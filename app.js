/* ════════════════════════════════════════════════
   PEDRO FiT v2 — app.js
   Modular architecture: DB → Data → UI → Features
   ════════════════════════════════════════════════ */

'use strict';

/* ── 1. DATA LAYER (swap localStorage → Supabase here) ── */
const DB = {
  KEY: 'pedrofit_v2',
  get() { try { return JSON.parse(localStorage.getItem(this.KEY)) || null; } catch{ return null; } },
  save(data) { localStorage.setItem(this.KEY, JSON.stringify(data)); },
  clear() { localStorage.removeItem(this.KEY); }
};

/* ── 2. STATE ── */
const defaultState = () => ({
  onboarded: false,
  goal: null, level: null, equipment: [], exclude: [], duration: 30, gender: null,
  height: null, weight: null, age: null,
  done: [],
  metrics: [],          // [{date, weight, waist, chest, hips, thigh, bicep, bodyfat}]
  startDate: new Date().toISOString().split('T')[0],
  aiPlan: null,
  customEquipment: [],  // [{id, label, icon}] — user-defined devices
});

let S = DB.get() || defaultState();
const save = () => DB.save(S);

/* ── 3. EXERCISE DATA ── */
const EX = [
  // ─ Oberkörper ─
  {id:'pushup',     name:'Push-ups',          cat:'Oberkörper', equip:[],
   color:'#1E5F8E', grad:'linear-gradient(135deg,#0a1e36,#0d2848)',
   desc:'Bauchlage, Hände schulterbreit, Körper gerade. Kontrolliert bis fast auf den Boden absenken, dann hochdrücken. Ellbogen leicht nach hinten, nicht seitlich.',
   muscles:['Brust','Trizeps','Schultern','Core'], sets:'3 Sätze', reps:'12–15', workSec:45, restSec:60},
  {id:'pikepush',   name:'Pike Push-ups',      cat:'Oberkörper', equip:[],
   color:'#1A4A7A', grad:'linear-gradient(135deg,#091630,#0d2040)',
   desc:'Gesäß hoch in die Luft (umgekehrtes V). Kopf nach unten, Schultern tragen das Gewicht. Langsam absenken und hochdrücken.',
   muscles:['Schultern','Trizeps'], sets:'3 Sätze', reps:'10', workSec:40, restSec:60},
  {id:'dips',       name:'Dips am Stuhl',      cat:'Oberkörper', equip:['stuhl','dip'],
   color:'#2A5A8E', grad:'linear-gradient(135deg,#0d1e36,#102848)',
   desc:'Hände auf Stuhl/Bank hinter dir, Beine ausgestreckt. Körper senken bis Ellbogen 90°, dann hochdrücken. Isoliert den Trizeps.',
   muscles:['Trizeps','Brust','Schultern'], sets:'3 Sätze', reps:'12', workSec:40, restSec:60},
  {id:'liegestutz', name:'Liegestütz mit Griff', cat:'Oberkörper', equip:['liegestuetz'],
   color:'#1E5F8E', grad:'linear-gradient(135deg,#0a1e36,#0d2848)',
   desc:'Wie normale Push-ups, aber mit Liegestützgriffen. Ermöglicht tiefere Absenkung und schont die Handgelenke. Mehr Brust-Dehnung.',
   muscles:['Brust','Trizeps','Schultern'], sets:'3 Sätze', reps:'12–15', workSec:45, restSec:60},
  // ─ Core ─
  {id:'plank',      name:'Plank',              cat:'Core', equip:[],
   color:'#2E5E7A', grad:'linear-gradient(135deg,#0a1e26,#0d2836)',
   desc:'Unterarmstütz, Körper gerade von Kopf bis Ferse. Gesäß nicht hoch oder durch hängen. Bauch aktiv anspannen, gleichmäßig atmen.',
   muscles:['Bauch','Rücken','Schultern'], sets:'3 Sätze', reps:'45 Sek.', workSec:45, restSec:60},
  {id:'sidepl',     name:'Side Plank',         cat:'Core', equip:[],
   color:'#1E4A6A', grad:'linear-gradient(135deg,#081828,#0c2030)',
   desc:'Seitlicher Unterarmstütz. Körper gerade, Hüfte nicht hängen lassen. Beide Seiten je gleich lang.',
   muscles:['Seitenbauch','Hüfte'], sets:'3 Sätze', reps:'30 Sek./Seite', workSec:30, restSec:45},
  {id:'hollow',     name:'Hollow Body Hold',   cat:'Core', equip:[],
   color:'#1A3A5A', grad:'linear-gradient(135deg,#081220,#0c1a2c)',
   desc:'Rückenlage, Arme über den Kopf, Beine angehoben. Unterer Rücken bleibt am Boden. Tiefes Bauchtraining.',
   muscles:['Tiefer Bauch','Hüftbeuger'], sets:'3 Sätze', reps:'30 Sek.', workSec:30, restSec:60},
  {id:'crunches',   name:'Crunches',           cat:'Core', equip:[],
   color:'#2A4A6A', grad:'linear-gradient(135deg,#091828,#0d2038)',
   desc:'Rückenlage, Knie angewinkelt. Schulterblätter abheben, Bauch anspannen. Nicht am Nacken ziehen.',
   muscles:['Gerade Bauchmuskulatur'], sets:'3 Sätze', reps:'20', workSec:40, restSec:45},
  {id:'superman',   name:'Superman',           cat:'Rücken', equip:[],
   color:'#3A2A6A', grad:'linear-gradient(135deg,#10082a,#180e38)',
   desc:'Bauchlage, Arme nach vorne. Gleichzeitig Arme und Beine anheben, 2 Sek. halten. Stärkt unteren Rücken.',
   muscles:['Unterer Rücken','Gesäß'], sets:'3 Sätze', reps:'12', workSec:40, restSec:60},
  // ─ Beine ─
  {id:'squat',      name:'Squats',             cat:'Beine', equip:[],
   color:'#148F77', grad:'linear-gradient(135deg,#031a0d,#052a15)',
   desc:'Füße schulterbreit, Zehen leicht nach außen. Tief in die Hocke, Knie folgen Zehen. Rücken gerade.',
   muscles:['Quadrizeps','Gesäß','Waden'], sets:'4 Sätze', reps:'15', workSec:50, restSec:60},
  {id:'lunge',      name:'Reverse Lunges',     cat:'Beine', equip:[],
   color:'#1A7A60', grad:'linear-gradient(135deg,#04180e,#072618)',
   desc:'Schritt nach hinten, hinteres Knie kurz über den Boden. Rücken gerade. Schont Knie mehr als vorwärts.',
   muscles:['Quadrizeps','Gesäß'], sets:'3 Sätze', reps:'12/Seite', workSec:50, restSec:60},
  {id:'glute',      name:'Glute Bridge',       cat:'Gesäß', equip:[],
   color:'#207A55', grad:'linear-gradient(135deg,#062016,#0a2e1e)',
   desc:'Rückenlage, Knie angewinkelt. Gesäß maximal heben, 2 Sek. halten, kontrolliert senken.',
   muscles:['Gesäß','Hintere Oberschenkel'], sets:'4 Sätze', reps:'15', workSec:50, restSec:60},
  {id:'wallsit',    name:'Wall Sit',           cat:'Beine', equip:[],
   color:'#2A6A4A', grad:'linear-gradient(135deg,#081a10,#0c2616)',
   desc:'Rücken an der Wand, Beine 90°. Oberschenkel parallel zum Boden halten.',
   muscles:['Quadrizeps','Gesäß'], sets:'3 Sätze', reps:'45 Sek.', workSec:45, restSec:60},
  {id:'calf',       name:'Calf Raises',        cat:'Beine', equip:[],
   color:'#1A5A3A', grad:'linear-gradient(135deg,#051410,#081e16)',
   desc:'Auf Zehenspitzen heben, kurz halten, kontrolliert senken. Einbeinig für mehr Intensität.',
   muscles:['Waden'], sets:'3 Sätze', reps:'20', workSec:40, restSec:45},
  {id:'stepcalves', name:'Step Calf Raises',   cat:'Beine', equip:['step','stuhl'],
   color:'#1A5A3A', grad:'linear-gradient(135deg,#051410,#081e16)',
   desc:'Auf Step/Treppenstufe stehen, Ferse hängt über den Rand. Tiefer senken als normal für mehr Dehnung.',
   muscles:['Waden (tiefer Bereich)'], sets:'3 Sätze', reps:'15', workSec:40, restSec:45},
  {id:'donkey',     name:'Donkey Kicks',       cat:'Gesäß', equip:[],
   color:'#2A5A40', grad:'linear-gradient(135deg,#081610,#0c2018)',
   desc:'Vierfüßlerstand. Ein Bein nach oben und hinten strecken, Fußsohle zur Decke. Gesäß aktiv anspannen.',
   muscles:['Gesäß','Hintere Oberschenkel'], sets:'3 Sätze', reps:'15/Seite', workSec:40, restSec:45},
  // ─ Klimmzug ─
  {id:'pullup',     name:'Klimmzüge',          cat:'Klimmzug', equip:['klimmzug'],
   color:'#5A3A8A', grad:'linear-gradient(135deg,#120c1e,#1a1028)',
   desc:'Übergriff schulterbreit. Körper hochziehen bis Kinn über Stange. Einer der effektivsten Oberkörper-Übungen.',
   muscles:['Latissimus','Bizeps','Core'], sets:'3 Sätze', reps:'max.', workSec:45, restSec:90},
  {id:'chinup',     name:'Klimmzüge (Untergriff)', cat:'Klimmzug', equip:['klimmzug'],
   color:'#4A2A7A', grad:'linear-gradient(135deg,#0e0818,#160c22)',
   desc:'Untergriff, Hände schulterbreit. Stärker auf Bizeps fokussiert als normaler Klimmzug.',
   muscles:['Bizeps','Latissimus'], sets:'3 Sätze', reps:'max.', workSec:45, restSec:90},
  {id:'hangleg',    name:'Hanging Leg Raise',  cat:'Klimmzug', equip:['klimmzug'],
   color:'#3A2A6A', grad:'linear-gradient(135deg,#0c0818,#12101e)',
   desc:'An der Stange hängen. Beine gestreckt bis zur Horizontalen heben, kontrolliert senken.',
   muscles:['Bauch','Hüftbeuger'], sets:'3 Sätze', reps:'10', workSec:40, restSec:60},
  // ─ Hanteln ─
  {id:'dbcurl',     name:'Hantel Curl',        cat:'Hanteln', equip:['hanteln','langhantel'],
   color:'#4A6A8A', grad:'linear-gradient(135deg,#0c1820,#101e2c)',
   desc:'Oberarme am Körper fixiert. Hantel bis zur Schulter heben, kontrolliert senken.',
   muscles:['Bizeps','Unterarm'], sets:'3 Sätze', reps:'12', workSec:40, restSec:60},
  {id:'dbpress',    name:'Hantel Schulterdrücken', cat:'Hanteln', equip:['hanteln','langhantel'],
   color:'#3A5A8A', grad:'linear-gradient(135deg,#0a1620,#0e1e2c)',
   desc:'Sitzen oder stehen. Hanteln auf Schulterhöhe, nach oben drücken bis Arme fast gestreckt.',
   muscles:['Schultern','Trizeps'], sets:'3 Sätze', reps:'10–12', workSec:40, restSec:60},
  {id:'dbrow',      name:'Hantel Row',         cat:'Hanteln', equip:['hanteln','langhantel'],
   color:'#3A5A7A', grad:'linear-gradient(135deg,#0a1620,#0e1e2c)',
   desc:'Oberkörper 45° vorgebeugt, Hanteln hängen. Schulterblätter zusammenziehen, zur Hüfte ziehen.',
   muscles:['Rücken','Bizeps'], sets:'3 Sätze', reps:'12', workSec:45, restSec:60},
  {id:'dblunge',    name:'Hantel Ausfallschritt', cat:'Hanteln', equip:['hanteln'],
   color:'#1A7A60', grad:'linear-gradient(135deg,#04180e,#072618)',
   desc:'Hanteln in den Händen halten für zusätzliches Gewicht beim Ausfallschritt.',
   muscles:['Quadrizeps','Gesäß'], sets:'3 Sätze', reps:'10/Seite', workSec:50, restSec:60},
  // ─ Kettlebell ─
  {id:'kbswing',    name:'Kettlebell Swing',   cat:'Kettlebell', equip:['kettlebell'],
   color:'#8A4A00', grad:'linear-gradient(135deg,#1a0c00,#2a1200)',
   desc:'Füße schulterbreit, KB zwischen Beinen. Mit Hüften schwingen, nicht Armen heben. Explosiv bis Schulterhöhe.',
   muscles:['Gesäß','Rücken','Schultern','Core'], sets:'4 Sätze', reps:'15', workSec:50, restSec:60},
  {id:'kbgoblet',   name:'Goblet Squat',       cat:'Kettlebell', equip:['kettlebell'],
   color:'#7A3A00', grad:'linear-gradient(135deg,#160a00,#241000)',
   desc:'KB mit beiden Händen vor der Brust halten. Tiefe Kniebeuge. Aufrechter Rücken durch Gegengewicht.',
   muscles:['Quadrizeps','Gesäß','Core'], sets:'4 Sätze', reps:'12', workSec:50, restSec:60},
  {id:'kbpress',    name:'Kettlebell Press',   cat:'Kettlebell', equip:['kettlebell'],
   color:'#6A3A00', grad:'linear-gradient(135deg,#120800,#1e0e00)',
   desc:'KB auf Schulter (Rack-Position). Einarmig nach oben drücken. Core aktiv für Stabilität.',
   muscles:['Schultern','Trizeps','Core'], sets:'3 Sätze', reps:'8/Seite', workSec:45, restSec:60},
  // ─ Widerstandsband ─
  {id:'bandrow',    name:'Band Row',           cat:'Band', equip:['band'],
   color:'#6A4A20', grad:'linear-gradient(135deg,#161008,#201610)',
   desc:'Band um Türgriff. Beide Enden halten, zurücktreten. Ellbogen nach hinten ziehen.',
   muscles:['Rücken','Bizeps'], sets:'3 Sätze', reps:'15', workSec:40, restSec:60},
  {id:'bandpress',  name:'Band Chest Press',   cat:'Band', equip:['band'],
   color:'#5A3A10', grad:'linear-gradient(135deg,#120c04,#1a1008)',
   desc:'Band hinter dem Rücken, Enden nach vorne drücken. Brust und Trizeps ohne Boden.',
   muscles:['Brust','Trizeps'], sets:'3 Sätze', reps:'15', workSec:40, restSec:60},
  {id:'bandcurl',   name:'Band Curl',          cat:'Band', equip:['band'],
   color:'#4A6A8A', grad:'linear-gradient(135deg,#0c1820,#101e2c)',
   desc:'Band unter Füßen, Enden halten. Arme beugen wie beim Hanteln-Curl.',
   muscles:['Bizeps'], sets:'3 Sätze', reps:'15', workSec:40, restSec:60},
  {id:'bandglute',  name:'Band Hip Thrust',    cat:'Band', equip:['band'],
   color:'#207A55', grad:'linear-gradient(135deg,#062016,#0a2e1e)',
   desc:'Rückenlage, Band über Hüften. Hüfte heben gegen den Widerstand des Bands.',
   muscles:['Gesäß','Hintere Oberschenkel'], sets:'4 Sätze', reps:'15', workSec:50, restSec:60},
  // ─ TRX / Ringe ─
  {id:'trxrow',     name:'TRX Row',            cat:'TRX', equip:['trx'],
   color:'#4A6A6A', grad:'linear-gradient(135deg,#0c1818,#101e1e)',
   desc:'Körper schräg nach hinten lehnen, Griffen halten. Brust zu den Griffen ziehen. Winkel bestimmt Schwierigkeit.',
   muscles:['Rücken','Bizeps','Core'], sets:'3 Sätze', reps:'12', workSec:45, restSec:60},
  {id:'trxpush',    name:'TRX Push-up',        cat:'TRX', equip:['trx'],
   color:'#3A5A6A', grad:'linear-gradient(135deg,#0a1620,#0e1e28)',
   desc:'Griffe in Hüfthöhe, Körper schräg nach vorne. Liegestütz-Bewegung. Instabilität trainiert Core extra.',
   muscles:['Brust','Trizeps','Core'], sets:'3 Sätze', reps:'12', workSec:45, restSec:60},
  // ─ Springseil ─
  {id:'rope',       name:'Seilspringen',       cat:'Cardio', equip:['springseil'],
   color:'#c05020', grad:'linear-gradient(135deg,#1e0800,#2e1000)',
   desc:'Gleichmäßig springen, Handgelenke drehen das Seil. Nicht die Schultern. Beide Füße oder abwechselnd.',
   muscles:['Waden','Schultern','Ausdauer'], sets:'4 Runden', reps:'45 Sek.', workSec:45, restSec:30},
  // ─ Medizinball ─
  {id:'mbslam',     name:'Medicine Ball Slam', cat:'Hanteln', equip:['medball'],
   color:'#8A2A00', grad:'linear-gradient(135deg,#1c0800,#2c1000)',
   desc:'Ball über den Kopf heben, explosiv auf den Boden schmettern. Aufheben und wiederholen.',
   muscles:['Core','Schultern','Rücken'], sets:'3 Sätze', reps:'10', workSec:40, restSec:60},
  // ─ Cardio ─
  {id:'jj',         name:'Jumping Jacks',      cat:'Cardio', equip:[],
   color:'#c05020', grad:'linear-gradient(135deg,#1e0800,#2e1000)',
   desc:'Beine spreizen und Arme über Kopf, zurück. Klassisches Aufwärmen, Puls steigt schnell.',
   muscles:['Ganzkörper','Ausdauer'], sets:'4 Runden', reps:'40 Sek.', workSec:40, restSec:20},
  {id:'burpee',     name:'Burpees',            cat:'Cardio', equip:[],
   color:'#b04010', grad:'linear-gradient(135deg,#180600,#260c00)',
   desc:'Stand → Boden → Liegestütz → zurück → Sprung. Anstrengendste Übung – maximale Wirkung.',
   muscles:['Ganzkörper'], sets:'4 Runden', reps:'40 Sek.', workSec:40, restSec:20},
  {id:'mountain',   name:'Mountain Climbers',  cat:'Cardio', equip:[],
   color:'#c05020', grad:'linear-gradient(135deg,#1e0800,#2e1000)',
   desc:'Liegestützposition, Knie abwechselnd schnell zur Brust. Hüfte unten halten.',
   muscles:['Core','Schultern','Ausdauer'], sets:'4 Runden', reps:'40 Sek.', workSec:40, restSec:20},
  {id:'highknee',   name:'High Knees',         cat:'Cardio', equip:[],
   color:'#b84828', grad:'linear-gradient(135deg,#1a0600,#280c00)',
   desc:'Auf der Stelle laufen, Knie mindestens Hüfthöhe heben. Arme mitschwingen.',
   muscles:['Hüftbeuger','Ausdauer'], sets:'4 Runden', reps:'40 Sek.', workSec:40, restSec:20},
  {id:'jsquat',     name:'Jump Squats',        cat:'Cardio', equip:[],
   color:'#c84830', grad:'linear-gradient(135deg,#200800,#300e00)',
   desc:'Tiefe Kniebeuge, explosiv springen, weich landen, direkt wieder in Kniebeuge.',
   muscles:['Quadrizeps','Gesäß','Ausdauer'], sets:'4 Runden', reps:'40 Sek.', workSec:40, restSec:20},
  {id:'skater',     name:'Skater Jumps',       cat:'Cardio', equip:[],
   color:'#a83820', grad:'linear-gradient(135deg,#180600,#220a00)',
   desc:'Seitliche Sprünge von einem Bein aufs andere. Kurz auf Standbein balancieren.',
   muscles:['Beine','Gleichgewicht'], sets:'4 Runden', reps:'40 Sek.', workSec:40, restSec:20},
  // ─ Gewichtsweste ─
  {id:'vestpush',   name:'Liegestütz mit Weste',       cat:'Gewichtsweste',  equip:['gewichtsweste'],
   color:'#5A4A2A', grad:'linear-gradient(135deg,#140e08,#201a0c)',
   desc:'Normale Push-ups mit Gewichtsweste. Zusatzwiderstand erhöht Intensität stark. Für Fortgeschrittene.',
   muscles:['Brust','Trizeps','Schultern'], sets:'4 Sätze', reps:'10–12', workSec:45, restSec:75},
  {id:'vestsquat',  name:'Kniebeugen mit Weste',       cat:'Gewichtsweste',  equip:['gewichtsweste'],
   color:'#4A3A1A', grad:'linear-gradient(135deg,#100c06,#1c1408)',
   desc:'Kniebeugen mit angelegter Gewichtsweste. Beine und Gesäß intensiver ohne Hantelstange.',
   muscles:['Quadrizeps','Gesäß','Core'], sets:'4 Sätze', reps:'15', workSec:50, restSec:75},
  {id:'vestpullup', name:'Klimmzüge mit Weste',        cat:'Gewichtsweste',  equip:['gewichtsweste','klimmzug'],
   color:'#5A3A6A', grad:'linear-gradient(135deg,#120c1e,#1c1028)',
   desc:'Klimmzüge mit Gewichtsweste — maximale Oberkörper-Intensität. Nur für Fortgeschrittene.',
   muscles:['Latissimus','Bizeps','Core'], sets:'3 Sätze', reps:'6–8', workSec:40, restSec:120},
  // ─ Langhantel / Rack ─
  {id:'bbsquat',    name:'Langhantel Kniebeuge',       cat:'Langhantel',     equip:['langhantel','rack'],
   color:'#3A5A2A', grad:'linear-gradient(135deg,#0c140a,#121e0e)',
   desc:'Langhantel auf Schultern, Füße schulterbreit. Tief in Hocke, Rücken gerade. Königsdisziplin für Beine.',
   muscles:['Quadrizeps','Gesäß','Rücken','Core'], sets:'4 Sätze', reps:'8–10', workSec:60, restSec:120},
  {id:'bbdeadlift', name:'Kreuzheben',                 cat:'Langhantel',     equip:['langhantel'],
   color:'#2A4A1A', grad:'linear-gradient(135deg,#080e06,#0e180a)',
   desc:'Füße hüftbreit, Hantel vor Unterschenkeln. Rücken gerade, Hüfte schiebt nach vorne. Ganzkörper.',
   muscles:['Rücken','Gesäß','Hintere Oberschenkel','Core'], sets:'4 Sätze', reps:'6–8', workSec:60, restSec:120},
  {id:'bbbench',    name:'Bankdrücken',                cat:'Langhantel',     equip:['langhantel','schraebank'],
   color:'#1A3A5A', grad:'linear-gradient(135deg,#060c14,#0a1220)',
   desc:'Flach auf Bank, Hantel auf Brusthöhe. Schulterbreit greifen, kontrolliert senken, explosiv drücken.',
   muscles:['Brust','Trizeps','Schultern'], sets:'4 Sätze', reps:'8–10', workSec:55, restSec:120},
  {id:'bbrow',      name:'Langhantel Rudern',          cat:'Langhantel',     equip:['langhantel'],
   color:'#2A3A5A', grad:'linear-gradient(135deg,#080c14,#0c121e)',
   desc:'Rumpf 45° vorgebeugt, Hantel hängt. Schulterblätter zusammenziehen, Hantel zur Hüfte.',
   muscles:['Rücken','Bizeps','Schultern'], sets:'4 Sätze', reps:'8–10', workSec:55, restSec:90},
  {id:'bbohp',      name:'Schulterdrücken (Barbell)',  cat:'Langhantel',     equip:['langhantel'],
   color:'#2A2A5A', grad:'linear-gradient(135deg,#080814,#0c0c1e)',
   desc:'Im Stehen, Langhantel von Schultern über den Kopf drücken. Core aktiv für Stabilität.',
   muscles:['Schultern','Trizeps','Core'], sets:'4 Sätze', reps:'8–10', workSec:55, restSec:90},
  // ─ Schrägbank ─
  {id:'inclinepush',name:'Schrägbank Push-up',         cat:'Schrägbank',     equip:['schraebank'],
   color:'#1E4A6A', grad:'linear-gradient(135deg,#081828,#0c2038)',
   desc:'Hände auf geneigter Bank, Füße am Boden. Obere Brust stärker betont.',
   muscles:['Obere Brust','Schultern','Trizeps'], sets:'3 Sätze', reps:'12', workSec:40, restSec:60},
  {id:'declinepush',name:'Decline Push-up',            cat:'Schrägbank',     equip:['schraebank'],
   color:'#1E3A5A', grad:'linear-gradient(135deg,#060e14,#0a1420)',
   desc:'Füße hochgestellt auf Bank, Hände am Boden. Untere Brust und Schultern intensiver.',
   muscles:['Untere Brust','Schultern','Trizeps'], sets:'3 Sätze', reps:'12', workSec:40, restSec:60},
  {id:'dbincline',  name:'Schrägbank Hanteldrücken',   cat:'Schrägbank',     equip:['schraebank','hanteln'],
   color:'#1A3A6A', grad:'linear-gradient(135deg,#080c1e,#0c1228)',
   desc:'Auf geneigter Bank, Hanteln auf Schulterhöhe, nach oben drücken. Obere Brust betont.',
   muscles:['Obere Brust','Schultern','Trizeps'], sets:'3 Sätze', reps:'10–12', workSec:45, restSec:90},
  // ─ Kabelzug ─
  {id:'cablerow',   name:'Kabelzug Rudern',            cat:'Kabelzug',       equip:['kabelzug'],
   color:'#2A4A4A', grad:'linear-gradient(135deg,#080e0e,#0c1616)',
   desc:'Sitzen oder stehen, Griff zur Hüfte ziehen, Schulterblätter zusammenführen.',
   muscles:['Rücken','Bizeps'], sets:'4 Sätze', reps:'12–15', workSec:45, restSec:60},
  {id:'cablepress', name:'Kabelzug Brustdrücken',      cat:'Kabelzug',       equip:['kabelzug'],
   color:'#1A3A4A', grad:'linear-gradient(135deg,#060c10,#0a1418)',
   desc:'Kabel auf Brusthöhe, Griffe nach vorne und zur Mitte zusammendrücken.',
   muscles:['Brust','Trizeps'], sets:'3 Sätze', reps:'15', workSec:40, restSec:60},
  {id:'cablecurl',  name:'Kabelzug Curl',              cat:'Kabelzug',       equip:['kabelzug'],
   color:'#2A3A5A', grad:'linear-gradient(135deg,#080c14,#0c1020)',
   desc:'Seilzug von unten, Arme beugen. Konstante Spannung durch den gesamten Bewegungsraum.',
   muscles:['Bizeps','Unterarm'], sets:'3 Sätze', reps:'15', workSec:40, restSec:60},
  {id:'cabletri',   name:'Kabelzug Trizeps',           cat:'Kabelzug',       equip:['kabelzug'],
   color:'#3A2A5A', grad:'linear-gradient(135deg,#0c0814,#14101e)',
   desc:'Kabel von oben, Strick-Aufsatz. Arme nach unten strecken, Ellbogen am Körper fixiert.',
   muscles:['Trizeps'], sets:'3 Sätze', reps:'15', workSec:40, restSec:60},
  // ─ Ergometer ─
  {id:'ergosprint', name:'Ergometer Sprint (Tabata)',   cat:'Cardio-Geräte', equip:['ergometer'],
   color:'#8A2A00', grad:'linear-gradient(135deg,#1c0800,#2e1000)',
   desc:'20 Sek. maximales Tempo, 10 Sek. Erholung — Tabata-Protokoll. Effektivstes Intervall-Cardio.',
   muscles:['Beine','Herz-Kreislauf'], sets:'8 Runden', reps:'20 Sek.', workSec:20, restSec:10},
  {id:'ergolane',   name:'Ergometer Ausdauer',          cat:'Cardio-Geräte', equip:['ergometer'],
   color:'#7A2000', grad:'linear-gradient(135deg,#180600,#260e00)',
   desc:'Gleichmäßiges Tempo bei 70–75% der max. Herzfrequenz. Optimale Fettverbrennung.',
   muscles:['Beine','Ausdauer'], sets:'1 ×', reps:'20 Min.', workSec:1200, restSec:0},
  // ─ Laufband ─
  {id:'treadwalk',  name:'Laufband Steigungsgehen',     cat:'Cardio-Geräte', equip:['laufband'],
   color:'#6A2A00', grad:'linear-gradient(135deg,#140800,#1e0e00)',
   desc:'Steigung 10–15%, Tempo 5–6 km/h. Intensives Cardio ohne hohe Gelenkbelastung.',
   muscles:['Gesäß','Waden','Ausdauer'], sets:'1 ×', reps:'20 Min.', workSec:1200, restSec:0},
  {id:'treadrun',   name:'Laufband Intervall',           cat:'Cardio-Geräte', equip:['laufband'],
   color:'#5A2000', grad:'linear-gradient(135deg,#100600,#180c00)',
   desc:'1 Min. schnelles Laufen, 1 Min. Gehen. 20 Min. lang. Effektives Fettverbrenner-Protokoll.',
   muscles:['Beine','Herz-Kreislauf'], sets:'10 Runden', reps:'1 Min.', workSec:60, restSec:60},
  // ─ Rudergerät ─
  {id:'rowsteady',  name:'Rudern Ausdauer',              cat:'Cardio-Geräte', equip:['ruder'],
   color:'#1A3A5A', grad:'linear-gradient(135deg,#060c14,#0a1220)',
   desc:'Gleichmäßiges Rudertempo. Ganzkörper-Ausdauer, sehr gelenkschonend.',
   muscles:['Rücken','Beine','Arme','Ausdauer'], sets:'1 ×', reps:'15 Min.', workSec:900, restSec:0},
  {id:'rowsprint',  name:'Rudern Sprint-Intervall',      cat:'Cardio-Geräte', equip:['ruder'],
   color:'#0A2A4A', grad:'linear-gradient(135deg,#040810,#08101a)',
   desc:'500m so schnell wie möglich, 1 Min. Pause. Extrem effektives Kraft-Ausdauer-Training.',
   muscles:['Ganzkörper','Kraft & Ausdauer'], sets:'5 Runden', reps:'500m', workSec:120, restSec:60},
  // ─ Boxsack ─
  {id:'boxcombo',   name:'Box-Kombination',              cat:'Boxsack',        equip:['boxsack'],
   color:'#8A1A1A', grad:'linear-gradient(135deg,#1c0606,#2e0a0a)',
   desc:'Jab–Cross–Haken. 30 Sek. maximales Tempo, 15 Sek. Pause. Cardio und Koordination.',
   muscles:['Schultern','Core','Ausdauer'], sets:'6 Runden', reps:'30 Sek.', workSec:30, restSec:15},
  {id:'boxpower',   name:'Power Shots',                  cat:'Boxsack',        equip:['boxsack'],
   color:'#7A1010', grad:'linear-gradient(135deg,#180404,#220808)',
   desc:'Maximalkraft-Schläge mit voller Hüftrotation. 10 Schläge mit kurzer Pause.',
   muscles:['Schultern','Core','Brust'], sets:'4 Runden', reps:'10 Schläge', workSec:30, restSec:30},
  // ─ Dehnen ─
  {id:'cobra',      name:'Cobra Stretch',      cat:'Dehnen', equip:[],
   color:'#4A3A6A', grad:'linear-gradient(135deg,#10091a,#160d22)',
   desc:'Bauchlage, Hände neben Schultern, Oberkörper hochdrücken, Hüfte am Boden.',
   muscles:['Bauch','Rücken'], sets:'3 ×', reps:'30 Sek.', workSec:30, restSec:15},
  {id:'hipstretch', name:'Hüftstretch',        cat:'Dehnen', equip:[],
   color:'#3A2A5A', grad:'linear-gradient(135deg,#0c0818,#12101e)',
   desc:'Ausfallschritt, hinteres Knie am Boden. Hüfte nach vorne schieben. Dehnt Hüftbeuger.',
   muscles:['Hüftbeuger','Oberschenkel'], sets:'2 ×', reps:'30 Sek./Seite', workSec:30, restSec:10},
  {id:'foamroll',   name:'Foam Rolling',       cat:'Regeneration', equip:['foam'],
   color:'#3A4A5A', grad:'linear-gradient(135deg,#0c1018,#101a20)',
   desc:'Langsam über Muskeln rollen, bei druckschmerzhaften Stellen 10–20 Sek. verweilen.',
   muscles:['Ganzkörper (Faszien)'], sets:'1 ×', reps:'2 Min.', workSec:120, restSec:0},
];

