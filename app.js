'use strict';
/* AR Training — suivi musculation / street lifting (PWA, données locales) */

// =============== Constantes ===============
const MUSCLES = ['Pectoraux', 'Dos', 'Trapèzes', 'Épaules', 'Biceps', 'Triceps', 'Avant-bras', 'Quadriceps', 'Ischios', 'Fessiers', 'Adducteurs', 'Mollets', 'Abdos', 'Corps entier'];
const TYPES = { load: 'Charge (kg)', bw: 'Poids du corps + lest', assist: 'Poids du corps assisté', time: 'Maintien (secondes)' };
const KG_LAB = { load: 'kg', bw: 'Lest', assist: 'Assist.', time: 'Lest' };
const SET_TYPES = { n: 'Normale', w: 'Échauffement', f: 'Jusqu\'à l\'échec', d: 'Dégressive' };
const SET_LAB = { w: 'É', f: 'X', d: 'D' };
const STREET = ['pull', 'dips', 'mu', 'squat'];
const XLSX_URL = 'https://cdnjs.cloudflare.com/ajax/libs/xlsx/0.18.5/xlsx.full.min.js';

// Équipement : libre (barre, haltères, poids du corps, kettlebell) ou machine (poulie, machine guidée)
const EQ = { barre: 'Barre', halteres: 'Haltères', pdc: 'Poids du corps', kettlebell: 'Kettlebell', autre: 'Autre (libre)', poulie: 'Poulie', machine: 'Machine guidée' };
const EQ_CAT = eq => (eq === 'poulie' || eq === 'machine' ? 'machine' : 'libre');
const CAT_LAB = { libre: 'Libre', machine: 'Machine' };
const EQ_CODE = { B: 'barre', H: 'halteres', P: 'pdc', K: 'kettlebell', A: 'autre', C: 'poulie', M: 'machine' };

