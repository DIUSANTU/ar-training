'use strict';
/* Séances réalisées avant l'usage de l'appli, reprises du journal « prévu vs fait » du méso 1 (26/10 → 14/11/2026).
   Seul le mouvement clé de chaque séance est documenté séance par séance : les exercices d'assistance ne sont pas repris.
   Les notes et remarques de séance ne sont pas reprises (dépôt public).
   Importées une seule fois (voir seedHistory dans app.js) ; une séance supprimée ensuite ne revient pas.
   Mouvement : [exercice, séries, reps, kg (lest pour dips et tractions), RIR réel de la dernière série ('' = non noté)]. */
const HISTORY = {
  id: 'meso1-sem1-3',
  cycles: {
    m1s1: { title: 'Méso 1 · semaine 1', from: '2026-10-26', to: '2026-11-01', n: 6, sets: 0 },
    m1s2: { title: 'Méso 1 · semaine 2', from: '2026-11-02', to: '2026-11-08', n: 6, sets: 0 },
    m1s3: { title: 'Méso 1 · semaine 3', from: '2026-11-09', to: '2026-11-15', n: 6, sets: 0 }
  },
  sessions: [
    // Semaine 1 — poids moyen 86,9 kg
    { d: '2026-10-26', cyc: 'm1s1', s: 's1', name: 'S1 Push lourd', bw: 86.9, items: [['dips', 3, 4, 60, 2]],
      diff: ['Développé haltères : 46 kg au lieu de 44 (indisponibles)'] },
    { d: '2026-10-27', cyc: 'm1s1', s: 's2', name: 'S2 Pull lourd', bw: 86.9, items: [['pull', 3, 4, 27.5, 0]], diff: [] },
    { d: '2026-10-28', cyc: 'm1s1', s: 's3', name: 'S3 Legs lourd', bw: 86.9, items: [['squat', 3, 5, 120, 4]], diff: [] },
    { d: '2026-10-30', cyc: 'm1s1', s: 's4', name: 'S4 Push volume', bw: 86.9, items: [['dips', 4, 8, 40, 3]],
      diff: ['Développé haltères : 46 kg au lieu de 44'] },
    { d: '2026-10-31', cyc: 'm1s1', s: 's5', name: 'S5 Pull volume', bw: 86.9, items: [['pull', 4, 6, 22.5, 0]], diff: [] },
    { d: '2026-11-01', cyc: 'm1s1', s: 's6', name: 'S6 Legs volume', bw: 86.9, items: [['squat', 5, 5, 110, 5]], diff: [] },
    // Semaine 2 — poids moyen 87,1 kg
    { d: '2026-11-02', cyc: 'm1s2', s: 's1', name: 'S1 Push lourd', bw: 87.1, items: [['dips', 3, 5, 60, 1]], diff: [] },
    { d: '2026-11-03', cyc: 'm1s2', s: 's2', name: 'S2 Pull lourd', bw: 87.1, items: [['pull', 3, 5, 27.5, 0]],
      diff: ['EMOM tractions : tenté à 6 reps par minute, non tenu'] },
    { d: '2026-11-04', cyc: 'm1s2', s: 's3', name: 'S3 Legs lourd', bw: 87.1, items: [['squat', 3, 5, 125, 3]], diff: [] },
    { d: '2026-11-06', cyc: 'm1s2', s: 's4', name: 'S4 Push volume', bw: 87.1, items: [['dips', 4, 9, 40, 2]], diff: [] },
    { d: '2026-11-07', cyc: 'm1s2', s: 's5', name: 'S5 + S6 condensées', bw: 87.1, items: [['pull', 4, 6, 22.5, 0], ['squat', 5, 5, 115, '']], emom: 1,
      diff: ['S5 et S6 condensées en une séance', 'Dips : non faits (dips volume la veille)'] },
    // Semaine 3 — poids moyen 87,3 kg
    { d: '2026-11-10', cyc: 'm1s3', s: 's1', name: 'S1 Push lourd', bw: 87.3, items: [['dips', 3, 5, 62.5, 0]],
      diff: [] },
    { d: '2026-11-11', cyc: 'm1s3', s: 's2', name: 'S2 Pull lourd', bw: 87.3, items: [['pull', 3, 5, 26.25, 0]], emom: 1,
      diff: [] },
    { d: '2026-11-12', cyc: 'm1s3', s: 's3', name: 'S3 Legs lourd', bw: 87.3, items: [['squat', 3, 5, 130, 1]], diff: [] },
    { d: '2026-11-14', cyc: 'm1s3', s: 's4', name: 'S4 + S5 + S6 condensées', bw: 87.3, items: [['squat', 5, 5, 120, 3], ['pull', 4, 7, 25, 0], ['dips', 4, 10, 40, 0]],
      diff: ['S4, S5 et S6 condensées en une séance (mouvements clés seulement)'] }
  ]
};