const exById = id => EX.find(e => e.id === id);

/* ── 4. WORKOUT TEMPLATES ── */
const WORKOUTS = [
  { id:'kraftA',    name:'Kraft A',         sub:'Oberkörper & Core',       heroClass:'sh-blue',   cardClass:'bg-blue',   calories:200, tag:'KRAFT',
    exercises:['pushup','pikepush','dips','plank','hollow','superman'],
    basketballCompat: true },
  { id:'kraftB',    name:'Kraft B',         sub:'Unterkörper & Gesäß',     heroClass:'sh-green',  cardClass:'bg-green',  calories:220, tag:'KRAFT',
    exercises:['squat','lunge','glute','wallsit','donkey','calf'],
    basketballCompat: false },  // avoid after basketball (leg fatigue)
  { id:'circuit',   name:'Circuit',         sub:'Cardio & Ganzkörper',     heroClass:'sh-orange', cardClass:'bg-orange', calories:280, tag:'CARDIO',
    exercises:['jj','burpee','mountain','highknee','jsquat','skater'],
    basketballCompat: false },
  { id:'bball',     name:'Basketball Athletik', sub:'Explosivkraft & Sprung', heroClass:'sh-orange', cardClass:'bg-orange', calories:260, tag:'ATHLETIK',
    exercises:['jsquat','lunge','calf','plank','sidepl','highknee'],
    basketballCompat: true },
  { id:'mobility',  name:'Mobility & Recovery', sub:'Dehnen & Regeneration', heroClass:'sh-green',  cardClass:'bg-green',  calories:80,  tag:'RECOVERY',
    exercises:['cobra','hipstretch','foamroll','sidepl','hollow'],
    basketballCompat: true },   // perfect after basketball
];

