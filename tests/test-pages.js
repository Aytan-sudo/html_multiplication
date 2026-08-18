// Tests des pages secondaires : configuration et meilleurs scores.
const fs = require('fs');
const { JSDOM, VirtualConsole } = require('jsdom');

const ROOT = require('path').join(__dirname, '..');
const read = f => fs.readFileSync(`${ROOT}/${f}`, 'utf8');

let pass = 0, fail = 0;
function check(label, condition, detail = '') {
    if (condition) { pass++; console.log(`  OK    ${label}`); }
    else { fail++; console.log(`  ECHEC ${label} ${detail}`); }
}

async function boot(page, scripts, seed) {
    // window.location n'est pas remplacable dans jsdom. Une redirection s'y
    // signale par une erreur "not implemented" sur la console virtuelle : c'est
    // cet evenement qu'on observe pour verifier le renvoi vers le jeu, plutot
    // que de tenter de stubber location.
    //
    // Le libelle change selon la version de jsdom ("navigation to another
    // Document" en v30, "navigation (except hash changes)" en v26), d'ou un
    // motif volontairement large.
    const navigations = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on('jsdomError', err => {
        if (/navigation/i.test(err.message)) navigations.push('navigate');
    });

    const dom = new JSDOM(read(page), {
        url: 'https://example.test/',
        runScripts: 'outside-only',
        pretendToBeVisual: true,
        virtualConsole
    });
    const { window } = dom;
    await new Promise(r => {
        if (window.document.readyState === 'complete') r();
        else window.addEventListener('load', r, { once: true });
    });
    window.localStorage.clear();
    if (seed) for (const [k, v] of Object.entries(seed)) {
        window.localStorage.setItem(k, JSON.stringify(v));
    }
    const alerts = [];
    window.alert = m => alerts.push(m);
    window.confirm = () => true;

    window.eval(['js/storage.js', 'js/config.js', ...scripts].map(read).join('\n;\n'));
    window.document.dispatchEvent(new window.Event('DOMContentLoaded'));
    return { window, alerts, navigations };
}

const $ = (w, id) => w.document.getElementById(id);
const change = (w, node) => node.dispatchEvent(new w.Event('change', { bubbles: true }));
const sleep = ms => new Promise(r => setTimeout(r, ms));

