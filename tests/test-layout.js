// Mesure de la mise en page dans un vrai moteur de rendu.
//
// Deux facons de simuler le clavier virtuel, parce que les deux plateformes se
// comportent differemment :
//
//   Android + interactive-widget=resizes-content : la fenetre elle-meme
//   retrecit. On le reproduit en changeant la taille du viewport Puppeteer.
//
//   iOS : ni window.innerHeight ni 100dvh ne bougent, seul
//   window.visualViewport.height retrecit. On le reproduit en remplacant le
//   getter de hauteur puis en emettant l'evenement resize.

const puppeteer = require('puppeteer');
const path = require('path');
const http = require('http');
const fs = require('fs');

const ROOT = path.join(__dirname, '..');
const SHOTS = path.join(__dirname, 'shots');
let BASE = '';

const TYPES = {
    '.html': 'text/html', '.css': 'text/css', '.js': 'application/javascript',
    '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg',
    '.ttf': 'font/ttf', '.webmanifest': 'application/manifest+json'
};

// Serveur statique minimal : le test se suffit a lui-meme, inutile d'avoir
// lance `npm run serve` a cote.
function startServer() {
    return new Promise(resolve => {
        const server = http.createServer((req, res) => {
            const rel = decodeURIComponent(req.url.split('?')[0]).replace(/^\/+/, '') || 'index.html';
            const file = path.join(ROOT, rel);
            if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
                res.writeHead(404); res.end('introuvable'); return;
            }
            res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
            fs.createReadStream(file).pipe(res);
        });
        server.listen(0, '127.0.0.1', () => {
            BASE = `http://127.0.0.1:${server.address().port}`;
            resolve(server);
        });
    });
}

let pass = 0, fail = 0;
const check = (label, cond, detail = '') => {
    if (cond) { pass++; }
    else { fail++; console.log(`  ECHEC  ${label}  ${detail}`); }
    return cond;
};

const DEVICES = [
    { name: 'iPhone SE',        w: 375, h: 667, kb: 260, ios: true },
    { name: 'iPhone 13 mini',   w: 375, h: 812, kb: 336, ios: true },
    { name: 'iPhone 15',        w: 393, h: 852, kb: 336, ios: true },
    { name: 'iPhone 15 ProMax', w: 430, h: 932, kb: 346, ios: true },
    { name: 'Galaxy S8',        w: 360, h: 740, kb: 300, ios: false },
    { name: 'Pixel 7',          w: 412, h: 915, kb: 310, ios: false },
    { name: 'Android compact',  w: 360, h: 640, kb: 290, ios: false },
    { name: 'iPad mini',        w: 768, h: 1024, kb: 400, ios: true },
    { name: 'Phone paysage',    w: 844, h: 390, kb: 200, ios: true }
];

// Elements qui doivent rester entierement visibles pendant une partie.
const CRITICAL = [
    ['la barre du haut', '.topbar'],
    ['la question', '.question'],
    ['le champ de reponse', '#answer-input'],
    ['le bouton OK', '.answer-form button[type="submit"]'],
    ['la barre de temps', '.timer'],
    ['les diamants', '#diamonds']
];

async function inspect(page) {
    return page.evaluate((critical) => {
        const root = document.documentElement;
        const app = document.querySelector('.app');
        const screen = document.querySelector('#screen-game');
        const appRect = app.getBoundingClientRect();

        const boxes = {};
        for (const [label, selector] of critical) {
            const node = document.querySelector(selector);
            if (!node) { boxes[label] = null; continue; }
            const r = node.getBoundingClientRect();
            boxes[label] = { top: r.top, bottom: r.bottom, left: r.left, right: r.right,
                             width: r.width, height: r.height };
        }

        // Balayage generique : le cadre est en overflow:hidden, donc un enfant
        // trop large est purement coupe sans jamais apparaitre dans
        // scrollWidth. Comparer chaque rectangle a celui du cadre est le seul
        // moyen de reperer un bouton tranche. C'est ce qui manquait quand le
        // bouton Quitter sortait de l'ecran sans qu'aucune mesure ne bronche.
        const clipped = [];
        for (const node of app.querySelectorAll('*')) {
            if (node.classList.contains('sr-only')) continue;
            const r = node.getBoundingClientRect();
            if (r.width < 2 || r.height < 2) continue;
            const style = getComputedStyle(node);
            if (style.visibility === 'hidden' || style.opacity === '0') continue;

            const over = {
                gauche: appRect.left - r.left,
                droite: r.right - appRect.right,
                haut: appRect.top - r.top,
                bas: r.bottom - appRect.bottom
            };
            const worst = Object.entries(over).filter(([, v]) => v > 1);
            if (worst.length) {
                clipped.push({
                    tag: node.id ? '#' + node.id
                         : node.className ? '.' + String(node.className).split(' ')[0]
                         : node.tagName.toLowerCase(),
                    text: (node.textContent || '').trim().slice(0, 20),
                    over: worst.map(([k, v]) => `${k} ${Math.round(v)}px`).join(', ')
                });
            }
        }

        return {
            clipped,
            compact: root.dataset.compact,
            keyboard: root.dataset.keyboard,
            appH: getComputedStyle(root).getPropertyValue('--app-h').trim(),
            // Debordement horizontal du document
            docScrollW: root.scrollWidth,
            docClientW: root.clientWidth,
            // Debordement vertical du document
            docScrollH: root.scrollHeight,
            docClientH: root.clientHeight,
            // Debordement interne du cadre et de l'ecran de jeu
            appScrollH: app.scrollHeight,
            appClientH: app.clientHeight,
            screenScrollH: screen.scrollHeight,
            screenClientH: screen.clientHeight,
            appTop: appRect.top,
            appBottom: appRect.bottom,
            boxes
        };
    }, CRITICAL);
}

