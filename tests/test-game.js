// Test d'integration : charge index.html dans jsdom et joue une partie.
const fs = require('fs');
const { JSDOM } = require('jsdom');

const ROOT = require('path').join(__dirname, '..');
const read = f => fs.readFileSync(`${ROOT}/${f}`, 'utf8');

let pass = 0, fail = 0;
function check(label, condition, detail = '') {
    if (condition) { pass++; console.log(`  OK    ${label}`); }
    else { fail++; console.log(`  ECHEC ${label} ${detail}`); }
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function boot() {
    const dom = new JSDOM(read('index.html'), {
        url: 'https://example.test/',
        runScripts: 'outside-only',
        pretendToBeVisual: true
    });
    const { window } = dom;

    // jsdom emet son propre DOMContentLoaded de facon asynchrone. Si on ne le
    // laisse pas passer avant d'installer les scripts, il arrive apres notre
    // dispatch manuel et tous les ecouteurs se retrouvent enregistres deux fois.
    await new Promise(resolve => {
        if (window.document.readyState === 'complete') resolve();
        else window.addEventListener('load', resolve, { once: true });
    });

    // Doublures : jsdom ne joue pas de son et le confetti n'est pas charge.
    const played = [];
    window.Audio = class {
        constructor(src) { this.src = src; this.muted = false; this.currentTime = 0; }
        play() { played.push(this.src); return Promise.resolve(); }
        pause() { this.paused = true; }
    };
    window.confetti = () => {};
    window.localStorage.clear();

    // Les declarations `const` d'un eval indirect sont jetees des la fin de
    // l'eval. On concatene donc les scripts en un seul bloc, comme le fait le
    // navigateur avec plusieurs <script>, et on expose au test ce dont il a
    // besoin via un pont explicite.
    const bundle = ['js/storage.js', 'js/config.js', 'js/questions.js', 'js/game.js']
        .map(read).join('\n;\n');
    window.eval(bundle + `
        ;window.__t = {
            get state() { return state; },
            get sounds() { return sounds; },
            get gameConfig() { return gameConfig; },
            saveVictory: saveVictory
        };`);
    window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
    return { dom, window, played };
}

const $ = (w, id) => w.document.getElementById(id);
const submit = w => $(w, 'answer-form').dispatchEvent(new w.Event('submit', { cancelable: true }));

function answerCorrectly(w) {
    const fact = w.__t.state.fact;
    const op = w.__t.gameConfig.operation;
    $(w, 'answer-input').value = String(op === 'addition' ? fact.a + fact.b : fact.a * fact.b);
    submit(w);
}

function answerWrongly(w) {
    const fact = w.__t.state.fact;
    $(w, 'answer-input').value = String(fact.a * fact.b + 7);
    submit(w);
}

(async () => {
    console.log('\n--- Ecran titre ---');
    let { window: w, played } = await boot();
    check("l'ecran titre est affiche", !$(w, 'screen-title').hidden);
    check("l'ecran de jeu est masque", $(w, 'screen-game').hidden);
    check('le bouton porte le nom du joueur', $(w, 'start-btn').textContent.includes('Emilie'),
          `-> "${$(w, 'start-btn').textContent}"`);
    check('le resume du mode est rempli', $(w, 'mode-summary').textContent.length > 0,
          `-> "${$(w, 'mode-summary').textContent}"`);
    check('aucune musique telechargee avant de jouer', w.__t.sounds.theme === null);

    console.log('\n--- Lancement de la partie ---');
    $(w, 'start-btn').click();
    check("l'ecran de jeu est affiche", !$(w, 'screen-game').hidden);
    check('le bouton Quitter apparait', !$(w, 'quit-btn').hidden);
    check('les liens de navigation sont caches', $(w, 'nav-links').hidden);
    check('une question est posee', $(w, 'num-a').textContent !== '' && $(w, 'num-b').textContent !== '',
          `-> ${$(w, 'num-a').textContent} ${$(w, 'operator').textContent} ${$(w, 'num-b').textContent}`);
    check('le symbole est x en multiplication', $(w, 'operator').textContent === 'x');
    check('la musique est lancee', played.some(s => s.includes('theme')));
    check('le timer affiche 15', $(w, 'timer-value').textContent === '15',
          `-> "${$(w, 'timer-value').textContent}"`);

    console.log('\n--- Bonne reponse ---');
    answerCorrectly(w);
    check('un diamant est ajoute', w.__t.state.diamonds === 1);
    check('un diamant est dessine', $(w, 'diamonds').children.length === 1);
    check('le dernier diamant est anime', $(w, 'diamonds').lastChild.classList.contains('diamond--new'));
    check('le champ est vide', $(w, 'answer-input').value === '');
    check('retour visuel vert', $(w, 'question-card').classList.contains('is-correct'));
    check('progression rangee 1 sur 3', $(w, 'progress').textContent === 'Rangee 1 sur 3',
          `-> "${$(w, 'progress').textContent}"`);

    console.log('\n--- Mauvaise reponse en mode difficile ---');
    for (let i = 0; i < 4; i++) answerCorrectly(w);
    check('5 diamants accumules', w.__t.state.diamonds === 5);
    answerWrongly(w);
    check('remise a zero complete', w.__t.state.diamonds === 0);
    check('plus aucun diamant affiche', $(w, 'diamonds').children.length === 0);
    check('retour visuel rouge', $(w, 'question-card').classList.contains('is-wrong'));
    check("le son d'erreur est joue", played.some(s => s.includes('error')));

    console.log('\n--- Temps ecoule ---');
    for (let i = 0; i < 3; i++) answerCorrectly(w);
    const before = w.__t.state.diamonds;
    w.__t.state.deadline = Date.now() - 1;
    await sleep(250);
    check('le temps ecoule est detecte', w.__t.state.diamonds === 0, `-> avant ${before}`);
    check('une nouvelle question est posee', w.__t.state.fact !== null);
    check('une erreur est comptabilisee', w.__t.state.mistakeCount > 0);

    console.log("\n--- Pause quand on quitte l'onglet ---");
    Object.defineProperty(w.document, 'hidden', { value: true, configurable: true });
    w.document.dispatchEvent(new w.Event('visibilitychange'));
    check('la partie passe en pause', w.__t.state.phase === 'paused');
    check("l'overlay de pause est visible", !$(w, 'pause-overlay').hidden);
    check('le chrono est arrete', w.__t.state.tickHandle === null);
    const remaining = w.__t.state.remainingOnPause;
    check('le temps restant est memorise', remaining > 0 && remaining <= 15000, `-> ${remaining} ms`);
    $(w, 'resume-btn').click();
    check('la reprise relance la partie', w.__t.state.phase === 'playing');
    check("l'overlay disparait", $(w, 'pause-overlay').hidden);

    console.log('\n--- Bouton son ---');
    $(w, 'sound-toggle').click();
    check('le son est coupe', w.__t.gameConfig.soundEnabled === false);
    // "unmute.webp" contient "mute.webp" : il faut comparer la fin du chemin.
    const iconName = () => $(w, 'sound-toggle').querySelector('img').src.split('/').pop();
    check("l'icone passe en mute", iconName() === 'mute.webp', `-> ${iconName()}`);
    check('le theme est mute', w.__t.sounds.theme.muted === true);
    check('le choix est persiste', JSON.parse(w.localStorage.getItem('gameConfig')).soundEnabled === false);
    $(w, 'sound-toggle').click();
    check('le son revient', w.__t.gameConfig.soundEnabled === true);
    check("l'icone repasse en unmute", iconName() === 'unmute.webp', `-> ${iconName()}`);
    check('le theme est demute', w.__t.sounds.theme.muted === false);

    console.log('\n--- Changement de rangee et victoire ---');
    ({ window: w, played } = await boot());
    $(w, 'start-btn').click();
    for (let i = 0; i < 10; i++) answerCorrectly(w);
    check('10 diamants = rangee 1 complete', $(w, 'diamonds').children.length === 10);
    check('les diamants sont jaunes', $(w, 'diamonds').firstChild.src.includes('diamond_yellow'));
    answerCorrectly(w);
    check('11e diamant = 1 diamant rose', $(w, 'diamonds').children.length === 1
          && $(w, 'diamonds').firstChild.src.includes('diamond_pink'));
    check('progression rangee 2 sur 3', $(w, 'progress').textContent === 'Rangee 2 sur 3');
    for (let i = 0; i < 10; i++) answerCorrectly(w);
    check('21e diamant = diamant brillant', $(w, 'diamonds').firstChild.src.includes('diamond_shine'));

    for (let i = 0; i < 9; i++) answerCorrectly(w);
    check('30 diamants atteints', w.__t.state.diamonds === 30);
    check("l'ecran de victoire s'affiche", !$(w, 'screen-victory').hidden);
    check("l'ecran de jeu est masque", $(w, 'screen-game').hidden);
    check('le chrono est arrete', w.__t.state.tickHandle === null);
    check('le son de victoire est joue', played.some(s => s.includes('victory')));
    check('un temps est affiche', /^\d+:\d\d$/.test($(w, 'victory-time').textContent),
          `-> "${$(w, 'victory-time').textContent}"`);
    check('le rang est #1', $(w, 'victory-rank').textContent === '#1',
          `-> "${$(w, 'victory-rank').textContent}"`);
    check('zero erreur comptabilisee', $(w, 'victory-mistakes').textContent === '0');

    console.log('\n--- Sauvegarde du score ---');
    const scores = JSON.parse(w.localStorage.getItem('highscores'));
    check('un score est enregistre', scores.length === 1);
    check('dans localStorage, pas dans un cookie', !w.document.cookie.includes('highscores'));
    check('le score a un identifiant unique', typeof scores[0].id === 'string' && scores[0].id.length > 5);
    check('le joueur est correct', scores[0].players === 'Emilie');
    check('les erreurs sont enregistrees', scores[0].mistakes === 0);

    console.log('\n--- Rang correct avec des temps identiques ---');
    // Le bug de la v1.7 : deux parties de meme duree donnaient un rang faux.
    w.localStorage.setItem('highscores', JSON.stringify([
        { id: 'a', date: new Date().toISOString(), players: 'Louane', time: 5,
          operation: 'multiplication', difficulty: 'hard', timerDuration: 15, selectedNumbers: [2] },
        { id: 'b', date: new Date().toISOString(), players: 'Arthur', time: 5,
          operation: 'multiplication', difficulty: 'hard', timerDuration: 15, selectedNumbers: [2] }
    ]));
    const res = w.__t.saveVictory(5);
    check('le rang reste coherent avec des ex aequo', res.rank >= 1 && res.rank <= 3, `-> #${res.rank}`);
    const saved = JSON.parse(w.localStorage.getItem('highscores'));
    check('les trois scores sont conserves', saved.length === 3);

    console.log('\n--- Plus de 20 scores tiennent (bug du cookie 4 Ko) ---');
    const many = Array.from({ length: 60 }, (_, i) => ({
        id: `s${i}`, date: new Date().toISOString(), players: 'Emilie', time: 100 + i,
        operation: 'multiplication', difficulty: 'hard', timerDuration: 15,
        selectedNumbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]
    }));
    w.localStorage.setItem('highscores', JSON.stringify(many));
    const bytes = JSON.stringify(many).length;
    w.__t.saveVictory(1);
    const afterMany = JSON.parse(w.localStorage.getItem('highscores'));
    check(`${Math.round(bytes / 1024)} Ko de scores survivent a la sauvegarde`, afterMany.length === 50,
          `-> ${afterMany.length} entrees`);
    check('le nouveau score est bien en tete', afterMany[0].time === 1);

    console.log("\n--- Retour a l'ecran titre ---");
    $(w, 'home-btn').click();
    check("l'ecran titre revient", !$(w, 'screen-title').hidden);
    check('les liens de navigation reviennent', !$(w, 'nav-links').hidden);
    check('le bouton Quitter disparait', $(w, 'quit-btn').hidden);

    console.log('\n--- Saisie non numerique filtree ---');
    ({ window: w } = await boot());
    $(w, 'start-btn').click();
    const input = $(w, 'answer-input');
    input.value = '12ab-3';
    input.dispatchEvent(new w.Event('input'));
    check('seuls les chiffres restent', input.value === '123', `-> "${input.value}"`);
    input.value = '';
    const factBefore = w.__t.state.fact.key;
    submit(w);
    check('un champ vide ne valide rien', w.__t.state.fact.key === factBefore);
    check('aucune penalite sur champ vide',
          w.__t.state.diamonds === 0 && w.__t.state.mistakeCount === 0);

    console.log('\n--- Mode addition ---');
    ({ window: w } = await boot());
    w.__t.gameConfig.operation = 'addition';
    $(w, 'start-btn').click();
    check('le symbole passe a +', $(w, 'operator').textContent === '+');
    answerCorrectly(w);
    check('une addition juste ajoute un diamant', w.__t.state.diamonds === 1);

    console.log('\n--- Mode facile : seule la rangee en cours est perdue ---');
    ({ window: w } = await boot());
    w.__t.gameConfig.difficulty = 'easy';
    $(w, 'start-btn').click();
    for (let i = 0; i < 13; i++) answerCorrectly(w);
    check('13 diamants accumules', w.__t.state.diamonds === 13);
    answerWrongly(w);
    check('on retombe a 10, pas a 0', w.__t.state.diamonds === 10,
          `-> ${w.__t.state.diamonds}`);

    console.log('\n===============================');
    console.log(`  ${pass} tests reussis, ${fail} echecs`);
    console.log('===============================');
    process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('\nERREUR DU HARNAIS:', e); process.exit(2); });