const dayShort = ['So','Mo','Di','Mi','Do','Fr','Sa'];
const dayFull  = ['Sonntag','Montag','Dienstag','Mittwoch','Donnerstag','Freitag','Samstag'];

/* ── 5. FLEXIBLE SCHEDULING HELPERS ── */

// Current week number (rolling, no end)
const currentWeekNum = () => {
  const start = S.done.length>0
    ? new Date(S.done[0].date||new Date())
    : new Date();
  return Math.floor((Date.now() - start.getTime()) / 86400000 / 7) + 1;
};

// Days until target date
const daysToTarget = () => {
  if(!S.targetDate) return null;
  const diff = Math.ceil((new Date(S.targetDate) - new Date()) / 86400000);
  return Math.max(0, diff);
};

// Is today a basketball day?
const isBballDay = () => S.basketballDays.includes(dayShort[new Date().getDay()]);

// Is coach season active? (Oct=9 to May=4)
const isCoachSeason = () => {
  const m = new Date().getMonth();
  return m >= 9 || m <= 4;
};

// Smart workout suggestion for today
const suggestWorkout = () => {
  const recent = (S.lastWorkouts||[]).slice(-3).map(w=>w.wid);
  const bball   = isBballDay();
  const legsTired = recent.some(w=>w==='kraftB'||w==='circuit');
  const armsTired = recent.some(w=>w==='kraftA');
  const hadMobility = recent.some(w=>w==='mobility');

  if(bball) {
    // Basketball day → short mobility or upper body only
    if(!armsTired) return {wid:'kraftA', reason:'🏀 Basketball-Tag — Oberkörper passt gut'};
    return {wid:'mobility', reason:'🏀 Basketball-Tag — Mobility & Recovery empfohlen'};
  }
  // After basketball yesterday
  const yesterday = dayShort[(new Date().getDay()+6)%7];
  const bbYesterday = S.basketballDays.includes(yesterday);
  if(bbYesterday && !hadMobility) return {wid:'mobility', reason:'🏀 Nach Basketball — Regeneration empfohlen'};

  // Normal rotation
  if(!armsTired) return {wid:'kraftA', reason:'💪 Oberkörper ist bereit'};
  if(!legsTired) return {wid:'kraftB', reason:'🦵 Beine als nächstes dran'};
  return {wid:'bball', reason:'🏀 Basketball Athletik — Explosivkraft'};
};

