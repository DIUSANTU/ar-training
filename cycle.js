'use strict';
/* Programme du cycle en cours — SEUL fichier à modifier à chaque bilan.
   Source : Notion « Cycles force & BPJEPS », page de la semaine.
   Écriture d'une séance : [id de l'exercice, séries, note facultative]
   Séries : « w 1x10@0 2:00 / 2x4@60 4:00 »  →  w = montée/échauffement, NxREPS@KG, puis repos m:ss.
   Une fourchette (6-8 reps, 40-45 kg) oblige à saisir la valeur réelle.
   EMOM : { emom: minutes, reps: répétitions par minute }. */
const CYCLE = {
  id: 'm1s4',
  title: 'Semaine de décharge · 5 séances',
  from: '2026-11-16',
  to: '2026-11-22',
  note: 'Décharge : rien à l\'échec. Dips et squat : moitié des séries. Tractions : tout le volume, charge réduite. Note le RIR de la dernière série du premier mouvement.',
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
  sessions: [
    { id: 's1', name: 'S1 Push lourd', items: [
      ['dips', 'w 1x10@0 2:00 / w 1x5@20 2:00 / w 1x3@40 2:30 / 2x4@60 4:00'],
      ['cleanpress', 'w 1x6@20 1:00 / 2x6@35 2:30'],
      ['devhalt', '2x6-8@44 2:30'],
      ['pecpoulie', '2x10-12@12.5 2:30'],
      ['latpoulie1', '2x12@10 1:30']
    ] },
    { id: 's2', name: 'S2 Pull lourd', items: [
      ['pull', 'w 1x10@0 1:30 / w 1x5@12.5 2:00 / w 1x3@17.5 2:30 / 3x5@23.75 3:30'],
      ['emompull', { emom: 10, reps: 5 }, 'Au poids du corps.'],
      ['cleanpress', 'w 1x6@20 1:00 / 2x6@35 2:30'],
      ['rowwide', '2x8@50 2:30', 'Charge par main.'],
      ['rowclose1', '1x8@70 2:30', 'Charge par main. Machine Technogym ou tirage horizontal.'],
      ['latpoulie1', '2x10@10 1:30'],
      ['ham', '1x8@22 2:00'],
      ['curlseat', '1x8@16 2:00']
    ] },
    { id: 's3', name: 'S3 Legs lourd', items: [
      ['squat', 'w 1x8@0 1:00 / w 1x6@60 1:30 / w 1x6@80 3:00 / w 1x5@100 3:00 / w 1x5@110 3:00 / 2x5@120 3:30', 'Pas de back-off.'],
      ['lcurl1', '2x6-8@20 2:30'],
      ['legext1', '2x8-10@40-45 2:30'],
      ['abdstand', '2x8@60 2:00'],
      ['crunchpoulie', '2x12-15@35 2:00']
    ] },
    // Décharge passée à 5 séances le 15/11/2026 (demande d'Adrien) : S4 = ancien Push volume + ancien Pull volume, S5 = ancien Legs volume.
    { id: 's4', name: 'S4 Upper (haut du corps)', items: [
      ['dips', 'w 1x10@0 1:30 / w 1x5@20 2:00 / w 1x3@30 2:30 / 2x8@40 3:00'],
      ['cleanpress', 'w 1x6@20 1:00 / 2x6@35 2:30'],
      ['pull', 'w 1x10@0 1:30 / w 1x5@10 2:00 / w 1x3@15 2:30 / 4x6@20 3:00'],
      ['emompull', { emom: 10, reps: 5 }, 'Au poids du corps.'],
      ['rowwide', '2x8@50 2:30', 'Charge par main.'],
      ['rowclose1', '1x8@70 2:30', 'Charge par main. Machine Technogym ou tirage horizontal.'],
      ['latpoulie1', '2x12@10 1:30'],
      ['tri1', '2x8@15-17.5 2:30', 'Extension verticale avec bande poignets.'],
      ['ohtri', '2x8-10@14 2:30'],
      ['ham', '1x8@22 2:00'],
      ['curlseat', '1x8@16 2:00']
    ] },
    { id: 's5', name: 'S5 Lower (bas du corps)', items: [
      ['squat', 'w 1x8@0 1:00 / w 1x6@60 1:30 / w 1x4@80 2:00 / w 1x3@100 2:30 / 3x5@110 3:00'],
      ['hip', '2x8@250 3:00'],
      ['lcurl1', '2x8@15 2:30'],
      ['legext1', '2x8-10@40-45 2:30'],
      ['crunchpoulie', '2x12-15@35 2:00'],
      ['latpoulie1', '2x10@10 1:30']
    ] }
  ]
};
