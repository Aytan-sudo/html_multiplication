// Harnais minimal : on simule Storage puis on charge questions.js tel quel.
const fs = require('fs');
const path = require('path').join(__dirname, '..', 'js', 'questions.js');
const store = {};
// Le module s'appelle GameStorage depuis la v2 : le harnais etait reste sur
// l'ancien nom `Storage` et le test plantait au demarrage.
global.GameStorage = {
  getJSON: (k, f) => (k in store ? JSON.parse(store[k]) : f),
  setJSON: (k, v) => { store[k] = JSON.stringify(v); return true; }
};
global.playerLabel = c => c.playerName || 'Anonyme';
eval(fs.readFileSync(path, 'utf8') + '\nglobal.QuestionPicker = QuestionPicker; global.expectedResult = expectedResult;');

const config = {
  operation: 'multiplication',
  selectedNumbers: [0,1,2,3,4,5,10],
  maxFirstOperand: 9,
  playerName: 'Test',
  adaptive: true
};

// --- 1. Part des questions triviales, sans historique
let picker = new QuestionPicker(config);
let trivial = 0, N = 20000;
for (let i = 0; i < N; i++) {
  const f = picker.next();
  if (f.a <= 1 || f.b <= 1 || f.a === 10 || f.b === 10) trivial++;
}
console.log(`Questions triviales : ${(100*trivial/N).toFixed(1)} %  (v1.7 uniforme : 61,9 %)`);

// --- 2. Un fait systematiquement rate revient-il plus souvent ?
picker = new QuestionPicker(config);
const target = { a: 7, b: 4, key: '7x4' };
for (let i = 0; i < 10; i++) picker.record(target, false);
// et un fait maitrise
const easyFact = { a: 8, b: 3, key: '8x3' };
for (let i = 0; i < 5; i++) picker.record(easyFact, true);

let hitTarget = 0, hitMastered = 0;
for (let i = 0; i < N; i++) {
  const f = picker.next();
  if (f.key === '7x4') hitTarget++;
  if (f.key === '8x3') hitMastered++;
}
const baseline = N / picker.facts.length;
console.log(`Fait toujours rate (7x4)   : ${hitTarget} tirages  (x${(hitTarget/baseline).toFixed(2)} vs uniforme)`);
console.log(`Fait maitrise    (8x3)     : ${hitMastered} tirages  (x${(hitMastered/baseline).toFixed(2)} vs uniforme)`);

// --- 3. Jamais deux fois la meme question d'affilee
picker = new QuestionPicker(config);
let repeats = 0, prev = null;
for (let i = 0; i < N; i++) {
  const f = picker.next();
  if (prev && f.key === prev) repeats++;
  prev = f.key;
}
console.log(`Repetitions immediates     : ${repeats} (attendu 0)`);

// --- 4. Resultats attendus corrects
const checks = [
  [{a:7,b:4}, 'multiplication', 28],
  [{a:0,b:9}, 'multiplication', 0],
  [{a:7,b:4}, 'addition', 11],
];
for (const [f, op, want] of checks) {
  const got = expectedResult(f, op);
  console.log(`${f.a} ${op==='addition'?'+':'x'} ${f.b} = ${got} ${got===want?'OK':'ECHEC attendu '+want}`);
}

// --- 5. Mode non adaptatif : distribution uniforme
picker = new QuestionPicker({...config, adaptive: false});
trivial = 0;
for (let i = 0; i < N; i++) { const f = picker.next(); if (f.a<=1||f.b<=1||f.a===10||f.b===10) trivial++; }
console.log(`Mode non adaptatif, triviales : ${(100*trivial/N).toFixed(1)} % (doit rester ~62 %)`);
