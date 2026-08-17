// Mesure de la zone reellement visible.
//
// Le probleme que ce fichier resout : `100dvh` tient compte des barres du
// navigateur mais **pas** du clavier virtuel. Quand le clavier s'ouvre :
//
//   - sur iOS, ni window.innerHeight ni 100dvh ne bougent. La page reste haute
//     de tout l'ecran alors que la moitie est cachee sous le clavier, et le
//     timer se retrouve dessous.
//   - sur Android, le comportement depend de `interactive-widget` dans la
//     balise viewport ; sans lui, meme symptome.
//
// Seul `window.visualViewport` decrit la zone reellement visible dans les deux
// cas. On l'expose en variable CSS `--app-h`, et on classe la hauteur
// disponible en trois niveaux de compacite que la feuille de style exploite
// pour retrecir progressivement le jeu au lieu de le laisser deborder.

(function () {
    const root = document.documentElement;
    const vv = window.visualViewport;

    // Seuils de hauteur disponible, en pixels CSS.
    //   0 = confortable (telephone debout, clavier ferme)
    //   1 = reduit      (petit ecran, ou paysage clavier ferme)
    //   2 = serre       (clavier ouvert debout : il reste 350 a 450 px)
    //   3 = extreme     (telephone couche clavier ouvert : parfois 190 px,
    //                    la zone de score est alors sacrifiee)
    //
    // Le seuil extreme est volontairement bas : un telephone couche clavier
    // ferme offre environ 390 px, ou le niveau 2 tient sans peine. Masquer le
    // score des 400 px privait de leurs diamants des enfants qui jouent
    // simplement a l'horizontale.
    const COMFORTABLE = 640;
    const REDUCED = 520;
    const EXTREME = 300;

    let frame = null;

    function measure() {
        frame = null;

        const height = vv ? vv.height : window.innerHeight;
        const offsetTop = vv ? vv.offsetTop : 0;

        root.style.setProperty('--app-h', `${Math.round(height)}px`);
        // Sur iOS, Safari fait defiler la fenetre de mise en page pour degager
        // le champ ; un element en position fixed suit ce defilement et sort de
        // l'ecran. On le recale en le decalant de la meme quantite.
        root.style.setProperty('--app-top', `${Math.round(offsetTop)}px`);

        root.dataset.compact =
            height < EXTREME ? '3' :
            height < REDUCED ? '2' :
            height < COMFORTABLE ? '1' : '0';

        // Utile pour masquer ce qui n'a pas besoin d'etre lu pendant la saisie.
        // Sur iOS la fenetre ne retrecit pas, d'ou l'ecart entre les deux
        // hauteurs ; sur Android en mode resizes-content, les deux retrecissent
        // ensemble et c'est le niveau de compacite qui prend le relais.
        const keyboardOpen = window.innerHeight - height > 120;
        root.dataset.keyboard = keyboardOpen ? 'open' : 'closed';
    }

    // Les evenements de viewport arrivent en rafale pendant l'animation du
    // clavier : on ne recalcule qu'une fois par image.
    function schedule() {
        if (frame === null) {
            frame = requestAnimationFrame(measure);
        }
    }

    measure();

    if (vv) {
        vv.addEventListener('resize', schedule);
        vv.addEventListener('scroll', schedule);
    }
    window.addEventListener('resize', schedule);

    // L'orientation change avant que les nouvelles dimensions soient connues.
    window.addEventListener('orientationchange', () => setTimeout(measure, 250));

    // iOS n'emet pas toujours l'evenement de redimensionnement a l'ouverture du
    // clavier. Une mesure differee apres la mise au point rattrape ces cas.
    document.addEventListener('focusin', event => {
        if (event.target.matches('input, textarea')) {
            setTimeout(measure, 100);
            setTimeout(measure, 400);
        }
    });
    document.addEventListener('focusout', () => setTimeout(measure, 100));
})();
