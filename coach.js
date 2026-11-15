'use strict';
/* AR Training — espace Coach : fiches coachés, bilans, nutrition. Tout est local (S.coach), aucun serveur.
   Chargé avant app.js : ce fichier ne fait que déclarer ; les fonctions d'app.js ($, esc, save, render…) sont appelées plus tard. */

// Types de question d'un bilan
const Q_TYPES = { num: 'Nombre', txt: 'Texte libre', note: 'Note de 1 à 10', choix: 'Choix', ouinon: 'Oui / Non', titre: 'Titre de section' };
const C_STATUS = { actif: 'Actif', pause: 'En pause', archive: 'Archivé' };
// Niveau d'activité physique (multiplicateurs usuels de la dépense de repos)
const NAP = [[1.2, 'Sédentaire (peu ou pas de sport)'], [1.375, 'Légèrement actif (1-3 séances/sem.)'], [1.55, 'Actif (3-5 séances/sem.)'], [1.725, 'Très actif (6-7 séances/sem.)'], [1.9, 'Extrêmement actif (sport + métier physique)']];
const ADJ = [[-0.2, 'Perte rapide (−20 %)'], [-0.1, 'Perte modérée (−10 %)'], [0, 'Maintien'], [0.05, 'Prise lente (+5 %)'], [0.1, 'Prise (+10 %)']];

const bq = (id, label, type, x) => ({ id, label, type, x: x || '' });
const DEF_BTPL = [
  { id: 'b-init', name: 'Bilan initial', qs: [
    bq('i0', 'Cadre', 'titre'),
    bq('i1', 'Consentement écrit au traitement de ses données (RGPD) recueilli', 'ouinon'),
    bq('i2', 'Certificat médical ou questionnaire de santé à jour', 'ouinon'),
    bq('i3', 'Objectifs', 'titre'),
    bq('i4', 'Objectif principal', 'txt'),
    bq('i5', 'Échéance visée', 'txt'),
    bq('i6', 'Motivation au départ', 'note'),
    bq('i7', 'Santé', 'titre'),
    bq('i8', 'Antécédents médicaux, blessures, opérations', 'txt'),
    bq('i9', 'Douleurs actuelles', 'txt'),
    bq('i10', 'Traitements en cours', 'txt'),
    bq('i11', 'Mode de vie', 'titre'),
    bq('i12', 'Activité au quotidien', 'choix', 'Sédentaire;Debout;Physique'),
    bq('i13', 'Sommeil moyen', 'num', 'h'),
    bq('i14', 'Niveau de stress', 'note'),
    bq('i15', 'Habitudes alimentaires (repas, grignotage, alcool)', 'txt'),
    bq('i16', 'Pratique sportive', 'titre'),
    bq('i17', 'Niveau', 'choix', 'Débutant;Intermédiaire;Confirmé'),
    bq('i18', 'Séances possibles par semaine', 'num', 'séances'),
    bq('i19', 'Lieu et matériel disponibles', 'txt'),
    bq('i20', 'Mesures', 'titre'),
    bq('i21', 'Poids', 'num', 'kg'),
    bq('i22', 'Tour de taille', 'num', 'cm'),
    bq('i23', 'Tour de hanches', 'num', 'cm'),
    bq('i24', 'Tour de poitrine', 'num', 'cm'),
    bq('i25', 'Tour de bras', 'num', 'cm'),
    bq('i26', 'Tour de cuisse', 'num', 'cm'),
    bq('i27', 'Tests', 'titre'),
    bq('i28', 'Pompes max', 'num', 'reps'),
    bq('i29', 'Tractions max', 'num', 'reps'),
    bq('i30', 'Gainage', 'num', 's'),
    bq('i31', 'Remarques', 'txt')
  ] },
  { id: 'b-hebdo', name: 'Bilan hebdomadaire', qs: [
    bq('h1', 'Poids', 'num', 'kg'),
    bq('h2', 'Séances réalisées', 'num', 'séances'),
    bq('h3', 'Énergie', 'note'),
    bq('h4', 'Qualité du sommeil', 'note'),
    bq('h5', 'Niveau de stress', 'note'),
    bq('h6', 'Respect du plan alimentaire', 'note'),
    bq('h7', 'Faim', 'note'),
    bq('h8', 'Douleurs ou gênes', 'txt'),
    bq('h9', 'Réussite de la semaine', 'txt'),
    bq('h10', 'Difficulté de la semaine', 'txt'),
    bq('h11', 'Questions au coach', 'txt')
  ] },
  { id: 'b-mens', name: 'Bilan mensuel', qs: [
    bq('m0', 'Mesures', 'titre'),
    bq('m1', 'Poids', 'num', 'kg'),
    bq('m2', 'Tour de taille', 'num', 'cm'),
    bq('m3', 'Tour de hanches', 'num', 'cm'),
    bq('m4', 'Tour de poitrine', 'num', 'cm'),
    bq('m5', 'Tour de bras', 'num', 'cm'),
    bq('m6', 'Tour de cuisse', 'num', 'cm'),
    bq('m7', 'Photos avant/après faites', 'ouinon'),
    bq('m8', 'Ressenti', 'titre'),
    bq('m9', 'Performances marquantes du mois', 'txt'),
    bq('m10', 'Satisfaction globale', 'note'),
    bq('m11', 'Motivation', 'note'),
    bq('m12', 'Suite', 'titre'),
    bq('m13', 'Objectif du mois prochain', 'txt'),
    bq('m14', 'Ajustements souhaités', 'txt')
  ] }
];

// État d'affichage de l'espace Coach
const K = { sub: 'clients', view: '', cid: '', bid: '', tid: '', ctab: 'profil', q: '', arch: false, fq: '', fgrp: -2, meal: null, food: null };