// Weekly load: gym sessions this week
const weeklyGymLoad = () => {
  const monday = new Date();
  monday.setDate(monday.getDate() - ((monday.getDay()+6)%7));
  monday.setHours(0,0,0,0);
  return (S.done||[]).filter(d => new Date(d.date||d) >= monday).length;
};

// Total weekly load including basketball
const weeklyTotalLoad = () => {
  const gym = weeklyGymLoad();
  // Estimate basketball days this week that already passed
  const todayIdx = new Date().getDay();
  const bbThisWeek = S.basketballDays.filter(d=>{
    const di = dayShort.indexOf(d);
    return di>0 && di<=todayIdx; // Mon–today
  }).length;
  return gym + bbThisWeek;
};

/* ── 6. LABELS ── */
const GOAL_LBL   = {strand:'Strand-Figur',abnehmen:'Abnehmen',muskel:'Muskelaufbau',ausdauer:'Ausdauer',koerper:'Körperhaltung',allgemein:'Allgemeine Fitness'};
const LEVEL_LBL  = {anfaenger:'Anfänger',mittel:'Mittelfortgeschritten',fortgeschritten:'Fortgeschritten'};
const EQUIP_LBL  = {
  // Bodyweight / Basics
  keine:'Bodyweight',matte:'Gymnastikmatte',stuhl:'Stuhl / Bank',step:'Step / Plattform',
  yogablock:'Yogablock',foam:'Foam Roller',liegestuetz:'Liegestützgriffe',
  // Freie Gewichte
  hanteln:'Kurzhanteln',langhantel:'Langhantel',kettlebell:'Kettlebell',
  sandsack:'Sandsack',medball:'Medizinball',gewichtsweste:'Gewichtsweste',
  // Stangen & Racks
  klimmzug:'Klimmzugstange',dip:'Dip-Stange / -Griffe',rack:'Barbell Rack / Power Rack',schraebank:'Schrägbank / Flachbank',
  // Kabel & Maschinen
  kabelzug:'Kabelzug / Kabelturm',
  // Bänder & Schlingen
  band:'Widerstandsband',trx:'TRX / Ringe / Schlingentrainer',
  // Cardio-Geräte
  springseil:'Springseil',ergometer:'Ergometer / Spinning-Bike',laufband:'Laufband',ruder:'Rudergerät',
  // Sonstiges
  boxsack:'Boxsack / Boxhandschuhe',bosuball:'Bosu-Ball',
};

// Dynamic label lookup — includes user-defined custom equipment
const equipLabel = (id) => {
  if(EQUIP_LBL[id]) return EQUIP_LBL[id];
  const custom = (S.customEquipment||[]).find(c=>c.id===id);
  return custom ? custom.label : id;
};

const ACHIEVEMENTS = [
  {id:'first',    icon:'🎯', name:'Erstes\nWorkout',       check: s=>s.done.length>=1},
  {id:'s5',       icon:'🔥', name:'5 Workouts',             check: s=>s.done.length>=5},
  {id:'s10',      icon:'💯', name:'10 Workouts',            check: s=>s.done.length>=10},
  {id:'s25',      icon:'⚡', name:'25 Workouts',            check: s=>s.done.length>=25},
  {id:'s50',      icon:'🏆', name:'50 Workouts',            check: s=>s.done.length>=50},
  {id:'bball',    icon:'🏀', name:'Basketball\nAthlet',    check: s=>s.done.filter(d=>(d.wid||d)==='bball').length>=5},
  {id:'mobility', icon:'🧘', name:'Recovery\nKönig',       check: s=>s.done.filter(d=>(d.wid||d)==='mobility').length>=5},
  {id:'month',    icon:'📅', name:'1 Monat\ndabei!',       check: s=>s.done.length>=12},
  {id:'streak7',  icon:'🌟', name:'7-Tage\nStreak',        check: s=>{
    // check 7 consecutive days with at least one workout
    const dates = s.done.map(d=>d.date||d).sort();
    if(dates.length<7) return false;
    for(let i=dates.length-1;i>=6;i--){
      let streak=1;
      for(let j=i-1;j>=0&&streak<7;j--){
        const diff=(new Date(dates[i-streak+1])-new Date(dates[i-streak]))/86400000;
        if(diff<=1) streak++; else break;
      }
      if(streak>=7) return true;
    }
    return false;
  }},
];

/* ════════════════════════════════════════════
   NAVIGATION
════════════════════════════════════════════ */
const mainScreens = ['home','ai','exercises','metrics','profile'];

function showScreen(sc) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById('screen-'+sc)?.classList.add('active');
  document.querySelectorAll('.nb').forEach(b =>
    b.classList.toggle('active', b.dataset.sc === sc));
  if(sc==='home')      renderHome();
  if(sc==='ai')        renderAIPage();
  if(sc==='exercises') renderExList();
  if(sc==='metrics')   renderMetrics();
  if(sc==='profile')   renderProfile();
}

document.querySelectorAll('.nb').forEach(btn =>
  btn.addEventListener('click', () => showScreen(btn.dataset.sc)));

/* ════════════════════════════════════════════
   ONBOARDING
════════════════════════════════════════════ */
const OB_COUNT = 9;
let obStep = 0;

function obRender() {
  document.getElementById('ob-slides').style.transform = `translateX(-${obStep*100}%)`;
  document.getElementById('ob-dots').innerHTML =
    Array.from({length:OB_COUNT},(_,i)=>`<div class="sdot${i===obStep?' active':''}"></div>`).join('');
  document.getElementById('ob-back').style.visibility = obStep > 0 ? 'visible' : 'hidden';
  const btn = document.getElementById('ob-next');
  btn.textContent = obStep === OB_COUNT-1 ? 'Loslegen!' : 'Weiter';
  obValidate();
}

function obValidate() {
  const btn = document.getElementById('ob-next');
  let ok = true;
  if(obStep===1 && !S.goal)     ok = false;
  if(obStep===2 && !S.level)    ok = false;
  if(obStep===5 && !S.duration) ok = false;
  btn.disabled = !ok;
}

/* Single-select */
function singleChips(id, key) {
  document.getElementById(id)?.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      document.getElementById(id).querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));
      c.classList.add('sel'); S[key]=c.dataset.v; save(); obValidate();
    });
  });
}
/* Multi-select */
function multiChips(id, key) {
  document.getElementById(id)?.querySelectorAll('.chip').forEach(c => {
    c.addEventListener('click', () => {
      c.classList.toggle('sel');
      S[key]=[...document.getElementById(id).querySelectorAll('.chip.sel')].map(x=>x.dataset.v);
      save();
    });
  });
}
function initLevelCards() {
  document.getElementById('level-cards')?.querySelectorAll('.lcard').forEach(c => {
    c.addEventListener('click', () => {
      document.getElementById('level-cards').querySelectorAll('.lcard').forEach(x=>x.classList.remove('sel'));
      c.classList.add('sel'); S.level=c.dataset.v; save(); obValidate();
    });
  });
}
function initDurBtns() {
  document.getElementById('dur-btns')?.querySelectorAll('.dur-btn').forEach(c => {
    c.addEventListener('click', () => {
      document.getElementById('dur-btns').querySelectorAll('.dur-btn').forEach(x=>x.classList.remove('sel'));
      c.classList.add('sel'); S.duration=parseInt(c.dataset.v); save(); obValidate();
    });
  });
}

singleChips('goal-chips','goal');
singleChips('gender-chips','gender');
multiChips('exclude-chips','exclude');
initLevelCards(); initDurBtns();

// Equipment: collect from ALL chip-grids inside the equipment ob-slide (not just #equip-chips)
function initOBEquipment() {
  const slide = document.getElementById('equip-chips')?.closest('.ob-slide');
  if(!slide) return;
  slide.querySelectorAll('.chip[data-v]:not([data-custom])').forEach(c => {
    c.addEventListener('click', () => {
      c.classList.toggle('sel');
      const all = [...slide.querySelectorAll('.chip.sel:not([data-custom])')].map(x=>x.dataset.v);
      const customs = (S.customEquipment||[]).map(x=>x.id).filter(id=>S.equipment.includes(id));
      S.equipment = [...new Set([...all,...customs])];
      save();
    });
  });
  // Custom add in onboarding
  document.getElementById('ob-custom-add')?.addEventListener('click', () => {
    const icon = (document.getElementById('ob-custom-icon')?.value||'').trim() || '🔧';
    const name = (document.getElementById('ob-custom-name')?.value||'').trim();
    if(!name) return;
    const id = 'custom_' + Date.now();
    S.customEquipment = S.customEquipment || [];
    S.customEquipment.push({id, label:name, icon});
    S.equipment.push(id); save();
    // Show as chip
    const list = document.getElementById('ob-custom-list');
    const chip = document.createElement('div');
    chip.className = 'chip sel'; chip.dataset.v = id; chip.dataset.custom = '1';
    chip.innerHTML = `${icon} ${name} <span style="opacity:.5;margin-left:4px">×</span>`;
    chip.addEventListener('click', () => {
      S.customEquipment = (S.customEquipment||[]).filter(x=>x.id!==id);
      S.equipment = S.equipment.filter(e=>e!==id); save(); chip.remove();
    });
    list?.appendChild(chip);
    document.getElementById('ob-custom-icon').value='';
    document.getElementById('ob-custom-name').value='';
  });
}
initOBEquipment();

