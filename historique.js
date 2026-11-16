'use strict';
/* Séances réalisées avant l'usage de l'appli : méso 1, semaines 1 à 3 (26/10 → 14/11/2026).
   Sources : journal « prévu vs fait » pour le mouvement clé (charge, reps, RIR réel) et pages Notion de chaque semaine
   pour le reste de chaque séance, réalisé tel qu'écrit (confirmé par Adrien le 15/11/2026) :
   semaine 1 = les 6 séances ; semaine 2 = S1 à S4 puis S5 + S6 condensées ; semaine 3 = S1 à S3 puis S4 + S5 + S6 condensées.
   Séances condensées (page Notion « Séances condensées ») : mouvements clés seuls, avec leur montée.
   Semaine 2 : Condensée B (tractions + squat). Semaine 3 : Condensée maximale (squat, dips, tractions + EMOM), aucune séance volume faite.
   Quand le plan donne une fourchette (6-8 reps, 40-45 kg), c'est le bas de la fourchette qui est retenu, faute de valeur notée.
   Les notes et remarques de séance ne sont pas reprises (dépôt public).
   Importées une seule fois (voir seedHistory dans app.js) ; une séance modifiée ou supprimée ensuite n'est plus touchée.
   Mouvement : [exercice, séries au format de cycle.js (w = montée), RIR réel de la dernière série lourde] ; EMOM : [exercice, reps de chaque minute]. */
const H_PUSH = [['pecpoulie', '3x10@12.5'], ['latpoulie1', '3x12@10']];
const H_PULL = [['rowwide', '3x8@50'], ['rowclose1', '2x8@70'], ['latpoulie1', '3x10@10'], ['ham', '2x8@22'], ['curlseat', '2x8@16']];
const H_LEGS = [['lcurl1', '3x6@20'], ['legext1', '3x8@40'], ['abdstand', '3x8@60'], ['crunchpoulie', '3x12@35']];
const H_PUSHV = [['latpoulie1', '3x12@10'], ['tri1', '3x8@15'], ['ohtri', '3x8@14']];
const H_LEGSV = [['hip', '3x8@250'], ['lcurl1', '3x8@15'], ['legext1', '3x8@40'], ['crunchpoulie', '3x12@35']];
const H_DIPSV = 'w 1x10@0 / w 1x5@20 / w 1x3@30 / ', H_TRACV = 'w 1x10@0 / w 1x5@10 / w 1x3@15 / ', H_SQV = 'w 1x8@0 / w 1x6@60 / w 1x6@70 / ';
const H_SQC = 'w 1x8@0 / w 1x6@60 / w 1x4@80 / w 1x3@100 / '; // montée des séances condensées
const H_EMOM = ['emompull', [5, 5, 5, 5, 5, 5, 5, 5, 5, 5]];
const H_DIPS = 'w 1x10@0 / w 1x5@20 / w 1x3@40 / w 1x1@50 / ';
const H_TRAC = 'w 1x10@0 / w 1x5@12.5 / w 1x3@17.5 / w 1x1@25 / ';
const H_SQ = 'w 1x8@0 / w 1x6@60 / w 1x6@80 / w 1x5@100 / w 1x5@110 / ';
const H_CP = 'w 1x6@20 / ';