function verify(label, info, visibleHeight, width) {
    let ok = true;

    ok &= check(`${label} : aucun element rogne par le cadre`,
        info.clipped.length === 0,
        info.clipped.map(c => `${c.tag}${c.text ? ` "${c.text}"` : ''} deborde de ${c.over}`).join(' | '));

    ok &= check(`${label} : pas de debordement horizontal`,
        info.docScrollW <= info.docClientW + 1,
        `scrollWidth ${info.docScrollW} > clientWidth ${info.docClientW}`);

    ok &= check(`${label} : la page ne defile pas verticalement`,
        info.docScrollH <= info.docClientH + 1,
        `scrollHeight ${info.docScrollH} > clientHeight ${info.docClientH}`);

    ok &= check(`${label} : le cadre ne deborde pas`,
        info.appScrollH <= info.appClientH + 1,
        `${info.appScrollH} > ${info.appClientH}`);

    ok &= check(`${label} : l'ecran de jeu ne deborde pas`,
        info.screenScrollH <= info.screenClientH + 1,
        `${info.screenScrollH} > ${info.screenClientH}`);

    for (const [name, box] of Object.entries(info.boxes)) {
        // Au niveau de compacite extreme, la rangee de diamants est masquee
        // volontairement pour laisser la place a la question et au champ.
        if (name === 'les diamants' && info.compact === '3') {
            check(`${label} : les diamants sont bien masques en mode extreme`,
                  !box || box.height === 0, `-> ${box && box.height}`);
            continue;
        }
        if (!box) { check(`${label} : ${name} existe`, false, 'introuvable'); ok = false; continue; }
        ok &= check(`${label} : ${name} tient en hauteur`,
            box.top >= -1 && box.bottom <= visibleHeight + 1,
            `haut ${Math.round(box.top)} bas ${Math.round(box.bottom)} pour ${visibleHeight} px visibles`);
        ok &= check(`${label} : ${name} tient en largeur`,
            box.left >= -1 && box.right <= width + 1,
            `gauche ${Math.round(box.left)} droite ${Math.round(box.right)} pour ${width} px`);
        ok &= check(`${label} : ${name} est visible`,
            box.height > 0 && box.width > 0, `${box.width} x ${box.height}`);
    }
    return ok;
}