// Basketball days
multiChips('bball-chips','basketballDays');

// Target date in onboarding — collect on finish
const obCollectTarget = () => {
  const label = document.getElementById('ob-tgt-label')?.value.trim();
  const date  = document.getElementById('ob-tgt-date')?.value;
  if(label) S.targetLabel = label;
  if(date)  S.targetDate  = date;
};
// Hook into finishOnboard
const _origFinish = finishOnboard;

document.getElementById('ob-next').addEventListener('click', () => {
  if(obStep < OB_COUNT-1) { obStep++; obRender(); }
  else finishOnboard();
});
document.getElementById('ob-back').addEventListener('click', () => {
  if(obStep > 0) { obStep--; obRender(); }
});

// Collect optional fields on step 6
function collectOBMetrics() {
  const h = parseFloat(document.getElementById('ob-height')?.value);
  const w = parseFloat(document.getElementById('ob-weight')?.value);
  const a = parseInt(document.getElementById('ob-age')?.value);
  if(h) S.height = h;
  if(w) S.weight = w;
  if(a) S.age    = a;
  if((h||w||a) && !(S.metrics||[]).length) {
    S.metrics = S.metrics || [];
    const entry = { date: new Date().toISOString().split('T')[0] };
    if(w) entry.weight = w;
    S.metrics.push(entry);
  }
}

function finishOnboard() {
  collectOBMetrics();
  // Collect target date
  const tgtLabel = document.getElementById('ob-tgt-label')?.value.trim();
  const tgtDate  = document.getElementById('ob-tgt-date')?.value;
  if(tgtLabel) S.targetLabel = tgtLabel;
  if(tgtDate)  S.targetDate  = tgtDate;
  S.onboarded = true; save();
  document.getElementById('screen-onboard').classList.remove('active');
  document.getElementById('main-nav').style.display = 'flex';
  showScreen('home');
}

obRender();
if(S.onboarded) {
  document.getElementById('screen-onboard').classList.remove('active');
  document.getElementById('main-nav').style.display = 'flex';
  showScreen('home');
}

/* ════════════════════════════════════════════
   HOME
════════════════════════════════════════════ */
function renderHome() {
  const todayIdx = new Date().getDay();
  const bball    = isBballDay();
  const gym      = weeklyGymLoad();
  const total    = weeklyTotalLoad();
  const suggest  = suggestWorkout();
  const dtarget  = daysToTarget();

  // Header
  document.getElementById('hdr-wk').textContent = bball ? '🏀 BASKETBALL' : 'HEUTE TRAINIEREN';

  // Streak row
  document.getElementById('streak-val').textContent = `${S.done.length} Workouts`;
  document.getElementById('streak-sub').textContent = S.done.length > 0
    ? `Diese Woche: ${gym} Gym-Session${gym!==1?'s':''} + ${weeklyTotalLoad()-gym} Basketball`
    : 'Starte heute deinen ersten Workout!';

  // Target date banner
  const wrap = document.getElementById('today-wrap');
  let targetBanner = '';
  if(dtarget !== null) {
    const col = dtarget < 14 ? 'var(--red)' : dtarget < 30 ? 'var(--gold)' : 'var(--blue)';
    targetBanner = `<div style="margin:0 16px 12px;padding:12px 16px;background:var(--card);border:1px solid var(--border);border-radius:14px;display:flex;align-items:center;gap:10px">
      <div style="font-size:22px">🎯</div>
      <div>
        <div style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:1px">${S.targetLabel||'Zieltermin'}</div>
        <div style="font-family:'Oswald',sans-serif;font-size:18px;font-weight:700;color:${col}">${dtarget === 0 ? 'Heute!' : dtarget + ' Tage noch'}</div>
      </div>
    </div>`;
  }

  // Weekly load bar
  const loadPct = Math.min(100, Math.round(total / (S.weeklyLoadGoal + S.basketballDays.length) * 100));
  const loadColor = loadPct >= 100 ? 'var(--green)' : loadPct >= 60 ? 'var(--gold)' : 'var(--red)';
  const loadBanner = `<div style="margin:0 16px 12px;padding:14px 16px;background:var(--card);border:1px solid var(--border);border-radius:14px">
    <div style="display:flex;justify-content:space-between;margin-bottom:8px">
      <span style="font-size:11px;color:var(--text2);text-transform:uppercase;letter-spacing:1px">Wochenbelastung</span>
      <span style="font-size:11px;font-weight:600;color:${loadColor}">${total} / ${S.weeklyLoadGoal + S.basketballDays.length} Einheiten</span>
    </div>
    <div style="height:5px;background:var(--border);border-radius:3px;overflow:hidden">
      <div style="height:100%;width:${loadPct}%;background:${loadColor};border-radius:3px;transition:width 1s ease"></div>
    </div>
    <div style="display:flex;gap:12px;margin-top:8px">
      <span style="font-size:11px;color:var(--text2)">🏋️ ${gym} Gym</span>
      <span style="font-size:11px;color:var(--text2)">🏀 ${total-gym} Basketball</span>
      ${isCoachSeason()?'<span style="font-size:11px;color:var(--purple)">🎽 Trainer-Saison</span>':''}
    </div>
  </div>`;

  // Today suggestion hero
  const suggW = WORKOUTS.find(x=>x.id===suggest.wid);
  const todayDoneToday = (S.done||[]).some(d=>(d.date||d)===new Date().toISOString().split('T')[0]);
  const heroHTML = `
    <div class="today-hero" id="th">
      <div class="th-body">
        <div class="th-tag">${todayDoneToday?'✓ HEUTE ERLEDIGT':'● EMPFEHLUNG HEUTE'}</div>
        <div class="th-name">${suggW.name}</div>
        <div class="th-sub">${suggest.reason}</div>
        <div class="th-meta">
          <div class="th-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>${S.duration} Min</div>
          <div class="th-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 4v16M18 4v16M3 8h4M17 8h4M3 16h4M17 16h4"/></svg>${suggW.exercises.length} Übungen</div>
          <div class="th-stat"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>~${suggW.calories} kcal</div>
        </div>
      </div>
    </div>
    <button class="start-cta" id="th-cta">
      <svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
      ${todayDoneToday?'Nochmal trainieren':'Jetzt starten'}
    </button>`;

  wrap.innerHTML = targetBanner + loadBanner + heroHTML;
  document.getElementById('th')?.addEventListener('click', ()=>openSheet(suggW, -1));
  document.getElementById('th-cta')?.addEventListener('click', ()=>openSheet(suggW, -1));

  // Week dots — show gym done + basketball days
  const monday = new Date(); monday.setDate(monday.getDate()-((monday.getDay()+6)%7)); monday.setHours(0,0,0,0);
  const doneThisWeek = (S.done||[]).filter(d=>new Date(d.date||d)>=monday);
  const wr = document.getElementById('week-row'); wr.innerHTML='';
  dayShort.forEach((d,i) => {
    const isBball = S.basketballDays.includes(d);
    const dayDate = new Date(monday); dayDate.setDate(monday.getDate()+((i+6)%7));
    const dayStr  = dayDate.toISOString().split('T')[0];
    const gymDone = doneThisWeek.some(x=>(x.date||x)===dayStr);
    const isT     = i === todayIdx;
    const isPast  = dayDate < new Date() && !isT;
    let cls='', label='';
    if(gymDone){ cls='done'; label='✓'; }
    else if(isBball){ cls='today'; label='🏀'; }
    else if(isT){ cls='today'; label=''; }
    else if(isPast&&!isBball){ cls='rest'; label='–'; }
    const el = document.createElement('div'); el.className='wd';
    el.innerHTML=`<div class="wd-l">${d}</div><div class="wd-d ${cls}">${label}</div>`;
    wr.appendChild(el);
  });

  // All workout cards — rolling total
  const allEl = document.getElementById('all-cards'); allEl.innerHTML='';
  WORKOUTS.forEach(w => {
    const doneN = (S.done||[]).filter(d=>(d.wid||d)===w.id).length;
    const div = document.createElement('div');
    div.innerHTML = wcardHTML(w, doneN);
    div.querySelector('.wcard').addEventListener('click', ()=>openSheet(w, -1));
    allEl.appendChild(div);
  });
}

function wcardHTML(w, doneCount=0) {
  const tagColors = {KRAFT:'var(--blue)',CARDIO:'var(--orange)',ATHLETIK:'var(--gold)',RECOVERY:'var(--green)'};
  const tagCol = tagColors[w.tag]||'var(--text2)';
  return `<div class="wcard">
    <div class="wcard-top ${w.cardClass}">
      <div class="wcard-glow"></div>
      <div class="wcard-tag" style="color:white">${w.sub}</div>
      <div class="wcard-nm">${w.name}</div>
    </div>
    <div class="wcard-bot">
      <div class="wcard-st"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>${S.duration} Min</div>
      <div class="wcard-st"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 4v16M18 4v16M3 8h4M17 8h4M3 16h4M17 16h4"/></svg>${w.exercises.length} Üb.</div>
      <div class="wcard-st" style="color:${tagCol};font-weight:600">${w.tag}</div>
      <div class="wcard-st" style="color:var(--text3);margin-left:auto">${doneCount}× gemacht</div>
    </div>
  </div>`;
}

function toggleDone(idx) {
  // Legacy compat — not used in new system
  save(); renderHome();
}

/* ════════════════════════════════════════════
   WORKOUT SHEET + ACTIVE WORKOUT
════════════════════════════════════════════ */
let _cW=null, _cIdx=-1;

function openSheet(w, schedIdx) {
  _cW=w; _cIdx=schedIdx;
  document.getElementById('sh-hero').className='sheet-hero '+w.heroClass;
  document.getElementById('sh-title').textContent=w.name+' — '+w.sub;
  document.getElementById('sh-dur').textContent=S.duration+' Min';
  document.getElementById('sh-ex').textContent=w.exercises.length;
  document.getElementById('sh-kcal').textContent=w.calories;
  document.getElementById('sh-ex-list').innerHTML=w.exercises.map((id,i)=>{
    const ex=exById(id);
    return `<div class="eli">
      <div class="eli-n">${i+1}</div>
      <div class="eli-info">
        <div class="eli-name">${ex.name}</div>
        <div class="eli-detail">${ex.sets} · ${ex.reps}</div>
      </div>
    </div>`;
  }).join('');
  document.getElementById('wo-sheet').classList.add('open');
}
document.getElementById('wo-sheet').addEventListener('click', e=>{
  if(e.target===document.getElementById('wo-sheet'))
    document.getElementById('wo-sheet').classList.remove('open');
});
document.getElementById('sh-start').addEventListener('click',()=>{
  document.getElementById('wo-sheet').classList.remove('open');
  startWorkout();
});

/* Timer */
const CIRC = 490;
let WS={idx:0,running:false,left:40,timer:null,start:null,rest:false};