// [id, nom, muscle principal, secondaires, équipement, type, plage min, plage max, incrément kg, repos s, barre olympique]
// Repos : 3 min sur les polyarticulaires lourds (Schoenfeld et al., 2016), 60-120 s en isolation.
const DEF_EX = [
  // Pectoraux
  ['bench', 'Développé couché', 'Pectoraux', 'Triceps,Épaules', 'B', 'load', 5, 8, 2.5, 180, 1],
  ['inclbar', 'Développé incliné barre', 'Pectoraux', 'Épaules,Triceps', 'B', 'load', 6, 10, 2.5, 150, 1],
  ['decl', 'Développé décliné barre', 'Pectoraux', 'Triceps', 'B', 'load', 6, 10, 2.5, 150, 1],
  ['benchdb', 'Développé couché haltères', 'Pectoraux', 'Triceps,Épaules', 'H', 'load', 8, 12, 2, 120],
  ['incl', 'Développé incliné haltères', 'Pectoraux', 'Épaules,Triceps', 'H', 'load', 8, 12, 2, 120],
  ['flydb', 'Écarté haltères', 'Pectoraux', '', 'H', 'load', 10, 15, 2, 90],
  ['pushup', 'Pompes', 'Pectoraux', 'Triceps,Épaules', 'P', 'bw', 10, 20, 2.5, 90],
  ['dipspec', 'Dips buste penché', 'Pectoraux', 'Triceps,Épaules', 'P', 'bw', 6, 10, 2.5, 150],
  ['chestpress', 'Développé couché machine', 'Pectoraux', 'Triceps,Épaules', 'M', 'load', 8, 12, 5, 120],
  ['inclpress', 'Développé incliné machine', 'Pectoraux', 'Épaules,Triceps', 'M', 'load', 8, 12, 5, 120],
  ['pecdeck', 'Pec deck (butterfly)', 'Pectoraux', '', 'M', 'load', 10, 15, 5, 90],
  ['cablefly', 'Écarté poulie vis-à-vis', 'Pectoraux', '', 'C', 'load', 12, 15, 2.5, 90],
  ['lowfly', 'Écarté poulie basse (vers le haut)', 'Pectoraux', 'Épaules', 'C', 'load', 12, 15, 2.5, 90],
  // Dos
  ['pull', 'Tractions lestées', 'Dos', 'Biceps', 'P', 'bw', 5, 8, 2.5, 180],
  ['chin', 'Tractions supination lestées', 'Dos', 'Biceps', 'P', 'bw', 5, 8, 2.5, 180],
  ['pullasst', 'Tractions assistées (élastique)', 'Dos', 'Biceps', 'P', 'assist', 6, 10, 5, 150],
  ['mu', 'Muscle-up', 'Dos', 'Triceps,Pectoraux', 'P', 'bw', 3, 6, 1.25, 180],
  ['invrow', 'Rowing australien (inversé)', 'Dos', 'Biceps', 'P', 'bw', 8, 15, 2.5, 90],
  ['flever', 'Front lever (tenue)', 'Dos', 'Abdos', 'P', 'time', 5, 15, 0, 120],
  ['row', 'Rowing barre', 'Dos', 'Biceps', 'B', 'load', 6, 10, 2.5, 150, 1],
  ['dead', 'Soulevé de terre', 'Dos', 'Ischios,Fessiers', 'B', 'load', 3, 6, 5, 240, 1],
  ['tbar', 'Rowing T-bar', 'Dos', 'Biceps', 'B', 'load', 8, 12, 2.5, 150],
  ['rowdb', 'Rowing haltère unilatéral', 'Dos', 'Biceps', 'H', 'load', 8, 12, 2, 120],
  ['pullover', 'Pull-over haltère', 'Dos', 'Pectoraux', 'H', 'load', 10, 15, 2, 90],
  ['pdown', 'Tirage vertical', 'Dos', 'Biceps', 'C', 'load', 8, 12, 2.5, 120],
  ['pdownclose', 'Tirage vertical prise serrée', 'Dos', 'Biceps', 'C', 'load', 8, 12, 2.5, 120],
  ['cablerow', 'Tirage horizontal poulie', 'Dos', 'Biceps', 'C', 'load', 8, 12, 2.5, 120],
  ['straightarm', 'Pull-over poulie bras tendus', 'Dos', '', 'C', 'load', 12, 15, 2.5, 90],
  ['rowmach', 'Rowing machine convergente', 'Dos', 'Biceps', 'M', 'load', 8, 12, 5, 120],
  ['hyper', 'Extensions lombaires (banc)', 'Dos', 'Fessiers,Ischios', 'M', 'load', 10, 15, 2.5, 90],
  // Épaules
  ['ohp', 'Développé militaire', 'Épaules', 'Triceps', 'B', 'load', 5, 8, 2.5, 180, 1],
  ['ohpdb', 'Développé haltères assis', 'Épaules', 'Triceps', 'H', 'load', 8, 12, 2, 120],
  ['arnold', 'Développé Arnold', 'Épaules', 'Triceps', 'H', 'load', 8, 12, 2, 120],
  ['lat', 'Élévations latérales', 'Épaules', '', 'H', 'load', 10, 15, 1, 90],
  ['reardelt', 'Oiseau haltères', 'Épaules', 'Dos', 'H', 'load', 12, 15, 1, 90],
  ['hspu', 'Pompes en équilibre (HSPU)', 'Épaules', 'Triceps', 'P', 'bw', 3, 8, 2.5, 180],
  ['pike', 'Pompes piquées', 'Épaules', 'Triceps', 'P', 'bw', 8, 15, 2.5, 90],
  ['planche', 'Planche (tenue)', 'Épaules', 'Pectoraux,Triceps', 'P', 'time', 5, 15, 0, 120],
  ['hstand', 'Équilibre (handstand)', 'Épaules', 'Triceps', 'P', 'time', 20, 60, 0, 90],
  ['face', 'Face pull', 'Épaules', 'Dos', 'C', 'load', 12, 15, 2.5, 90],
  ['cablelat', 'Élévations latérales poulie', 'Épaules', '', 'C', 'load', 12, 15, 1.25, 90],
  ['shpress', 'Développé épaules machine', 'Épaules', 'Triceps', 'M', 'load', 8, 12, 5, 120],
  ['revpec', 'Reverse pec deck', 'Épaules', 'Dos', 'M', 'load', 12, 15, 2.5, 90],
  ['latmach', 'Élévations latérales machine', 'Épaules', '', 'M', 'load', 12, 15, 2.5, 90],
  // Biceps
  ['curl', 'Curl barre', 'Biceps', '', 'B', 'load', 8, 12, 2.5, 90],
  ['curlez', 'Curl barre EZ', 'Biceps', '', 'B', 'load', 8, 12, 2.5, 90],
  ['curldb', 'Curl haltères alterné', 'Biceps', '', 'H', 'load', 8, 12, 2, 90],
  ['ham', 'Curl marteau', 'Biceps', '', 'H', 'load', 10, 12, 2, 90],
  ['curlincl', 'Curl incliné haltères', 'Biceps', '', 'H', 'load', 10, 12, 2, 90],
  ['conc', 'Curl concentré', 'Biceps', '', 'H', 'load', 10, 15, 1, 60],
  ['cablecurl', 'Curl poulie basse', 'Biceps', '', 'C', 'load', 10, 15, 2.5, 90],
  ['bayes', 'Curl poulie (Bayesian)', 'Biceps', '', 'C', 'load', 10, 15, 2.5, 90],
  ['preacher', 'Curl pupitre machine', 'Biceps', '', 'M', 'load', 10, 15, 2.5, 90],
  // Triceps
  ['dips', 'Dips lestés', 'Triceps', 'Pectoraux,Épaules', 'P', 'bw', 5, 8, 2.5, 180],
  ['diamond', 'Pompes diamant', 'Triceps', 'Pectoraux', 'P', 'bw', 8, 15, 2.5, 90],
  ['benchdips', 'Dips entre bancs', 'Triceps', 'Pectoraux', 'P', 'bw', 10, 20, 2.5, 90],
  ['cgbench', 'Développé couché prise serrée', 'Triceps', 'Pectoraux', 'B', 'load', 6, 10, 2.5, 150, 1],
  ['skull', 'Barre au front', 'Triceps', '', 'B', 'load', 8, 12, 2.5, 90],
  ['ohext', 'Extension nuque haltère', 'Triceps', '', 'H', 'load', 10, 15, 2, 90],
  ['kick', 'Kickback haltère', 'Triceps', '', 'H', 'load', 12, 15, 1, 60],
  ['tri', 'Extension triceps poulie', 'Triceps', '', 'C', 'load', 10, 15, 2.5, 90],
  ['tricable', 'Extension nuque poulie', 'Triceps', '', 'C', 'load', 10, 15, 2.5, 90],
  ['dipmach', 'Dips machine', 'Triceps', 'Pectoraux', 'M', 'load', 8, 12, 5, 120],
  // Quadriceps
  ['squat', 'Squat', 'Quadriceps', 'Fessiers', 'B', 'load', 5, 8, 2.5, 180, 1],
  ['front', 'Squat avant', 'Quadriceps', 'Fessiers', 'B', 'load', 5, 8, 2.5, 180, 1],
  ['goblet', 'Goblet squat', 'Quadriceps', 'Fessiers', 'H', 'load', 8, 12, 2, 120],
  ['bulg', 'Fentes bulgares', 'Quadriceps', 'Fessiers', 'H', 'load', 8, 12, 2, 120],
  ['lunge', 'Fentes marchées', 'Quadriceps', 'Fessiers', 'H', 'load', 8, 12, 2, 120],
  ['stepup', 'Step-up', 'Quadriceps', 'Fessiers', 'H', 'load', 8, 12, 2, 120],
  ['pistol', 'Pistol squat', 'Quadriceps', 'Fessiers', 'P', 'bw', 5, 10, 2.5, 120],
  ['sissy', 'Sissy squat', 'Quadriceps', '', 'P', 'bw', 8, 15, 2.5, 90],
  ['press', 'Presse à cuisses', 'Quadriceps', 'Fessiers', 'M', 'load', 8, 12, 5, 150],
  ['hack', 'Hack squat', 'Quadriceps', 'Fessiers', 'M', 'load', 8, 12, 5, 150],
  ['smith', 'Squat à la Smith machine', 'Quadriceps', 'Fessiers', 'M', 'load', 6, 10, 2.5, 150],
  ['legext', 'Leg extension', 'Quadriceps', '', 'M', 'load', 10, 15, 5, 90],
  // Ischios
  ['rdl', 'Soulevé de terre roumain', 'Ischios', 'Fessiers,Dos', 'B', 'load', 6, 10, 2.5, 180, 1],
  ['goodm', 'Good morning', 'Ischios', 'Fessiers,Dos', 'B', 'load', 8, 12, 2.5, 150, 1],
  ['rdldb', 'Soulevé de terre roumain haltères', 'Ischios', 'Fessiers', 'H', 'load', 8, 12, 2, 120],
  ['nordic', 'Nordic curl', 'Ischios', '', 'P', 'bw', 3, 8, 2.5, 150],
  ['ghr', 'Glute-ham raise', 'Ischios', 'Fessiers', 'P', 'bw', 6, 12, 2.5, 120],
  ['lcurl', 'Leg curl allongé', 'Ischios', '', 'M', 'load', 10, 15, 2.5, 90],
  ['slcurl', 'Leg curl assis', 'Ischios', '', 'M', 'load', 10, 15, 2.5, 90],
  // Fessiers
  ['hip', 'Hip thrust', 'Fessiers', 'Ischios', 'B', 'load', 8, 12, 5, 120, 1],
  ['sumo', 'Soulevé de terre sumo', 'Fessiers', 'Quadriceps,Ischios', 'B', 'load', 3, 6, 5, 240, 1],
  ['glutebr', 'Pont fessier', 'Fessiers', 'Ischios', 'B', 'load', 10, 15, 5, 90],
  ['kbswing', 'Kettlebell swing', 'Fessiers', 'Ischios', 'K', 'load', 12, 20, 4, 90],
  ['kickcable', 'Kickback fessier poulie', 'Fessiers', '', 'C', 'load', 12, 15, 2.5, 60],
  ['hipmach', 'Hip thrust machine', 'Fessiers', 'Ischios', 'M', 'load', 8, 12, 5, 120],
  ['abduct', 'Abducteurs machine', 'Fessiers', '', 'M', 'load', 12, 20, 5, 60],
  // Mollets
  ['calfdb', 'Mollets unilatéral haltère', 'Mollets', '', 'H', 'load', 10, 15, 2, 60],
  ['calfbw', 'Mollets sur marche', 'Mollets', '', 'P', 'bw', 15, 25, 2.5, 60],
  ['calf', 'Mollets debout machine', 'Mollets', '', 'M', 'load', 10, 15, 5, 90],
  ['calfseat', 'Mollets assis machine', 'Mollets', '', 'M', 'load', 10, 15, 5, 90],
  ['calfpress', 'Mollets à la presse', 'Mollets', '', 'M', 'load', 10, 15, 5, 90],
  // Abdos
  ['plank', 'Gainage', 'Abdos', '', 'P', 'time', 30, 60, 0, 60],
  ['side', 'Gainage latéral', 'Abdos', '', 'P', 'time', 30, 60, 0, 60],
  ['lsit', 'L-sit', 'Abdos', '', 'P', 'time', 10, 30, 0, 90],
  ['hlr', 'Relevés de jambes suspendu', 'Abdos', '', 'P', 'bw', 8, 15, 2.5, 90],
  ['abwheel', 'Roue abdominale', 'Abdos', '', 'P', 'bw', 8, 15, 2.5, 90],
  ['dragon', 'Dragon flag', 'Abdos', '', 'P', 'bw', 3, 8, 2.5, 120],
  ['crunchcable', 'Crunch poulie', 'Abdos', '', 'C', 'load', 10, 15, 5, 60],
  ['crunchmach', 'Crunch machine', 'Abdos', '', 'M', 'load', 10, 15, 5, 60]
].map(mkEx);
function mkEx([id, name, muscle, sec, eq, type, repMin, repMax, inc, rest, bar]) { return { id, name, muscle, sec: sec ? sec.split(',') : [], eq: EQ_CODE[eq], type, bar: !!bar, repMin, repMax, inc, rest, note: '', archived: false }; }
// Bibliothèque étendue (15/11/2026) : variantes street lifting / anneaux, haltérophilie, machines, gainage, avant-bras
DEF_EX.push(...[
  // Pectoraux
  ['benchpause', 'Développé couché pause', 'Pectoraux', 'Triceps,Épaules', 'B', 'load', 3, 6, 2.5, 210, 1],
  ['benchlarsen', 'Développé couché Larsen (jambes levées)', 'Pectoraux', 'Triceps,Épaules', 'B', 'load', 5, 8, 2.5, 180, 1],
  ['spoto', 'Spoto press', 'Pectoraux', 'Triceps,Épaules', 'B', 'load', 4, 8, 2.5, 180, 1],
  ['floorpress', 'Floor press barre', 'Pectoraux', 'Triceps', 'B', 'load', 5, 8, 2.5, 180, 1],
  ['smithbench', 'Développé couché Smith machine', 'Pectoraux', 'Triceps,Épaules', 'M', 'load', 6, 10, 2.5, 150],
  ['smithincl', 'Développé incliné Smith machine', 'Pectoraux', 'Épaules,Triceps', 'M', 'load', 6, 10, 2.5, 150],
  ['hammerpress', 'Développé convergent (Hammer)', 'Pectoraux', 'Triceps,Épaules', 'M', 'load', 8, 12, 2.5, 120],
  ['declpress', 'Développé décliné machine', 'Pectoraux', 'Triceps', 'M', 'load', 8, 12, 5, 120],
  ['decldb', 'Développé décliné haltères', 'Pectoraux', 'Triceps', 'H', 'load', 8, 12, 2, 120],
  ['inclflydb', 'Écarté incliné haltères', 'Pectoraux', 'Épaules', 'H', 'load', 10, 15, 2, 90],
  ['highfly', 'Écarté poulie haute (vers le bas)', 'Pectoraux', '', 'C', 'load', 12, 15, 2.5, 90],
  ['cablepress', 'Développé poulie debout', 'Pectoraux', 'Triceps,Épaules', 'C', 'load', 10, 15, 2.5, 90],
  ['svend', 'Svend press (disque)', 'Pectoraux', 'Épaules', 'H', 'load', 12, 15, 2.5, 60],
  ['widepushup', 'Pompes prise large', 'Pectoraux', 'Triceps,Épaules', 'P', 'bw', 10, 20, 2.5, 90],
  ['declpushup', 'Pompes déclinées (pieds surélevés)', 'Pectoraux', 'Épaules,Triceps', 'P', 'bw', 8, 15, 2.5, 90],
  ['inclpushup', 'Pompes inclinées (mains surélevées)', 'Pectoraux', 'Triceps', 'P', 'bw', 10, 20, 2.5, 90],
  ['archerpu', 'Pompes archer', 'Pectoraux', 'Triceps,Épaules', 'P', 'bw', 5, 10, 2.5, 120],
  ['ringpushup', 'Pompes aux anneaux', 'Pectoraux', 'Triceps,Épaules', 'P', 'bw', 8, 15, 2.5, 120],
  ['ringfly', 'Écarté aux anneaux', 'Pectoraux', 'Épaules', 'P', 'bw', 6, 12, 2.5, 120],
  ['plyopushup', 'Pompes claquées', 'Pectoraux', 'Triceps', 'P', 'bw', 5, 10, 2.5, 120],
  // Dos
  ['neutralpull', 'Tractions prise neutre lestées', 'Dos', 'Biceps', 'P', 'bw', 5, 8, 2.5, 180],
  ['widepull', 'Tractions prise large', 'Dos', 'Biceps', 'P', 'bw', 5, 10, 2.5, 180],
  ['chestbar', 'Tractions hautes explosives (poitrine à la barre)', 'Dos', 'Biceps', 'P', 'bw', 3, 6, 2.5, 180],
  ['archerpull', 'Tractions archer', 'Dos', 'Biceps', 'P', 'bw', 3, 8, 2.5, 150],
  ['lsitpull', 'Tractions en L-sit', 'Dos', 'Biceps,Abdos', 'P', 'bw', 5, 10, 2.5, 150],
  ['negpull', 'Tractions négatives (descente lente)', 'Dos', 'Biceps', 'P', 'bw', 3, 6, 2.5, 150],
  ['scappull', 'Tractions scapulaires', 'Dos', '', 'P', 'bw', 8, 12, 2.5, 90],
  ['ringmu', 'Muscle-up aux anneaux', 'Dos', 'Triceps,Pectoraux', 'P', 'bw', 2, 5, 1.25, 180],
  ['negmu', 'Muscle-up négatif', 'Dos', 'Triceps,Pectoraux', 'P', 'bw', 2, 5, 1.25, 150],
  ['ringrow', 'Rowing aux anneaux', 'Dos', 'Biceps', 'P', 'bw', 8, 15, 2.5, 90],
  ['fltuck', 'Front lever groupé (tenue)', 'Dos', 'Abdos', 'P', 'time', 10, 30, 0, 120],
  ['flraise', 'Front lever raises', 'Dos', 'Abdos', 'P', 'bw', 3, 8, 2.5, 150],
  ['backlever', 'Back lever (tenue)', 'Dos', 'Abdos', 'P', 'time', 5, 20, 0, 120],
  ['skincat', 'Skin the cat', 'Dos', 'Abdos,Épaules', 'P', 'bw', 3, 6, 2.5, 120],
  ['pendlay', 'Rowing Pendlay', 'Dos', 'Biceps', 'B', 'load', 5, 8, 2.5, 150, 1],
  ['yatesrow', 'Rowing barre supination (Yates)', 'Dos', 'Biceps', 'B', 'load', 6, 10, 2.5, 150, 1],
  ['sealrow', 'Seal row (rowing sur banc)', 'Dos', 'Biceps', 'B', 'load', 6, 10, 2.5, 150, 1],
  ['meadows', 'Rowing Meadows (landmine)', 'Dos', 'Biceps', 'B', 'load', 8, 12, 2.5, 120],
  ['chestrow', 'Rowing haltères buste appuyé', 'Dos', 'Biceps', 'H', 'load', 8, 12, 2, 120],
  ['rackpull', 'Rack pull', 'Dos', 'Fessiers,Ischios', 'B', 'load', 3, 6, 5, 210, 1],
  ['deficitdead', 'Soulevé de terre déficit', 'Dos', 'Ischios,Fessiers', 'B', 'load', 3, 6, 5, 240, 1],
  ['pausedead', 'Soulevé de terre pause', 'Dos', 'Ischios,Fessiers', 'B', 'load', 3, 5, 5, 240, 1],
  ['trapbar', 'Soulevé de terre trap bar', 'Dos', 'Quadriceps,Fessiers', 'B', 'load', 3, 6, 5, 240],
  ['pdownneutral', 'Tirage vertical prise neutre', 'Dos', 'Biceps', 'C', 'load', 8, 12, 2.5, 120],
  ['pdownsup', 'Tirage vertical supination', 'Dos', 'Biceps', 'C', 'load', 8, 12, 2.5, 120],
  ['pdown1', 'Tirage vertical unilatéral', 'Dos', 'Biceps', 'C', 'load', 10, 12, 2.5, 90],
  ['cablerow1', 'Tirage horizontal poulie unilatéral', 'Dos', 'Biceps', 'C', 'load', 10, 12, 2.5, 90],
  ['highrow', 'Tirage haut machine (high row)', 'Dos', 'Biceps', 'M', 'load', 8, 12, 5, 120],
  ['lowrow', 'Tirage bas machine (low row)', 'Dos', 'Biceps', 'M', 'load', 8, 12, 5, 120],
  ['pullovermach', 'Pull-over machine', 'Dos', '', 'M', 'load', 10, 15, 5, 90],
  ['revhyper', 'Reverse hyper', 'Dos', 'Fessiers,Ischios', 'M', 'load', 10, 15, 5, 90],
  ['superman', 'Superman (tenue)', 'Dos', 'Fessiers', 'P', 'time', 20, 45, 0, 60],
  // Trapèzes
  ['shrug', 'Shrug barre', 'Trapèzes', 'Avant-bras', 'B', 'load', 8, 12, 5, 90, 1],
  ['shrugdb', 'Shrug haltères', 'Trapèzes', 'Avant-bras', 'H', 'load', 10, 15, 2, 90],
  ['shrugmach', 'Shrug machine', 'Trapèzes', '', 'M', 'load', 10, 15, 5, 90],
  ['uprightrow', 'Tirage menton barre', 'Trapèzes', 'Épaules', 'B', 'load', 8, 12, 2.5, 90],
  ['uprightcable', 'Tirage menton poulie', 'Trapèzes', 'Épaules', 'C', 'load', 10, 15, 2.5, 90],
  ['ytw', 'Y-T-W haltères (banc incliné)', 'Trapèzes', 'Épaules,Dos', 'H', 'load', 8, 12, 1, 60],
  ['trap3', 'Trap-3 raise (élévation en Y)', 'Trapèzes', 'Épaules', 'H', 'load', 10, 15, 1, 60],
  // Épaules
  ['pushpress', 'Push press', 'Épaules', 'Triceps,Quadriceps', 'B', 'load', 3, 6, 2.5, 180, 1],
  ['zpress', 'Z press (assis au sol)', 'Épaules', 'Triceps,Abdos', 'B', 'load', 5, 8, 2.5, 150, 1],
  ['ohp1', 'Développé haltère unilatéral debout', 'Épaules', 'Triceps,Abdos', 'H', 'load', 6, 10, 2, 120],
  ['landminepress', 'Landmine press', 'Épaules', 'Pectoraux,Triceps', 'B', 'load', 8, 12, 2.5, 120],
  ['smithohp', 'Développé épaules Smith machine', 'Épaules', 'Triceps', 'M', 'load', 6, 10, 2.5, 150],
  ['latlean', 'Élévations latérales penché (lean-away)', 'Épaules', '', 'H', 'load', 10, 15, 1, 90],
  ['latseat', 'Élévations latérales assis', 'Épaules', '', 'H', 'load', 10, 15, 1, 90],
  ['luraise', 'Lu raises (élévations jusqu\'en haut)', 'Épaules', 'Trapèzes', 'H', 'load', 10, 15, 1, 90],
  ['frontraise', 'Élévations frontales haltères', 'Épaules', '', 'H', 'load', 10, 15, 1, 90],
  ['frontcable', 'Élévations frontales poulie', 'Épaules', '', 'C', 'load', 10, 15, 1.25, 90],
  ['frontplate', 'Élévations frontales disque', 'Épaules', '', 'H', 'load', 10, 15, 2.5, 90],
  ['rearcable', 'Oiseau poulies croisées', 'Épaules', 'Dos', 'C', 'load', 12, 15, 1.25, 90],
  ['rearincl', 'Oiseau haltères buste appuyé', 'Épaules', 'Dos', 'H', 'load', 12, 15, 1, 90],
  ['cuban', 'Cuban press', 'Épaules', 'Trapèzes', 'H', 'load', 8, 12, 1, 90],
  ['extrot', 'Rotation externe poulie', 'Épaules', '', 'C', 'load', 12, 15, 1.25, 60],
  ['extrotdb', 'Rotation externe haltère (coude sur genou)', 'Épaules', '', 'H', 'load', 12, 15, 1, 60],
  ['bandapart', 'Band pull-apart (élastique)', 'Épaules', 'Trapèzes', 'A', 'bw', 15, 25, 0, 60],
  ['pseudopl', 'Pompes pseudo-planche', 'Épaules', 'Pectoraux,Triceps', 'P', 'bw', 5, 12, 2.5, 120],
  ['planchelean', 'Planche lean (tenue)', 'Épaules', 'Pectoraux,Abdos', 'P', 'time', 10, 30, 0, 90],
  ['tuckplanche', 'Planche groupée (tenue)', 'Épaules', 'Pectoraux,Triceps', 'P', 'time', 5, 20, 0, 120],
  ['wallwalk', 'Wall walk', 'Épaules', 'Triceps,Abdos', 'P', 'bw', 3, 6, 2.5, 120],
  ['wallhs', 'Équilibre contre le mur (tenue)', 'Épaules', 'Triceps', 'P', 'time', 20, 60, 0, 90],
  // Biceps
  ['spider', 'Curl spider', 'Biceps', '', 'H', 'load', 10, 12, 2, 90],
  ['dragcurl', 'Drag curl', 'Biceps', '', 'B', 'load', 8, 12, 2.5, 90],
  ['zottman', 'Curl Zottman', 'Biceps', 'Avant-bras', 'H', 'load', 8, 12, 1, 90],
  ['hamcable', 'Curl marteau corde (poulie)', 'Biceps', 'Avant-bras', 'C', 'load', 10, 15, 2.5, 90],
  ['hamcross', 'Curl marteau croisé', 'Biceps', 'Avant-bras', 'H', 'load', 8, 12, 2, 90],
  ['preacherez', 'Curl pupitre barre EZ', 'Biceps', '', 'B', 'load', 8, 12, 2.5, 90],
  ['preacherdb', 'Curl pupitre haltère', 'Biceps', '', 'H', 'load', 8, 12, 1, 90],
  ['highcurl', 'Curl poulies hautes (double biceps)', 'Biceps', '', 'C', 'load', 10, 15, 2.5, 60],
  ['curlmach', 'Curl machine', 'Biceps', '', 'M', 'load', 10, 15, 2.5, 90],
  ['ringcurl', 'Curl aux anneaux', 'Biceps', '', 'P', 'bw', 8, 12, 2.5, 90],
  ['waitercurl', 'Waiter curl', 'Biceps', '', 'H', 'load', 10, 15, 1, 60],
  // Triceps
  ['ringdips', 'Dips aux anneaux', 'Triceps', 'Pectoraux,Épaules', 'P', 'bw', 5, 10, 2.5, 180],
  ['bardips', 'Dips barre droite', 'Triceps', 'Pectoraux,Épaules', 'P', 'bw', 5, 10, 2.5, 150],
  ['koreandips', 'Dips coréens', 'Triceps', 'Épaules', 'P', 'bw', 5, 10, 2.5, 150],
  ['jmpress', 'JM press', 'Triceps', 'Pectoraux', 'B', 'load', 6, 10, 2.5, 120, 1],
  ['tate', 'Tate press', 'Triceps', '', 'H', 'load', 10, 12, 1, 90],
  ['skulldb', 'Barre au front haltères', 'Triceps', '', 'H', 'load', 8, 12, 1, 90],
  ['frenchez', 'Extension nuque barre EZ', 'Triceps', '', 'B', 'load', 8, 12, 2.5, 90],
  ['trirope', 'Extension triceps corde', 'Triceps', '', 'C', 'load', 10, 15, 2.5, 90],
  ['tribar', 'Extension triceps barre droite', 'Triceps', '', 'C', 'load', 10, 15, 2.5, 90],
  ['trirev', 'Extension triceps prise inversée', 'Triceps', '', 'C', 'load', 10, 15, 2.5, 60],
  ['trimach', 'Extension triceps machine', 'Triceps', '', 'M', 'load', 10, 15, 2.5, 90],
  ['ringtri', 'Extension triceps aux anneaux', 'Triceps', 'Abdos', 'P', 'bw', 6, 12, 2.5, 120],
  ['closepushup', 'Pompes prise serrée', 'Triceps', 'Pectoraux', 'P', 'bw', 10, 20, 2.5, 90],
  // Avant-bras
  ['reversecurl', 'Curl inversé barre EZ', 'Avant-bras', 'Biceps', 'B', 'load', 10, 15, 2.5, 60],
  ['wristcurl', 'Flexion des poignets', 'Avant-bras', '', 'B', 'load', 12, 20, 2.5, 60],
  ['wristext', 'Extension des poignets', 'Avant-bras', '', 'H', 'load', 12, 20, 1, 60],
  ['wristroller', 'Enrouleur de poignets', 'Avant-bras', '', 'A', 'load', 2, 4, 1.25, 90],
  ['farmer', 'Marche du fermier', 'Avant-bras', 'Trapèzes,Abdos', 'H', 'time', 30, 60, 0, 120],
  ['deadhang', 'Suspension à la barre (dead hang)', 'Avant-bras', 'Dos', 'P', 'time', 30, 90, 0, 90],
  ['hang1', 'Suspension à un bras', 'Avant-bras', 'Dos', 'P', 'time', 10, 30, 0, 90],
  ['platepinch', 'Pince de disques (tenue)', 'Avant-bras', '', 'A', 'time', 20, 45, 0, 60],
  ['gripper', 'Pince à main (gripper)', 'Avant-bras', '', 'A', 'load', 8, 15, 2.5, 60],
  // Quadriceps
  ['pausesquat', 'Squat pause', 'Quadriceps', 'Fessiers', 'B', 'load', 3, 6, 2.5, 210, 1],
  ['boxsquat', 'Box squat', 'Quadriceps', 'Fessiers,Ischios', 'B', 'load', 3, 6, 2.5, 210, 1],
  ['tempsquat', 'Squat tempo (descente lente)', 'Quadriceps', 'Fessiers', 'B', 'load', 4, 6, 2.5, 180, 1],
  ['zercher', 'Squat Zercher', 'Quadriceps', 'Fessiers,Abdos', 'B', 'load', 5, 8, 2.5, 180, 1],
  ['ohsquat', 'Squat d\'arraché (overhead squat)', 'Quadriceps', 'Épaules,Abdos', 'B', 'load', 3, 6, 2.5, 150, 1],
  ['lungebar', 'Fentes barre', 'Quadriceps', 'Fessiers', 'B', 'load', 6, 10, 2.5, 150, 1],
  ['revlunge', 'Fentes arrière haltères', 'Quadriceps', 'Fessiers', 'H', 'load', 8, 12, 2, 120],
  ['sidelunge', 'Fentes latérales', 'Quadriceps', 'Adducteurs,Fessiers', 'H', 'load', 8, 12, 2, 90],
  ['cossack', 'Squat cosaque', 'Quadriceps', 'Adducteurs,Fessiers', 'P', 'bw', 6, 10, 2.5, 90],
  ['shrimp', 'Shrimp squat', 'Quadriceps', 'Fessiers', 'P', 'bw', 4, 8, 2.5, 120],
  ['press1', 'Presse à cuisses unilatérale', 'Quadriceps', 'Fessiers', 'M', 'load', 8, 12, 5, 120],
  ['pendulum', 'Pendulum squat', 'Quadriceps', 'Fessiers', 'M', 'load', 8, 12, 5, 150],
  ['beltsquat', 'Belt squat', 'Quadriceps', 'Fessiers', 'M', 'load', 8, 12, 5, 150],
  ['smithsplit', 'Fentes Smith machine', 'Quadriceps', 'Fessiers', 'M', 'load', 8, 12, 2.5, 120],
  ['stepdown', 'Step-down (descente de marche)', 'Quadriceps', 'Fessiers', 'P', 'bw', 8, 12, 2.5, 90],
  ['wallsit', 'Chaise (tenue)', 'Quadriceps', '', 'P', 'time', 30, 90, 0, 90],
  ['jumpsquat', 'Squat sauté', 'Quadriceps', 'Fessiers,Mollets', 'P', 'bw', 5, 10, 2.5, 120],
  ['boxjump', 'Box jump', 'Quadriceps', 'Fessiers,Mollets', 'P', 'bw', 3, 6, 0, 120],
  ['sled', 'Poussée de traîneau (longueurs)', 'Quadriceps', 'Fessiers,Mollets', 'A', 'load', 2, 6, 10, 150],
  // Ischios
  ['stiff', 'Soulevé de terre jambes tendues', 'Ischios', 'Fessiers,Dos', 'B', 'load', 6, 10, 2.5, 180, 1],
  ['rdl1', 'Soulevé de terre roumain unilatéral', 'Ischios', 'Fessiers', 'H', 'load', 8, 12, 2, 120],
  ['lcurlstand', 'Leg curl debout', 'Ischios', '', 'M', 'load', 10, 15, 2.5, 90],
  ['lcurlball', 'Leg curl swiss ball', 'Ischios', 'Fessiers', 'P', 'bw', 8, 15, 2.5, 90],
  ['hyper45', 'Extension à 45° (ischios, fessiers)', 'Ischios', 'Fessiers,Dos', 'M', 'load', 10, 15, 2.5, 90],
  ['kbdead', 'Soulevé de terre kettlebell', 'Ischios', 'Fessiers', 'K', 'load', 8, 12, 4, 120],
  // Fessiers
  ['hip1', 'Hip thrust unilatéral', 'Fessiers', 'Ischios', 'P', 'bw', 8, 12, 2.5, 90],
  ['pullthrough', 'Pull-through poulie', 'Fessiers', 'Ischios', 'C', 'load', 10, 15, 2.5, 90],
  ['sumosq', 'Squat sumo haltère', 'Fessiers', 'Quadriceps,Adducteurs', 'H', 'load', 8, 12, 2, 120],
  ['curtsy', 'Fentes croisées (curtsy)', 'Fessiers', 'Quadriceps', 'H', 'load', 8, 12, 2, 90],
  ['abductcable', 'Abduction de hanche poulie', 'Fessiers', '', 'C', 'load', 12, 15, 1.25, 60],
  ['kickmach', 'Kickback fessier machine', 'Fessiers', 'Ischios', 'M', 'load', 10, 15, 5, 90],
  ['frogpump', 'Frog pump', 'Fessiers', '', 'P', 'bw', 15, 25, 2.5, 60],
  ['bandwalk', 'Marche latérale élastique', 'Fessiers', '', 'A', 'bw', 10, 20, 0, 60],
  // Adducteurs
  ['adduct', 'Adducteurs machine', 'Adducteurs', '', 'M', 'load', 12, 20, 5, 60],
  ['adductcable', 'Adduction de hanche poulie', 'Adducteurs', '', 'C', 'load', 12, 15, 1.25, 60],
  ['copenhagen', 'Planche Copenhague (tenue)', 'Adducteurs', 'Abdos', 'P', 'time', 15, 40, 0, 60],
  // Mollets
  ['calfsmith', 'Mollets debout Smith machine', 'Mollets', '', 'M', 'load', 10, 15, 2.5, 90],
  ['donkey', 'Mollets donkey machine', 'Mollets', '', 'M', 'load', 10, 15, 5, 90],
  ['calfbar', 'Mollets debout barre', 'Mollets', '', 'B', 'load', 10, 15, 5, 90],
  ['tibialis', 'Relevés tibiaux (tibialis raise)', 'Mollets', '', 'P', 'bw', 15, 25, 2.5, 60],
  // Abdos
  ['crunch', 'Crunch au sol', 'Abdos', '', 'P', 'bw', 15, 25, 2.5, 60],
  ['revcrunch', 'Crunch inversé', 'Abdos', '', 'P', 'bw', 12, 20, 2.5, 60],
  ['situp', 'Relevés de buste (sit-up)', 'Abdos', '', 'P', 'bw', 15, 25, 2.5, 60],
  ['declsitup', 'Sit-up décliné lesté', 'Abdos', '', 'P', 'bw', 10, 15, 2.5, 90],
  ['vup', 'V-up', 'Abdos', '', 'P', 'bw', 10, 15, 2.5, 60],
  ['kneeraise', 'Relevés de genoux suspendu', 'Abdos', '', 'P', 'bw', 10, 20, 2.5, 90],
  ['captain', 'Relevés de jambes chaise romaine', 'Abdos', '', 'P', 'bw', 10, 15, 2.5, 90],
  ['ttb', 'Toes-to-bar', 'Abdos', 'Dos', 'P', 'bw', 6, 12, 2.5, 120],
  ['windshield', 'Essuie-glaces suspendu', 'Abdos', 'Dos', 'P', 'bw', 6, 12, 2.5, 120],
  ['legraise', 'Relevés de jambes au sol', 'Abdos', '', 'P', 'bw', 12, 20, 2.5, 60],
  ['hollow', 'Hollow hold (tenue)', 'Abdos', '', 'P', 'time', 20, 60, 0, 60],
  ['lsittuck', 'L-sit groupé (tenue)', 'Abdos', '', 'P', 'time', 10, 30, 0, 90],
  ['vsit', 'V-sit (tenue)', 'Abdos', '', 'P', 'time', 5, 20, 0, 120],
  ['plankw', 'Gainage lesté', 'Abdos', '', 'P', 'time', 30, 60, 0, 90],
  ['bodysaw', 'Body saw', 'Abdos', '', 'P', 'bw', 8, 12, 2.5, 90],
  ['deadbug', 'Dead bug', 'Abdos', '', 'P', 'bw', 10, 16, 2.5, 60],
  ['pallof', 'Pallof press', 'Abdos', '', 'C', 'load', 10, 15, 2.5, 60],
  ['woodchop', 'Wood chop poulie', 'Abdos', '', 'C', 'load', 10, 15, 2.5, 60],
  ['russtwist', 'Rotations russes', 'Abdos', '', 'H', 'load', 16, 30, 1, 60],
  ['sidebend', 'Flexion latérale haltère', 'Abdos', '', 'H', 'load', 12, 15, 2, 60],
  // Corps entier : haltérophilie, kettlebell, conditionnement
  ['snatch', 'Arraché', 'Corps entier', 'Épaules,Quadriceps,Dos', 'B', 'load', 1, 3, 2.5, 180, 1],
  ['powersnatch', 'Arraché debout (power snatch)', 'Corps entier', 'Épaules,Dos', 'B', 'load', 1, 3, 2.5, 150, 1],
  ['hangsnatch', 'Arraché suspendu', 'Corps entier', 'Épaules,Dos', 'B', 'load', 2, 3, 2.5, 150, 1],
  ['musclesnatch', 'Arraché en force (muscle snatch)', 'Corps entier', 'Épaules,Trapèzes', 'B', 'load', 3, 5, 2.5, 120, 1],
  ['snatchpull', 'Tirage d\'arraché', 'Corps entier', 'Dos,Trapèzes', 'B', 'load', 2, 4, 2.5, 150, 1],
  ['snatchbal', 'Snatch balance', 'Corps entier', 'Épaules,Quadriceps', 'B', 'load', 2, 3, 2.5, 150, 1],
  ['cleanjerk', 'Épaulé-jeté', 'Corps entier', 'Quadriceps,Épaules,Dos', 'B', 'load', 1, 3, 2.5, 180, 1],
  ['clean', 'Épaulé', 'Corps entier', 'Quadriceps,Dos', 'B', 'load', 1, 3, 2.5, 180, 1],
  ['powerclean', 'Épaulé debout (power clean)', 'Corps entier', 'Dos,Trapèzes', 'B', 'load', 2, 4, 2.5, 150, 1],
  ['hangclean', 'Épaulé suspendu', 'Corps entier', 'Dos,Trapèzes', 'B', 'load', 2, 3, 2.5, 150, 1],
  ['cleanpull', 'Tirage d\'épaulé', 'Corps entier', 'Dos,Trapèzes', 'B', 'load', 2, 4, 2.5, 150, 1],
  ['splitjerk', 'Jeté en fente', 'Corps entier', 'Épaules,Triceps,Quadriceps', 'B', 'load', 1, 3, 2.5, 180, 1],
  ['pushjerk', 'Jeté en poussée (push jerk)', 'Corps entier', 'Épaules,Triceps', 'B', 'load', 2, 3, 2.5, 150, 1],
  ['thruster', 'Thruster', 'Corps entier', 'Quadriceps,Épaules', 'B', 'load', 5, 10, 2.5, 150, 1],
  ['dbsnatch', 'Arraché haltère', 'Corps entier', 'Épaules,Dos', 'H', 'load', 5, 8, 2, 120],
  ['kbsnatch', 'Arraché kettlebell', 'Corps entier', 'Épaules,Fessiers', 'K', 'load', 5, 10, 4, 120],
  ['kbclean', 'Épaulé kettlebell', 'Corps entier', 'Fessiers,Dos', 'K', 'load', 5, 10, 4, 120],
  ['turkish', 'Relevé turc (Turkish get-up)', 'Corps entier', 'Épaules,Abdos', 'K', 'load', 1, 3, 4, 120],
  ['burpee', 'Burpees', 'Corps entier', 'Pectoraux,Quadriceps', 'P', 'bw', 10, 20, 0, 90],
  ['wallball', 'Wall ball', 'Corps entier', 'Quadriceps,Épaules', 'A', 'load', 10, 20, 1, 90]
].map(mkEx));
// Programme du cycle (cycle.js) : absent = l'appli fonctionne en mode libre seul
const CYC = typeof CYCLE !== 'undefined' ? CYCLE : null;
const VER = '15/11 n°5';
const DEF_TPL = [
  ['push', 'Push', ['bench', 'ohp', 'incl', 'lat', 'dips', 'tri']],
  ['pull', 'Pull', ['pull', 'row', 'pdown', 'face', 'curl', 'ham']],
  ['legs', 'Legs', ['squat', 'rdl', 'press', 'lcurl', 'bulg', 'calf']]
].map(([id, name, ids]) => ({ id, name, rot: true, items: ids.map(exId => ({ exId, sets: 3, group: '' })) }));