(async () => {
    fs.mkdirSync(SHOTS, { recursive: true });
    const server = await startServer();

    const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox'] });

    for (const d of DEVICES) {
        const page = await browser.newPage();
        await page.setViewport({ width: d.w, height: d.h, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        await page.goto(`${BASE}/index.html`, { waitUntil: 'networkidle0' });

        // Ecran titre
        let info = await inspect(page);
        check(`${d.name} / titre : pas de debordement horizontal`,
            info.docScrollW <= info.docClientW + 1,
            `${info.docScrollW} > ${info.docClientW}`);
        check(`${d.name} / titre : pas de defilement vertical`,
            info.docScrollH <= info.docClientH + 1,
            `${info.docScrollH} > ${info.docClientH}`);

        // On lance la partie
        await page.click('#start-btn');
        await new Promise(r => setTimeout(r, 150));

        info = await inspect(page);
        const okNormal = verify(`${d.name} / clavier ferme`, info, d.h, d.w);
        console.log(`  ${okNormal ? 'OK   ' : 'KO   '} ${d.name.padEnd(18)} ${d.w}x${d.h}  clavier ferme   compact=${info.compact} --app-h=${info.appH}`);
        await page.screenshot({ path: path.join(SHOTS, `${d.name.replace(/ /g, '-')}-normal.png`) });

        // --- Clavier ouvert ---
        const visible = d.h - d.kb;
        if (d.ios) {
            // iOS : la fenetre garde sa taille, seul visualViewport retrecit.
            await page.evaluate(h => {
                Object.defineProperty(window.visualViewport, 'height', {
                    configurable: true, get: () => h
                });
                window.visualViewport.dispatchEvent(new Event('resize'));
            }, visible);
        } else {
            // Android resizes-content : la fenetre entiere retrecit.
            await page.setViewport({ width: d.w, height: visible, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        }
        await page.focus('#answer-input');
        await new Promise(r => setTimeout(r, 600));

        info = await inspect(page);
        const okKb = verify(`${d.name} / clavier ouvert`, info, visible, d.w);
        console.log(`  ${okKb ? 'OK   ' : 'KO   '} ${d.name.padEnd(18)} ${d.w}x${visible}  clavier ouvert  compact=${info.compact} clavier=${info.keyboard} --app-h=${info.appH}`);

        // La zone sous le clavier doit rester vide de tout element interactif.
        const bottom = info.boxes['le champ de reponse'].bottom;
        check(`${d.name} : le champ reste au-dessus du clavier`,
            bottom <= visible + 1, `bas du champ a ${Math.round(bottom)} px, zone visible ${visible} px`);

        await page.setViewport({ width: d.w, height: d.ios ? d.h : visible, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
        await page.screenshot({ path: path.join(SHOTS, `${d.name.replace(/ /g, '-')}-clavier.png`),
                                clip: { x: 0, y: 0, width: d.w, height: visible } });
        await page.close();
    }

    // --- Pages secondaires : elles doivent defiler, pas deborder en largeur ---
    console.log('');
    for (const p of ['/config.html', '/highscores.html']) {
        for (const d of [DEVICES[0], DEVICES[4], DEVICES[8]]) {
            const page = await browser.newPage();
            await page.setViewport({ width: d.w, height: d.h, isMobile: true, hasTouch: true });
            await page.goto(BASE + p, { waitUntil: 'networkidle0' });
            const r = await page.evaluate(() => {
                // Un texte plus large que sa pastille ne fait pas grandir la
                // page : il deborde par-dessus le voisin. Aucune mesure au
                // niveau du document ne le voit, d'ou ce controle par element.
                const overflowing = [];
                for (const node of document.querySelectorAll('.option, .score, .panel *')) {
                    if (node.scrollWidth > node.clientWidth + 1 && node.clientWidth > 0) {
                        overflowing.push(`${node.className || node.tagName} "${(node.textContent || '').trim().slice(0, 14)}" ${node.scrollWidth}>${node.clientWidth}`);
                    }
                }
                // Deux pastilles voisines ne doivent jamais se recouvrir.
                const overlaps = [];
                const pills = [...document.querySelectorAll('.option')];
                for (let i = 0; i < pills.length; i++) {
                    for (let j = i + 1; j < pills.length; j++) {
                        const a = pills[i].getBoundingClientRect();
                        const b = pills[j].getBoundingClientRect();
                        if (a.left < b.right - 1 && b.left < a.right - 1 &&
                            a.top < b.bottom - 1 && b.top < a.bottom - 1) {
                            overlaps.push(`${pills[i].textContent.trim()} / ${pills[j].textContent.trim()}`);
                        }
                    }
                }
                return {
                    sw: document.documentElement.scrollWidth,
                    cw: document.documentElement.clientWidth,
                    overflowing, overlaps
                };
            });
            check(`${p} sur ${d.name} : pas de debordement horizontal`,
                r.sw <= r.cw + 1, `${r.sw} > ${r.cw}`);
            check(`${p} sur ${d.name} : aucun texte ne deborde de sa pastille`,
                r.overflowing.length === 0, r.overflowing.join(' | '));
            check(`${p} sur ${d.name} : aucune pastille n'en recouvre une autre`,
                r.overlaps.length === 0, r.overlaps.join(' | '));
            await page.close();
        }
    }
    console.log(`  pages secondaires verifiees`);

    await browser.close();
    server.close();
    console.log('\n===============================');
    console.log(`  ${pass} controles reussis, ${fail} echecs`);
    console.log('===============================');
    process.exit(fail === 0 ? 0 : 1);
})().catch(e => { console.error('ERREUR:', e); process.exit(2); });