function startWorkout(){
  WS={idx:0,running:false,left:40,timer:null,start:Date.now(),rest:false};
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  document.getElementById('screen-workout').classList.add('active');
  loadEx(0); ppDo(true);
}
function loadEx(i){
  const ex=exById(_cW.exercises[i]);
  WS.idx=i; WS.left=ex.workSec; WS.rest=false;
  document.getElementById('wo-nm').textContent=ex.name;
  document.getElementById('wo-det').textContent=`${ex.sets} · ${ex.reps}`;
  document.getElementById('wo-ctr').textContent=`${i+1} / ${_cW.exercises.length}`;
  document.getElementById('wo-fill').style.width=`${(i/_cW.exercises.length)*100}%`;
  updTimer(ex.workSec,ex.workSec);
  if(i<_cW.exercises.length-1){
    document.getElementById('next-nm').textContent=exById(_cW.exercises[i+1]).name;
    document.getElementById('next-peek').style.opacity='1';
  } else document.getElementById('next-peek').style.opacity='0';
  const nm=document.getElementById('wo-nm');
  nm.style.animation='none';requestAnimationFrame(()=>nm.style.animation='slideUp .35s ease');
}
function updTimer(l,tot){
  document.getElementById('t-sec').textContent=l;
  document.getElementById('t-ring').style.strokeDashoffset=CIRC*(1-l/tot);
}
function ppDo(force=false){
  if(WS.running&&!force){
    clearInterval(WS.timer);WS.running=false;
    document.getElementById('ico-play').style.display='block';
    document.getElementById('ico-pause').style.display='none';
  } else {
    WS.running=true;
    document.getElementById('ico-play').style.display='none';
    document.getElementById('ico-pause').style.display='block';
    WS.timer=setInterval(tick,1000);
  }
}
function tick(){
  WS.left--;
  const ex=exById(_cW.exercises[WS.idx]);
  const tot=WS.rest?ex.restSec:ex.workSec;
  updTimer(WS.left,tot);
  if(WS.left<=0){clearInterval(WS.timer);WS.running=false;WS.rest?nextExer():beginRest();}
}
function beginRest(){
  const ex=exById(_cW.exercises[WS.idx]);
  if(WS.idx>=_cW.exercises.length-1){finishWO();return;}
  const nextEx=exById(_cW.exercises[WS.idx+1]);
  WS.rest=true;WS.left=ex.restSec;
  document.getElementById('rest-next').textContent=nextEx.name;
  document.getElementById('rest-screen').classList.add('show');
  document.getElementById('rest-num').textContent=ex.restSec;
  WS.running=true;
  WS.timer=setInterval(()=>{WS.left--;document.getElementById('rest-num').textContent=WS.left;
    if(WS.left<=0){clearInterval(WS.timer);WS.running=false;nextExer();}},1000);
}
function nextExer(){
  document.getElementById('rest-screen').classList.remove('show');
  const n=WS.idx+1;if(n>=_cW.exercises.length){finishWO();return;}
  loadEx(n);ppDo(true);
}
function finishWO(){
  document.getElementById('rest-screen').classList.remove('show');
  const mins=Math.round((Date.now()-WS.start)/60000)||S.duration;
  document.getElementById('fin-mins').textContent=mins;
  document.getElementById('fin-ex').textContent=_cW.exercises.length;
  document.getElementById('fin-kcal').textContent='~'+_cW.calories;
  document.getElementById('fin-screen').classList.add('show');
  // Log workout with metadata (rolling, no index)
  const entry = {date:new Date().toISOString().split('T')[0], wid:_cW.id, mins:mins, kcal:_cW.calories};
  S.done = S.done||[];
  S.done.push(entry);
  S.lastWorkouts = S.lastWorkouts||[];
  S.lastWorkouts.push({date:entry.date, wid:_cW.id});
  if(S.lastWorkouts.length>14) S.lastWorkouts=S.lastWorkouts.slice(-14);
  save();
}
function closeWO(){
  clearInterval(WS.timer);WS.running=false;
  document.getElementById('rest-screen').classList.remove('show');
  document.getElementById('fin-screen').classList.remove('show');
  showScreen('home');
}
document.getElementById('wo-pp').addEventListener('click',()=>ppDo());
document.getElementById('wo-next').addEventListener('click',()=>{clearInterval(WS.timer);WS.running=false;document.getElementById('rest-screen').classList.remove('show');nextExer();});
document.getElementById('wo-prev').addEventListener('click',()=>{clearInterval(WS.timer);WS.running=false;document.getElementById('rest-screen').classList.remove('show');if(WS.idx>0){loadEx(WS.idx-1);ppDo(true);}});
document.getElementById('skip-rest').addEventListener('click',()=>{clearInterval(WS.timer);WS.running=false;nextExer();});
document.getElementById('wo-close').addEventListener('click',closeWO);
document.getElementById('fin-btn').addEventListener('click',()=>{document.getElementById('fin-screen').classList.remove('show');closeWO();});

/* ════════════════════════════════════════════
   EXERCISES
════════════════════════════════════════════ */
let exFilter='Alle';
const allCats = ['Alle',...new Set(EX.map(e=>e.cat))];

function renderExercises() {
  const fEl=document.getElementById('ex-filters');
  fEl.innerHTML=allCats.map(c=>`<button class="fc${c===exFilter?' active':''}" data-c="${c}">${c}</button>`).join('');
  fEl.querySelectorAll('.fc').forEach(b=>b.addEventListener('click',()=>{
    exFilter=b.dataset.c;renderExList();
    fEl.querySelectorAll('.fc').forEach(x=>x.classList.remove('active'));b.classList.add('active');
  }));
  renderExList();
}
function renderExList() {
  const filtered = (exFilter==='Alle'?EX:EX.filter(e=>e.cat===exFilter))
    .filter(e=>e.equip.length===0||e.equip.some(eq=>S.equipment.includes(eq))||!S.onboarded);
  document.getElementById('ex-list').innerHTML=filtered.map(ex=>`
    <div class="ex-row" data-id="${ex.id}">
      <div class="ex-stripe" style="background:${ex.color}"></div>
      <div class="ex-body">
        <div class="ex-name">${ex.name}</div>
        <div class="ex-desc">${ex.desc}</div>
        <div class="ex-tags">
          <span class="etag">${ex.cat}</span>
          ${ex.muscles.slice(0,2).map(m=>`<span class="etag">${m}</span>`).join('')}
          ${ex.equip.length?`<span class="etag etag-eq">${ex.equip.map(e=>equipLabel(e)).join(', ')}</span>`:''}
        </div>
      </div>
    </div>`).join('');
  document.getElementById('ex-list').querySelectorAll('.ex-row').forEach(r=>
    r.addEventListener('click',()=>openExDet(r.dataset.id)));
}
function openExDet(id){
  const ex=exById(id);
  document.getElementById('exd-hero').style.background=ex.grad;
  document.getElementById('exd-nm').textContent=ex.name;
  document.getElementById('exd-desc').textContent=ex.desc;
  document.getElementById('exd-muscles').innerHTML=ex.muscles.map(m=>`<div class="mc">${m}</div>`).join('');
  document.getElementById('exd-equip').textContent=ex.equip.length?ex.equip.map(e=>equipLabel(e)).join(', '):'Kein Gerät nötig';
  document.getElementById('exd-usage').textContent=`${ex.sets} · ${ex.reps}`;
  document.getElementById('ex-det').classList.add('open');
}
document.getElementById('exd-close').addEventListener('click',()=>document.getElementById('ex-det').classList.remove('open'));
renderExercises();

/* ════════════════════════════════════════════
   METRICS
════════════════════════════════════════════ */
const METRIC_FIELDS = [
  {key:'weight',  label:'Gewicht (kg)',   unit:'kg'},
  {key:'bodyfat', label:'Körperfett (%)', unit:'%'},
  {key:'waist',   label:'Taille (cm)',    unit:'cm'},
  {key:'chest',   label:'Brust (cm)',     unit:'cm'},
  {key:'hips',    label:'Hüfte (cm)',     unit:'cm'},
  {key:'thigh',   label:'Oberschenkel (cm)', unit:'cm'},
  {key:'bicep',   label:'Bizeps (cm)',    unit:'cm'},
];

function renderMetrics() {
  const last = S.metrics?.[S.metrics.length-1] || {};

  // Current tiles
  const tiles = METRIC_FIELDS.filter(f=>S[f.key]||last[f.key]).map(f=>{
    const v = last[f.key] || S[f.key] || '–';
    const prev = S.metrics?.length>1 ? S.metrics[S.metrics.length-2]?.[f.key] : null;
    const diff = prev && last[f.key] ? (last[f.key]-prev).toFixed(1) : null;
    const arrow = diff==null?'':diff>0?` ↑${diff}`:` ↓${Math.abs(diff)}`;
    return `<div class="metric-tile">
      <div class="metric-tile-val">${v}${v!=='–'?f.unit:''}</div>
      <div class="metric-tile-lbl">${f.label.replace(/\(.*\)/,'').trim()}</div>
      ${diff!=null?`<div class="metric-tile-sub" style="color:${diff<0&&f.key==='weight'?'var(--green)':diff>0&&f.key!=='weight'?'var(--green)':'var(--text3)'}">${arrow}</div>`:''}
    </div>`;
  }).join('');
  document.getElementById('metric-current').innerHTML = tiles || '<div style="color:var(--text2);font-size:13px;grid-column:1/-1">Noch keine Messungen. Tippe + um deine ersten Werte einzutragen.</div>';

  // Weight chart
  const wData = (S.metrics||[]).filter(m=>m.weight).slice(-10);
  const chartWrap = document.getElementById('weight-chart-wrap');
  if(wData.length>=2) {
    chartWrap.style.display='block';
    drawMiniChart('weight-canvas', wData.map(m=>m.weight), 'var(--green)');
  } else chartWrap.style.display='none';

  // History rows
  const histEl = document.getElementById('metric-history');
  if(!S.metrics?.length) {
    histEl.innerHTML='<div style="margin:0 16px;color:var(--text2);font-size:13px;text-align:center;padding:20px">Keine Einträge vorhanden</div>';
    return;
  }
  histEl.innerHTML='<div class="metric-history">'+[...S.metrics].reverse().map((m,i)=>{
    const idx=S.metrics.length-1-i;
    const vals=METRIC_FIELDS.filter(f=>m[f.key]).map(f=>`<div><span class="mh-val">${m[f.key]}${f.unit}</span><div class="mh-label">${f.label.replace(/\(.*\)/,'').trim()}</div></div>`).join('');
    return `<div class="mh-row">
      <div class="mh-date">${m.date?.slice(5)||''}</div>
      <div class="mh-vals">${vals||'<span style="color:var(--text3);font-size:12px">Keine Werte</span>'}</div>
      <div class="mh-del" data-idx="${idx}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 6L6 18M6 6l12 12"/></svg></div>
    </div>`;
  }).join('')+'</div>';
  histEl.querySelectorAll('.mh-del').forEach(btn=>btn.addEventListener('click',()=>{
    S.metrics.splice(parseInt(btn.dataset.idx),1);save();renderMetrics();
  }));
}

function drawMiniChart(canvasId, data, color='var(--green)') {
  const canvas=document.getElementById(canvasId);
  if(!canvas)return;
  const dpr=window.devicePixelRatio||1;
  const w=canvas.offsetWidth||300, h=canvas.offsetHeight||80;
  canvas.width=w*dpr;canvas.height=h*dpr;
  const ctx=canvas.getContext('2d');ctx.scale(dpr,dpr);
  const min=Math.min(...data)-1,max=Math.max(...data)+1,range=max-min||1;
  const pts=data.map((v,i)=>({x:(i/(data.length-1))*w,y:h-(((v-min)/range)*(h-10))-5}));
  // Fill
  const grad=ctx.createLinearGradient(0,0,0,h);
  grad.addColorStop(0,'rgba(0,224,106,.2)');grad.addColorStop(1,'rgba(0,224,106,0)');
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
  pts.forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.lineTo(pts[pts.length-1].x,h);ctx.lineTo(0,h);ctx.closePath();
  ctx.fillStyle=grad;ctx.fill();
  // Line
  ctx.beginPath();ctx.moveTo(pts[0].x,pts[0].y);
  pts.forEach(p=>ctx.lineTo(p.x,p.y));
  ctx.strokeStyle='#00e06a';ctx.lineWidth=2;ctx.lineJoin='round';ctx.stroke();
  // Dots
  ctx.fillStyle='#00e06a';
  pts.forEach(p=>{ctx.beginPath();ctx.arc(p.x,p.y,3,0,Math.PI*2);ctx.fill();});
}