(async () => {
    console.log('\n--- Page de configuration : construction ---');
    let { window: w, alerts, navigations } = await boot('config.html', ['js/config-page.js']);
    check('Anonyme + 6 joueurs proposes', $(w, 'player-options').children.length === 7,
          `-> ${$(w, 'player-options').children.length}`);
    check('8 tables proposees (2 a 9)', $(w, 'table-options').children.length === 8);
    check('4 couleurs proposees', $(w, 'color-options').children.length === 4);
    check('Anonyme est preselectionne',
          w.document.querySelector('input[name="player"]:checked').value === '');
    check('multiplication preselectionnee',
          w.document.querySelector('input[name="operation"]:checked').value === 'multiplication');
    check('timer 15 s preselectionne',
          w.document.querySelector('input[name="timer"]:checked').value === '15');
    check('entrainement cible actif par defaut', $(w, 'adaptive').checked === true);
    check('toutes les tables cochees par defaut',
          ['2', '3', '4', '5', '6', '7', '8', '9'].every(v =>
              w.document.querySelector(`input[name="tables"][value="${v}"]`).checked));

    console.log('\n--- Case "Toutes les tables" ---');
    check('la case globale est cochee au depart', $(w, 'all-tables').checked === true);
    check("l'etat n'est pas intermediaire", $(w, 'all-tables').indeterminate === false);
    const one = w.document.querySelector('input[name="tables"][value="7"]');
    one.checked = false;
    change(w, one);
    check('decocher une table repasse en intermediaire', $(w, 'all-tables').indeterminate === true);
    check('la case globale se decoche', $(w, 'all-tables').checked === false);

    console.log('\n--- Sauvegarde ---');
    w.document.querySelector('input[name="player"][value="Arthur"]').checked = true;
    w.document.querySelector('input[name="operation"][value="addition"]').checked = true;
    w.document.querySelector('input[name="timer"][value="30"]').checked = true;
    $(w, 'config-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
    const saved = JSON.parse(w.localStorage.getItem('gameConfig'));
    check('le joueur est enregistre', saved.playerName === 'Arthur');
    check("l'operation est enregistree", saved.operation === 'addition');
    check('le timer est enregistre', saved.timerDuration === 30);
    check('les tables 0, 1 et 10 sont ajoutees d office',
          [0, 1, 10].every(n => saved.selectedNumbers.includes(n)));
    check('la table 7 decochee est absente', !saved.selectedNumbers.includes(7));
    check('les tables sont triees',
          saved.selectedNumbers.join() === [...saved.selectedNumbers].sort((a, b) => a - b).join());
    // jsdom signale la navigation sur la console virtuelle au tick suivant.
    await sleep(20);
    check('redirection vers le jeu', navigations.length === 1, `-> ${navigations.length}`);
    check('aucune alerte', alerts.length === 0, `-> ${alerts}`);

    console.log('\n--- Retour a l anonymat ---');
    ({ window: w } = await boot('config.html', ['js/config-page.js'],
        { gameConfig: { playerName: 'Arthur', operation: 'multiplication', timerDuration: 15,
                        selectedNumbers: [0, 1, 2, 10], difficulty: 'hard', bgColor: '#f8c3d3',
                        adaptive: true, soundEnabled: true, configVersion: 2 } }));
    check('le prenom enregistre est relu',
          w.document.querySelector('input[name="player"]:checked').value === 'Arthur');
    w.document.querySelector('input[name="player"][value=""]').checked = true;
    $(w, 'config-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
    check('on peut redevenir anonyme',
          JSON.parse(w.localStorage.getItem('gameConfig')).playerName === '');

    console.log('\n--- Un prenom herite d une ancienne version ne colle pas ---');
    ({ window: w } = await boot('config.html', ['js/config-page.js'],
        // Config d'avant la 2.2 : « Emilie » y etait la valeur par defaut.
        { gameConfig: { playerName: 'Emilie', operation: 'multiplication', timerDuration: 15,
                        selectedNumbers: [0, 1, 2, 10], difficulty: 'hard', bgColor: '#f8c3d3',
                        adaptive: true, soundEnabled: true } }));
    check('la mise a jour repart en anonyme',
          w.document.querySelector('input[name="player"]:checked').value === '');

    console.log('\n--- Refus si aucune table entre 2 et 9 ---');
    ({ window: w, alerts, navigations } = await boot('config.html', ['js/config-page.js']));
    w.document.querySelectorAll('input[name="tables"]').forEach(cb => { cb.checked = false; });
    $(w, 'config-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
    check('une alerte previent le joueur', alerts.length === 1, `-> ${alerts}`);
    check('aucune redirection', navigations.length === 0);

    console.log('\n--- Reinitialisation ---');
    ({ window: w } = await boot('config.html', ['js/config-page.js'],
        { gameConfig: { playerName: 'Flora', operation: 'addition', timerDuration: 30,
                        selectedNumbers: [0, 1, 9, 10], difficulty: 'easy', bgColor: '#b3d9ff',
                        adaptive: false, soundEnabled: true, configVersion: 2 } }));
    check('la config enregistree est relue',
          w.document.querySelector('input[name="player"]:checked').value === 'Flora');
    check('la couleur enregistree est relue',
          w.document.querySelector('input[name="bgcolor"]:checked').value === '#b3d9ff');
    check('entrainement cible desactive relu', $(w, 'adaptive').checked === false);
    $(w, 'reset-button').click();
    check('retour a Anonyme',
          w.document.querySelector('input[name="player"]:checked').value === '');
    check('retour a toutes les tables', $(w, 'all-tables').checked === true);
    check('retour au rose',
          w.document.querySelector('input[name="bgcolor"]:checked').value === '#f8c3d3');

    console.log('\n--- Config d une ancienne version completee ---');
    ({ window: w } = await boot('config.html', ['js/config-page.js'],
        // Config telle que la v1.3 la sauvegardait : liste de joueurs, aucune
        // des clefs ajoutees depuis.
        { gameConfig: { playerNames: ['Louane', 'Arthur'], operation: 'multiplication',
                        selectedNumbers: [0, 1, 2, 10], difficulty: 'hard', timerDuration: 20 } }));
    check('la liste de joueurs de la v1.3 laisse place a l anonymat',
          w.document.querySelector('input[name="player"]:checked').value === '');
    check('les clefs manquantes prennent la valeur par defaut',
          $(w, 'adaptive').checked === true);
    check('la couleur par defaut est appliquee',
          w.document.querySelector('input[name="bgcolor"]:checked').value === '#f8c3d3');
    $(w, 'config-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
    check('la clef playerNames obsolete est retiree',
          !('playerNames' in JSON.parse(w.localStorage.getItem('gameConfig'))));

    console.log('\n--- Page des scores ---');
    const scores = [
        { id: '1', date: '2026-01-15T10:30:00.000Z', players: 'Emilie', time: 95, mistakes: 2,
          operation: 'multiplication', difficulty: 'hard', timerDuration: 15,
          selectedNumbers: [0,1,2,3,4,5,6,7,8,9,10] },
        { id: '2', date: '2026-01-16T11:00:00.000Z', players: 'Arthur', time: 62, mistakes: 0,
          operation: 'addition', difficulty: 'easy', timerDuration: 30, selectedNumbers: [0,1,2,10] },
        { id: '3', date: '2026-01-17T09:00:00.000Z', players: 'Flora', time: 140,
          operation: 'multiplication', difficulty: 'easy', timerDuration: 20, selectedNumbers: [0,1,5,10] }
    ];
    ({ window: w } = await boot('highscores.html', ['js/highscores-page.js'], { highscores: scores }));
    const rows = () => Array.from($(w, 'scores').querySelectorAll('.score'));
    check('3 scores affiches', rows().length === 3);
    check('tries du plus rapide au plus lent',
          rows().map(r => r.querySelector('.score-time').textContent).join(' ') === '1:02 1:35 2:20',
          `-> ${rows().map(r => r.querySelector('.score-time').textContent).join(' ')}`);
    check('le rang 1 est Arthur',
          rows()[0].querySelector('.score-player').textContent === 'Arthur');
    check('les erreurs apparaissent', rows()[0].querySelector('.score-meta').innerHTML.includes('0 erreur'));
    check('un score sans erreurs (v1.7) ne casse rien',
          !rows()[2].querySelector('.score-meta').innerHTML.includes('undefined'),
          `-> ${rows()[2].querySelector('.score-meta').innerHTML}`);
    check('toutes les tables reconnues',
          rows()[1].querySelector('.score-meta').innerHTML.includes('toutes les tables'));

    console.log('\n--- Filtres ---');
    const filter = v => w.document.querySelector(`input[data-filter][value="${v}"]`);
    filter('addition').checked = false;
    change(w, filter('addition'));
    check("l'addition disparait", rows().length === 2);
    check('il ne reste que des multiplications',
          rows().every(r => r.querySelector('.score-meta').innerHTML.includes('Multiplication')));
    filter('easy').checked = false;
    change(w, filter('easy'));
    check('un seul score en multiplication difficile', rows().length === 1);
    filter('multiplication').checked = false;
    change(w, filter('multiplication'));
    check('message quand aucun score ne correspond',
          $(w, 'scores').querySelector('.empty') !== null);

    console.log('\n--- Effacement ---');
    filter('multiplication').checked = true;
    filter('addition').checked = true;
    filter('easy').checked = true;
    change(w, filter('easy'));
    check('les scores reviennent', rows().length === 3);
    $(w, 'clear-button').click();
    check('tout est efface', $(w, 'scores').querySelector('.empty') !== null);
    check('le stockage est vide', w.localStorage.getItem('highscores') === null);

    console.log('\n--- Un nom de joueur n est jamais interprete comme du HTML ---');
    ({ window: w } = await boot('highscores.html', ['js/highscores-page.js'], {
        highscores: [{ id: 'x', date: '2026-01-01T10:00:00.000Z',
                       players: '<img src=x onerror=alert(1)>', time: 10, mistakes: 0,
                       operation: 'multiplication', difficulty: 'hard', timerDuration: 15,
                       selectedNumbers: [2] }]
    }));
    const player = $(w, 'scores').querySelector('.score-player');
    check('le nom est insere en texte brut', player.querySelector('img') === null);
    check('le contenu est bien le texte litteral',
          player.textContent === '<img src=x onerror=alert(1)>');

    console.log('\n===============================');
    console.log(`  ${pass} tests reussis, ${fail} echecs`);
    console.log('===============================');
    process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('\nERREUR DU HARNAIS:', e); process.exit(2); });
