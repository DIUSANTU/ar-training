'use strict';
/* Programme du cycle en cours — SEUL fichier à modifier à chaque bilan.
   Source : Notion « Cycles force & BPJEPS », page de la semaine.
   Écriture d'une séance : [id de l'exercice, séries, note facultative]
   Séries : « w 1x10@0 2:00 / 2x4@60 4:00 »  →  w = montée/échauffement, NxREPS@KG, puis repos m:ss.
   Une fourchette (6-8 reps, 40-45 kg) oblige à saisir la valeur réelle.
   EMOM : { emom: minutes, reps: répétitions par minute }. */
const CYCLE = {
  id: 'm2s1',
  title: 'Méso 2 · Semaine 1',
  from: '2026-11-23',
  to: '2026-11-29',
  note: 'RIR visé 3 sur les séries lourdes. 5 séances : Push, Pull, Legs, Upper, Lower. Note le RIR de la dernière série de travail du mouvement principal. Accessoires : 3 séries.',
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
      ['dips', 'w 1x10@0 2:00 / w 1x5@20 2:00 / w 1x3@40 2:30 / w 1x1@50 3:00 / 3x4@62.5 4:00'],
      ['cleanpress', 'w 1x6@20 1:00 / 3x6@40 2:30', 'Progression : +1 rep par semaine jusqu\'à 3x8, puis on monte la charge.'],
      ['devhalt', '3x6-8@44 2:30', 'Passe à 46 kg quand tu fais 3x8.'],
      ['pecpoulie', '3x10-12@12.5 2:30'],
      ['latpoulie1', '3x12@10 1:30']
    ] },
    { id: 's2', name: 'S2 Pull lourd', items: [
      ['pull', 'w 1x10@0 1:30 / w 1x5@12.5 2:00 / w 1x3@17.5 2:30 / w 1x1@20 3:00 / 3x5@25 3:30', 'Plan : 25, puis 26,25, puis 27,5 kg. Lest à relever si ton poids moyen 7 j descend.'],
      ['emompull', { emom: 10, reps: 5 }, 'Au poids du corps.'],
      ['cleanpress', 'w 1x6@20 1:00 / 3x6@40 2:30'],
      ['rowwide', '3x8@50 2:30', 'Charge par main.'],
      ['rowclose1', '3x8@70 2:30', 'Charge par main. Machine Technogym ou tirage horizontal.'],
      ['latpoulie1', '3x10@10 1:30'],
      ['ham', '3x8@22 2:00'],
      ['curlseat', '3x8@16 2:00']
    ] },
    { id: 's3', name: 'S3 Legs lourd', items: [
      ['squat', 'w 1x8@0 1:00 / w 1x6@60 1:30 / w 1x6@80 3:00 / w 1x5@100 3:00 / w 1x3@115 3:00 / 3x5@125 3:30 / 1x5@100 3:00', 'Dernière série : back-off à 100 kg.'],
      ['lcurl1', '3x6-8@20 2:30'],
      ['legext1', '3x8-10@40-45 2:30'],
      ['abdstand', '3x8@60 2:00'],
      ['crunchpoulie', '3x12-15@35 2:00']
    ] },
    { id: 's4', name: 'S4 Upper (haut du corps)', items: [
      ['pull', 'w 1x10@0 1:30 / w 1x5@10 2:00 / w 1x3@15 2:30 / 4x6@22.5 3:00'],
      ['emompull', { emom: 10, reps: 5 }, 'Au poids du corps.'],
      ['dips', 'w 1x10@0 1:30 / w 1x5@20 2:00 / w 1x3@30 2:30 / 4x8@42.5 3:00', 'Les dips avant le clean press : épaules.'],
      ['cleanpress', 'w 1x6@20 1:00 / 2x6@40 2:30'],
      ['rowwide', '3x8@50 2:30', 'Charge par main.'],
      ['latpoulie1', '3x10-12@10 1:30'],
      ['tri1', '3x8-10@15 2:30', 'Extension verticale à la poignée, une main.'],
      ['curlseat', '3x8@16 2:00']
    ] },
    { id: 's5', name: 'S5 Lower (bas du corps)', items: [
      ['squat', 'w 1x8@0 1:00 / w 1x6@60 1:30 / w 1x4@80 2:00 / w 1x3@100 2:30 / 5x5@115 3:00'],
      ['hip', '3x8@250 3:00'],
      ['lcurl1', '3x8@15 2:30'],
      ['legext1', '3x8-10@40-45 2:30'],
      ['crunchpoulie', '3x12-15@35 2:00'],
      ['latpoulie1', '3x10@10 1:30']
    ] }
  ]
};