// Add metric form
document.getElementById('add-metric-btn').addEventListener('click', openMetricForm);
function openMetricForm() {
  const form=document.getElementById('metric-form');
  form.innerHTML=METRIC_FIELDS.map(f=>`
    <div class="mf-field">
      <div class="mf-label">${f.label}</div>
      <input class="mf-input" data-key="${f.key}" type="number" inputmode="decimal" placeholder="${f.unit}" step="0.1"/>
    </div>`).join('');
  document.getElementById('metric-overlay').classList.add('open');
}
document.getElementById('metric-save').addEventListener('click',()=>{
  const entry={date:new Date().toISOString().split('T')[0]};
  document.getElementById('metric-form').querySelectorAll('.mf-input').forEach(inp=>{
    const v=parseFloat(inp.value);if(!isNaN(v))entry[inp.dataset.key]=v;
  });
  if(entry.weight) S.weight=entry.weight;
  if(entry.height) S.height=entry.height;
  S.metrics=S.metrics||[];
  S.metrics.push(entry);save();
  document.getElementById('metric-overlay').classList.remove('open');
  renderMetrics();
});
document.getElementById('metric-overlay').addEventListener('click',e=>{
  if(e.target===document.getElementById('metric-overlay'))
    document.getElementById('metric-overlay').classList.remove('open');
});

/* ════════════════════════════════════════════
   PROFILE — fully editable
════════════════════════════════════════════ */
function renderProfile() {
  const equipStr = S.equipment.length
    ? S.equipment.map(e=>equipLabel(e)).slice(0,4).join(', ')+(S.equipment.length>4?'…':'')
    : 'Nur Bodyweight';

  document.getElementById('prof-tagline').textContent =
    `${GOAL_LBL[S.goal]||'–'} · ${LEVEL_LBL[S.level]||'–'}`;

  // Training settings
  const bbDayStr = S.basketballDays.length ? S.basketballDays.join(', ') : 'Keine';
  const targetStr = S.targetDate
    ? `${S.targetLabel||'Ziel'}: ${new Date(S.targetDate).toLocaleDateString('de-DE',{day:'numeric',month:'short'})}`
    : 'Kein Termin gesetzt';
  document.getElementById('prof-training-settings').innerHTML = [
    {icon:'🎯',label:'Fitnessziel',val:GOAL_LBL[S.goal]||'–',   key:'goal'},
    {icon:'📊',label:'Level',      val:LEVEL_LBL[S.level]||'–', key:'level'},
    {icon:'⏱️',label:'Dauer',      val:S.duration+' Min',        key:'duration'},
    {icon:'🛠️',label:'Ausrüstung', val:equipStr,                 key:'equipment'},
    {icon:'🚫',label:'Ausschlüsse',val:S.exclude.length?S.exclude.join(', '):'Keine', key:'exclude'},
    {icon:'🏀',label:'Basketball-Tage', val:bbDayStr,            key:'basketball'},
    {icon:'🎯',label:'Zieltermin', val:targetStr,                key:'targetdate'},
    {icon:'💪',label:'Gym-Ziel/Woche', val:S.weeklyLoadGoal+' Sessions', key:'weeklygoal'},
  ].map(r=>`
    <div class="setting-row" data-key="${r.key}">
      <span class="si">${r.icon}</span>
      <span class="sl">${r.label}</span>
      <span class="sv">${r.val}</span>
      <span class="sa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></span>
    </div>`).join('');

  document.getElementById('prof-training-settings').querySelectorAll('.setting-row').forEach(row=>
    row.addEventListener('click',()=>openEditPanel(row.dataset.key)));

  // Body settings
  document.getElementById('prof-body-settings').innerHTML = [
    {icon:'📏',label:'Größe',   val:S.height?(S.height+'cm'):'–', key:'height'},
    {icon:'⚖️',label:'Gewicht', val:S.weight?(S.weight+'kg'):'–', key:'weight'},
    {icon:'🎂',label:'Alter',   val:S.age?(S.age+' Jahre'):'–',    key:'age'},
    {icon:'♀♂',label:'Geschlecht',val:S.gender==='m'?'Mann':S.gender==='f'?'Frau':'–', key:'gender'},
  ].map(r=>`
    <div class="setting-row" data-key="${r.key}">
      <span class="si">${r.icon}</span>
      <span class="sl">${r.label}</span>
      <span class="sv">${r.val}</span>
      <span class="sa"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 18l6-6-6-6"/></svg></span>
    </div>`).join('');

  document.getElementById('prof-body-settings').querySelectorAll('.setting-row').forEach(row=>
    row.addEventListener('click',()=>openEditPanel(row.dataset.key)));
}

/* Generic Edit Panel */
function openEditPanel(key) {
  const ov=document.getElementById('edit-overlay');
  const titles={goal:'Ziel ändern',level:'Level ändern',duration:'Dauer ändern',
    equipment:'Ausrüstung',exclude:'Ausschlüsse',height:'Größe',weight:'Gewicht',age:'Alter',gender:'Geschlecht'};
  document.getElementById('edit-title').textContent=titles[key]||key;
  const body=document.getElementById('edit-body');
  let saveHandler=null;

  if(key==='goal') {
    body.innerHTML=`<div class="chip-grid" id="ep-goal">${Object.entries(GOAL_LBL).map(([v,l])=>
      `<div class="chip${S.goal===v?' sel':''}" data-v="${v}">${l}</div>`).join('')}</div>`;
    multiChipSingle('ep-goal');
    saveHandler=()=>{const s=body.querySelector('.chip.sel');if(s)S.goal=s.dataset.v;};
  } else if(key==='level') {
    body.innerHTML=`<div class="level-cards">${Object.entries(LEVEL_LBL).map(([v,l])=>
      `<div class="lcard${S.level===v?' sel':''}" data-v="${v}"><h3>${l}</h3></div>`).join('')}</div>`;
    body.querySelectorAll('.lcard').forEach(c=>c.addEventListener('click',()=>{
      body.querySelectorAll('.lcard').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');
    }));
    saveHandler=()=>{const s=body.querySelector('.lcard.sel');if(s)S.level=s.dataset.v;};
  } else if(key==='duration') {
    body.innerHTML=`<div class="dur-row">${[15,30,45].map(v=>
      `<div class="dur-btn${S.duration===v?' sel':''}" data-v="${v}"><div class="dur-val">${v}</div><div class="dur-lbl">Min</div></div>`).join('')}</div>`;
    body.querySelectorAll('.dur-btn').forEach(c=>c.addEventListener('click',()=>{
      body.querySelectorAll('.dur-btn').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');
    }));
    saveHandler=()=>{const s=body.querySelector('.dur-btn.sel');if(s)S.duration=parseInt(s.dataset.v);};
  } else if(key==='equipment') {
    // Group equipment by category for better UX
    const groups = [
      {label:'Basics / Bodyweight',   ids:['keine','matte','stuhl','step','yogablock','foam','liegestuetz']},
      {label:'Freie Gewichte',        ids:['hanteln','langhantel','kettlebell','sandsack','medball','gewichtsweste']},
      {label:'Stangen & Racks',       ids:['klimmzug','dip','rack','schraebank']},
      {label:'Kabel & Maschinen',     ids:['kabelzug']},
      {label:'Bänder & Schlingen',    ids:['band','trx']},
      {label:'Cardio-Geräte',         ids:['springseil','ergometer','laufband','ruder']},
      {label:'Sonstiges',             ids:['boxsack','bosuball']},
    ];
    const customChips = (S.customEquipment||[]).map(c=>
      `<div class="chip sel" data-v="${c.id}" data-custom="1">${c.icon||'🔧'} ${c.label} <span style="opacity:.6;margin-left:4px">×</span></div>`
    ).join('');
    body.innerHTML = groups.map(g=>`
      <div style="margin-bottom:12px">
        <div style="font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:6px">${g.label}</div>
        <div class="chip-grid">${g.ids.map(v=>`<div class="chip${S.equipment.includes(v)?' sel':''}" data-v="${v}">${EQUIP_LBL[v]||v}</div>`).join('')}</div>
      </div>`).join('') +
      (S.customEquipment?.length ? `<div style="margin-bottom:12px"><div style="font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:6px">Eigene Geräte</div><div class="chip-grid" id="ep-custom">${customChips}</div></div>` : '') +
      `<div style="margin-bottom:8px">
        <div style="font-size:10px;font-weight:600;letter-spacing:1.5px;text-transform:uppercase;color:var(--text3);margin-bottom:6px">+ Eigenes Gerät hinzufügen</div>
        <div style="display:flex;gap:8px;align-items:center">
          <input id="custom-eq-icon" placeholder="Emoji" style="width:52px;padding:10px;border-radius:10px;border:1px solid var(--border2);background:var(--bg3);color:var(--text);font-size:18px;text-align:center"/>
          <input id="custom-eq-name" placeholder="z.B. Yogaschaukel, Sandbag…" style="flex:1;padding:10px 12px;border-radius:10px;border:1px solid var(--border2);background:var(--bg3);color:var(--text);font-family:inherit;font-size:14px"/>
          <button id="custom-eq-add" style="padding:10px 14px;border-radius:10px;border:none;background:var(--red);color:#fff;font-weight:700;cursor:pointer;white-space:nowrap">Hinzufügen</button>
        </div>
      </div>`;
    body.getElementById = body.querySelector.bind(body); // alias
    multiChips2Grouped(body,'equipment');
    // Custom remove
    body.querySelectorAll('[data-custom="1"]').forEach(c=>c.addEventListener('click',()=>{
      S.customEquipment=(S.customEquipment||[]).filter(x=>x.id!==c.dataset.v);
      S.equipment=S.equipment.filter(e=>e!==c.dataset.v);
      save(); openEditPanel('equipment');
    }));
    // Add custom
    body.querySelector('#custom-eq-add')?.addEventListener('click',()=>{
      const icon=body.querySelector('#custom-eq-icon').value.trim()||'🔧';
      const name=body.querySelector('#custom-eq-name').value.trim();
      if(!name)return;
      const id='custom_'+Date.now();
      S.customEquipment=S.customEquipment||[];
      S.customEquipment.push({id,label:name,icon});
      S.equipment.push(id);
      save(); openEditPanel('equipment');
    });
    saveHandler=()=>{};
  } else if(key==='exclude') {
    const excl={burpees:'Keine Burpees',springen:'Kein Springen',laufen:'Kein Laufen',kniebeugen:'Keine Kniebeugen',boden:'Keine Bodenübungen',ruecken:'Schonend Rücken',knie:'Schonend Knie'};
    body.innerHTML=`<div class="chip-grid" id="ep-excl">${Object.entries(excl).map(([v,l])=>
      `<div class="chip${S.exclude.includes(v)?' sel':''}" data-v="${v}">${l}</div>`).join('')}</div>`;
    multiChips2('ep-excl','exclude');
    saveHandler=()=>{};
  } else if(key==='basketball') {
    body.innerHTML=`
      <div class="ob-sub" style="margin-bottom:12px">An welchen Tagen spielst du Basketball? (Mehrfachauswahl)</div>
      <div class="chip-grid" id="ep-bball">${['Mo','Di','Mi','Do','Fr','Sa','So'].map(d=>
        `<div class="chip${(S.basketballDays||[]).includes(d)?' sel':''}" data-v="${d}">${d}</div>`).join('')}</div>
      <div style="margin-top:16px;padding:12px;background:var(--bg3);border-radius:10px;font-size:13px;color:var(--text2);line-height:1.5">
        🏀 Basketball-Tage beeinflussen die tägliche Workout-Empfehlung. An diesen Tagen empfiehlt die App Oberkörper oder Mobility statt Beintraining.
      </div>`;
    multiChips2('ep-bball','basketballDays');
    saveHandler=()=>{};
  } else if(key==='targetdate') {
    const cur = S.targetDate||'';
    body.innerHTML=`
      <div class="field-group">
        <div class="field-label">Bezeichnung (z.B. Sommerurlaub, Strand)</div>
        <input class="field-input" id="ep-tgt-label" type="text" value="${S.targetLabel||''}" placeholder="z.B. Urlaub Kroatien"/>
      </div>
      <div class="field-group" style="margin-top:12px">
        <div class="field-label">Zieldatum (optional)</div>
        <input class="field-input" id="ep-tgt-date" type="date" value="${cur}" min="${new Date().toISOString().split('T')[0]}"/>
      </div>
      <div style="margin-top:12px;display:flex;gap:8px">
        <button id="ep-tgt-clear" style="flex:1;padding:12px;border-radius:10px;border:1px solid var(--border2);background:none;color:var(--text2);cursor:pointer;font-size:14px">Termin löschen</button>
      </div>`;
    document.getElementById('ep-tgt-clear')?.addEventListener('click',()=>{
      S.targetDate=null;S.targetLabel=null;save();
      document.getElementById('edit-overlay').classList.remove('open');renderProfile();renderHome();
    });
    saveHandler=()=>{
      const label=document.getElementById('ep-tgt-label')?.value.trim();
      const date=document.getElementById('ep-tgt-date')?.value;
      S.targetLabel=label||null;
      S.targetDate=date||null;
    };
  } else if(key==='weeklygoal') {
    body.innerHTML=`
      <div class="ob-sub" style="margin-bottom:12px">Wie viele Gym-Sessions pro Woche willst du schaffen?</div>
      <div class="dur-row">${[2,3,4,5].map(v=>
        `<div class="dur-btn${S.weeklyLoadGoal===v?' sel':''}" data-v="${v}"><div class="dur-val">${v}</div><div class="dur-lbl">Sessions</div></div>`).join('')}</div>
      <div style="margin-top:12px;padding:12px;background:var(--bg3);border-radius:10px;font-size:13px;color:var(--text2);line-height:1.5">
        💡 Deine Basketball-Tage zählen als separate Aktivität — das Gym-Ziel ist zusätzlich dazu.
      </div>`;
    body.querySelectorAll('.dur-btn').forEach(c=>c.addEventListener('click',()=>{
      body.querySelectorAll('.dur-btn').forEach(x=>x.classList.remove('sel'));c.classList.add('sel');
    }));
    saveHandler=()=>{const s=body.querySelector('.dur-btn.sel');if(s)S.weeklyLoadGoal=parseInt(s.dataset.v);};
  } else if(['height','weight','age'].includes(key)) {
    const labels={height:'Größe (cm)',weight:'Gewicht (kg)',age:'Alter'};
    body.innerHTML=`<div class="field-group">
      <div class="field-label">${labels[key]}</div>
      <input class="field-input" id="ep-num" type="number" inputmode="decimal" value="${S[key]||''}" step="0.1"/>
    </div>`;
    saveHandler=()=>{const v=parseFloat(document.getElementById('ep-num').value);if(!isNaN(v)){S[key]=v;if(key==='weight'&&S.metrics?.length){S.metrics[S.metrics.length-1].weight=v;}}};
  } else if(key==='gender') {
    body.innerHTML=`<div class="chip-grid" id="ep-gender">
      <div class="chip${S.gender==='m'?' sel':''}" data-v="m">♂ Mann</div>
      <div class="chip${S.gender==='f'?' sel':''}" data-v="f">♀ Frau</div>
    </div>`;
    multiChipSingle('ep-gender');
    saveHandler=()=>{const s=body.querySelector('.chip.sel');if(s)S.gender=s.dataset.v;};
  }

  document.getElementById('edit-save').onclick=()=>{
    if(saveHandler)saveHandler();save();
    ov.classList.remove('open');renderProfile();renderAIPage();renderExList();
  };
  ov.classList.add('open');
}