function normalizeCoach(c) {
  c = c || {};
  c.clients = Array.isArray(c.clients) ? c.clients : [];
  c.tpls = Array.isArray(c.tpls) && c.tpls.length ? c.tpls : JSON.parse(JSON.stringify(DEF_BTPL));
  c.foods = Array.isArray(c.foods) ? c.foods : [];
  c.clients.forEach(cl => {
    cl.bilans = cl.bilans || [];
    cl.nut = Object.assign({ w: '', act: 1.55, adj: 0, pkg: 1.8, lkg: 1 }, cl.nut || {});
    cl.plan = cl.plan || { meals: [] };
  });
  return c;
}
function newClient() {
  return { id: uid(), name: '', phone: '', email: '', birth: '', sex: '', height: '', goal: '', start: today(), status: 'actif', notes: '', consent: false, consentDate: '',
    bilans: [], nut: { w: '', act: 1.55, adj: 0, pkg: 1.8, lkg: 1 }, plan: { meals: [] } };
}
const kcl = () => S.coach.clients.find(c => c.id === K.cid);
const kbi = () => { const c = kcl(); return c && c.bilans.find(b => b.id === K.bid); };
const ktp = () => S.coach.tpls.find(t => t.id === K.tid);
const ageOf = birth => { if (!birth) return 0; const b = new Date(birth + 'T12:00'), n = new Date(); let a = n.getFullYear() - b.getFullYear(); if (n < new Date(n.getFullYear(), b.getMonth(), b.getDate())) a--; return a; };
const frLong = s => (s ? new Date(s + 'T12:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '');
const qkey = x => norm(x.label) + '|' + norm(x.x || '');
const has2 = v => v !== undefined && v !== null && String(v).trim() !== '';
const sortedBilans = c => c.bilans.slice().sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
// Séries de mesures chiffrées d'un coaché, tous bilans confondus (même intitulé + même unité = même courbe)
function measures(c) {
  const m = {};
  sortedBilans(c).forEach(b => b.qs.forEach(x => {
    if ((x.type !== 'num' && x.type !== 'note') || !has(b.a[x.id])) return;
    const k = qkey(x);
    (m[k] = m[k] || { label: x.label, unit: x.type === 'note' ? '/10' : x.x, type: x.type, pts: [] }).pts.push({ d: b.date, v: num(b.a[x.id]), bid: b.id });
  }));
  return m;
}
function prevValue(c, b, x) {
  const s = measures(c)[qkey(x)]; if (!s) return null;
  const before = s.pts.filter(p => p.bid !== b.id && p.d <= b.date);
  return before.length ? before[before.length - 1].v : null;
}
function lastWeight(c) { const s = Object.values(measures(c)).find(x => norm(x.label) === 'poids'); return s ? s.pts[s.pts.length - 1].v : 0; }
async function shareText(text) {
  try { if (navigator.share) { await navigator.share({ text }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  try { await navigator.clipboard.writeText(text); toast('Texte copié'); } catch (e) { toast('Partage impossible'); }
}

// =============== Vues ===============
function vCoach() {
  if (K.view === 'client' && kcl()) return vClient();
  if (K.view === 'bilan' && kbi()) return vBilanFill();
  if (K.view === 'bilanv' && kbi()) return vBilanView();
  if (K.view === 'tpl' && ktp()) return vBTpl();
  K.view = '';
  const subs = [['clients', 'Coachés'], ['tpls', 'Modèles de bilan'], ['foods', 'Aliments']];
  return `<h1>Coach</h1><div class="chips" style="margin-bottom:12px">${subs.map(([id, l]) => `<button class="${K.sub === id ? 'on' : ''}" data-act="k-sub" data-s="${id}">${l}</button>`).join('')}</div>`
    + (K.sub === 'tpls' ? vTplList() : K.sub === 'foods' ? vFoods() : vClients());
}
function clientRows() {
  const qn = norm(K.q), now = today();
  const list = S.coach.clients.filter(c => (K.arch || c.status !== 'archive') && (!qn || norm(c.name + ' ' + c.goal).includes(qn)))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'));
  if (!list.length) return `<p class="mut">${S.coach.clients.length ? 'Aucun résultat.' : 'Aucun coaché pour l\'instant.'}</p>`;
  return ['actif', 'pause', 'archive'].map(st => {
    const l = list.filter(c => c.status === st); if (!l.length) return '';
    return `<h3>${C_STATUS[st]} <span class="mut">· ${l.length}</span></h3>` + l.map(c => {
      const sb = sortedBilans(c), lb = sb[sb.length - 1];
      const late = st === 'actif' && Math.round((new Date(now) - new Date(lb ? lb.date : c.start || now)) / 864e5) > 14;
      return `<button data-act="k-open" data-id="${c.id}"><span class="grow">${esc(c.name || 'Sans nom')}<br><span class="mut">${esc(c.goal || 'Objectif à définir')}</span></span>
        <span class="mut" style="text-align:right">${lb ? 'Bilan ' + fr(lb.date) : 'Aucun bilan'}${late ? '<br><span class="acc b">à relancer</span>' : ''}</span></button>`;
    }).join('');
  }).join('');
}
function vClients() {
  return `<input id="kq" placeholder="Rechercher un coaché" value="${esc(K.q)}" autocomplete="off">
  <button class="p blk" style="margin-top:10px" data-act="k-new">+ Nouveau coaché</button>
  <div class="list" id="klist">${clientRows()}</div>
  <label class="ck"><input type="checkbox" id="karch" ${K.arch ? 'checked' : ''}>Afficher les coachés archivés</label>
  ${S.coach.clients.length ? '<button class="blk" data-act="k-xlsx">Exporter coachés et bilans (.xlsx)</button>' : ''}
  <p class="mut">Les fiches restent sur cet appareil et sont incluses dans la sauvegarde .json (Réglages). « À relancer » : aucun bilan depuis plus de 14 jours.</p>`;
}
function vClient() {
  const c = kcl(), tabs = [['profil', 'Profil'], ['bilans', 'Bilans'], ['nut', 'Nutrition']];
  const age = ageOf(c.birth);
  return `<button class="lnk" data-act="k-home">‹ Coachés</button><h1>${esc(c.name || 'Nouveau coaché')}</h1>
  <div class="mut">${C_STATUS[c.status]}${age ? ' · ' + age + ' ans' : ''}${c.start ? ' · suivi depuis le ' + frLong(c.start) : ''}</div>
  <div class="chips" style="margin:12px 0">${tabs.map(([id, l]) => `<button class="${K.ctab === id ? 'on' : ''}" data-act="k-ctab" data-s="${id}">${l}</button>`).join('')}</div>`
    + (K.ctab === 'bilans' ? vClientBilans(c) : K.ctab === 'nut' ? vClientNut(c) : vClientProfil(c));
}
function vClientProfil(c) {
  const tel = String(c.phone || '').replace(/[^\d+]/g, ''), wa = tel.replace(/^\+/, '').replace(/^0/, '33');
  const fld = (k, l, attrs) => `<label class="f">${l}<input data-kc="${k}" value="${esc(c[k])}" ${attrs || ''}></label>`;
  return `<div class="card"><h2>Contact</h2>
    ${fld('name', 'Nom et prénom', 'autocomplete="off"')}
    <div class="g2">${fld('phone', 'Téléphone', 'inputmode="tel"')}${fld('email', 'E-mail', 'inputmode="email" autocapitalize="off"')}</div>
    ${tel || c.email ? `<div class="row" style="margin-top:10px">${tel ? `<a class="btn" href="tel:${tel}">Appeler</a><a class="btn" href="sms:${tel}">SMS</a><a class="btn" href="https://wa.me/${wa}" target="_blank" rel="noopener">WhatsApp</a>` : ''}${c.email ? `<a class="btn" href="mailto:${esc(c.email)}">E-mail</a>` : ''}</div>` : ''}</div>
  <div class="card"><h2>Profil</h2>
    <div class="g2">${fld('birth', 'Date de naissance', 'type="date"')}
    <label class="f">Sexe<select data-kc="sex"><option value="">–</option><option value="h" ${c.sex === 'h' ? 'selected' : ''}>Homme</option><option value="f" ${c.sex === 'f' ? 'selected' : ''}>Femme</option></select></label>
    ${fld('height', 'Taille (cm)', 'inputmode="decimal"')}
    <label class="f">Statut<select data-kc="status">${Object.keys(C_STATUS).map(k => `<option value="${k}" ${k === c.status ? 'selected' : ''}>${C_STATUS[k]}</option>`).join('')}</select></label></div>
    ${fld('goal', 'Objectif')}${fld('start', 'Début du suivi', 'type="date"')}
    <label class="f">Notes (blessures, contraintes, préférences…)<textarea rows="4" data-kc="notes">${esc(c.notes)}</textarea></label></div>
  <div class="card"><h2>Données personnelles</h2>
    <label class="ck"><input type="checkbox" data-kc="consent" ${c.consent ? 'checked' : ''}>Consentement écrit recueilli${c.consentDate ? ' le ' + frLong(c.consentDate) : ''}</label>
    <p class="mut">Poids, mensurations et blessures sont des données de santé : le RGPD (art. 9) demande le consentement explicite du coaché avant de les enregistrer, et son droit à l'effacement.</p></div>
  <button class="d blk" data-act="k-del">Supprimer ce coaché et ses données</button>`;
}
function vClientBilans(c) {
  const m = measures(c), keys = Object.keys(m);
  const list = sortedBilans(c).reverse();
  return `<button class="p blk" data-act="k-bnew">+ Nouveau bilan</button>
  ${keys.length ? `<div class="card" style="margin-top:12px"><h2>Suivi des mesures</h2><table><tr><th>Mesure</th><th>Dernière</th><th>Évolution</th></tr>
    ${keys.map(k => { const s = m[k], l = s.pts[s.pts.length - 1], f = s.pts[0], dl = l.v - f.v;
      return `<tr data-act="k-meas" data-k="${esc(k)}"><td>${esc(s.label)}</td><td><b>${fmt(l.v)}</b> ${esc(s.unit)}</td><td class="mut">${s.pts.length > 1 ? (dl >= 0 ? '+' : '') + fmt(dl) + ' depuis le ' + fr(f.d) : '1 relevé'}</td></tr>`; }).join('')}</table>
    <p class="mut">Touche une ligne pour voir la courbe.</p></div>` : ''}
  <h3>Bilans</h3><div class="list">${list.map(b => { const n = b.qs.filter(x => x.type !== 'titre' && has2(b.a[x.id])).length, t = b.qs.filter(x => x.type !== 'titre').length;
    return `<button data-act="k-bview" data-id="${b.id}"><span class="grow">${esc(b.name)}<br><span class="mut">${frLong(b.date)}</span></span><span class="mut">${n}/${t} réponses</span></button>`; }).join('') || '<p class="mut">Aucun bilan.</p>'}</div>`;
}
function vBilanFill() {
  const c = kcl(), b = kbi();
  return `<button class="lnk" data-act="k-bback">‹ ${esc(c.name || 'Coaché')}</button><h1>${esc(b.name)}</h1>
  <label class="f">Date du bilan<input type="date" data-kb="date" value="${b.date}"></label>
  ${b.qs.map(x => {
    if (x.type === 'titre') return `<h3>${esc(x.label)}</h3>`;
    const v = b.a[x.id], pv = (x.type === 'num' || x.type === 'note') ? prevValue(c, b, x) : null;
    let inp;
    if (x.type === 'num') inp = `<div class="row nw"><input inputmode="decimal" data-ka="${x.id}" value="${esc(v)}" placeholder="${pv !== null ? fmtIn(pv) : ''}"><span class="mut" style="min-width:52px">${esc(x.x)}</span></div>`;
    else if (x.type === 'txt') inp = `<textarea rows="2" data-ka="${x.id}">${esc(v)}</textarea>`;
    else {
      const opts = x.type === 'note' ? [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(String) : x.type === 'ouinon' ? ['Oui', 'Non'] : String(x.x).split(';').map(o => o.trim()).filter(Boolean);
      inp = `<div class="chips ${x.type === 'note' ? 'n10' : ''}" style="flex-wrap:wrap">${opts.map(o => `<button class="${String(v) === o ? 'on' : ''}" data-act="k-ans" data-q="${x.id}" data-v="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
    }
    return `<div class="card qa"><div class="row sp"><b>${esc(x.label)}</b>${pv !== null ? `<span class="mut">préc. ${fmt(pv)}</span>` : ''}</div>${inp}</div>`;
  }).join('')}
  <button class="p blk" data-act="k-bdone">Terminer</button>`;
}
function bilanText(c, b) {
  return `${b.name} — ${c.name} — ${frLong(b.date)}\n\n` + b.qs.map(x => x.type === 'titre' ? `\n${x.label.toUpperCase()}` : `${x.label} : ${has2(b.a[x.id]) ? b.a[x.id] + (x.type === 'num' && x.x ? ' ' + x.x : x.type === 'note' ? '/10' : '') : '–'}`).join('\n');
}
function vBilanView() {
  const c = kcl(), b = kbi();
  return `<button class="lnk" data-act="k-bback">‹ ${esc(c.name || 'Coaché')}</button><h1>${esc(b.name)}</h1><div class="mut">${frLong(b.date)}</div>
  <div class="card" style="margin-top:12px">${b.qs.map(x => {
    if (x.type === 'titre') return `<h3>${esc(x.label)}</h3>`;
    const v = b.a[x.id], isN = x.type === 'num' || x.type === 'note', pv = isN && has(v) ? prevValue(c, b, x) : null, dl = pv !== null ? num(v) - pv : null;
    return `<div style="margin:8px 0"><div class="mut">${esc(x.label)}</div><div style="white-space:pre-wrap">${has2(v) ? `<b>${esc(v)}</b>${x.type === 'num' ? ' ' + esc(x.x) : x.type === 'note' ? '/10' : ''}` : '<span class="mut">–</span>'}${dl !== null && dl !== 0 ? ` <span class="mut">(${dl > 0 ? '+' : ''}${fmt(dl)} vs préc.)</span>` : ''}</div></div>`;
  }).join('')}</div>
  <div class="g2"><button data-act="k-bedit">Modifier</button><button data-act="k-bshare">Partager le texte</button></div>
  <button class="d blk" style="margin-top:8px" data-act="k-bdel">Supprimer ce bilan</button>`;
}

// ---------- Modèles de bilan ----------
function vTplList() {
  return `<div class="list">${S.coach.tpls.map(t => `<button data-act="k-tpl" data-id="${t.id}"><span>${esc(t.name)}</span><span class="mut">${t.qs.filter(x => x.type !== 'titre').length} questions</span></button>`).join('')}</div>
  <button class="p blk" style="margin-top:10px" data-act="k-tnew">+ Nouveau modèle</button>
  <p class="mut">Modifier un modèle ne change pas les bilans déjà remplis. Deux questions chiffrées de même intitulé et même unité (ex. « Poids », kg) alimentent la même courbe, quel que soit le modèle.</p>`;
}
function vBTpl() {
  const t = ktp();
  return `<button class="lnk" data-act="k-home">‹ Modèles</button><h1>Modèle de bilan</h1>
  <div class="card"><label class="f">Nom<input data-ktn="1" value="${esc(t.name)}"></label></div>
  ${t.qs.map((x, k) => `<div class="card ${x.type === 'titre' ? 'ss' : ''}">
    <input data-kt="label" data-k="${k}" value="${esc(x.label)}" placeholder="Intitulé">
    <div class="g2" style="margin-top:6px"><select data-kt="type" data-k="${k}">${Object.keys(Q_TYPES).map(y => `<option value="${y}" ${y === x.type ? 'selected' : ''}>${Q_TYPES[y]}</option>`).join('')}</select>
    ${x.type === 'num' ? `<input data-kt="x" data-k="${k}" value="${esc(x.x)}" placeholder="Unité (kg, cm…)">` : x.type === 'choix' ? `<input data-kt="x" data-k="${k}" value="${esc(x.x)}" placeholder="Options séparées par ;">` : '<span></span>'}</div>
    <div class="row" style="margin-top:6px;justify-content:flex-end"><button class="ic" data-act="k-qmv" data-k="${k}" data-dir="-1" ${k === 0 ? 'disabled' : ''}>↑</button><button class="ic" data-act="k-qmv" data-k="${k}" data-dir="1" ${k === t.qs.length - 1 ? 'disabled' : ''}>↓</button><button class="ic d" data-act="k-qrm" data-k="${k}">✕</button></div></div>`).join('')}
  <button class="p blk" data-act="k-qadd">+ Ajouter une question</button>
  <div class="g2" style="margin-top:12px"><button data-act="k-tdup">Dupliquer</button><button class="d" data-act="k-tdel">Supprimer</button></div>`;
}

// =============== Nutrition ===============
let ciqP = null, CIQ_N = null;
function loadCiqual() {
  if (typeof CIQUAL !== 'undefined') return Promise.resolve();
  if (!ciqP) ciqP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'ciqual.js'; s.onload = res; s.onerror = () => { ciqP = null; rej(); }; document.head.appendChild(s); });
  return ciqP;
}
const ciqReady = () => typeof CIQUAL !== 'undefined';
// Recherche : tous les mots doivent figurer dans le nom ; les noms qui commencent par la recherche, puis les plus courts, d'abord
function foodSearch(text, grp, limit) {
  const STOP = ['de', 'du', 'des', 'la', 'le', 'les', 'au', 'aux', 'a', 'et', 'en', 'd', 'l'];
  const words = norm(text).split(/[\s']+/).filter(w => w && !STOP.includes(w)), q0 = norm(text).trim();
  if (!CIQ_N) CIQ_N = CIQUAL.map(f => norm(f[0]));
  const out = [];
  S.coach.foods.forEach(f => { const n = norm(f[0]); if ((grp === -2 || grp === -1) && words.every(w => n.includes(w))) out.push({ f, n }); });
  if (grp !== -1) CIQUAL.forEach((f, i) => { const n = CIQ_N[i]; if ((grp === -2 || f[1] === grp) && words.every(w => n.includes(w))) out.push({ f, n }); });
  const rank = x => (x.f[1] === -1 ? 0 : q0 && x.n.startsWith(q0) ? 1 : 2);
  out.sort((a, b) => rank(a) - rank(b) || a.n.length - b.n.length || a.n.localeCompare(b.n));
  return { total: out.length, list: out.slice(0, limit).map(x => x.f) };
}
const fv = v => (v === null || v === undefined ? '–' : fmt(v));
function foodRows(text, grp) {
  if (!ciqReady()) return '<p class="mut">Chargement de la table Ciqual…</p>';
  if (!text.trim() && grp === -2) return '<p class="mut">Tape un aliment (ex. « riz cuit », « poulet », « skyr ») ou choisis un groupe.</p>';
  const r = foodSearch(text, grp, 60);
  return (r.list.map(f => `<button data-act="k-food" data-n="${esc(f[0])}" data-g="${f[1]}"><span class="grow">${esc(f[0])}${f[1] === -1 ? ' <span class="acc">perso</span>' : ''}<br><span class="mut">P ${fv(f[3])} · G ${fv(f[4])} · L ${fv(f[5])} g</span></span><span style="text-align:right"><b>${fv(f[2])}</b><br><span class="mut">kcal</span></span></button>`).join('') || '<p class="mut">Aucun aliment trouvé.</p>')
    + (r.total > r.list.length ? `<p class="mut">${r.list.length} premiers résultats sur ${r.total} : précise la recherche.</p>` : '');
}
function grpChips(act) {
  if (!ciqReady()) return '';
  const g = [[-2, 'Tous'], [-1, 'Mes aliments']].concat(CIQUAL_GROUPS.map((n, i) => [i, n.charAt(0).toUpperCase() + n.slice(1)]));
  return `<div class="chips" style="margin:10px 0">${g.map(([i, n]) => `<button class="${K.fgrp === i ? 'on' : ''}" data-act="${act}" data-g="${i}">${esc(n)}</button>`).join('')}</div>`;
}
function vFoods() {
  if (!ciqReady()) loadCiqual().then(() => { if (R.tab === 'coach' && K.sub === 'foods' && !K.view) render(); }).catch(() => toast('Table Ciqual indisponible : ouvre l\'app une fois avec Internet'));
  return `<input id="kfq" placeholder="Rechercher un aliment" value="${esc(K.fq)}" autocomplete="off">
  ${grpChips('k-fgrp')}
  <div class="list" id="kflist">${foodRows(K.fq, K.fgrp)}</div>
  <button class="blk" style="margin-top:10px" data-act="k-fnew">+ Aliment personnalisé</button>
  <p class="mut">Valeurs pour 100 g. Source : table de composition nutritionnelle Ciqual 2025, Anses (${ciqReady() ? CIQUAL.length + ' aliments, ' : ''}licence CC BY 4.0). Ce sont des moyennes : un produit de marque peut s'en écarter, vérifie son étiquette.</p>`;
}
function findFood(name, g) { return (+g === -1 ? S.coach.foods : CIQUAL).find(f => f[0] === name); }
function portionHtml(f, g) {
  const k = g / 100, row = (l, v, u) => `<tr><td>${l}</td><td><b>${v === null || v === undefined ? '–' : fmt(v * k)}</b> ${u}</td></tr>`;
  return `<table>${row('Énergie', f[2], 'kcal')}${row('Protéines', f[3], 'g')}${row('Glucides', f[4], 'g')}${row('&nbsp;&nbsp;dont sucres', f[7], 'g')}${row('Lipides', f[5], 'g')}${row('&nbsp;&nbsp;dont saturés', f[8], 'g')}${row('Fibres', f[6], 'g')}${row('Sel', f[9], 'g')}</table>`;
}
function foodSheet(f) {
  K.food = f;
  sheet(`<h2>${esc(f[0])}</h2><div class="mut">${f[1] === -1 ? 'Aliment personnalisé' : esc(CIQUAL_GROUPS[f[1]]) + ' · Ciqual 2025'}</div>
  <label class="f">Quantité (g)<input id="kfg" inputmode="decimal" value="100"></label>
  <div id="kfres" style="margin-top:8px">${portionHtml(f, 100)}</div>
  ${K.meal !== null ? '<button class="p blk" style="margin-top:12px" data-act="k-fadd">Ajouter au repas</button>' : ''}
  ${f[1] === -1 ? '<button class="d blk" style="margin-top:8px" data-act="k-fdel">Supprimer cet aliment</button>' : ''}`);
}
// Besoins : métabolisme de repos par Mifflin-St Jeor (1990), × niveau d'activité, ± objectif
function needs(c) {
  const w = num(c.nut.w) || lastWeight(c), h = num(c.height), a = ageOf(c.birth);
  if (!w || !h || !a || !c.sex) return null;
  const bmr = 10 * w + 6.25 * h - 5 * a + (c.sex === 'h' ? 5 : -161), tdee = bmr * c.nut.act, kcal = tdee * (1 + c.nut.adj);
  const p = c.nut.pkg * w, l = c.nut.lkg * w, g = Math.max(0, (kcal - 4 * p - 9 * l) / 4);
  return { w, bmr, tdee, kcal, p, l, g };
}
function planTotals(meals) {
  const t = [0, 0, 0, 0, 0];
  meals.forEach(m => m.items.forEach(it => it.v.forEach((x, k) => { t[k] += (x || 0) * num(it.g) / 100; })));
  return t;
}
function vClientNut(c) {
  const n = needs(c), lw = lastWeight(c), meals = c.plan.meals, tot = planTotals(meals);
  const sel = (k, opts) => `<select data-kn="${k}">${opts.map(([v, l]) => `<option value="${v}" ${+c.nut[k] === v ? 'selected' : ''}>${l}</option>`).join('')}</select>`;
  const bar = (l, v, target, u) => `<div style="margin-top:8px"><div class="row sp"><span>${l}</span><span class="mut"><b style="color:var(--txt)">${fmt(v, 0)}</b>${target ? ' / ' + fmt(target, 0) : ''} ${u}</span></div>${target ? `<div class="bar"><i style="width:${Math.min(100, v / target * 100)}%"></i></div>` : ''}</div>`;
  return `<div class="card"><h2>Besoins estimés</h2>
    <div class="g2"><label class="f">Poids (kg)<input inputmode="decimal" data-kn="w" value="${esc(c.nut.w)}" placeholder="${lw ? fmtIn(lw) + ' (bilan)' : ''}"></label>
    <label class="f">Objectif${sel('adj', ADJ)}</label></div>
    <label class="f">Niveau d'activité${sel('act', NAP)}</label>
    <div class="g2"><label class="f">Protéines (g/kg)<input inputmode="decimal" data-kn="pkg" value="${fmtIn(c.nut.pkg)}"></label>
    <label class="f">Lipides (g/kg)<input inputmode="decimal" data-kn="lkg" value="${fmtIn(c.nut.lkg)}"></label></div>
    ${n ? `<div class="kpi" style="margin-top:12px"><div><b>${fmt(n.bmr, 0)}</b><span class="mut">repos (kcal)</span></div><div><b>${fmt(n.tdee, 0)}</b><span class="mut">maintien (kcal)</span></div><div><b class="acc">${fmt(n.kcal, 0)}</b><span class="mut">cible (kcal)</span></div></div>
    <div class="kpi" style="margin-top:8px"><div><b>${fmt(n.p, 0)} g</b><span class="mut">protéines</span></div><div><b>${fmt(n.g, 0)} g</b><span class="mut">glucides</span></div><div><b>${fmt(n.l, 0)} g</b><span class="mut">lipides</span></div></div>`
      : '<p class="mut" style="margin-top:10px">Renseigne le sexe, la date de naissance et la taille dans Profil, puis un poids, pour obtenir l\'estimation.</p>'}
    <p class="mut">Métabolisme de repos : Mifflin-St Jeor (1990). Protéines : 1,4 à 2,0 g/kg chez le pratiquant (ISSN, Jäger et al., 2017). Les glucides complètent l'apport. C'est une estimation de départ, à ajuster sur l'évolution du poids sur 2 à 3 semaines ; elle ne remplace pas un avis médical ou diététique.</p></div>
  <div class="card"><h2>Journée type</h2>
    ${meals.length ? bar('Énergie', tot[0], n && n.kcal, 'kcal') + bar('Protéines', tot[1], n && n.p, 'g') + bar('Glucides', tot[2], n && n.g, 'g') + bar('Lipides', tot[3], n && n.l, 'g') + `<div class="mut" style="margin-top:6px">Fibres : ${fmt(tot[4], 0)} g</div>` : '<p class="mut">Aucun repas. Ajoute les repas de la journée, puis les aliments depuis la table Ciqual.</p>'}</div>
  ${meals.map((m, i) => { const t = planTotals([m]);
    return `<div class="card"><div class="row nw"><input data-km="${i}" value="${esc(m.name)}" style="font-weight:700"><button class="ic d" data-act="k-mdel" data-i="${i}">✕</button></div>
    <div class="mut" style="margin:6px 0">${fmt(t[0], 0)} kcal · P ${fmt(t[1], 0)} · G ${fmt(t[2], 0)} · L ${fmt(t[3], 0)} g</div>
    ${m.items.map((it, k) => `<div class="row nw" style="margin-top:6px"><span class="grow" style="font-size:14px">${esc(it.n)}<br><span class="mut">${fmt((it.v[0] || 0) * num(it.g) / 100, 0)} kcal</span></span>
      <input inputmode="decimal" data-kg="${i}" data-k="${k}" value="${esc(it.g)}" style="width:72px;text-align:center"><span class="mut">g</span><button class="ic d" data-act="k-idel" data-i="${i}" data-k="${k}">✕</button></div>`).join('')}
    <button class="blk" style="margin-top:8px" data-act="k-fpick" data-i="${i}">+ Aliment</button></div>`; }).join('')}
  <div class="g2"><button data-act="k-madd">+ Repas</button>${meals.length ? '<button data-act="k-pshare">Partager le plan</button>' : '<span></span>'}</div>`;
}
function planText(c) {
  const n = needs(c), tot = planTotals(c.plan.meals);
  return `Plan alimentaire — ${c.name}\n` + (n ? `Cible : ${fmt(n.kcal, 0)} kcal · P ${fmt(n.p, 0)} g · G ${fmt(n.g, 0)} g · L ${fmt(n.l, 0)} g\n` : '')
    + c.plan.meals.map(m => `\n${m.name.toUpperCase()}\n` + m.items.map(it => `- ${it.n} : ${fmtIn(it.g)} g`).join('\n')).join('\n')
    + `\n\nTotal : ${fmt(tot[0], 0)} kcal · P ${fmt(tot[1], 0)} g · G ${fmt(tot[2], 0)} g · L ${fmt(tot[3], 0)} g`;
}

// =============== Export Excel ===============
function coachXlsx() {
  if (!window.XLSX) { toast('Préparation du module Excel…'); loadXlsx().then(coachXlsx).catch(() => toast('Module Excel indisponible : connecte-toi une fois à Internet')); return; }
  const X = window.XLSX, wb = X.utils.book_new(), D = s => (s ? new Date(s + 'T12:00') : '');
  const add = (name, rows, cols) => { const ws = X.utils.aoa_to_sheet(rows, { cellDates: true, dateNF: 'dd/mm/yyyy' }); ws['!cols'] = cols.map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, name); };
  const r1 = [['Nom', 'Statut', 'Téléphone', 'E-mail', 'Naissance', 'Sexe', 'Taille (cm)', 'Objectif', 'Début du suivi', 'Consentement', 'Nombre de bilans', 'Notes']];
  const r2 = [['Coaché', 'Date', 'Bilan', 'Question', 'Réponse', 'Unité']];
  const r3 = [['Coaché', 'Mesure', 'Unité', 'Date', 'Valeur']];
  S.coach.clients.forEach(c => {
    r1.push([c.name, C_STATUS[c.status], c.phone, c.email, D(c.birth), c.sex === 'h' ? 'Homme' : c.sex === 'f' ? 'Femme' : '', num(c.height) || '', c.goal, D(c.start), c.consent ? 'Oui' : 'Non', c.bilans.length, c.notes]);
    sortedBilans(c).forEach(b => b.qs.forEach(x => { if (x.type === 'titre' || !has2(b.a[x.id])) return;
      const isN = x.type === 'num' || x.type === 'note'; r2.push([c.name, D(b.date), b.name, x.label, isN && has(b.a[x.id]) ? num(b.a[x.id]) : b.a[x.id], x.type === 'num' ? x.x : x.type === 'note' ? '/10' : '']); }));
    Object.values(measures(c)).forEach(s => s.pts.forEach(p => r3.push([c.name, s.label, s.unit, D(p.d), p.v])));
  });
  add('Coachés', r1, [22, 10, 14, 26, 11, 8, 10, 30, 13, 12, 10, 40]);
  add('Bilans', r2, [22, 11, 20, 40, 40, 8]);
  add('Mesures', r3, [22, 24, 8, 11, 10]);
  const type = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
  const le = S.lastExport; // export partiel : ne compte pas comme sauvegarde complète
  shareFile(`AR-Training-coach-${today()}.xlsx`, new Blob([X.write(wb, { type: 'array', bookType: 'xlsx' })], { type }), type).then(() => { S.lastExport = le; save(); });
}

// =============== Événements (appelés par app.js) ===============
function coachClick(d) {
  if (!d.act || d.act.slice(0, 2) !== 'k-') return false;
  const c = kcl(), b = kbi(), t = ktp(), go = () => { save(); render(); }, top = () => { save(); render(); window.scrollTo(0, 0); };
  switch (d.act) {
    case 'k-sub': K.sub = d.s; render(); break;
    case 'k-home': K.view = ''; top(); break;
    case 'k-new': { const n = newClient(); S.coach.clients.push(n); K.cid = n.id; K.view = 'client'; K.ctab = 'profil'; top(); break; }
    case 'k-open': K.cid = d.id; K.view = 'client'; K.ctab = 'profil'; top(); break;
    case 'k-ctab': K.ctab = d.s; K.meal = null; render(); break;
    case 'k-del': ask(`Supprimer ${esc(c.name || 'ce coaché')} ?`, 'Supprimer', () => { S.coach.clients = S.coach.clients.filter(x => x.id !== c.id); K.view = ''; top(); }, 'Sa fiche, ses bilans et son plan alimentaire seront effacés.'); break;
    case 'k-xlsx': coachXlsx(); break;
    // bilans
    case 'k-bnew': sheet(`<h2>Quel bilan ?</h2><div class="list">${S.coach.tpls.map(x => `<button data-act="k-bcreate" data-id="${x.id}"><span>${esc(x.name)}</span><span class="mut">${x.qs.filter(y => y.type !== 'titre').length} questions</span></button>`).join('')}</div>`); break;
    case 'k-bcreate': { const tp = S.coach.tpls.find(x => x.id === d.id); if (!tp) break;
      const nb = { id: uid(), tplId: tp.id, name: tp.name, date: today(), qs: JSON.parse(JSON.stringify(tp.qs)), a: {} };
      c.bilans.push(nb); K.bid = nb.id; K.view = 'bilan'; closeSheet(); top(); break; }
    case 'k-bview': K.bid = d.id; K.view = 'bilanv'; top(); break;
    case 'k-bedit': K.view = 'bilan'; top(); break;
    case 'k-bdone': K.view = 'bilanv'; top(); break;
    case 'k-bback': K.view = 'client'; K.ctab = 'bilans'; top(); break;
    case 'k-bshare': shareText(bilanText(c, b)); break;
    case 'k-bdel': ask('Supprimer ce bilan ?', 'Supprimer', () => { c.bilans = c.bilans.filter(x => x.id !== b.id); K.view = 'client'; K.ctab = 'bilans'; top(); }); break;
    case 'k-ans': b.a[d.q] = b.a[d.q] === d.v ? '' : d.v; go(); break;
    case 'k-meas': { const s = measures(c)[d.k]; if (!s) break;
      sheet(`<h2>${esc(s.label)}</h2>${s.pts.length > 1 ? chart(s.pts, s.pts.length - 1, s.unit) : ''}<table>${s.pts.slice().reverse().map(p => `<tr><td>${frLong(p.d)}</td><td><b>${fmt(p.v)}</b> ${esc(s.unit)}</td></tr>`).join('')}</table>`); break; }
    // modèles
    case 'k-tpl': K.tid = d.id; K.view = 'tpl'; top(); break;
    case 'k-tnew': { const n = { id: uid(), name: 'Nouveau bilan', qs: [bq(uid(), 'Poids', 'num', 'kg')] }; S.coach.tpls.push(n); K.tid = n.id; K.view = 'tpl'; top(); break; }
    case 'k-tdup': { const n = JSON.parse(JSON.stringify(t)); n.id = uid(); n.name = t.name + ' (copie)'; n.qs.forEach((x, k) => { x.id = uid() + k; }); S.coach.tpls.push(n); K.tid = n.id; top(); toast('Modèle dupliqué'); break; }
    case 'k-tdel': ask('Supprimer ce modèle ?', 'Supprimer', () => { S.coach.tpls = S.coach.tpls.filter(x => x.id !== t.id); if (!S.coach.tpls.length) S.coach.tpls = JSON.parse(JSON.stringify(DEF_BTPL)); K.view = ''; top(); }, 'Les bilans déjà remplis sont conservés. S\'il ne reste aucun modèle, les trois modèles d\'origine sont rétablis.'); break;
    case 'k-qadd': t.qs.push(bq(uid(), '', 'txt')); go(); break;
    case 'k-qrm': t.qs.splice(+d.k, 1); go(); break;
    case 'k-qmv': { const k = +d.k, m = k + +d.dir; if (m < 0 || m >= t.qs.length) break; [t.qs[k], t.qs[m]] = [t.qs[m], t.qs[k]]; go(); break; }
    // aliments
    case 'k-fgrp': K.fgrp = +d.g; render(); break;
    case 'k-pgrp': K.fgrp = +d.g; $('#kpchips').innerHTML = grpChips('k-pgrp'); $('#kplist').innerHTML = foodRows($('#kpq').value, K.fgrp); break;
    case 'k-food': { const f = findFood(d.n, d.g); if (f) foodSheet(f); break; }
    case 'k-fnew': K.meal = null; sheet(`<h2>Aliment personnalisé</h2><label class="f">Nom<input id="kn-n"></label>
      <div class="g2"><label class="f">kcal / 100 g<input id="kn-k" inputmode="decimal"></label><label class="f">Protéines (g)<input id="kn-p" inputmode="decimal"></label>
      <label class="f">Glucides (g)<input id="kn-g" inputmode="decimal"></label><label class="f">Lipides (g)<input id="kn-l" inputmode="decimal"></label>
      <label class="f">Fibres (g)<input id="kn-f" inputmode="decimal"></label></div><p class="mut">Valeurs pour 100 g, lues sur l'étiquette.</p>
      <button class="p blk" data-act="k-fsave">Enregistrer</button>`); break;
    case 'k-fsave': { const n = $('#kn-n').value.trim(); if (!n) { toast('Indique un nom'); break; }
      const v = id => (has($('#kn-' + id).value) ? num($('#kn-' + id).value) : null);
      S.coach.foods.push([n, -1, v('k'), v('p'), v('g'), v('l'), v('f'), null, null, null]); closeSheet(); K.fgrp = -1; K.fq = ''; go(); toast('Aliment ajouté'); break; }
    case 'k-fdel': S.coach.foods = S.coach.foods.filter(f => f !== K.food); closeSheet(); go(); break;
    // plan alimentaire
    case 'k-madd': { const names = ['Petit-déjeuner', 'Déjeuner', 'Collation', 'Dîner']; c.plan.meals.push({ name: names[c.plan.meals.length] || 'Repas ' + (c.plan.meals.length + 1), items: [] }); go(); break; }
    case 'k-mdel': ask('Supprimer ce repas ?', 'Supprimer', () => { c.plan.meals.splice(+d.i, 1); go(); }); break;
    case 'k-idel': c.plan.meals[+d.i].items.splice(+d.k, 1); go(); break;
    case 'k-fpick': K.meal = +d.i; K.fgrp = -2;
      sheet(`<h2>Ajouter à ${esc(c.plan.meals[K.meal].name)}</h2><input id="kpq" placeholder="Rechercher un aliment" autocomplete="off"><div id="kpchips">${grpChips('k-pgrp')}</div><div class="list" id="kplist">${foodRows('', -2)}</div>`);
      if (!ciqReady()) loadCiqual().then(() => { if ($('#kplist')) { $('#kpchips').innerHTML = grpChips('k-pgrp'); $('#kplist').innerHTML = foodRows($('#kpq').value, K.fgrp); } }).catch(() => toast('Table Ciqual indisponible'));
      break;
    case 'k-fadd': { const f = K.food, g = num($('#kfg').value) || 100; c.plan.meals[K.meal].items.push({ n: f[0], g: fmtIn(g), v: [f[2], f[3], f[4], f[5], f[6]] }); K.meal = null; closeSheet(); go(); break; }
    case 'k-pshare': shareText(planText(c)); break;
  }
  return true;
}
function coachInput(t) {
  const d = t.dataset;
  if (t.id === 'kq') { K.q = t.value; $('#klist').innerHTML = clientRows(); return true; }
  if (t.id === 'kfq') { K.fq = t.value; $('#kflist').innerHTML = foodRows(K.fq, K.fgrp); return true; }
  if (t.id === 'kpq') { $('#kplist').innerHTML = foodRows(t.value, K.fgrp); return true; }
  if (t.id === 'kfg') { $('#kfres').innerHTML = portionHtml(K.food, num(t.value)); return true; }
  if (d.ka) { kbi().a[d.ka] = t.value; save(); return true; }
  return false;
}
function coachChange(t) {
  const d = t.dataset, c = kcl();
  if (t.id === 'karch') { K.arch = t.checked; $('#klist').innerHTML = clientRows(); return true; }
  if (d.kc) {
    if (d.kc === 'consent') { c.consent = t.checked; c.consentDate = t.checked ? today() : ''; }
    else c[d.kc] = t.type === 'date' ? t.value : t.value.trim();
    save(); if (d.kc !== 'notes' && d.kc !== 'goal') render(); return true;
  }
  if (d.kb) { if (t.value) kbi().date = t.value; save(); return true; }
  if (d.ka) { kbi().a[d.ka] = t.value; save(); return true; }
  if (d.ktn) { ktp().name = t.value.trim() || ktp().name; save(); return true; }
  if (d.kt) { ktp().qs[+d.k][d.kt] = t.value.trim(); if (d.kt === 'type') ktp().qs[+d.k].x = ''; save(); if (d.kt === 'type') render(); return true; }
  if (d.kn) { c.nut[d.kn] = d.kn === 'w' ? t.value.trim() : num(t.value); save(); render(); return true; }
  if (d.km !== undefined) { c.plan.meals[+d.km].name = t.value.trim() || 'Repas'; save(); return true; }
  if (d.kg !== undefined) { c.plan.meals[+d.kg].items[+d.k].g = t.value.trim(); save(); render(); return true; }
  return false;
}