const HISTORY = {
  id: 'meso1-sem1-3-v6',
  replaces: ['meso1-sem1-3', 'meso1-sem1-3-v2', 'meso1-sem1-3-v3', 'meso1-sem1-3-v4', 'meso1-sem1-3-v5'],
  // Exercices du plan absents de la bibliothèque (même format que DEF_EX dans app.js)
  exercises: [
    ['cleanpress', 'Clean press', 'Épaules', 'Triceps,Dos', 'B', 'load', 6, 8, 2.5, 150, 1],
    ['emompull', 'EMOM tractions', 'Dos', 'Biceps', 'P', 'bw', 5, 5, 0, 0],
    ['devhalt', 'Développé haltères', 'Pectoraux', 'Triceps,Épaules', 'H', 'load', 6, 8, 2, 150],
    ['pecpoulie', 'Poulie haute (chef claviculaire)', 'Pectoraux', 'Épaules', 'C', 'load', 10, 12, 2.5, 150],
    ['latpoulie1', 'Élévations latérales poulie unilatérale', 'Épaules', '', 'C', 'load', 10, 12, 1.25, 90],
    ['rowwide', 'Tirage horizontal prise large (machine raw Technogym)', 'Dos', 'Biceps', 'M', 'load', 8, 8, 2.5, 150],
    ['rowclose1', 'Tirage horizontal prise serrée unilatéral', 'Dos', 'Biceps', 'M', 'load', 8, 8, 2.5, 150],
    ['curlseat', 'Curl assis', 'Biceps', '', 'H', 'load', 8, 8, 2, 120],
    ['lcurl1', 'Leg curl unilatéral (Hammer)', 'Ischios', '', 'M', 'load', 6, 8, 2.5, 150],
    ['legext1', 'Leg extension unilatéral', 'Quadriceps', '', 'M', 'load', 8, 10, 2.5, 150],
    ['abdstand', 'Standing abductor', 'Fessiers', '', 'M', 'load', 8, 8, 5, 120],
    ['crunchpoulie', 'Crunch à la poulie', 'Abdos', '', 'C', 'load', 12, 15, 5, 120],
    ['tri1', 'Poulie triceps unilatéral', 'Triceps', '', 'C', 'load', 8, 8, 2.5, 150],
    ['ohtri', 'Overhead triceps (haltères)', 'Triceps', '', 'H', 'load', 8, 10, 2, 150]
  ],
  cycles: {
    m1s1: { title: 'Méso 1 · semaine 1', from: '2026-10-26', to: '2026-11-01', n: 6, sets: 0 },
    m1s2: { title: 'Méso 1 · semaine 2', from: '2026-11-02', to: '2026-11-08', n: 6, sets: 0 },
    m1s3: { title: 'Méso 1 · semaine 3', from: '2026-11-09', to: '2026-11-15', n: 6, sets: 0 }
  },
  sessions: [
    // Semaine 1 — poids moyen 86,9 kg
    { d: '2026-10-26', cyc: 'm1s1', s: 's1', name: 'S1 Push lourd', bw: 86.9, diff: ['Développé haltères : 46 kg au lieu de 44 (indisponibles)'],
      items: [['dips', H_DIPS + '3x4@60', 2], ['cleanpress', H_CP + '3x6@35'], ['devhalt', '3x6@46'], ...H_PUSH] },
    { d: '2026-10-27', cyc: 'm1s1', s: 's2', name: 'S2 Pull lourd', bw: 86.9, diff: [],
      items: [['pull', H_TRAC + '3x4@27.5', 0], H_EMOM, ['cleanpress', H_CP + '3x6@35'], ...H_PULL] },
    { d: '2026-10-28', cyc: 'm1s1', s: 's3', name: 'S3 Legs lourd', bw: 86.9, diff: [],
      items: [['squat', H_SQ + '3x5@120 / 1x5@100', 4], ...H_LEGS] },
    { d: '2026-10-30', cyc: 'm1s1', s: 's4', name: 'S4 Push volume', bw: 86.9, diff: [],
      items: [['dips', H_DIPSV + '4x8@40', 3], ['cleanpress', H_CP + '3x6@35'], ...H_PUSHV] },
    { d: '2026-10-31', cyc: 'm1s1', s: 's5', name: 'S5 Pull volume', bw: 86.9, diff: [],
      items: [['pull', H_TRACV + '4x6@22.5', 0], H_EMOM, ...H_PULL] },
    { d: '2026-11-01', cyc: 'm1s1', s: 's6', name: 'S6 Legs volume', bw: 86.9, diff: [],
      items: [['squat', H_SQV + '5x5@110', 5], ...H_LEGSV] },
    // Semaine 2 — poids moyen 87,1 kg
    { d: '2026-11-02', cyc: 'm1s2', s: 's1', name: 'S1 Push lourd', bw: 87.1, diff: [],
      items: [['dips', H_DIPS + '3x5@60', 1], ['cleanpress', H_CP + '3x7@35'], ['devhalt', '3x6@44'], ...H_PUSH] },
    { d: '2026-11-03', cyc: 'm1s2', s: 's2', name: 'S2 Pull lourd', bw: 87.1, diff: ['EMOM tractions : tenté à 6 reps par minute, tenu 6 minutes'],
      items: [['pull', H_TRAC + '3x5@27.5', 0], ['emompull', [6, 6, 6, 6, 6, 6, 4, 4, 4, 4]], ['cleanpress', H_CP + '3x7@35'], ...H_PULL] },
    { d: '2026-11-04', cyc: 'm1s2', s: 's3', name: 'S3 Legs lourd', bw: 87.1, diff: [],
      items: [['squat', H_SQ + '3x5@125 / 1x5@100', 3], ...H_LEGS] },
    { d: '2026-11-06', cyc: 'm1s2', s: 's4', name: 'S4 Push volume', bw: 87.1, diff: [],
      items: [['dips', H_DIPSV + '4x9@40', 2], ['cleanpress', H_CP + '3x7@35'], ...H_PUSHV] },
    { d: '2026-11-07', cyc: 'm1s2', s: 'cb', name: 'Condensée B · tractions + squat (S5 + S6)', bw: 87.1, diff: ['Condensée B à la place de S5 et S6 (seuls les mouvements clés sont documentés)'],
      items: [['pull', H_TRACV + '4x6@22.5', 0], H_EMOM, ['squat', H_SQC + '5x5@115']] },
    // Semaine 3 — poids moyen 87,3 kg
    { d: '2026-11-10', cyc: 'm1s3', s: 's1', name: 'S1 Push lourd', bw: 87.3, diff: [],
      items: [['dips', H_DIPS + '3x5@62.5', 0], ['cleanpress', H_CP + '3x8@35'], ['devhalt', '3x6@44'], ...H_PUSH] },
    { d: '2026-11-11', cyc: 'm1s3', s: 's2', name: 'S2 Pull lourd', bw: 87.3, diff: ['Tractions : 26,5 kg au lieu de 26,25 (disques de 1,5 kg)'],
      items: [['pull', H_TRAC + '3x5@26.5', 0], H_EMOM, ['cleanpress', H_CP + '3x8@35'], ...H_PULL] },
    { d: '2026-11-12', cyc: 'm1s3', s: 's3', name: 'S3 Legs lourd', bw: 87.3, diff: [],
      items: [['squat', H_SQ + 'w 1x3@120 / 3x5@130 / 1x5@100', 1], ...H_LEGS] },
    { d: '2026-11-14', cyc: 'm1s3', s: 'cmax', name: 'Condensée maximale · plan d\'urgence', bw: 87.3, diff: ['Condensée maximale à la place de S4, S5 et S6 (aucune séance volume faite)'],
      items: [['squat', H_SQC + '5x5@120', 3], ['dips', 'w 1x10@0 / w 1x5@20 / 4x10@40', 0], ['pull', 'w 1x10@0 / w 1x5@10 / 4x7@25', 0], H_EMOM] }
  ]
};
