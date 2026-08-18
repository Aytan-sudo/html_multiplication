// Verifie que la config et les scores enregistres par la v1.7 (dans des
// cookies) sont bien repris par la v2 (dans localStorage), sans rien perdre.
const fs = require('fs');
const { JSDOM } = require('jsdom');

const ROOT = require('path').join(__dirname, '..');
const read = f => fs.readFileSync(`${ROOT}/${f}`, 'utf8');

let pass = 0, fail = 0;
const check = (label, cond, detail = '') => {
    if (cond) { pass++; console.log(`  OK    ${label}`); }
    else { fail++; console.log(`  ECHEC ${label} ${detail}`); }
};

(async () => {
    const dom = new JSDOM(read('index.html'), {
        url: 'https://example.test/', runScripts: 'outside-only', pretendToBeVisual: true
    });
    const { window: w } = dom;
    await new Promise(r => {
        if (w.document.readyState === 'complete') r();
        else w.addEventListener('load', r, { once: true });
    });

    // Etat laisse par la v1.7 : tout en cookies, rien en localStorage.
    const oldConfig = {
        operation: 'addition', selectedNumbers: [0, 1, 3, 7, 10], difficulty: 'easy',
        timerDuration: 30, diamondsPerRow: 10, totalRows: 3, maxFirstOperand: 9,
        playerName: 'Louane', bgColor: '#c8e6c9'
    };
    const oldScores = [
        { date: '2025-12-01T10:00:00.000Z', players: 'Louane', time: 88,
          operation: 'addition', difficulty: 'easy', timerDuration: 30, selectedNumbers: [0,1,3,7,10] },
        { date: '2025-12-02T10:00:00.000Z', players: 'Emilie', time: 120,
          operation: 'multiplication', difficulty: 'hard', timerDuration: 15, selectedNumbers: [0,1,2,10] }
    ];
    w.localStorage.clear();
    w.document.cookie = 'gameConfig=' + encodeURIComponent(JSON.stringify(oldConfig)) + ';path=/';
    w.document.cookie = 'highscores=' + encodeURIComponent(JSON.stringify(oldScores)) + ';path=/';

    w.Audio = class { constructor(s) { this.src = s; } play() { return Promise.resolve(); } pause() {} };
    w.confetti = () => {};

    console.log('\n--- Migration des cookies v1.7 vers localStorage ---');
    w.eval(['js/storage.js', 'js/config.js', 'js/questions.js', 'js/game.js']
        .map(read).join('\n;\n')
        + ';window.__t={get gameConfig(){return gameConfig}, store: GameStorage};');
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));

    const c = w.__t.gameConfig;
    // Le prenom, lui, repart a zero : dans les versions precedentes il valait
    // « Emilie » par defaut, sans que personne l'ait choisi. Impossible de
    // distinguer un vrai choix d'un reste de valeur par defaut, on repart donc
    // en anonyme partout.
    check('le joueur repart en anonyme', c.playerName === '', `-> ${c.playerName}`);
    check("l'operation est reprise", c.operation === 'addition');
    check('la difficulte est reprise', c.difficulty === 'easy');
    check('le timer est repris', c.timerDuration === 30);
    check('les tables sont reprises', c.selectedNumbers.join() === '0,1,3,7,10');
    check('la couleur est reprise', c.bgColor === '#c8e6c9');
    check('les nouvelles clefs prennent leur defaut', c.adaptive === true && c.soundEnabled === true);
    check('la config est passee en localStorage', w.localStorage.getItem('gameConfig') !== null);
    check('le cookie de config est retire', !w.document.cookie.includes('gameConfig'),
          `-> ${w.document.cookie}`);

    const migrated = JSON.parse(w.__t.store.get('highscores'));
    check('les 2 scores sont repris', migrated.length === 2);
    check('le meilleur temps est conserve', migrated[0].time === 88);
    check('les scores sont passes en localStorage', w.localStorage.getItem('highscores') !== null);
    check('le cookie de scores est retire', !w.document.cookie.includes('highscores'),
          `-> ${w.document.cookie}`);

    console.log('\n--- Les anciens scores restent lisibles sur la page des scores ---');
    const dom2 = new JSDOM(read('highscores.html'), {
        url: 'https://example.test/', runScripts: 'outside-only', pretendToBeVisual: true
    });
    const w2 = dom2.window;
    await new Promise(r => {
        if (w2.document.readyState === 'complete') r();
        else w2.addEventListener('load', r, { once: true });
    });
    w2.localStorage.setItem('highscores', JSON.stringify(oldScores));
    w2.eval(['js/storage.js', 'js/config.js', 'js/highscores-page.js'].map(read).join('\n;\n'));
    w2.document.dispatchEvent(new w2.Event('DOMContentLoaded'));
    const rows = w2.document.querySelectorAll('.score');
    check('les 2 anciens scores sont affiches', rows.length === 2, `-> ${rows.length}`);
    check('sans mention "undefined"',
          !w2.document.getElementById('scores').innerHTML.includes('undefined'));

    console.log('\n--- Repli sur les cookies si localStorage est bloque ---');
    const dom3 = new JSDOM(read('index.html'), {
        url: 'https://example.test/', runScripts: 'outside-only', pretendToBeVisual: true
    });
    const w3 = dom3.window;
    await new Promise(r => {
        if (w3.document.readyState === 'complete') r();
        else w3.addEventListener('load', r, { once: true });
    });
    // Simule un navigateur qui interdit le stockage local (navigation privee).
    Object.defineProperty(w3, 'localStorage', {
        get() { throw new Error('SecurityError'); }, configurable: true
    });
    w3.Audio = class { constructor(s) { this.src = s; } play() { return Promise.resolve(); } pause() {} };
    w3.confetti = () => {};
    w3.eval(['js/storage.js', 'js/config.js'].map(read).join('\n;\n')
        + ';window.__t={store: GameStorage, get gameConfig(){return gameConfig}};');
    const wrote = w3.__t.store.set('essai', 'valeur');
    check('le stockage bascule sur les cookies sans planter', wrote === true);
    check('la valeur est relisible', w3.__t.store.get('essai') === 'valeur');
    check('le jeu demarre malgre tout', w3.__t.gameConfig.operation === 'multiplication');
    check('aucun joueur par defaut : partie anonyme', w3.__t.gameConfig.playerName === '');

    console.log('\n===============================');
    console.log(`  ${pass} tests reussis, ${fail} echecs`);
    console.log('===============================');
    process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('\nERREUR DU HARNAIS:', e); process.exit(2); });