function multiChips2Grouped(container, key) {
  container.querySelectorAll('.chip:not([data-custom])').forEach(c=>
    c.addEventListener('click',()=>{
      c.classList.toggle('sel');
      // Re-collect all selected non-custom chips
      const selected = [...container.querySelectorAll('.chip.sel:not([data-custom])')].map(x=>x.dataset.v);
      // Preserve custom equipment selections
      const customs = (S.customEquipment||[]).map(c=>c.id).filter(id=>S.equipment.includes(id));
      S[key]=[...new Set([...selected,...customs])];
    }));
}

function multiChipSingle(id) {
  document.getElementById(id)?.querySelectorAll('.chip').forEach(c=>
    c.addEventListener('click',()=>{
      document.getElementById(id).querySelectorAll('.chip').forEach(x=>x.classList.remove('sel'));
      c.classList.add('sel');
    }));
}
function multiChips2(id,key) {
  document.getElementById(id)?.querySelectorAll('.chip').forEach(c=>
    c.addEventListener('click',()=>{
      c.classList.toggle('sel');
      S[key]=[...document.getElementById(id).querySelectorAll('.chip.sel')].map(x=>x.dataset.v);
    }));
}

document.getElementById('edit-overlay').addEventListener('click',e=>{
  if(e.target===document.getElementById('edit-overlay'))
    document.getElementById('edit-overlay').classList.remove('open');
});
document.getElementById('reset-btn').addEventListener('click',()=>{
  if(confirm('Trainings-Fortschritt wirklich zurücksetzen?')){
    S.done=[];S.lastWorkouts=[];save();renderHome();
  }
});
document.getElementById('reob-btn').addEventListener('click',()=>{
  if(confirm('Profil komplett neu einrichten? (Fortschritt bleibt erhalten)')){
    S.onboarded=false;save();location.reload();
  }
});

/* ════════════════════════════════════════════
   AI PLAN
════════════════════════════════════════════ */
function renderAIPage() {
  const equipStr=S.equipment.map(e=>equipLabel(e)).join(', ')||'nur Bodyweight';
  document.getElementById('ai-profile-txt').textContent=
    `Ziel: ${GOAL_LBL[S.goal]||'–'} · Level: ${LEVEL_LBL[S.level]||'–'} · ${S.duration} Min · ${equipStr}`;

  if(S.aiPlan) {
    document.getElementById('ai-result').classList.add('show');
    document.getElementById('ai-result-txt').textContent=S.aiPlan;
  }
  document.getElementById('ai-settings').innerHTML=[
    {ic:'🎯',l:'Ziel',v:GOAL_LBL[S.goal]||'–'},
    {ic:'📊',l:'Level',v:LEVEL_LBL[S.level]||'–'},
    {ic:'🛠️',l:'Ausrüstung',v:equipStr.slice(0,40)},
    {ic:'⏱️',l:'Dauer',v:S.duration+' Min'},
    {ic:'🚫',l:'Ausschlüsse',v:S.exclude.length?S.exclude.join(', '):'Keine'},
  ].map(r=>`<div class="setting-row"><span class="si">${r.ic}</span><span class="sl">${r.l}</span><span class="sv">${r.v}</span></div>`).join('');
}

document.getElementById('ai-gen-btn').addEventListener('click', async () => {
  const btn=document.getElementById('ai-gen-btn');
  const res=document.getElementById('ai-result');
  const txt=document.getElementById('ai-result-txt');
  btn.disabled=true; btn.innerHTML=`<span>Generiert…</span>`;
  res.classList.add('show');
  txt.innerHTML=`<div class="ai-dots"><div class="ai-dot"></div><div class="ai-dot"></div><div class="ai-dot"></div><span>KI analysiert dein Profil…</span></div>`;

  const equipStr=S.equipment.map(e=>equipLabel(e)).join(', ')||'nur Bodyweight (kein Gerät)';
  const bodyStr=S.height&&S.weight?`Körpergröße: ${S.height}cm, Gewicht: ${S.weight}kg`:''
  const bbStr=S.basketballDays.length
    ? `Basketball: ${S.basketballDays.join(', ')} (${S.basketballDays.length}×/Woche) — zählt als Cardio-Einheit`
    : 'Kein Basketball'
  const seasonStr=isCoachSeason()?'Aktuell Trainer-Saison (Okt–Mai): 2×/Woche Minibasket-Training zusätzlich':'Sommersaison: bis zu 4×/Woche Basketball möglich';
  const exclStr=S.exclude.length?`Ausgeschlossen: ${S.exclude.join(', ')}`:' keine Ausschlüsse';

  const prompt=`Du bist ein erfahrener Personal-Trainer. Erstelle einen sehr detaillierten, motivierenden 6-Wochen-Trainingsplan für Zuhause auf Deutsch.

Profil:
- Ziel: ${GOAL_LBL[S.goal]||S.goal}
- Fitness-Level: ${LEVEL_LBL[S.level]||S.level}
- Verfügbare Geräte: ${equipStr}
- Workout-Dauer: ${S.duration} Minuten
- ${bodyStr}
- ${exclStr}

Liefere:
1. Wochenstruktur (Trainingstage, Ruhetage)
2. 3 konkrete Workout-Typen passend zu den Geräten, mit je 5–6 Übungen inkl. Sätze/Wdh.
3. Progressionsplan Woche 1–6 (wie Intensität steigt)
4. Top 3 Ernährungstipps spezifisch für das Ziel

Schreibe praxisnah, motivierend und konkret. Max. 450 Wörter.`;

  try {
    const resp=await fetch('https://api.anthropic.com/v1/messages',{
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body:JSON.stringify({model:'claude-sonnet-4-20250514',max_tokens:1000,
        messages:[{role:'user',content:prompt}]})
    });
    const data=await resp.json();
    const answer=data.content?.find(b=>b.type==='text')?.text||'Keine Antwort erhalten.';
    txt.textContent=answer;
    S.aiPlan=answer;save();
  } catch(e){
    txt.textContent='⚠️ Fehler. Bitte Internetverbindung prüfen.';
  }
  btn.disabled=false;
  btn.innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>Neuen Plan generieren`;
});

/* ════════════════════════════════════════════
   PWA INSTALL
════════════════════════════════════════════ */
let deferredInstall=null;
window.addEventListener('beforeinstallprompt',e=>{
  e.preventDefault();deferredInstall=e;
  document.getElementById('install-bar').classList.add('show');
});
document.getElementById('ib-install').addEventListener('click',async()=>{
  if(deferredInstall){await deferredInstall.prompt();deferredInstall=null;}
  document.getElementById('install-bar').classList.remove('show');
});
document.getElementById('ib-dismiss').addEventListener('click',()=>
  document.getElementById('install-bar').classList.remove('show'));

if('serviceWorker' in navigator)
  navigator.serviceWorker.register('sw.js').catch(()=>{});
