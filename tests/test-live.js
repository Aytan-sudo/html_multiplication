// Verification de bout en bout contre le site reellement deploye :
// on telecharge index.html et ses scripts depuis GitHub Pages, puis on joue
// une partie complete dans jsdom.
const { JSDOM } = require('jsdom');

const BASE = 'https://aytan-sudo.github.io/html_multiplication';
let pass = 0, fail = 0;
const check = (l, c, d = '') => {
    if (c) { pass++; console.log(`  OK    ${l}`); }
    else { fail++; console.log(`  ECHEC ${l} ${d}`); }
};

const get = async p => {
    const r = await fetch(BASE + p);
    if (!r.ok) throw new Error(`${p} -> HTTP ${r.status}`);
    return r.text();
};

(async () => {
    console.log('\n--- Telechargement depuis GitHub Pages ---');
    const html = await get('/index.html');
    const scripts = {};
    for (const f of ['storage', 'config', 'questions', 'game']) {
        scripts[f] = await get(`/js/${f}.js`);
    }
    check('index.html recupere', html.includes('<title>Multiplication</title>'));
    check('les 4 scripts du moteur sont recuperes', Object.keys(scripts).length === 4);

    console.log('\n--- Balises indispensables au mobile ---');
    check('viewport avec viewport-fit=cover', /viewport-fit=cover/.test(html));
    check('theme-color present', /name="theme-color"/.test(html));
    check('manifest lie', /rel="manifest"/.test(html));
    check('apple-touch-icon present', /rel="apple-touch-icon"/.test(html));
    check('champ en inputmode numeric', /inputmode="numeric"/.test(html));
    check('bouton de validation present', /type="submit"/.test(html));
    check('enterkeyhint pour le clavier mobile', /enterkeyhint="done"/.test(html));
    check('aucune reference a un CDN externe', !/https?:\/\/cdn\./.test(html),
          html.match(/https?:\/\/cdn\.[^"']*/)?.[0] || '');

    console.log('\n--- Manifeste ---');
    const manifest = JSON.parse(await get('/manifest.webmanifest'));
    check('display standalone', manifest.display === 'standalone');
    check('deux icones declarees', manifest.icons.length === 2);
    check('icones maskables', manifest.icons.every(i => i.purpose.includes('maskable')));
    for (const icon of manifest.icons) {
        const r = await fetch(`${BASE}/${icon.src}`);
        check(`icone ${icon.sizes} accessible`, r.ok && r.headers.get('content-type').includes('png'));
    }

    console.log('\n--- Partie complete jouee sur le site deploye ---');
    const dom = new JSDOM(html, { url: BASE + '/', runScripts: 'outside-only', pretendToBeVisual: true });
    const w = dom.window;
    await new Promise(r => {
        if (w.document.readyState === 'complete') r();
        else w.addEventListener('load', r, { once: true });
    });
    const played = [];
    w.Audio = class { constructor(s) { this.src = s; } play() { played.push(this.src); return Promise.resolve(); } pause() {} };
    w.confetti = () => {};
    w.localStorage.clear();
    w.eval(Object.values(scripts).join('\n;\n')
        + ';window.__t={get state(){return state},get gameConfig(){return gameConfig}};');
    w.document.dispatchEvent(new w.Event('DOMContentLoaded'));

    const $ = id => w.document.getElementById(id);
    $('start-btn').click();
    check('la partie demarre', !$('screen-game').hidden);

    for (let i = 0; i < 30; i++) {
        const f = w.__t.state.fact;
        $('answer-input').value = String(f.a * f.b);
        $('answer-form').dispatchEvent(new w.Event('submit', { cancelable: true }));
    }
    check('30 bonnes reponses menent a la victoire', !$('screen-victory').hidden);
    check('le rang est calcule', $('victory-rank').textContent === '#1',
          `-> ${$('victory-rank').textContent}`);
    check('le score est enregistre',
          JSON.parse(w.localStorage.getItem('highscores')).length === 1);
    check('des statistiques sont collectees',
          Object.keys(w.localStorage).some(k => k.startsWith('stats:')));

    console.log('\n--- Poids du premier chargement (avant de lancer une partie) ---');
    const firstLoad = [
        '/index.html', '/css/style.css', '/js/storage.js', '/js/config.js',
        '/js/questions.js', '/js/game.js', '/js/register-sw.js',
        '/js/vendor/confetti.min.js', '/assets/fonts/Daydream.ttf',
        '/assets/img/unmute.webp', '/assets/img/trophee.webp', '/assets/img/config.webp',
        '/assets/audio/error.mp3', '/manifest.webmanifest'
    ];
    let total = 0;
    for (const p of firstLoad) {
        const r = await fetch(BASE + p);
        total += (await r.arrayBuffer()).byteLength;
    }
    const kb = Math.round(total / 1024);
    console.log(`  ${kb} Ko pour afficher l'ecran titre`);
    check("le premier chargement reste sous 300 Ko", kb < 300, `-> ${kb} Ko`);

    const themeSize = Math.round(
        (await (await fetch(BASE + '/assets/audio/theme.mp3')).arrayBuffer()).byteLength / 1024);
    console.log(`  + ${themeSize} Ko de musique, seulement au lancement de la partie`);
    console.log(`  (la v1.7 chargeait 5747 Ko de musique des l'ouverture de la page)`);

    console.log('\n--- Archive v1.7 toujours en ligne ---');
    const old = await get('/v1.7/index.html');
    check("l'archive repond", old.includes('Multiplication'));
    check("l'archive garde son code d'origine", old.includes('script.js'));
    for (const p of ['/v1.7/script.js', '/v1.7/style.css', '/v1.7/img/theme.mp3', '/v1.7/img/diamond_yellow.png']) {
        const r = await fetch(BASE + p);
        check(`${p} accessible`, r.ok);
    }

    console.log('\n===============================');
    console.log(`  ${pass} verifications reussies, ${fail} echecs`);
    console.log('===============================');
    process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('\nERREUR:', e.message); process.exit(2); });