// =============== Utilitaires ===============
const $ = s => document.querySelector(s);
const clone = o => JSON.parse(JSON.stringify(o));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const num = v => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isNaN(n) ? 0 : n; };
const has = v => v !== '' && v != null && !isNaN(parseFloat(String(v).replace(',', '.')));
const fmt = (n, d = 1) => (Math.round(n * 10 ** d) / 10 ** d).toLocaleString('fr-FR');
const fmtIn = n => String(Math.round(num(n) * 100) / 100).replace('.', ',');
const iso = d => { const z = new Date(d.getTime() - d.getTimezoneOffset() * 6e4); return z.toISOString().slice(0, 10); };
const addDays = (s, n) => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() + n); return iso(d); };
const fr = s => new Date(s + 'T12:00').toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' });
const mondayOf = s => { const d = new Date(s + 'T12:00'); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return iso(d); };
const today = () => iso(new Date());
const mmss = s => { s = Math.max(0, Math.floor(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };
const norm = s => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
const GHOST = { name: 'Exercice supprimé', muscle: '', sec: [], type: 'load', bar: false, repMin: 8, repMax: 12, inc: 2.5, rest: 0, note: '' };
const ex = id => S.exercises.find(e => e.id === id) || Object.assign({ id }, GHOST);
const tpl = id => S.templates.find(t => t.id === id);
const isWork = s => s.done && s.t !== 'w' && (num(s.reps) > 0 || num(s.sec) > 0);
const bwOf = se => se.bw || S.settings.bw;
const isIOS = /iPhone|iPad|iPod/.test(navigator.userAgent);
const standalone = () => navigator.standalone === true || matchMedia('(display-mode: standalone)').matches;

// Charge effective : poids du corps compté pour les exercices au poids du corps
function eff(e, s, bw) { const k = num(s.kg); if (e.type === 'bw') return bw + k; if (e.type === 'assist') return Math.max(0, bw - k); return k; }
// e1RM — Epley (1985) : charge × (1 + reps/30), retenu jusqu'à 12 reps (au-delà l'erreur d'estimation grimpe)
function e1rm(e, s, bw) { if (e.type === 'time') return 0; const r = num(s.reps); if (r < 1 || r > 12) return 0; const w = eff(e, s, bw); return r === 1 ? w : w * (1 + r / 30); }

// =============== Stockage (IndexedDB + stockage persistant) ===============
let S = null, DB = null, persisted = null;
function idbOpen() { return new Promise((res, rej) => { const r = indexedDB.open('lourd', 1); r.onupgradeneeded = () => r.result.createObjectStore('kv'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); }); }
function kv(mode, fn) { return new Promise((res, rej) => { const tx = DB.transaction('kv', mode), rq = fn(tx.objectStore('kv')); tx.oncomplete = () => res(rq ? rq.result : undefined); tx.onerror = tx.onabort = () => rej(tx.error); }); }
const kGet = k => kv('readonly', s => s.get(k));
const kPut = (k, v) => kv('readwrite', s => s.put(v, k));
const kDel = k => kv('readwrite', s => s.delete(k));
const kKeys = () => kv('readonly', s => s.getAllKeys());

function defaults() {
  return { v: 2, exercises: clone(DEF_EX), templates: clone(DEF_TPL), sessions: [], active: null, paused: [], lastExport: 0,
    settings: { bw: 83.5, rest: 120, bar: 20, plates: [25, 20, 15, 10, 5, 2.5, 1.25] } };
}
function exDefaults() { return { id: uid(), name: 'Nouvel exercice', muscle: 'Pectoraux', sec: [], eq: 'autre', type: 'load', bar: false, repMin: 8, repMax: 12, inc: 2.5, rest: 0, note: '', archived: false }; }
function normalize(s) {
  const d = defaults();
  s.v = 2; s.settings = Object.assign(d.settings, s.settings || {});
  s.exercises = (s.exercises || []).map(e => {
    const def = DEF_EX.find(x => x.id === e.id);
    return Object.assign(exDefaults(), def && !e.eq ? { eq: def.eq } : {}, e);
  });
  // ajoute les exercices de la bibliothèque apparus dans une nouvelle version (sans toucher aux existants)
  DEF_EX.forEach(def => { if (!s.exercises.some(e => e.id === def.id)) s.exercises.push(clone(def)); });
  if (CYC) CYC.exercises.map(mkEx).forEach(def => { if (!s.exercises.some(e => e.id === def.id)) s.exercises.push(def); });
  s.templates = Array.isArray(s.templates) ? s.templates : d.templates;
  s.sessions = (s.sessions || []).sort((a, b) => (a.start || 0) - (b.start || 0));
  if (s.active === undefined) s.active = null;
  s.paused = Array.isArray(s.paused) ? s.paused : [];
  s.lastExport = s.lastExport || 0;
  s.coach = normalizeCoach(s.coach);
  return s;
}
// Migration depuis la première version (localStorage, RPE)
function migrate(o) {
  const s = defaults(), bw = (o.settings && o.settings.bw) || 83.5;
  s.settings.bw = bw; if (o.settings && o.settings.rest) s.settings.rest = o.settings.rest;
  (o.exercises || []).forEach(e => { if (!s.exercises.find(x => x.id === e.id)) s.exercises.push(Object.assign(exDefaults(), { id: e.id, name: e.name, muscle: e.muscle, type: e.type === 'bw' ? 'bw' : 'load' })); });
  if (o.templates && !Array.isArray(o.templates)) s.templates.forEach(t => { if (o.templates[t.id]) t.items = o.templates[t.id].map(exId => ({ exId, sets: 3, group: '' })); });
  const names = { push: 'Push', pull: 'Pull', legs: 'Legs' };
  s.sessions = (o.sessions || []).map(se => ({ id: se.id, date: se.date, tplId: names[se.type] ? se.type : '', name: names[se.type] || 'Libre', start: se.start, end: se.end, bw, note: '',
    entries: se.entries.map(en => ({ exId: en.exId, group: '', sets: en.sets.map(x => ({ t: 'n', kg: x.kg, reps: x.reps, sec: '', rir: has(x.rpe) ? String(Math.max(0, Math.min(5, Math.round(10 - num(x.rpe))))) : '', done: true, pr: [] })) })) }));
  return s;
}

let saveTimer = null;
function save(now) { clearTimeout(saveTimer); if (now) return flush(); saveTimer = setTimeout(flush, 250); }
function flush() {
  clearTimeout(saveTimer); saveTimer = null;
  if (DB) return kPut('state', S).catch(lsSave);
  lsSave(); return Promise.resolve();
}
function lsSave() { try { localStorage.setItem('lourd.v2', JSON.stringify(S)); } catch (e) {} }
async function snapshot() {
  if (!DB) return;
  try {
    await kPut('snap:' + new Date().toISOString(), clone(S));
    const ks = (await kKeys()).filter(k => String(k).startsWith('snap:')).sort();
    for (const k of ks.slice(0, -15)) await kDel(k);
  } catch (e) {}
}

// =============== Interface : feuille, toast, son, écran ===============
let askCb = null;
function sheet(html) { const s = $('#sheet'); s.innerHTML = `<div class="bg" data-act="close"></div><div class="sh"><div class="grab"></div>${html}</div>`; s.classList.add('on'); }
function closeSheet() { const s = $('#sheet'); s.classList.remove('on'); s.innerHTML = ''; askCb = null; }
function ask(msg, ok, cb, sub) { sheet(`<h2>${msg}</h2>${sub ? `<p class="mut">${sub}</p>` : ''}<div class="row nw" style="margin-top:14px"><button class="grow" data-act="close">Annuler</button><button class="p grow" data-act="ask-yes">${ok}</button></div>`); askCb = cb; }
let toastT;
function toast(m) { const t = $('#toast'); t.textContent = m; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2800); }

let AC = null;
function unlockAudio() {
  try {
    if (!AC) { AC = new (window.AudioContext || window.webkitAudioContext)(); if (navigator.audioSession) navigator.audioSession.type = 'transient'; }
    if (AC.state === 'suspended') AC.resume();
  } catch (e) {}
}
function beep(n, f) {
  if (!AC) return;
  const t0 = AC.currentTime + 0.02;
  for (let k = 0; k < n; k++) {
    const o = AC.createOscillator(), g = AC.createGain(), t = t0 + k * 0.28;
    o.type = 'square'; o.frequency.value = f;
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.35, t + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
    o.connect(g).connect(AC.destination); o.start(t); o.stop(t + 0.2);
  }
}
let WL = null;
async function wake() {
  if (!S.active || S.active.editOf || WL || document.visibilityState !== 'visible' || !('wakeLock' in navigator)) return;
  try { WL = await navigator.wakeLock.request('screen'); WL.addEventListener('release', () => { WL = null; }); } catch (e) {}
}
function unwake() { if (WL) { WL.release().catch(() => {}); WL = null; } }

// =============== Historique & calculs ===============
function histLimit() {
  const A = S.active;
  if (A && A.editOf) { const k = S.sessions.findIndex(s => s.id === A.editOf); if (k >= 0) return k; }
  return S.sessions.length;
}
function prevEntry(exId) {
  for (let k = histLimit() - 1; k >= 0; k--) {
    const se = S.sessions[k], en = se.entries.find(x => x.exId === exId && x.sets.some(s => s.done));
    if (en) return { se, en };
  }
  return null;
}
function prevSet(last, en, j) {
  if (!last) return null;
  const w = en.sets[j].t === 'w', k = en.sets.slice(0, j).filter(x => (x.t === 'w') === w).length;
  return last.en.sets.filter(x => x.done && (x.t === 'w') === w)[k] || null;
}
// Double progression (Helms, Morgan & Valdez, The Muscle and Strength Pyramid: Training) :
// on monte les reps dans la plage, puis la charge quand toutes les séries atteignent le haut de plage avec RIR ≥ 1.
function suggest(exId) {
  const e = ex(exId), last = prevEntry(exId);
  if (!last) return null;
  const work = last.en.sets.filter(isWork);
  if (!work.length) return null;
  if (e.type === 'time') {
    const top = Math.max(...work.map(s => num(s.sec)));
    return top >= e.repMax ? { kg: work[0].kg, sec: top, why: 'Haut de plage atteint : ajoute du lest ou une variante plus dure' } : { kg: work[0].kg, sec: Math.min(e.repMax, top + 5), why: '+5 s par rapport à la dernière fois' };
  }
  const bw = bwOf(last.se);
  let ref = work[0]; work.forEach(s => { if (eff(e, s, bw) > eff(e, ref, bw)) ref = s; });
  const kg = num(ref.kg), at = work.filter(s => num(s.kg) === kg && s.t !== 'd');
  const minR = Math.min(...at.map(s => num(s.reps)));
  const top = at.every(s => num(s.reps) >= e.repMax) && at.every(s => !has(s.rir) || num(s.rir) >= 1);
  if (top) {
    const nk = e.type === 'assist' ? Math.max(0, kg - e.inc) : kg + e.inc;
    return { kg: fmtIn(nk), reps: e.repMin, why: `Haut de plage atteint : ${e.type === 'assist' ? '−' : '+'}${fmt(e.inc, 2)} kg` };
  }
  const tr = Math.min(e.repMax, Math.max(e.repMin, minR + 1));
  return { kg: fmtIn(kg), reps: tr, why: minR < e.repMin ? `Sous la plage (${minR} reps) : garde la charge` : `Même charge, vise ${tr} reps` };
}
function placeholder(e, en, j, c) {
  const s = en.sets[j];
  if (s.pk !== undefined) return { kg: s.pk, reps: s.pn }; // série prévue par le cycle
  const p = prevSet(c.last, en, j);
  if (s.t !== 'w' && s.t !== 'd' && c.sug) return { kg: c.sug.kg, reps: c.sug.reps, sec: c.sug.sec };
  return p ? { kg: fmtIn(p.kg), reps: p.reps, sec: p.sec } : {};
}
function records(exId, excludeId) {
  const e = ex(exId), r = { n: 0, e1: 0, load: 0, sec: 0, sets: [] };
  S.sessions.forEach(se => {
    if (se.id === excludeId) return;
    se.entries.forEach(en => { if (en.exId === exId) en.sets.filter(isWork).forEach(s => addRec(r, e, s, bwOf(se))); });
  });
  return r;
}
function addRec(r, e, s, bw) { r.n++; r.e1 = Math.max(r.e1, e1rm(e, s, bw)); r.load = Math.max(r.load, eff(e, s, bw)); r.sec = Math.max(r.sec, num(s.sec)); r.sets.push({ w: eff(e, s, bw), reps: num(s.reps) }); }
function checkPR(i, j) {
  const A = S.active, en = A.entries[i], s = en.sets[j], e = ex(en.exId);
  s.pr = [];
  if (!isWork(s)) return;
  const r = records(en.exId, A.editOf);
  if (!r.n) return; // première fois : pas de record à célébrer
  en.sets.forEach((o, k) => { if (k !== j && isWork(o)) addRec(r, e, o, A.bw); });
  if (e.type === 'time') { if (num(s.sec) > r.sec) s.pr.push('Temps'); }
  else {
    const v = e1rm(e, s, A.bw), w = eff(e, s, A.bw), reps = num(s.reps);
    if (v && v > r.e1 + 0.05) s.pr.push('e1RM');
    if (w > r.load + 0.01) s.pr.push('Charge');
    else {
      const same = r.sets.filter(x => x.w >= w - 0.01);
      if (same.length && reps > Math.max(...same.map(x => x.reps))) s.pr.push('Reps');
    }
  }
  if (s.pr.length) { toast('Record ! ' + s.pr.join(' · ') + ' — ' + e.name); beep(2, 1320); if (navigator.vibrate) navigator.vibrate(80); }
}
function sessMetric(e, se, en) {
  const bw = bwOf(se), work = en.sets.filter(isWork);
  if (!work.length) return null;
  if (e.type === 'time') { let b = work[0]; work.forEach(s => { if (num(s.sec) > num(b.sec)) b = s; }); return { kind: 'sec', v: num(b.sec), s: b }; }
  let b = null; work.forEach(s => { const v = e1rm(e, s, bw); if (v && (!b || v > b.v)) b = { kind: 'e1', v, s }; });
  if (b) return b;
  let m = work[0]; work.forEach(s => { if (num(s.reps) > num(m.reps)) m = s; });
  return { kind: 'reps', v: num(m.reps), s: m };
}
function setTxt(e, s) {
  if (!s) return '–';
  if (e.type === 'time') return (num(s.kg) ? '+' + fmtIn(s.kg) + ' · ' : '') + num(s.sec) + ' s';
  const k = fmtIn(s.kg);
  return (e.type === 'bw' ? '+' + k : e.type === 'assist' ? '−' + k : k) + '×' + num(s.reps);
}
function muscleWeek(monday) {
  const end = addDays(monday, 7), m = {};
  S.sessions.forEach(se => {
    if (se.date < monday || se.date >= end) return;
    se.entries.forEach(en => {
      const e = ex(en.exId), n = en.sets.filter(isWork).length;
      if (!n || !e.muscle) return;
      m[e.muscle] = (m[e.muscle] || 0) + n;
      (e.sec || []).forEach(x => { m[x] = (m[x] || 0) + n * 0.5; });
    });
  });
  return m;
}
function nextTpl() {
  const rot = S.templates.filter(t => t.rot);
  if (!rot.length) return null;
  const last = S.sessions.slice().reverse().find(se => rot.some(t => t.id === se.tplId));
  if (!last) return rot[0];
  return rot[(rot.findIndex(t => t.id === last.tplId) + 1) % rot.length];
}
function freeLetter(list) { return 'ABCDEFGHIJ'.split('').find(l => !list.some(x => x.group === l)) || 'Z'; }
function cleanGroups(list) { list.forEach((x, k) => { if (x.group && !(list[k - 1] && list[k - 1].group === x.group) && !(list[k + 1] && list[k + 1].group === x.group)) x.group = ''; }); }

// =============== Séance active ===============
function blankSet(t) { return { t: t || 'n', kg: '', reps: '', sec: '', rir: '', done: false, pr: [] }; }
function newEntry(exId, nSets, group) {
  const last = prevEntry(exId);
  const warm = last ? last.en.sets.filter(s => s.done && s.t === 'w').length : 0;
  const n = nSets || (last ? last.en.sets.filter(isWork).length : 0) || 3;
  return { exId, group: group || '', sets: [...Array(warm).fill('w'), ...Array(n).fill('n')].map(blankSet) };
}
function begin(name, tplId, mk) {
  if (S.active) { toast('Une séance est déjà en cours'); R.tab = 'seance'; return render(); }
  S.active = { id: uid(), date: today(), tplId: tplId || '', name, start: Date.now(), end: 0, bw: S.settings.bw, note: '', entries: [], restEnd: 0, restTotal: 0 };
  S.active.entries = mk();
  save(); R.tab = 'seance'; R.view = ''; render(); window.scrollTo(0, 0); wake();
}
function startTpl(id) { const t = tpl(id); if (t) begin(t.name, t.id, () => t.items.map(it => newEntry(it.exId, it.sets, it.group))); else begin('Séance libre', '', () => []); }
function repeatSession(id) { const se = S.sessions.find(s => s.id === id); if (se) begin(se.name, se.tplId, () => se.entries.map(en => newEntry(en.exId, en.sets.filter(isWork).length, en.group))); }
function editSession(id) {
  if (S.active) return toast('Termine d\'abord la séance en cours');
  const se = S.sessions.find(s => s.id === id); if (!se) return;
  S.active = Object.assign(clone(se), { id: uid(), editOf: se.id, restEnd: 0, restTotal: 0 });
  save(); R.tab = 'seance'; R.view = ''; render(); window.scrollTo(0, 0);
}
// =============== Cycle (programme chargé depuis cycle.js) ===============
const isRange = v => /\d-\d/.test(String(v));
const offPlan = (val, p) => { if (isRange(p)) { const [lo, hi] = String(p).split('-').map(num); return val < lo || val > hi; } return val !== num(p); };
function parsePlan(spec) {
  return spec.split('/').map(tok => {
    const m = tok.trim().match(/^(w\s+)?(\d+)x([\d-]+)@([\d.,-]+)(?:\s+(\d+):(\d\d))?$/);
    if (!m) throw new Error('Série illisible dans cycle.js : ' + tok);
    return { w: !!m[1], n: +m[2], reps: m[3], kg: m[4].replace(/\./g, ','), rest: m[5] ? +m[5] * 60 + +m[6] : 0 };
  });
}
function planSets(spec) {
  const out = [];
  parsePlan(spec).forEach(p => { for (let k = 0; k < p.n; k++) out.push(Object.assign(blankSet(p.w ? 'w' : 'n'), { pk: p.kg, pn: p.reps, ps: p.rest })); });
  return out;
}
function planTxt(spec) { return parsePlan(spec).map(p => `${p.n > 1 ? p.n + '×' : ''}${p.reps}@${p.kg} kg${p.rest ? ` (${Math.floor(p.rest / 60)}'${String(p.rest % 60).padStart(2, '0')})` : ''}`).join(' / '); }
function itemTxt(spec) { return typeof spec === 'string' ? planTxt(spec) : `${spec.emom} min · ${spec.reps} reps au départ de chaque minute`; }
const cycDone = id => S.sessions.filter(se => se.cyc === CYC.id && se.cycS === id).pop();
function startCycle(sid) {
  const cs = CYC && CYC.sessions.find(x => x.id === sid); if (!cs) return;
  if (S.active) { toast('Une séance est déjà en cours : termine-la ou quitte-la d\'abord'); R.tab = 'seance'; render(); return window.scrollTo(0, 0); }
  begin(cs.name, '', () => cs.items.map(([exId, spec, note]) => typeof spec === 'string'
    ? { exId, group: '', plan: spec, pnote: note || '', sets: planSets(spec) }
    : { exId, group: '', emom: spec.emom, pnote: note || '', sets: Array.from({ length: spec.emom }, () => Object.assign(blankSet('n'), { pk: '0', pn: String(spec.reps), ps: 0 })) }));
  S.active.cyc = CYC.id; S.active.cycS = sid; save();
}
// Écarts entre le prévu et le fait, calculés à la fin de la séance
function cycDiff(A) {
  const out = [];
  A.entries.forEach(en => {
    if ((!en.plan && !en.emom) || !en.sets.some(isWork)) return; // rien de fait : signalé plus bas comme « non fait »
    const e = ex(en.exId);
    if (en.emom) { const r = en.sets.filter(isWork).reduce((t, s) => t + num(s.reps), 0), pr = en.emom * num(en.sets[0].pn); if (r !== pr) out.push(`${e.name} : ${r} reps sur ${pr} prévues`); return; }
    const pl = en.sets.filter(s => s.pk !== undefined && s.t !== 'w'), bits = [];
    const miss = pl.filter(s => !isWork(s)).length;
    if (miss) bits.push(`${miss} série${miss > 1 ? 's' : ''} non faite${miss > 1 ? 's' : ''}`);
    pl.filter(s => isWork(s) && (offPlan(num(s.kg), s.pk) || offPlan(num(s.reps), s.pn))).forEach(s => bits.push(`fait ${num(s.reps)}@${fmtIn(s.kg)} (prévu ${s.pn}@${s.pk})`));
    const extra = en.sets.filter(s => s.pk === undefined && isWork(s)).length;
    if (extra) bits.push(`${extra} série${extra > 1 ? 's' : ''} en plus`);
    if (bits.length) out.push(e.name + ' : ' + bits.join(', '));
  });
  const cs = CYC && CYC.sessions.find(x => x.id === A.cycS);
  if (cs) cs.items.forEach(([id]) => { if (!A.entries.some(en => en.exId === id && (en.plan || en.emom) && en.sets.some(isWork))) out.push(ex(id).name + ' : non fait'); });
  A.entries.forEach(en => { if (!en.plan && !en.emom && en.sets.some(isWork)) out.push(ex(en.exId).name + ' : ajouté (hors plan)'); });
  return out;
}
function sessText(se) {
  const dur = se.end && se.start ? ' · ' + Math.round((se.end - se.start) / 6e4) + ' min' : '';
  const lines = [`${se.name} · ${fr(se.date)}${dur} · poids ${fmtIn(bwOf(se))} kg`];
  se.entries.forEach(en => { const e = ex(en.exId), w = en.sets.filter(isWork);
    if (en.emom) lines.push(`${e.name} : ${w.length} min, ${w.reduce((t, s) => t + num(s.reps), 0)} reps`);
    else if (w.length) lines.push(`${e.name} : ${w.map(s => setTxt(e, s) + (has(s.rir) ? ' RIR ' + s.rir : '')).join(' · ')}`); });
  if (se.cyc) lines.push(se.diff && se.diff.length ? 'Écarts au plan : ' + se.diff.join(' ; ') : 'Conforme au plan');
  if (se.note) lines.push('Note : ' + se.note);
  return lines.join('\n');
}

function finishWorkout(bw, note) {
  const A = S.active;
  A.bw = bw || A.bw; A.note = note || '';
  const diff = A.cyc ? (A.editOf ? A.diff || [] : cycDiff(A)) : null;
  A.entries = A.entries.map(en => Object.assign({ exId: en.exId, group: en.group, sets: en.sets.filter(s => s.done && (num(s.reps) > 0 || num(s.sec) > 0)) }, en.plan ? { plan: en.plan } : {}, en.emom ? { emom: en.emom } : {})).filter(en => en.sets.length);
  cleanGroups(A.entries);
  const out = { id: A.editOf || A.id, date: A.date, tplId: A.tplId, name: A.name, start: A.start, end: A.editOf ? A.end : Date.now(), bw: A.bw, note: A.note, entries: A.entries };
  if (A.cyc) Object.assign(out, { cyc: A.cyc, cycS: A.cycS, diff });
  if (!out.entries.length) return toast('Aucune série validée');
  if (A.editOf) { const k = S.sessions.findIndex(s => s.id === A.editOf); if (k >= 0) S.sessions[k] = out; else S.sessions.push(out); }
  else { S.sessions.push(out); S.settings.bw = out.bw; }
  const nPR = out.entries.reduce((t, en) => t + en.sets.filter(s => s.pr && s.pr.length).length, 0);
  S.active = null; closeSheet(); unwake(); save(true); snapshot();
  R.tab = out.cyc && !A.editOf ? 'cycle' : 'hist'; render(); window.scrollTo(0, 0);
  toast(A.editOf ? 'Séance modifiée' : `Séance enregistrée${nPR ? ' · ' + nPR + ' record' + (nPR > 1 ? 's' : '') : ''}`);
}

// Chrono de repos : basé sur l'heure de fin (survit au verrouillage et à la fermeture de l'app)
let warned = false, emomM = -1, emomW = -1;
function tickEmom() {
  const A = S.active; if (!A || !A.emom) return;
  const en = A.entries[A.emom.i], tot = ((en && en.emom) || 10) * 60, el = (Date.now() - A.emom.start) / 1000;
  if (!en || !en.emom) { A.emom = null; save(); return; } // l'exercice a été déplacé ou retiré
  if (el >= tot) { const i = A.emom.i; A.emom = null; save(); beep(3, 880); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); toast('EMOM terminé'); renderCard(i); return; }
  const m = Math.floor(el / 60), left = 60 - (el % 60);
  if (m !== emomM) { emomM = m; beep(2, 1100); if (navigator.vibrate) navigator.vibrate(150); renderCard(A.emom.i); }
  else if (left <= 3.2 && emomW !== m) { emomW = m; beep(1, 660); }
  const c = $('#emomclk'); if (c) c.textContent = `Minute ${m + 1}/${tot / 60} · ${mmss(Math.ceil(left))}`;
}
function startRest(sec) { const A = S.active; A.restEnd = Date.now() + sec * 1000; A.restTotal = sec; warned = false; save(); tick(); }
function stopRest() { if (S.active) { S.active.restEnd = 0; save(); } $('#rest').style.display = 'none'; }
function tick() {
  const A = S.active, el = $('#el'), bar = $('#rest');
  if (A && el && !A.editOf) el.textContent = mmss((Date.now() - A.start) / 1000);
  tickEmom();
  if (!A || !A.restEnd) { bar.style.display = 'none'; return; }
  const left = (A.restEnd - Date.now()) / 1000;
  if (left <= 0) {
    const late = -left; A.restEnd = 0; save(); bar.style.display = 'none';
    if (document.visibilityState === 'visible' && late < 4) { $('#flash').classList.add('on'); beep(3, 880); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); }
    else toast('Repos terminé');
    return;
  }
  bar.style.display = 'flex';
  $('#rt').textContent = mmss(Math.ceil(left));
  $('#rpg').style.width = Math.min(100, 100 * (1 - left / (A.restTotal || 1))) + '%';
  if (left <= 10 && !warned) { warned = true; beep(1, 660); }
}

// =============== Vues ===============
const R = { tab: CYC ? 'cycle' : 'seance', view: '', id: '', range: 90, pt: null, q: '', mus: '', cat: '', pmus: '', pcat: '', arch: false, pick: null };
const ICON = {
  cycle: '<path d="M4 5h16v15H4zM4 10h16M9 3v4M15 3v4M8 15l2.5 2.5L16 12.5"/>',
  seance: '<path d="M6 7v10M18 7v10M3 9v6M21 9v6M6 12h12"/>',
  hist: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  prog: '<path d="M4 19h16M5 15l4-4 3 3 6-7"/>',
  ex: '<path d="M4 6h16M4 12h16M4 18h10"/>',
  coach: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M16 4.8a3.5 3.5 0 010 6.4M18 14.8c2 .7 3.2 2.4 3.6 5.2"/>',
  set: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.9 4.9l2.1 2.1M17 17l2.1 2.1M4.9 19.1L7 17M17 7l2.1-2.1"/>'
};
const TABS = (CYC ? [['cycle', 'Cycle']] : []).concat([['seance', 'Séance'], ['hist', 'Historique'], ['prog', 'Progrès'], ['ex', 'Exercices'], ['coach', 'Coach'], ['set', 'Réglages']]);
function render() {
  $('#nav').innerHTML = TABS.map(([id, l]) => `<button data-tab="${id}" class="${id === R.tab ? 'on' : ''}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON[id]}</svg>${l}${id === 'seance' && S.active && R.tab !== 'seance' ? ' •' : ''}</button>`).join('');
  const v = R.view === 'exd' ? vExDetail : R.view === 'tpl' ? vTplEdit : { cycle: vCycle, seance: vSeance, hist: vHist, prog: vProg, ex: vEx, coach: vCoach, set: vSet }[R.tab];
  $('#app').innerHTML = v();
  tick();
  if (R.tab === 'set' && !R.view) fillSnaps();
}

// ---------- Cycle ----------
function vCycle() {
  const A = S.active, n = CYC.sessions.length, nD = CYC.sessions.filter(cs => cycDone(cs.id)).length, nx = CYC.sessions.find(cs => !cycDone(cs.id));
  return `<h1>Cycle</h1>
  <div class="card"><div class="mut">${fr(CYC.from)} → ${fr(CYC.to)}</div><h2 style="margin-top:2px">${esc(CYC.title)}</h2>
    <div class="bar" style="margin:10px 0 6px"><i style="width:${100 * nD / n}%"></i></div>
    <b>${nD} / ${n} séances faites</b>${CYC.note ? `<div class="note">${esc(CYC.note)}</div>` : ''}</div>
  ${A ? `<div class="card banner"><div class="row sp nw"><div class="grow"><b>Séance en cours</b><div class="mut">${esc(A.name)}</div></div><button class="p" data-tab="seance">Reprendre</button></div></div>` : ''}
  ${nx ? `<div class="card hero"><div class="mut">Prochaine séance</div><h2 style="font-size:24px;margin:2px 0 6px">${esc(nx.name)}</h2>
    <div class="mut">${nx.items.map(([id]) => esc(ex(id).name)).join(' · ')}</div>
    <button class="p blk" style="margin-top:12px;min-height:54px;font-size:18px" data-act="cstart" data-id="${nx.id}">Démarrer ${esc(nx.name)}</button></div>`
    : `<div class="card banner"><b>Semaine terminée</b><div class="mut">Les ${n} séances sont faites.</div></div>`}
  <h3>Séances de la semaine</h3>
  <div class="list">${CYC.sessions.map(cs => { const d = cycDone(cs.id);
    return `<button class="${d ? 'ok' : ''}" data-act="cview" data-id="${cs.id}"><span class="grow">${esc(cs.name)}<br><span class="mut">${d ? 'Faite ' + fr(d.date) + (d.diff && d.diff.length ? ' · ' + d.diff.length + ' écart' + (d.diff.length > 1 ? 's' : '') : ' · conforme') : cs.items.length + ' exercices'}</span></span><span class="${d ? 'acc b' : 'mut'}">${d ? '✓' : 'Voir'}</span></button>`; }).join('')}</div>
  <p class="mut" style="margin-top:14px">Les séances hors programme se lancent depuis l'onglet Séance.<br>Version ${VER}</p>`;
}
function cycleSheet(sid) {
  const cs = CYC.sessions.find(x => x.id === sid); if (!cs) return;
  const d = cycDone(sid);
  sheet(`<h2>${esc(cs.name)}</h2>
  ${cs.items.map(([id, spec, note], k) => `<div style="margin-top:10px"><b>${k + 1}. ${esc(ex(id).name)}</b><div class="mut">${esc(itemTxt(spec))}${note ? ' · ' + esc(note) : ''}</div></div>`).join('')}
  ${d ? `<div class="note">Faite ${fr(d.date)} · ${d.diff && d.diff.length ? esc(d.diff.join(' ; ')) : 'conforme au plan'}</div>` : ''}
  <button class="p blk" style="margin-top:14px" data-act="cstart" data-id="${sid}">${d ? 'Refaire cette séance' : 'Démarrer cette séance'}</button>`);
}
function emomCard(i) {
  const A = S.active, en = A.entries[i], e = ex(en.exId), run = A.emom && A.emom.i === i;
  const cur = run ? Math.floor((Date.now() - A.emom.start) / 6e4) : -1;
  const tot = en.sets.filter(isWork).reduce((t, s) => t + num(s.reps), 0);
  return `<div class="card" id="en-${i}"><div class="row sp nw"><h2 class="grow" style="margin:0">${esc(e.name)}</h2>
    <button class="ic" data-act="mv" data-i="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>↑</button>
    <button class="ic" data-act="mv" data-i="${i}" data-dir="1" ${i === A.entries.length - 1 ? 'disabled' : ''}>↓</button></div>
  <div class="goal mut">Prévu : <b>${en.emom} min · ${esc(en.sets[0].pn)} reps au départ de chaque minute</b>${en.pnote ? ' · ' + esc(en.pnote) : ''}</div>
  <div class="row sp nw" style="margin-top:10px"><b id="emomclk" style="font-size:22px;font-variant-numeric:tabular-nums">${run ? '' : 'Prêt'}</b>
    <button class="${run ? '' : 'p'}" data-act="${run ? 'emom-stop' : 'emom-go'}" data-i="${i}">${run ? 'Arrêter' : 'Démarrer l\'EMOM'}</button></div>
  <div class="emom">${en.sets.map((s, j) => `<button class="${s.done ? 'on' : ''}${j === cur ? ' cur' : ''}" data-act="emin" data-i="${i}" data-j="${j}"><span>${j + 1}</span><b>${s.done ? num(s.reps) : '·'}</b></button>`).join('')}</div>
  <div class="mut" style="margin-top:8px">${tot} reps validées. Touche une minute pour la valider, retouche-la pour corriger le nombre de reps.</div></div>`;
}

// ---------- Séance ----------
function backupBanner() {
  if (!S.sessions.length) return '';
  const d = S.lastExport ? Math.floor((Date.now() - S.lastExport) / 864e5) : null;
  if (d !== null && d < 7) return '';
  return `<div class="card banner"><div class="row sp nw"><div class="grow"><b>Sauvegarde externe</b><div class="mut">${d === null ? 'Jamais faite' : 'Dernière il y a ' + d + ' jours'} : tes données ne sont que sur ce téléphone.</div></div><button class="p" data-act="json">Sauver</button></div></div>`;
}
function vSeance() {
  const A = S.active;
  if (!A) {
    const nx = nextTpl(), others = S.templates.filter(t => !nx || t.id !== nx.id);
    const last = S.sessions[S.sessions.length - 1];
    const paused = S.paused.map(p => {
      const nD = p.entries.reduce((t, en) => t + en.sets.filter(s => s.done).length, 0);
      return `<div class="card banner"><div class="row sp nw"><div class="grow"><h2 style="margin:0">${esc(p.name)}</h2>
        <div class="mut">${fr(p.date)} · ${nD} série${nD > 1 ? 's' : ''} validée${nD > 1 ? 's' : ''} · ${Math.round((p.pausedAt - p.start) / 6e4)} min</div></div>
        <button class="ic d" data-act="pdel" data-id="${p.id}">✕</button><button class="p" data-act="resume" data-id="${p.id}">Reprendre</button></div></div>`;
    }).join('');
    return `<h1>Séance</h1>${backupBanner()}${paused ? '<h3>En pause</h3>' + paused : ''}
    ${isIOS && !standalone() ? `<div class="card banner"><b>Installe l'app</b><div class="mut">Dans Safari : bouton Partager, puis « Sur l'écran d'accueil ». Plein écran, hors ligne, et stockage plus durable.</div></div>` : ''}
    ${nx ? `<div class="card hero"><div class="mut">Prochaine séance de la rotation</div><h2 style="font-size:24px;margin:2px 0 6px">${esc(nx.name)}</h2>
      <div class="mut">${nx.items.map(it => esc(ex(it.exId).name)).join(' · ') || 'Modèle vide'}</div>
      <button class="p blk" style="margin-top:12px;min-height:54px;font-size:18px" data-act="start" data-id="${nx.id}">Démarrer ${esc(nx.name)}</button></div>` : ''}
    <h3>Autres séances</h3>
    <div class="list">${others.map(t => `<button data-act="start" data-id="${t.id}"><span>${esc(t.name)}</span><span class="mut">${t.items.length} exos</span></button>`).join('')}
    <button data-act="start" data-id=""><span>Séance libre</span><span class="mut">vide</span></button></div>
    ${last ? `<h3>Dernière séance</h3><div class="mut">${esc(last.name)} · ${fr(last.date)}</div>` : ''}`;
  }
  return `<div class="row sp nw"><div class="grow"><h1 style="margin:0">${esc(A.name)}</h1>
    <div class="timer">${A.editOf ? 'Modification · ' + fr(A.date) : '<span id="el">0:00</span> · ' + fr(A.date)}</div></div>
    <button data-act="leave">Quitter</button>
    <button class="p" data-act="finish">${A.editOf ? 'Enregistrer' : 'Terminer'}</button></div>
  <div style="height:12px"></div>
  ${A.entries.map((en, i) => entryCard(i)).join('')}
  <button class="blk" data-act="pick" data-mode="add">+ Ajouter un exercice</button>
  <div class="row" style="margin-top:12px">
    ${!A.editOf && !A.cyc ? (A.tplId && tpl(A.tplId) ? '<button class="grow" data-act="savetpl">Mettre à jour le modèle</button>' : '<button class="grow" data-act="newtpl-from">Enregistrer comme modèle</button>') : ''}
    <button class="d grow" data-act="leave">Quitter</button></div>`;
}
function cardCtx(en) { return { last: prevEntry(en.exId), sug: suggest(en.exId) }; }
function entryCard(i) {
  const A = S.active, en = A.entries[i];
  if (en.emom) return emomCard(i);
  const e = ex(en.exId), c = cardCtx(en), t = e.type === 'time';
  const prevG = A.entries[i - 1] && A.entries[i - 1].group, ss = en.group && (prevG === en.group || (A.entries[i + 1] && A.entries[i + 1].group === en.group));
  let goal;
  if (en.plan) goal = `Prévu : <b>${esc(planTxt(en.plan))}</b>${en.pnote ? '<br>' + esc(en.pnote) : ''}`;
  else if (c.sug) goal = `Objectif : <b>${t ? c.sug.sec + ' s' : setTxt(e, { kg: c.sug.kg, reps: c.sug.reps })}</b> · ${c.sug.why}`;
  else goal = `Première fois · plage ${e.repMin}–${e.repMax} ${t ? 's' : 'reps'}`;
  let n = 0;
  return `<div class="card ${ss ? 'ss' : ''}" id="en-${i}">
  ${ss && prevG !== en.group ? `<div class="mut acc b" style="margin-bottom:4px">SUPERSET ${en.group}</div>` : ''}
  <div class="row sp nw"><h2 class="grow" style="margin:0">${esc(e.name)}</h2>
    <button class="ic" data-act="mv" data-i="${i}" data-dir="-1" ${i === 0 ? 'disabled' : ''}>↑</button>
    <button class="ic" data-act="mv" data-i="${i}" data-dir="1" ${i === A.entries.length - 1 ? 'disabled' : ''}>↓</button>
    <button class="ic" data-act="exmenu" data-i="${i}">⋯</button></div>
  ${e.note ? `<div class="note">${esc(e.note)}</div>` : ''}
  <div class="goal mut">${goal}</div>
  <div class="set hd"><span>Série</span><span>Préc.</span><span>${KG_LAB[e.type]}</span><span>${t ? 'Sec' : 'Reps'}</span><span>RIR</span><span></span></div>
  ${en.sets.map((s, j) => {
    const p = placeholder(e, en, j, c), pv = prevSet(c.last, en, j);
    if (s.t !== 'w') n++;
    return `<div class="set ${s.done ? 'done' : ''}">
    <button class="lab ${s.t}" data-act="setmenu" data-i="${i}" data-j="${j}">${SET_LAB[s.t] || n}${s.pr && s.pr.length ? '<span class="prb">PR</span>' : ''}</button>
    <button class="prev" data-act="copyprev" data-i="${i}" data-j="${j}">${pv ? setTxt(e, pv) : '–'}</button>
    <input inputmode="decimal" data-f="kg" data-i="${i}" data-j="${j}" value="${esc(s.kg)}" placeholder="${esc(has(p.kg) ? p.kg : (e.type === 'load' ? '' : '0'))}">
    <input inputmode="numeric" data-f="${t ? 'sec' : 'reps'}" data-i="${i}" data-j="${j}" value="${esc(t ? s.sec : s.reps)}" placeholder="${esc(t ? (p.sec || '') : (p.reps || ''))}">
    <select data-f="rir" data-i="${i}" data-j="${j}">${['', '0', '1', '2', '3', '4', '5'].map(v => `<option value="${v}" ${String(s.rir) === v ? 'selected' : ''}>${v === '' ? '–' : v === '5' ? '5+' : v}</option>`).join('')}</select>
    <button class="ok" data-act="done" data-i="${i}" data-j="${j}">✓</button></div>`;
  }).join('')}
  <div class="row" style="margin-top:8px"><button class="grow" data-act="addset" data-i="${i}">+ Série</button></div></div>`;
}
function renderCard(i) { const el = document.getElementById('en-' + i); if (el) el.outerHTML = entryCard(i); else render(); }

// ---------- Historique ----------
function vHist() {
  if (!S.sessions.length) return '<h1>Historique</h1><p class="mut">Aucune séance enregistrée.</p>';
  let out = '<h1>Historique</h1>', wk = '';
  S.sessions.slice().reverse().forEach(se => {
    const m = mondayOf(se.date);
    if (m !== wk) { wk = m; const n = S.sessions.filter(x => mondayOf(x.date) === m).length; out += `<h3>Semaine du ${fr(m)} · ${n} séance${n > 1 ? 's' : ''}</h3>`; }
    const nW = se.entries.reduce((t, en) => t + en.sets.filter(isWork).length, 0);
    const nPR = se.entries.reduce((t, en) => t + en.sets.filter(s => s.pr && s.pr.length).length, 0);
    const dur = se.end && se.start ? Math.round((se.end - se.start) / 6e4) + ' min · ' : '';
    out += `<div class="card"><div class="row sp nw"><div class="grow"><h2 style="margin:0">${esc(se.name)}</h2>
      <div class="mut">${fr(se.date)} · ${dur}${nW} séries${nPR ? ` · <span class="acc b">${nPR} PR</span>` : ''}</div></div>
      <button class="ic" data-act="sesmenu" data-id="${se.id}">⋯</button></div>
      ${se.entries.map(en => { const e = ex(en.exId), w = en.sets.filter(isWork);
        if (en.emom) return `<div style="margin-top:8px"><b>${esc(e.name)}</b><div class="mut">${w.length} min · ${w.reduce((t, s) => t + num(s.reps), 0)} reps</div></div>`;
        return `<div style="margin-top:8px"><b>${esc(e.name)}</b>${en.group ? ` <span class="mut acc">${en.group}</span>` : ''}<div class="mut">${w.map(s => setTxt(e, s) + (has(s.rir) ? ' @' + s.rir : '') + (s.pr && s.pr.length ? ' <span class="prb">PR</span>' : '')).join(' · ') || 'échauffement seul'}</div></div>`; }).join('')}
      ${se.cyc ? `<div class="note" style="border-color:${se.diff && se.diff.length ? '#f5a524' : '#2fbf71'}">${se.diff && se.diff.length ? '<b>Écarts au plan</b>\n' + esc(se.diff.join('\n')) : 'Conforme au plan'}</div>` : ''}
      ${se.note ? `<div class="note">${esc(se.note)}</div>` : ''}</div>`;
  });
  return out;
}

// ---------- Progrès ----------
function vProg() {
  const t = today(), wk = mondayOf(t);
  const inWeek = S.sessions.filter(se => se.date >= wk).length;
  const from8 = addDays(wk, -56), avg8 = S.sessions.filter(se => se.date >= from8 && se.date < wk).length / 8;
  const month = t.slice(0, 8) + '01';
  const prM = S.sessions.filter(se => se.date >= month).reduce((n, se) => n + se.entries.reduce((m, en) => m + en.sets.filter(s => s.pr && s.pr.length).length, 0), 0);
  // calendrier 12 semaines
  const days = new Set(S.sessions.map(se => se.date)), c0 = addDays(wk, -77);
  let cal = '';
  for (let k = 0; k < 84; k++) { const d = addDays(c0, k); cal += `<i class="${d > t ? 'fu' : days.has(d) ? 'on' : ''}"></i>`; }
  // séries difficiles par muscle
  const cur = muscleWeek(wk), prev = [1, 2, 3, 4].map(k => muscleWeek(addDays(wk, -7 * k)));
  const mus = MUSCLES.map(m => {
    const n = cur[m] || 0, a = prev.reduce((s, x) => s + (x[m] || 0), 0) / 4;
    return `<div style="margin-top:10px"><div class="row sp"><span>${m}</span><span class="mut"><b style="color:var(--txt)">${fmt(n)}</b> · moy. 4 sem. ${fmt(a)}</span></div>
    <div class="bar"><s style="left:40%;width:40%"></s><i style="width:${Math.min(100, n / 25 * 100)}%"></i></div></div>`;
  }).join('');
  // street lifting
  const st = STREET.map(id => {
    const e = S.exercises.find(x => x.id === id); if (!e) return '';
    let b = null;
    S.sessions.forEach(se => se.entries.forEach(en => { if (en.exId === id) en.sets.filter(isWork).forEach(s => { const v = e1rm(e, s, bwOf(se)); if (v && (!b || v > b.v)) b = { v, bw: bwOf(se), d: se.date }; }); }));
    if (!b) return '';
    const extra = e.type === 'bw' ? `lest équiv. <b>${b.v - b.bw >= 0 ? '+' : ''}${fmt(b.v - b.bw)} kg</b> · ` : '';
    return `<tr data-act="exd" data-id="${id}"><td>${esc(e.name)}</td><td>${fmt(b.v)} kg</td><td class="mut">${extra}×${fmt(b.v / b.bw, 2)} PDC</td></tr>`;
  }).join('');
  // exercices suivis
  const tracked = S.exercises.map(e => {
    const pts = []; S.sessions.forEach(se => se.entries.forEach(en => { if (en.exId === e.id) { const m = sessMetric(e, se, en); if (m) pts.push({ d: se.date, m }); } }));
    if (!pts.length) return null;
    const kind = pts.some(p => p.m.kind === 'e1') ? 'e1' : pts[pts.length - 1].m.kind, ps = pts.filter(p => p.m.kind === kind);
    const lastP = ps[ps.length - 1], old = ps.filter(p => p.d <= addDays(t, -28)).pop();
    return { e, d: pts[pts.length - 1].d, v: lastP.m.v, kind, delta: old ? lastP.m.v - old.m.v : null };
  }).filter(Boolean).sort((a, b) => (a.d < b.d ? 1 : -1));
  const unit = k => (k === 'e1' ? ' kg' : k === 'sec' ? ' s' : ' reps');
  return `<h1>Progrès</h1>
  <div class="kpi"><div><b>${inWeek}</b><span class="mut">cette semaine</span></div><div><b>${fmt(avg8)}</b><span class="mut">séances/sem. (8 sem.)</span></div><div><b class="acc">${prM}</b><span class="mut">records ce mois</span></div></div>
  <div class="card" style="margin-top:12px"><h2>Régularité · 12 semaines</h2><div class="cal" style="grid-template-rows:repeat(7,1fr);grid-auto-flow:column">${cal}</div></div>
  ${st ? `<div class="card"><h2>Street lifting · 1RM estimés</h2><table>${st}</table><div class="mut" style="margin-top:6px">e1RM total (poids du corps inclus) et rapport au poids du corps du jour.</div></div>` : ''}
  <div class="card"><h2>Séries difficiles par muscle</h2>
  <div class="mut">Semaine en cours. Bande grise : 10 à 20 séries/semaine, zone associée à plus d'hypertrophie (Schoenfeld et al., 2017). Muscles secondaires comptés à 0,5 série (Pelland et al., 2024). Échauffements exclus.</div>${mus}</div>
  <h3>Exercices</h3>
  <div class="list">${tracked.map(x => `<button data-act="exd" data-id="${x.e.id}"><span class="grow">${esc(x.e.name)}<br><span class="mut">${fr(x.d)}</span></span>
    <span style="text-align:right"><b>${fmt(x.v)}${unit(x.kind)}</b><br><span class="mut ${x.delta > 0 ? 'acc' : ''}">${x.delta === null ? (x.kind === 'e1' ? 'e1RM' : '') : (x.delta >= 0 ? '+' : '') + fmt(x.delta) + ' / 4 sem.'}</span></span></button>`).join('') || '<p class="mut">Enregistre une séance pour voir ta progression.</p>'}</div>`;
}
function chart(pts, sel, unit) {
  const W = 320, H = 160, P = 26;
  const vs = pts.map(p => p.v), mn = Math.min(...vs), mx = Math.max(...vs), rg = mx - mn || 1;
  const x = i => P + (pts.length === 1 ? (W - 2 * P) / 2 : i * (W - 2 * P) / (pts.length - 1));
  const y = v => H - P - (v - mn) / rg * (H - 2 * P);
  const best = vs.indexOf(mx);
  return `<svg viewBox="0 0 ${W} ${H}">
  <line x1="${P}" x2="${W - P}" y1="${y(mx)}" y2="${y(mx)}" stroke="#25272b" stroke-dasharray="3 3"/>
  <polyline fill="none" stroke="var(--acc)" stroke-width="2.5" stroke-linejoin="round" points="${pts.map((p, i) => x(i) + ',' + y(p.v)).join(' ')}"/>
  ${pts.map((p, i) => `<circle cx="${x(i)}" cy="${y(p.v)}" r="${i === sel ? 6 : i === best ? 4.5 : 3}" fill="${i === sel ? '#fff' : 'var(--acc)'}"/><circle cx="${x(i)}" cy="${y(p.v)}" r="15" fill="transparent" data-act="pt" data-k="${i}"/>`).join('')}
  <text x="2" y="${y(mx) + 4}" font-size="10" fill="#8a8d93">${fmt(mx, 0)}</text>
  <text x="2" y="${y(mn) + 4}" font-size="10" fill="#8a8d93">${fmt(mn, 0)}</text>
  <text x="${P}" y="${H - 6}" font-size="10" fill="#8a8d93">${fr(pts[0].d)}</text>
  <text x="${W - P}" y="${H - 6}" font-size="10" text-anchor="end" fill="#8a8d93">${fr(pts[pts.length - 1].d)}</text></svg>`;
}

// ---------- Fiche exercice ----------
function vExDetail() {
  const e = ex(R.id), t = e.type === 'time';
  const all = [];
  S.sessions.forEach(se => se.entries.forEach(en => { if (en.exId === e.id) { const m = sessMetric(e, se, en); if (m) all.push({ d: se.date, se, en, m }); } }));
  const kind = all.some(p => p.m.kind === 'e1') ? 'e1' : t ? 'sec' : 'reps';
  const since = R.range ? addDays(today(), -R.range) : '';
  const pts = all.filter(p => p.m.kind === kind && p.d >= since).map(p => ({ d: p.d, v: p.m.v, s: p.m.s, se: p.se, en: p.en }));
  if (R.pt === null || R.pt >= pts.length) R.pt = pts.length - 1;
  const sp = pts[R.pt], gain = pts.length > 1 ? pts[pts.length - 1].v - pts[0].v : 0;
  const unit = kind === 'e1' ? 'kg' : kind === 'sec' ? 's' : 'reps';
  // tableau des records par nombre de reps
  const byR = {}; let maxReps = null, maxSec = null;
  S.sessions.forEach(se => se.entries.forEach(en => { if (en.exId === e.id) en.sets.filter(isWork).forEach(s => {
    const r = num(s.reps), w = eff(e, s, bwOf(se));
    if (r >= 1 && r <= 15 && (!byR[r] || w > byR[r].w)) byR[r] = { w, s, d: se.date };
    if (!maxReps || r > num(maxReps.s.reps)) maxReps = { s, d: se.date };
    if (t && (!maxSec || num(s.sec) > num(maxSec.s.sec))) maxSec = { s, d: se.date };
  }); }));
  const recRows = Object.keys(byR).map(Number).sort((a, b) => a - b).map(r => `<tr><td>${r} RM</td><td><b>${setTxt(e, byR[r].s)}</b></td><td class="mut">${e.type === 'load' ? '' : fmt(byR[r].w) + ' kg · '}${fr(byR[r].d)}</td></tr>`).join('');
  const ranges = [[28, '4 sem.'], [90, '3 mois'], [365, '1 an'], [0, 'Tout']];
  const hist = all.slice(-12).reverse();
  const mo = m => MUSCLES.map(x => `<option ${x === m ? 'selected' : ''}>${x}</option>`).join('');
  return `<button class="lnk" data-act="back">‹ Retour</button>
  <h1>${esc(e.name)}</h1>
  <div class="mut">${esc(e.muscle)}${e.sec.length ? ' · ' + e.sec.map(esc).join(', ') : ''} · ${TYPES[e.type]}${e.archived ? ' · archivé' : ''}</div>
  ${e.note ? `<div class="note">${esc(e.note)}</div>` : ''}
  <div class="card" style="margin-top:12px"><div class="chips">${ranges.map(r => `<button class="${r[0] === R.range ? 'on' : ''}" data-act="range" data-r="${r[0]}">${r[1]}</button>`).join('')}</div>
  <h2 style="margin-top:10px">${kind === 'e1' ? 'e1RM par séance' : kind === 'sec' ? 'Meilleur maintien' : 'Meilleure série (reps)'}</h2>
  ${pts.length ? chart(pts, R.pt, unit) : '<p class="mut">Aucune donnée sur cette période.</p>'}
  ${sp ? `<div class="mut">${fr(sp.d)} · <b style="color:var(--txt)">${fmt(sp.v)} ${unit}</b> · ${sp.en.sets.filter(isWork).map(s => setTxt(e, s) + (has(s.rir) ? '@' + s.rir : '')).join(' · ')}</div>` : ''}
  ${pts.length > 1 ? `<p style="margin:8px 0 0">Sur la période : <b class="${gain > 0 ? 'acc' : ''}">${gain >= 0 ? '+' : ''}${fmt(gain)} ${unit}</b></p>` : ''}
  ${kind === 'e1' ? '<div class="mut" style="margin-top:6px">e1RM (Epley, 1985) sur les séries de 1 à 12 reps, poids du corps du jour inclus si besoin.</div>' : ''}</div>
  <div class="card"><h2>Records</h2>
  ${t ? (maxSec ? `<p>Plus long maintien : <b class="acc">${setTxt(e, maxSec.s)}</b> <span class="mut">${fr(maxSec.d)}</span></p>` : '<p class="mut">Aucun.</p>')
    : (recRows ? `<table><tr><th>Reps</th><th>Meilleure série</th><th></th></tr>${recRows}</table>${maxReps ? `<p class="mut">Max de reps en une série : ${setTxt(e, maxReps.s)} (${fr(maxReps.d)})</p>` : ''}` : '<p class="mut">Aucun.</p>')}</div>
  <div class="card"><h2>Réglages de l'exercice</h2>
    <label class="f">Nom<input data-exf="name" value="${esc(e.name)}"></label>
    <div class="g2"><label class="f">Muscle principal<select data-exf="muscle">${mo(e.muscle)}</select></label>
    <label class="f">Type<select data-exf="type">${Object.keys(TYPES).map(k => `<option value="${k}" ${k === e.type ? 'selected' : ''}>${TYPES[k]}</option>`).join('')}</select></label></div>
    <label class="f">Équipement<select data-exf="eq">${['barre', 'halteres', 'pdc', 'kettlebell', 'autre'].map(k => `<option value="${k}" ${k === e.eq ? 'selected' : ''}>Libre · ${EQ[k]}</option>`).join('')}${['poulie', 'machine'].map(k => `<option value="${k}" ${k === e.eq ? 'selected' : ''}>Machine · ${EQ[k]}</option>`).join('')}</select></label>
    <label class="f">Muscles secondaires (comptés 0,5 série)</label><div class="chips" style="flex-wrap:wrap">${MUSCLES.filter(m => m !== e.muscle).map(m => `<button class="${e.sec.includes(m) ? 'on' : ''}" data-act="exsec" data-m="${m}">${m}</button>`).join('')}</div>
    <div class="g2"><label class="f">Plage min (${t ? 's' : 'reps'})<input inputmode="numeric" data-exf="repMin" value="${e.repMin}"></label>
    <label class="f">Plage max (${t ? 's' : 'reps'})<input inputmode="numeric" data-exf="repMax" value="${e.repMax}"></label>
    <label class="f">Incrément (kg)<input inputmode="decimal" data-exf="inc" value="${fmtIn(e.inc)}"></label>
    <label class="f">Repos (s, 0 = défaut)<input inputmode="numeric" data-exf="rest" value="${e.rest}"></label></div>
    <label class="ck"><input type="checkbox" data-exf="bar" ${e.bar ? 'checked' : ''}>Barre olympique (calculateur de disques)</label>
    <label class="f">Note épinglée (réglages machine, consignes…)<textarea rows="2" data-exf="note">${esc(e.note)}</textarea></label></div>
  <div class="card"><h2>Historique</h2>${hist.map(p => `<div style="margin-top:6px"><span class="mut">${fr(p.d)}</span> · ${p.en.sets.filter(isWork).map(s => setTxt(e, s) + (has(s.rir) ? '@' + s.rir : '')).join(' · ')}</div>`).join('') || '<p class="mut">Aucune séance.</p>'}</div>
  <button class="d blk" data-act="exarch">${e.archived ? 'Réactiver l\'exercice' : 'Archiver l\'exercice'}</button>
  <p class="mut">Archiver le retire des listes sans toucher à l'historique.</p>`;
}

// ---------- Exercices ----------
// Filtre commun (recherche, muscle, libre/machine) et liste groupée par muscle puis Libre / Machine
function filterEx(q, mus, cat, arch) {
  q = norm(q || '');
  return S.exercises.filter(e => (arch || !e.archived) && (!mus || e.muscle === mus) && (!cat || EQ_CAT(e.eq) === cat)
    && (!q || norm(e.name + ' ' + e.muscle + ' ' + (EQ[e.eq] || '')).includes(q)));
}
function grouped(list, btn) {
  const out = MUSCLES.map(m => {
    const lm = list.filter(e => e.muscle === m);
    if (!lm.length) return '';
    return `<h3>${m} <span class="mut">· ${lm.length}</span></h3>` + ['libre', 'machine'].map(c => {
      const lc = lm.filter(e => EQ_CAT(e.eq) === c).sort((a, b) => a.name.localeCompare(b.name, 'fr'));
      return lc.length ? `<div class="cat">${CAT_LAB[c]}</div>` + lc.map(btn).join('') : '';
    }).join('');
  }).join('');
  return out || '<p class="mut">Aucun exercice.</p>';
}
function catChips(act, cur) { return ['', 'libre', 'machine'].map(c => `<button class="${c === cur ? 'on' : ''}" data-act="${act}" data-c="${c}">${c ? CAT_LAB[c] : 'Libre + machine'}</button>`).join(''); }
function exList() {
  return grouped(filterEx(R.q, R.mus, R.cat, R.arch), e => { const l = prevEntry(e.id);
    return `<button data-act="exd" data-id="${e.id}"><span class="grow">${esc(e.name)}<br><span class="mut">${e.eq === 'pdc' ? '' : (EQ[e.eq] || '') + ' · '}${TYPES[e.type]}${e.archived ? ' · archivé' : ''}</span></span><span class="mut">${l ? fr(l.se.date) : ''}</span></button>`; });
}
function vEx() {
  return `<h1>Exercices</h1>
  <input id="exq" placeholder="Rechercher (nom, muscle, équipement)" value="${esc(R.q)}" autocomplete="off">
  <div class="chips" style="margin:10px 0 6px">${catChips('cat', R.cat)}</div>
  <div class="chips" style="margin:0 0 10px">${['', ...MUSCLES].map(m => `<button class="${m === R.mus ? 'on' : ''}" data-act="mus" data-m="${m}">${m || 'Tous'}</button>`).join('')}</div>
  <button class="p blk" data-act="newex">+ Nouvel exercice</button>
  <div class="list" id="exlist">${exList()}</div>
  <label class="ck"><input type="checkbox" id="exarch" ${R.arch ? 'checked' : ''}>Afficher les exercices archivés</label>`;
}

// ---------- Modèles ----------
function vTplEdit() {
  const t = tpl(R.id);
  if (!t) { R.view = ''; return vSet(); }
  return `<button class="lnk" data-act="back">‹ Retour</button><h1>Modèle</h1>
  <div class="card"><label class="f">Nom<input data-tplf="name" value="${esc(t.name)}"></label>
  <label class="ck"><input type="checkbox" data-tplf="rot" ${t.rot ? 'checked' : ''}>Dans la rotation (proposé automatiquement)</label></div>
  ${t.items.map((it, k) => { const ss = it.group && ((t.items[k - 1] && t.items[k - 1].group === it.group) || (t.items[k + 1] && t.items[k + 1].group === it.group));
    return `<div class="card ${ss ? 'ss' : ''}"><div class="row sp nw"><b class="grow">${esc(ex(it.exId).name)}${ss ? ` <span class="acc">${it.group}</span>` : ''}</b>
    <button class="ic" data-act="tmv" data-k="${k}" data-dir="-1" ${k === 0 ? 'disabled' : ''}>↑</button><button class="ic" data-act="tmv" data-k="${k}" data-dir="1" ${k === t.items.length - 1 ? 'disabled' : ''}>↓</button><button class="ic d" data-act="trm" data-k="${k}">✕</button></div>
    <div class="row sp" style="margin-top:6px"><span class="row"><button class="ic" data-act="tsets" data-k="${k}" data-d="-1">−</button><b>${it.sets} séries</b><button class="ic" data-act="tsets" data-k="${k}" data-d="1">+</button></span>
    ${k < t.items.length - 1 ? `<button data-act="tlink" data-k="${k}">${ss && t.items[k + 1].group === it.group ? 'Délier du suivant' : 'Superset avec le suivant'}</button>` : ''}</div></div>`; }).join('')}
  <button class="blk" data-act="pick" data-mode="tpl">+ Ajouter un exercice</button>
  <button class="d blk" style="margin-top:12px" data-act="tdel">Supprimer ce modèle</button>`;
}

// ---------- Réglages ----------
function vSet() {
  const last = S.lastExport ? new Date(S.lastExport).toLocaleDateString('fr-FR') : 'jamais';
  return `<h1>Réglages</h1>
  <div class="card"><h2>Profil</h2><div class="g2">
    <label class="f">Poids du corps (kg)<input inputmode="decimal" data-setf="bw" value="${fmtIn(S.settings.bw)}"></label>
    <label class="f">Repos par défaut (s)<input inputmode="numeric" data-setf="rest" value="${S.settings.rest}"></label></div>
    <p class="mut">Le poids du corps est enregistré avec chaque séance (tractions, dips, muscle-up) : changer cette valeur ne réécrit pas l'historique.</p></div>
  <div class="card"><h2>Modèles et rotation</h2>
    <p class="mut">La séance proposée est celle qui suit la dernière faite dans la rotation : une séance ratée ne décale pas ton PPL.</p>
    ${S.templates.map((t, k) => `<div class="row nw" style="margin-top:6px"><button class="grow" style="text-align:left" data-act="tpl" data-id="${t.id}">${esc(t.name)} <span class="mut">· ${t.items.length} exos${t.rot ? ' · rotation' : ''}</span></button>
      <button class="ic" data-act="tord" data-k="${k}" data-dir="-1" ${k === 0 ? 'disabled' : ''}>↑</button><button class="ic" data-act="tord" data-k="${k}" data-dir="1" ${k === S.templates.length - 1 ? 'disabled' : ''}>↓</button></div>`).join('')}
    <button class="blk" style="margin-top:8px" data-act="tnew">+ Nouveau modèle</button></div>
  <div class="card"><h2>Barre et disques</h2><div class="g2">
    <label class="f">Barre (kg)<input inputmode="decimal" data-setf="bar" value="${fmtIn(S.settings.bar)}"></label>
    <label class="f">Disques dispo (kg)<input data-setf="plates" value="${S.settings.plates.map(fmtIn).join(' ')}"></label></div></div>
  <div class="card"><h2>Données</h2>
    <p class="mut">Dernière sauvegarde externe : ${last}. Stockage ${persisted === true ? 'persistant accordé' : persisted === false ? 'non garanti par le navigateur : exporte régulièrement' : 'en cours de vérification'}.</p>
    <button class="p blk" data-act="xlsx">Exporter en Excel (.xlsx)</button>
    <div class="g2" style="margin-top:8px"><button data-act="json">Sauvegarde .json</button><button data-act="imp">Restaurer .json</button></div>
    <input type="file" id="file" accept=".json,application/json" hidden>
    <p class="mut">L'Excel contient 4 onglets : Séries, Séances, Records, Séries par muscle. Il ne modifie pas ton Suivi Journalier.xlsx ; copie les colonnes utiles ou relie-les par formule.</p>
    <h3>Sauvegardes automatiques (à chaque fin de séance)</h3><div id="snaps" class="list"><p class="mut">…</p></div></div>
  <div class="card"><h2>Sources des calculs</h2><div class="mut">
    e1RM : Epley (1985). Progression : double progression (Helms, Morgan & Valdez, The Muscle and Strength Pyramid). RIR : Zourdos et al. (2016), Helms et al. (2016). Volume : Schoenfeld, Ogborn & Krieger (2017) ; comptage fractionnaire des muscles secondaires : Pelland et al. (2024). Repos : Schoenfeld et al. (2016).</div></div>`;
}
async function fillSnaps() {
  const el = $('#snaps'); if (!el) return;
  if (!DB) { el.innerHTML = '<p class="mut">Indisponible sur ce navigateur.</p>'; return; }
  const ks = (await kKeys()).filter(k => String(k).startsWith('snap:')).sort().reverse();
  el.innerHTML = ks.map(k => `<button data-act="snap" data-k="${esc(k)}"><span>${new Date(k.slice(5)).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })}</span><span class="mut">Restaurer</span></button>`).join('') || '<p class="mut">Aucune pour l\'instant.</p>';
}

// =============== Export ===============
let xlsxP = null, pendingShare = null;
function loadXlsx() {
  if (window.XLSX) return Promise.resolve();
  if (!xlsxP) xlsxP = new Promise((res, rej) => { const s = document.createElement('script'); s.src = XLSX_URL; s.onload = res; s.onerror = () => { xlsxP = null; rej(); }; document.head.appendChild(s); });
  return xlsxP;
}
async function shareFile(name, blob, type) {
  const file = new File([blob], name, { type });
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file] }); S.lastExport = Date.now(); save(); closeSheet(); render(); return; }
    catch (e) {
      if (e.name === 'AbortError') return;
      pendingShare = { name, blob, type };
      return sheet(`<h2>Fichier prêt</h2><p class="mut">${esc(name)}</p><button class="p blk" data-act="share-again">Partager</button>`);
    }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  S.lastExport = Date.now(); save(); render();
}
function exportJson() { shareFile(`AR-Training-sauvegarde-${today()}.json`, new Blob([JSON.stringify(S)], { type: 'application/json' }), 'application/json'); }
function exportXlsx() {
  if (!window.XLSX) {
    toast('Préparation du module Excel…');
    loadXlsx().then(() => sheet(`<h2>Export Excel prêt</h2><button class="p blk" data-act="xlsx">Partager le fichier</button>`)).catch(() => toast('Module Excel indisponible : connecte-toi une fois à Internet'));
    return;
  }
  const X = window.XLSX, D = s => new Date(s + 'T12:00'), wb = X.utils.book_new();
  const add = (name, rows, cols) => { const ws = X.utils.aoa_to_sheet(rows, { cellDates: true, dateNF: 'dd/mm/yyyy' }); ws['!cols'] = cols.map(w => ({ wch: w })); X.utils.book_append_sheet(wb, ws, name); };
  const r1 = [['Date', 'Séance', 'Exercice', 'Muscle', 'Type de série', 'N°', 'Saisie (kg)', 'Charge effective (kg)', 'Reps', 'Secondes', 'RIR', 'e1RM (kg)', 'Record']];
  const r2 = [['Date', 'Séance', 'Durée (min)', 'Séries de travail', 'Poids du corps (kg)', 'Records', 'Note']];
  S.sessions.forEach(se => {
    let nW = 0, nPR = 0;
    se.entries.forEach(en => { const e = ex(en.exId); en.sets.forEach((s, j) => {
      if (isWork(s)) nW++; if (s.pr && s.pr.length) nPR++;
      const v = e1rm(e, s, bwOf(se));
      r1.push([D(se.date), se.name, e.name, e.muscle, SET_TYPES[s.t] || 'Normale', j + 1, num(s.kg), e.type === 'time' ? '' : Math.round(eff(e, s, bwOf(se)) * 100) / 100, e.type === 'time' ? '' : num(s.reps), e.type === 'time' ? num(s.sec) : '', has(s.rir) ? num(s.rir) : '', v ? Math.round(v * 10) / 10 : '', (s.pr || []).join(', ')]);
    }); });
    r2.push([D(se.date), se.name, se.end && se.start ? Math.round((se.end - se.start) / 6e4) : '', nW, bwOf(se), nPR, se.note || '']);
  });
  const r3 = [['Exercice', 'Muscle', 'Meilleur e1RM (kg)', 'Date', 'Charge effective max (kg)', 'Max reps', 'Max secondes']];
  S.exercises.forEach(e => {
    let b = null, ml = 0, mr = 0, ms = 0;
    S.sessions.forEach(se => se.entries.forEach(en => { if (en.exId === e.id) en.sets.filter(isWork).forEach(s => { const v = e1rm(e, s, bwOf(se)); if (v && (!b || v > b.v)) b = { v, d: se.date }; ml = Math.max(ml, eff(e, s, bwOf(se))); mr = Math.max(mr, num(s.reps)); ms = Math.max(ms, num(s.sec)); }); }));
    if (b || ms || mr) r3.push([e.name, e.muscle, b ? Math.round(b.v * 10) / 10 : '', b ? D(b.d) : '', e.type === 'time' ? '' : Math.round(ml * 100) / 100, mr || '', ms || '']);
  });
  const r4 = [['Semaine du', ...MUSCLES]];
  const weeks = [...new Set(S.sessions.map(se => mondayOf(se.date)))].sort();
  weeks.forEach(w => { const m = muscleWeek(w); r4.push([D(w), ...MUSCLES.map(x => m[x] || 0)]); });
  add('Séries', r1, [11, 12, 26, 12, 14, 4, 10, 12, 6, 9, 5, 10, 14]);
  add('Séances', r2, [11, 14, 10, 10, 12, 8, 30]);
  add('Records', r3, [26, 12, 14, 11, 14, 9, 11]);
  add('Séries par muscle', r4, [12, ...MUSCLES.map(() => 11)]);
  const out = X.write(wb, { type: 'array', bookType: 'xlsx' });
  shareFile(`AR-Training-${today()}.xlsx`, new Blob([out], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
}
function restoreData(o) {
  if (!o || !Array.isArray(o.sessions) || !Array.isArray(o.exercises)) return toast('Fichier invalide');
  const data = o.v === 2 ? o : migrate(o);
  ask('Remplacer toutes les données ?', 'Restaurer', () => { S = normalize(data); save(true); R.view = ''; render(); toast(`${S.sessions.length} séances restaurées`); }, `${data.sessions.length} séances dans la sauvegarde.`);
}

// =============== Feuilles contextuelles ===============
function pickList() {
  const q = $('#pickq') ? $('#pickq').value.trim() : '';
  return `<div class="chips" style="margin:10px 0 6px">${catChips('pcat', R.pcat)}</div>
  <div class="chips" style="margin:0 0 4px">${['', ...MUSCLES].map(m => `<button class="${m === R.pmus ? 'on' : ''}" data-act="pmus" data-m="${m}">${m || 'Tous'}</button>`).join('')}</div>
  ${grouped(filterEx(q, R.pmus, R.pcat, false), e => `<button data-act="pickex" data-id="${e.id}"><span>${esc(e.name)}</span><span class="mut">${EQ[e.eq] || ''}</span></button>`)}
  ${q ? `<button data-act="pickcreate"><span>Créer « ${esc(q)} »</span><span class="acc">+</span></button>` : ''}`;
}
function openPick(mode, i) {
  R.pick = { mode, i };
  // en séance, on présélectionne le muscle de l'exercice à remplacer
  if (mode === 'replace' && S.active) R.pmus = ex(S.active.entries[i].exId).muscle || '';
  sheet(`<h2>${mode === 'replace' ? 'Remplacer par' : 'Ajouter un exercice'}</h2><input id="pickq" placeholder="Rechercher" autocomplete="off"><div class="list" id="picklist">${pickList()}</div>`);
}
function picked(id) {
  const p = R.pick; closeSheet();
  if (p.mode === 'tpl') { const t = tpl(R.id); t.items.push({ exId: id, sets: 3, group: '' }); save(); return render(); }
  const A = S.active; if (!A) return;
  if (p.mode === 'replace') { const g = A.entries[p.i].group; A.entries[p.i] = newEntry(id, 0, g); save(); return renderCard(p.i); }
  A.entries.push(newEntry(id)); save(); render();
  setTimeout(() => { const el = document.getElementById('en-' + (A.entries.length - 1)); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, 50);
}
function exMenu(i) {
  const A = S.active, en = A.entries[i], e = ex(en.exId), nx = A.entries[i + 1];
  const linked = en.group && nx && nx.group === en.group;
  sheet(`<h2>${esc(e.name)}</h2><div class="list">
  ${e.type !== 'time' ? '<button data-act="warmup" data-i="' + i + '"><span>Générer l\'échauffement</span><span class="mut">rampe 40-60-80 %</span></button>' : ''}
  ${e.bar ? '<button data-act="plates" data-i="' + i + '"><span>Calculateur de disques</span></button>' : ''}
  ${nx ? `<button data-act="link" data-i="${i}"><span>${linked ? 'Délier du suivant' : 'Superset avec le suivant'}</span><span class="mut">${esc(ex(nx.exId).name)}</span></button>` : ''}
  <button data-act="note" data-id="${e.id}"><span>Note épinglée</span></button>
  <button data-act="pickrep" data-i="${i}"><span>Remplacer l'exercice</span></button>
  <button data-act="exd" data-id="${e.id}"><span>Voir la fiche et les records</span></button>
  <button data-act="rmex" data-i="${i}"><span class="acc">Retirer de la séance</span></button></div>`);
}
function platesFor(total) {
  let side = (total - S.settings.bar) / 2; if (side < 0) return null;
  const out = []; S.settings.plates.slice().sort((a, b) => b - a).forEach(p => { while (side >= p - 1e-9) { out.push(p); side -= p; } });
  return { out, rest: Math.round(side * 200) / 100 };
}
function platesHtml(kg) {
  const r = platesFor(kg);
  if (!r) return `<p class="mut">Inférieur au poids de la barre (${fmtIn(S.settings.bar)} kg).</p>`;
  return `<div class="plates"><span style="width:60px;height:8px;background:#555"></span>${r.out.map(p => `<span style="height:${30 + p * 3}px">${fmtIn(p)}</span>`).join('')}</div>
  <p style="text-align:center"><b>Par côté :</b> ${r.out.map(fmtIn).join(' + ') || 'rien'}${r.rest ? ` <span class="mut">(reste ${fmtIn(r.rest)} kg non chargeable)</span>` : ''}</p>`;
}
function targetKg(i) {
  const A = S.active, en = A.entries[i], e = ex(en.exId), c = cardCtx(en);
  for (let j = 0; j < en.sets.length; j++) { const s = en.sets[j]; if (s.t === 'w') continue; if (has(s.kg)) return num(s.kg); const p = placeholder(e, en, j, c); if (has(p.kg)) return num(p.kg); }
  return 0;
}

// =============== Événements ===============
document.addEventListener('pointerdown', unlockAudio, { passive: true });
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') { wake(); tick(); } else flush(); });
window.addEventListener('pagehide', flush);

document.addEventListener('click', ev => {
  const tb = ev.target.closest('[data-tab]');
  if (tb) { R.tab = tb.dataset.tab; R.view = ''; K.view = ''; render(); window.scrollTo(0, 0); return; }
  const b = ev.target.closest('[data-act]');
  if (!b || b.tagName === 'INPUT' || b.tagName === 'SELECT' || b.tagName === 'TEXTAREA') return;
  const d = b.dataset, A = S.active, i = +d.i, j = +d.j;
  if (coachClick(d)) return;
  switch (d.act) {
    case 'close': closeSheet(); return;
    case 'ask-yes': { const cb = askCb; closeSheet(); if (cb) cb(); return; }
    case 'flash-off': $('#flash').classList.remove('on'); return;
    case 'start': startTpl(d.id); return;
    case 'cstart': closeSheet(); startCycle(d.id); return;
    case 'cview': cycleSheet(d.id); return;
    case 'emom-go': A.emom = { i, start: Date.now() }; emomM = -1; emomW = -1; stopRest(); save(); renderCard(i); tick(); return;
    case 'emom-stop': A.emom = null; save(); renderCard(i); return;
    case 'emin': {
      const s = A.entries[i].sets[j];
      if (!s.done) { s.kg = '0'; s.reps = s.pn; s.done = true; save(); renderCard(i); return; }
      sheet(`<h2>Minute ${j + 1} : reps faites</h2><div class="g2" style="grid-template-columns:repeat(4,1fr)">${[1, 2, 3, 4, 5, 6, 7, 8].map(r => `<button class="${num(s.reps) === r ? 'p' : ''}" data-act="emin-set" data-i="${i}" data-j="${j}" data-r="${r}">${r}</button>`).join('')}</div>
      <button class="d blk" style="margin-top:10px" data-act="emin-set" data-i="${i}" data-j="${j}" data-r="0">Minute non faite</button>`);
      return;
    }
    case 'emin-set': { const s = A.entries[i].sets[j]; if (+d.r) { s.reps = d.r; s.done = true; } else { s.reps = ''; s.done = false; } closeSheet(); save(); renderCard(i); return; }
    case 'scopy': {
      const se = S.sessions.find(s => s.id === d.id); closeSheet(); if (!se) return;
      const txt = sessText(se);
      if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(txt).then(() => toast('Résumé copié'), () => sheet(`<h2>Résumé</h2><textarea rows="12" readonly>${esc(txt)}</textarea>`));
      else sheet(`<h2>Résumé</h2><textarea rows="12" readonly>${esc(txt)}</textarea>`);
      return;
    }
    case 'finish': {
      const nW = A.entries.reduce((t, en) => t + en.sets.filter(isWork).length, 0), nU = A.entries.reduce((t, en) => t + en.sets.filter(s => !s.done).length, 0);
      const nPR = A.entries.reduce((t, en) => t + en.sets.filter(s => s.pr && s.pr.length).length, 0);
      sheet(`<h2>${A.editOf ? 'Enregistrer les modifications' : 'Terminer la séance'}</h2>
      <div class="kpi"><div><b>${A.editOf ? '–' : Math.round((Date.now() - A.start) / 6e4)}</b><span class="mut">min</span></div><div><b>${nW}</b><span class="mut">séries</span></div><div><b class="acc">${nPR}</b><span class="mut">records</span></div></div>
      <label class="f">Poids du corps du jour (kg)<input id="finbw" inputmode="decimal" value="${fmtIn(A.bw)}"></label>
      <label class="f">Note de séance<textarea id="finnote" rows="2" placeholder="Forme, sommeil, douleurs…">${esc(A.note)}</textarea></label>
      ${nU ? `<p class="mut">${nU} série${nU > 1 ? 's' : ''} non validée${nU > 1 ? 's' : ''} ser${nU > 1 ? 'ont' : 'a'} ignorée${nU > 1 ? 's' : ''}.</p>` : ''}
      <button class="p blk" style="margin-top:12px" data-act="finish-ok">Enregistrer</button>`);
      return;
    }
    case 'finish-ok': finishWorkout(num($('#finbw').value), $('#finnote').value.trim()); return;
    case 'leave':
      if (A.editOf) { ask('Quitter sans enregistrer les modifications ?', 'Quitter', () => { S.active = null; save(true); render(); }); return; }
      sheet(`<h2>Quitter la séance</h2><div class="list">
      <button data-act="pause"><span><b>Continuer plus tard</b><br><span class="mut">Mise de côté dans « En pause », reprise quand tu veux</span></span></button>
      <button data-act="abort"><span><b class="acc">Quitter sans enregistrer</b><br><span class="mut">Rien n'est gardé</span></span></button>
      <button data-act="close"><span>Rester dans la séance</span></button></div>`);
      return;
    case 'pause': {
      closeSheet(); A.pausedAt = Date.now(); A.restEnd = 0;
      S.paused.push(A); S.active = null; unwake(); save(true); R.tab = 'seance'; render(); window.scrollTo(0, 0);
      toast('Séance mise en pause'); return;
    }
    case 'resume': {
      if (S.active) return toast('Mets d\'abord en pause ou termine la séance en cours');
      const k = S.paused.findIndex(p => p.id === d.id); if (k < 0) return;
      const p = S.paused.splice(k, 1)[0];
      p.start += Date.now() - (p.pausedAt || Date.now()); delete p.pausedAt; // la pause ne compte pas dans la durée
      S.active = p; save(true); render(); window.scrollTo(0, 0); wake(); return;
    }
    case 'pdel': ask('Supprimer cette séance en pause ?', 'Supprimer', () => { S.paused = S.paused.filter(p => p.id !== d.id); save(); render(); }, 'Les séries saisies seront perdues.'); return;
    case 'abort': closeSheet(); ask(A.editOf ? 'Annuler les modifications ?' : 'Abandonner cette séance ?', A.editOf ? 'Oui, annuler' : 'Abandonner', () => { S.active = null; unwake(); save(true); render(); }); return;
    case 'mv': { const k = i + +d.dir; if (k < 0 || k >= A.entries.length) return; [A.entries[i], A.entries[k]] = [A.entries[k], A.entries[i]]; cleanGroups(A.entries); break; }
    case 'exmenu': exMenu(i); return;
    case 'rmex': closeSheet(); ask(`Retirer ${esc(ex(A.entries[i].exId).name)} ?`, 'Retirer', () => { A.entries.splice(i, 1); cleanGroups(A.entries); save(); render(); }); return;
    case 'pick': openPick(d.mode); return;
    case 'pickrep': openPick('replace', i); return;
    case 'pickex': picked(d.id); return;
    case 'pickcreate': { const n = $('#pickq').value.trim(); if (!n) return; const e = Object.assign(exDefaults(), { name: n }); S.exercises.push(e); picked(e.id); toast('Exercice créé : règle son muscle dans sa fiche'); return; }
    case 'addset': { const s = A.entries[i].sets; const l = s[s.length - 1]; const ns = blankSet(l && l.t === 'w' ? 'n' : (l ? l.t : 'n')); s.push(ns); save(); renderCard(i); return; }
    case 'setmenu': {
      const s = A.entries[i].sets[j];
      sheet(`<h2>Série ${j + 1}</h2><div class="list">${Object.keys(SET_TYPES).map(t => `<button data-act="settype" data-i="${i}" data-j="${j}" data-t="${t}"><span>${SET_TYPES[t]}</span><span class="acc">${s.t === t ? '✓' : ''}</span></button>`).join('')}
      <button data-act="rmset" data-i="${i}" data-j="${j}"><span class="acc">Supprimer la série</span></button></div>`);
      return;
    }
    case 'settype': A.entries[i].sets[j].t = d.t; if (d.t === 'w') A.entries[i].sets[j].pr = []; closeSheet(); save(); renderCard(i); return;
    case 'rmset': A.entries[i].sets.splice(j, 1); closeSheet(); save(); renderCard(i); return;
    case 'copyprev': {
      const en = A.entries[i], p = prevSet(cardCtx(en).last, en, j); if (!p) return;
      Object.assign(en.sets[j], { kg: fmtIn(p.kg), reps: p.reps, sec: p.sec }); save(); renderCard(i); return;
    }
    case 'done': {
      const en = A.entries[i], s = en.sets[j], e = ex(en.exId);
      if (!s.done) {
        const p = placeholder(e, en, j, cardCtx(en));
        // une fourchette prévue (6-8 reps, 40-45 kg) ne se valide pas d'un appui : il faut la valeur réelle
        if (!has(s.kg) && isRange(p.kg)) return toast('Indique la charge utilisée');
        if (!has(s.reps) && isRange(p.reps)) return toast('Indique les répétitions faites');
        if (!has(s.kg) && has(p.kg)) s.kg = String(p.kg);
        if (e.type === 'time') { if (!has(s.sec) && has(p.sec)) s.sec = String(p.sec); if (!num(s.sec)) return toast('Indique la durée'); }
        else { if (!has(s.reps) && has(p.reps)) s.reps = String(p.reps); if (!num(s.reps)) return toast('Indique les répétitions'); }
        if (e.type === 'load' && !has(s.kg)) return toast('Indique la charge');
        s.done = true; checkPR(i, j);
        const nx = A.entries[i + 1], ssMid = en.group && nx && nx.group === en.group;
        const rs = s.ps !== undefined ? s.ps : (s.t === 'w' ? 60 : (e.rest || S.settings.rest));
        if (!A.editOf) { if (ssMid) toast('Superset : enchaîne ' + ex(nx.exId).name); else if (rs > 0) startRest(rs); }
      } else { s.done = false; s.pr = []; }
      save(); renderCard(i); return;
    }
    case 'link': {
      const en = A.entries[i], nx = A.entries[i + 1];
      if (en.group && nx.group === en.group) nx.group = ''; else { const g = en.group || freeLetter(A.entries); en.group = g; nx.group = g; }
      cleanGroups(A.entries); closeSheet(); break;
    }
    case 'warmup': {
      const en = A.entries[i], e = ex(en.exId), W = targetKg(i); closeSheet();
      const r = v => Math.round(v / 2.5) * 2.5;
      let rows;
      if (e.type === 'load') {
        if (!W) return toast('Indique d\'abord la charge de travail');
        rows = (e.bar ? [[S.settings.bar, 10]] : []).concat([[0.4, 5], [0.6, 3], [0.8, 2]].map(([p, n]) => [r(W * p), n])).filter(([k], x, a) => k > 0 && k < W && (!e.bar || k >= S.settings.bar) && (x === 0 || k > a[x - 1][0]));
      } else rows = [[0, 5]].concat(W > 0 ? [[r(W * 0.5), 3]] : []);
      en.sets = en.sets.filter(s => s.t !== 'w' || s.done);
      en.sets.unshift(...rows.map(([k, n]) => Object.assign(blankSet('w'), { kg: fmtIn(k), reps: String(n) })));
      save(); renderCard(i); toast(rows.length + ' séries d\'échauffement ajoutées'); return;
    }
    case 'plates': { const kg = targetKg(i); sheet(`<h2>Calculateur de disques</h2><label class="f">Charge totale (kg)<input id="platekg" inputmode="decimal" value="${kg ? fmtIn(kg) : ''}"></label><div id="plateres">${kg ? platesHtml(kg) : ''}</div>`); return; }
    case 'note': { const e = ex(d.id); sheet(`<h2>Note · ${esc(e.name)}</h2><textarea id="notetx" rows="4" placeholder="Réglage du banc, prise, consignes…">${esc(e.note)}</textarea><button class="p blk" style="margin-top:10px" data-act="note-ok" data-id="${e.id}">Enregistrer</button>`); return; }
    case 'note-ok': ex(d.id).note = $('#notetx').value.trim(); closeSheet(); save(); render(); return;
    case 'savetpl': ask('Mettre à jour le modèle ' + esc(A.name) + ' ?', 'Mettre à jour', () => { tpl(A.tplId).items = A.entries.map(en => ({ exId: en.exId, sets: en.sets.filter(s => s.t !== 'w').length || 3, group: en.group })); save(); toast('Modèle mis à jour'); }, 'Ordre, exercices, nombre de séries et supersets de cette séance.'); return;
    case 'newtpl-from': sheet(`<h2>Nouveau modèle</h2><input id="tplname" placeholder="Nom du modèle" value="${esc(A.name === 'Séance libre' ? '' : A.name)}"><button class="p blk" style="margin-top:10px" data-act="newtpl-ok">Créer</button>`); return;
    case 'newtpl-ok': { const n = $('#tplname').value.trim() || 'Nouveau modèle', t = { id: uid(), name: n, rot: false, items: A.entries.map(en => ({ exId: en.exId, sets: en.sets.filter(s => s.t !== 'w').length || 3, group: en.group })) }; S.templates.push(t); A.tplId = t.id; A.name = n; closeSheet(); save(); render(); toast('Modèle créé'); return; }
    case 'rest+': if (A && A.restEnd) { A.restEnd += 15000; A.restTotal += 15; save(); tick(); } return;
    case 'rest-': if (A && A.restEnd) { A.restEnd -= 15000; A.restTotal = Math.max(1, A.restTotal - 15); save(); tick(); } return;
    case 'rest-stop': stopRest(); return;
    // historique
    case 'sesmenu': sheet(`<h2>Séance</h2><div class="list"><button data-act="scopy" data-id="${d.id}"><span>Copier le résumé</span><span class="mut">prévu / fait</span></button><button data-act="sedit" data-id="${d.id}"><span>Modifier</span></button><button data-act="srep" data-id="${d.id}"><span>Refaire cette séance</span></button><button data-act="sdel" data-id="${d.id}"><span class="acc">Supprimer</span></button></div>`); return;
    case 'sedit': closeSheet(); editSession(d.id); return;
    case 'srep': closeSheet(); repeatSession(d.id); return;
    case 'sdel': ask('Supprimer cette séance ?', 'Supprimer', () => { S.sessions = S.sessions.filter(s => s.id !== d.id); save(); render(); }, 'Une sauvegarde automatique reste disponible dans Réglages.'); return;
    // progrès / fiche
    case 'exd': closeSheet(); R.view = 'exd'; R.id = d.id; R.pt = null; render(); window.scrollTo(0, 0); return;
    case 'back': R.view = ''; render(); window.scrollTo(0, 0); return;
    case 'range': R.range = +d.r; R.pt = null; render(); return;
    case 'pt': R.pt = +d.k; render(); return;
    case 'exsec': { const e = ex(R.id), k = e.sec.indexOf(d.m); if (k < 0) e.sec.push(d.m); else e.sec.splice(k, 1); break; }
    case 'exarch': ex(R.id).archived = !ex(R.id).archived; break;
    // exercices
    case 'mus': R.mus = d.m; render(); return;
    case 'cat': R.cat = d.c; render(); return;
    case 'pcat': R.pcat = d.c; $('#picklist').innerHTML = pickList(); return;
    case 'pmus': R.pmus = d.m; $('#picklist').innerHTML = pickList(); return;
    case 'newex': { const e = exDefaults(); S.exercises.push(e); save(); R.view = 'exd'; R.id = e.id; R.pt = null; render(); window.scrollTo(0, 0); return; }
    // modèles
    case 'tpl': R.view = 'tpl'; R.id = d.id; render(); window.scrollTo(0, 0); return;
    case 'tnew': { const t = { id: uid(), name: 'Nouveau modèle', rot: false, items: [] }; S.templates.push(t); save(); R.view = 'tpl'; R.id = t.id; render(); return; }
    case 'tord': { const l = S.templates, k = +d.k, m = k + +d.dir; if (m < 0 || m >= l.length) return; [l[k], l[m]] = [l[m], l[k]]; break; }
    case 'tmv': { const l = tpl(R.id).items, k = +d.k, m = k + +d.dir; if (m < 0 || m >= l.length) return; [l[k], l[m]] = [l[m], l[k]]; cleanGroups(l); break; }
    case 'trm': { const l = tpl(R.id).items; l.splice(+d.k, 1); cleanGroups(l); break; }
    case 'tsets': { const it = tpl(R.id).items[+d.k]; it.sets = Math.max(1, Math.min(10, it.sets + +d.d)); break; }
    case 'tlink': { const l = tpl(R.id).items, k = +d.k; if (l[k].group && l[k + 1].group === l[k].group) l[k + 1].group = ''; else { const g = l[k].group || freeLetter(l); l[k].group = g; l[k + 1].group = g; } cleanGroups(l); break; }
    case 'tdel': ask('Supprimer ce modèle ?', 'Supprimer', () => { S.templates = S.templates.filter(t => t.id !== R.id); R.view = ''; save(); render(); }, 'L\'historique des séances est conservé.'); return;
    // données
    case 'xlsx': closeSheet(); exportXlsx(); return;
    case 'json': exportJson(); return;
    case 'share-again': { const p = pendingShare; closeSheet(); if (p) shareFile(p.name, p.blob, p.type); return; }
    case 'imp': $('#file').click(); return;
    case 'snap': kGet(d.k).then(o => restoreData(o)); return;
    default: return;
  }
  save(); render();
});

document.addEventListener('input', ev => {
  const t = ev.target, d = t.dataset;
  if (coachInput(t)) return;
  if (d.f && S.active) { S.active.entries[+d.i].sets[+d.j][d.f] = t.value; save(); return; }
  if (t.id === 'pickq') { $('#picklist').innerHTML = pickList(); return; }
  if (t.id === 'exq') { R.q = t.value; $('#exlist').innerHTML = exList(); return; }
  if (t.id === 'platekg') { $('#plateres').innerHTML = num(t.value) ? platesHtml(num(t.value)) : ''; return; }
});
document.addEventListener('change', ev => {
  const t = ev.target, d = t.dataset;
  if (coachChange(t)) return;
  if (d.f && S.active) { S.active.entries[+d.i].sets[+d.j][d.f] = t.value; save(); return; }
  if (d.exf) {
    const e = ex(R.id), k = d.exf;
    if (k === 'bar') e.bar = t.checked;
    else if (['repMin', 'repMax', 'rest'].includes(k)) e[k] = Math.max(0, Math.round(num(t.value)));
    else if (k === 'inc') e.inc = Math.max(0, num(t.value));
    else if (k === 'name') e.name = t.value.trim() || e.name;
    else { e[k] = t.value; if (k === 'muscle') e.sec = e.sec.filter(m => m !== t.value); }
    if (e.repMax < e.repMin) e.repMax = e.repMin;
    save(); if (k !== 'note' && k !== 'name') render(); return;
  }
  if (d.tplf) { const p = tpl(R.id); if (d.tplf === 'rot') p.rot = t.checked; else p.name = t.value.trim() || p.name; save(); return; }
  if (d.setf) {
    const k = d.setf;
    if (k === 'plates') S.settings.plates = t.value.split(/[\s;]+/).map(num).filter(x => x > 0);
    else if (k === 'rest') S.settings.rest = Math.max(10, Math.round(num(t.value)) || 120);
    else S.settings[k] = num(t.value) || S.settings[k];
    save(); return;
  }
  if (t.id === 'exarch') { R.arch = t.checked; $('#exlist').innerHTML = exList(); return; }
  if (t.id === 'file' && t.files[0]) {
    const r = new FileReader();
    r.onload = () => { try { restoreData(JSON.parse(r.result)); } catch (e) { toast('Fichier illisible'); } t.value = ''; };
    r.readAsText(t.files[0]);
  }
});

// =============== Démarrage ===============
async function boot() {
  try { DB = await idbOpen(); S = await kGet('state'); } catch (e) { DB = null; }
  if (!S) { try { S = JSON.parse(localStorage.getItem('lourd.v2')); } catch (e) {} }
  if (!S) { let old = null; try { old = JSON.parse(localStorage.getItem('lourd.v1')); } catch (e) {} S = old ? migrate(old) : defaults(); }
  S = normalize(S); save(true);
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().then(p => { persisted = p; if (R.tab === 'set' && !R.view) render(); }).catch(() => {});
  render(); wake();
  setInterval(tick, 500);
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('sw.js').catch(() => {});
  setTimeout(() => loadXlsx().catch(() => {}), 5000);
}
boot();
