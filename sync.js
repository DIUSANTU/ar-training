'use strict';
/* AR Training — envoi des séances terminées vers le Google Sheets « Suivi Journalier » (script Apps Script du classeur).
   Chargé avant app.js : ce fichier ne fait que déclarer. L'adresse du script et le jeton ne sont jamais dans le code
   (dépôt public) : ils viennent du « code de liaison » saisi dans Réglages et restent dans les données de l'appareil. */

const syncCfg = () => S.settings.sync || {};
let syncBusy = false;

// Catégorie de la colonne SÉANCE MUSCU du journal, d'après le nom de la séance
function sessCat(se) {
  const n = norm(se.name);
  if (n.includes('condens')) return 'Condensée';
  return ['Push', 'Pull', 'Legs', 'Upper', 'Lower'].find(c => n.includes(c.toLowerCase())) || '';
}
// EXO CLÉ du journal : premier mouvement de la séance, série de travail la plus lourde, RIR de la dernière série à cette charge.
// Séance condensée : plusieurs mouvements clés, donc rien (comme dans la saisie manuelle).
function sessKey(se) {
  if (sessCat(se) === 'Condensée') return null;
  const en = se.entries.find(x => !x.emom); if (!en) return null;
  const e = ex(en.exId), work = en.sets.filter(isWork); if (!work.length || e.type === 'time') return null;
  const mx = Math.max(...work.map(s => num(s.kg))), top = work.filter(s => num(s.kg) === mx), last = top[top.length - 1];
  return { name: e.name, kg: mx, reps: num(last.reps), rir: has(last.rir) ? num(last.rir) : '' };
}
function sessPayload(se) {
  return { id: se.id, date: se.date, name: se.name, cyc: se.cyc || '', diff: se.diff || [], cat: sessCat(se), key: sessKey(se),
    journal: !se.imp, // séances reprises de l'historique : le journal a déjà été rempli à la main
    entries: se.entries.map(en => ({ name: ex(en.exId).name, emom: en.emom || 0,
      sets: en.sets.map(s => ({ t: s.t, kg: s.kg, reps: s.reps, sec: s.sec, rir: s.rir, pk: s.pk, pn: s.pn, rp: s.rp, gp: s.gp, od: s.od,
        tot: ['bw', 'assist'].includes(ex(en.exId).type) && s.done ? Math.round(eff(ex(en.exId), s, bwOf(se)) * 100) / 100 : '' })) })),
    warm: se.warm || 0, note: se.note || '' };
}
function queueSync(id) {
  S.syncQ = S.syncQ || [];
  if (!S.syncQ.includes(id)) S.syncQ.push(id);
  save(); trySync();
}
async function postSync(sessions) {
  const c = syncCfg();
  // text/plain : requête « simple », la seule qu'Apps Script accepte depuis un autre site
  const r = await fetch(c.url, { method: 'POST', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ token: c.token, sessions }) });
  const j = await r.json();
  if (!j.ok) throw new Error(j.error || 'Réponse inattendue');
  return j;
}
async function trySync(manual) {
  const c = syncCfg();
  if (!c.url || syncBusy) return;
  S.syncQ = (S.syncQ || []).filter(id => S.sessions.some(se => se.id === id));
  if (!S.syncQ.length) { if (manual) toast('Rien à envoyer'); return; }
  syncBusy = true;
  const ids = S.syncQ.slice();
  try {
    // par paquets de 5 séances : une réponse rapide même pour tout l'historique
    for (let k = 0; k < ids.length; k += 5) {
      const part = ids.slice(k, k + 5);
      await postSync(part.map(id => sessPayload(S.sessions.find(se => se.id === id))));
      S.synced = S.synced || {}; part.forEach(id => { S.synced[id] = Date.now(); });
      S.syncQ = S.syncQ.filter(id => !part.includes(id)); save();
    }
    S.syncErr = ''; S.syncAt = Date.now(); save();
    toast(ids.length > 1 ? ids.length + ' séances envoyées au Sheets' : 'Séance envoyée au Sheets');
  } catch (e) {
    S.syncErr = navigator.onLine === false ? 'Hors ligne : envoi au prochain lancement' : String(e.message || e); save();
    if (manual) toast('Envoi impossible : ' + S.syncErr);
  }
  syncBusy = false;
  if (R.tab === 'set' && !R.view) render();
}
function syncCard() {
  const c = syncCfg(), q = (S.syncQ || []).length, n = Object.keys(S.synced || {}).length;
  if (!c.url) return `<div class="card"><h2>Google Sheets</h2>
    <p class="mut">Envoi automatique de chaque séance terminée vers ton Suivi Journalier : onglet « Séances » (une ligne par série) et EXO CLÉ, CHARGE, REPS, RIR du jour.</p>
    <label class="f">Code de liaison<input id="synccode" autocapitalize="off" autocomplete="off" placeholder="https://script.google.com/…#jeton"></label>
    <button class="p blk" style="margin-top:8px" data-act="sync-link">Lier</button></div>`;
  return `<div class="card"><h2>Google Sheets</h2>
    <p class="mut">Lié. ${n} séance${n > 1 ? 's' : ''} envoyée${n > 1 ? 's' : ''}${S.syncAt ? ', dernier envoi le ' + new Date(S.syncAt).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : ''}.
    ${q ? `<br><b class="acc">${q} en attente</b>${S.syncErr ? ' · ' + esc(S.syncErr) : ''}` : ''}</p>
    <div class="g2"><button data-act="sync-now">Envoyer maintenant</button><button data-act="sync-all">Tout renvoyer</button></div>
    <button class="d blk" style="margin-top:8px" data-act="sync-off">Délier</button>
    <p class="mut">Le journal n'est rempli que dans des cases vides : rien de ce que tu as saisi à la main n'est écrasé. Une séance modifiée dans l'appli est renvoyée et remplace ses lignes dans « Séances ».</p></div>`;
}
function syncClick(d) {
  if (!d.act || d.act.slice(0, 5) !== 'sync-') return false;
  switch (d.act) {
    case 'sync-link': {
      // tolérant : retrouve l'adresse et le jeton où qu'ils soient dans le texte collé (espaces, retours à la ligne, « # » perdu, majuscule automatique)
      const raw = ($('#synccode').value || '').replace(/[​-‍﻿ ]/g, ' ');
      // accepte aussi l'identifiant seul (AKfycb…) : l'adresse complète est alors reconstruite ; un lien réécrit par une messagerie est lu tel quel
      const dec = (() => { try { return decodeURIComponent(raw); } catch (e) { return raw; } })(), txt = /AKfycb/.test(raw) && !/%2F/i.test(raw) ? raw : dec;
      const mu = txt.match(/https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec/i), id = mu ? '' : (txt.match(/AKfycb[\w-]{20,}/) || [])[0];
      const head = mu ? mu[0] : id || '', after = head ? txt.slice(txt.indexOf(head) + head.length) : '';
      const mt = after.match(/[0-9a-f]{32}/i) || txt.match(/[0-9a-f]{32}/i) || after.match(/[\w-]{16,}/);
      const url = mu ? mu[0] : id ? 'https://script.google.com/macros/s/' + id + '/exec' : '', token = mt ? mt[0] : '';
      if (!url || !token) { toast(!url ? 'Adresse du script introuvable dans le texte collé' : 'Jeton introuvable après l\'adresse'); break; }
      S.settings.sync = { url, token }; S.syncErr = ''; save(); render();
      // premier envoi : tout ce qui n'est pas encore parti
      S.syncQ = S.sessions.filter(se => !(S.synced || {})[se.id]).map(se => se.id); save(); trySync(true); break;
    }
    case 'sync-now': trySync(true); break;
    case 'sync-all': ask('Renvoyer toutes les séances ?', 'Renvoyer', () => { S.syncQ = S.sessions.map(se => se.id); save(); trySync(true); }, 'L\'onglet « Séances » est reconstruit séance par séance. Le journal n\'est touché que dans ses cases vides.'); break;
    case 'sync-off': ask('Délier le Google Sheets ?', 'Délier', () => { delete S.settings.sync; save(); render(); }, 'Les séances déjà envoyées restent dans le Sheets.'); break;
  }
  return true;
}
