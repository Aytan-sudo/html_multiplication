// Configuration du jeu : valeurs par defaut, chargement, validation.

// Version affichee dans les reglages. Elle est lue depuis le code reellement
// charge : si le service worker sert encore un ancien cache, c'est bien
// l'ancien numero qui s'affiche, et c'est l'information utile.
//
// Elle doit rester alignee avec « version » dans package.json et avec CACHE
// dans sw.js ; test-pages.js echoue si les trois divergent.
const APP_VERSION = '2.6.1';

const DEFAULT_CONFIG = {
    operation: 'multiplication',   // 'addition' ou 'multiplication'
    selectedNumbers: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10], // tables revisees (second operande)
    difficulty: 'hard',            // 'easy' (perte de la rangee) ou 'hard' (remise a zero)
    timerDuration: 15,             // secondes par question (15, 20 ou 30)
    diamondsPerRow: 10,
    totalRows: 3,
    maxFirstOperand: 9,            // premier operande tire entre 0 et cette valeur
    // Vide = anonyme. Un prenom preselectionne mettait le score et les
    // statistiques d'entrainement au compte de quelqu'un qui n'avait pas joue :
    // le prenom se choisit maintenant dans la configuration, pour ceux qui
    // veulent suivre leurs scores.
    playerName: '',
    bgColor: '#f8c3d3',
    adaptive: true,                // tirage pondere par les erreurs passees
    soundEnabled: true,
    configVersion: 3               // voir CONFIG_VERSION plus bas
};

const PLAYERS = ['Emilie', 'Louane', 'Arthur', 'Flora', 'Papa', 'Maman'];

// Nom affiche et enregistre quand aucun prenom n'est choisi. Les scores et les
// statistiques d'une partie anonyme partagent ce meme compte.
const ANONYMOUS = 'Anonyme';

function playerLabel(config) {
    return globalThis.Passeport?.profil()?.nom || config.playerName || ANONYMOUS;
}

const BG_COLORS = [
    { value: '#f8c3d3', label: 'Rose' },
    { value: '#b3d9ff', label: 'Bleu' },
    { value: '#c8e6c9', label: 'Vert' },
    { value: '#fff9c4', label: 'Jaune' }
];

const CONFIG_KEY = 'gameConfig';

// Numero de format de la config enregistree. Il ne change que lorsqu'une valeur
// deja stockee doit etre reinterpretee au chargement.
const CONFIG_VERSION = 3;

// Selection de tables des versions <= 2.1. Une config qui porte exactement
// cette liste n'a jamais vu l'ecran de configuration : c'est l'ancien defaut
// tel quel, et non un choix. La reconnaitre permet de la remplacer par le
// nouveau defaut sans effacer les selections voulues.
const LEGACY_TABLES = [0, 1, 2, 3, 4, 5];

function loadConfig() {
    const saved = GameStorage.getJSON(CONFIG_KEY, null);
    if (!saved) {
        return { ...DEFAULT_CONFIG };
    }

    // Les versions <= 1.3 stockaient une liste de joueurs au lieu d'un seul. La
    // clef est simplement retiree : le prenom d'alors ne serait de toute facon
    // pas repris, la migration ci-dessous repartant en anonyme.
    delete saved.playerNames;

    // Fusion avec les valeurs par defaut : une config enregistree par une
    // ancienne version n'a pas les clefs ajoutees depuis.
    const config = { ...DEFAULT_CONFIG, ...saved };

    // Migrations par palier. Chacune est conditionnee au numero d'origine et non
    // a l'ecart avec la version courante : sans cela, ajouter une migration
    // rejouerait toutes les precedentes et effacerait des choix faits depuis.
    const from = Number(saved.configVersion) || 1;

    // Palier 2 : le playerName d'une config anterieure a la 2.2 vaut « Emilie »
    // par simple effet de l'ancienne valeur par defaut, et non parce que
    // quelqu'un l'a choisi. On repart en anonyme.
    if (from < 2) {
        config.playerName = '';
    }

    // Palier 3 : les versions <= 2.1 ne proposaient que les tables de 2 a 5 par
    // defaut. Une config restee sur cette liste exacte n'a jamais ete modifiee ;
    // elle passe au nouveau defaut, toutes les tables. Une selection differente
    // est un choix delibere et n'est pas touchee.
    if (from < 3 && Array.isArray(saved.selectedNumbers)
        && [...saved.selectedNumbers].sort((a, b) => a - b).join() === LEGACY_TABLES.join()) {
        config.selectedNumbers = [...DEFAULT_CONFIG.selectedNumbers];
    }

    config.configVersion = CONFIG_VERSION;

    if (!PLAYERS.includes(config.playerName)) {
        config.playerName = '';
    }
    if (!Array.isArray(config.selectedNumbers) || config.selectedNumbers.length === 0) {
        config.selectedNumbers = [...DEFAULT_CONFIG.selectedNumbers];
    }
    return config;
}

function saveConfig(config) {
    return GameStorage.setJSON(CONFIG_KEY, config);
}

function resetConfig() {
    return { ...DEFAULT_CONFIG, playerName: globalThis.Passeport?.profilId ? 'profil' : '' };
}

function validateConfig(config) {
    const errors = [];

    if (!['addition', 'multiplication'].includes(config.operation)) {
        errors.push('Operation invalide');
    }
    if (!Array.isArray(config.selectedNumbers) || config.selectedNumbers.length === 0) {
        errors.push('Aucune table selectionnee');
    }
    if (!['easy', 'hard'].includes(config.difficulty)) {
        errors.push('Difficulte invalide');
    }
    if (![15, 20, 30].includes(config.timerDuration)) {
        errors.push('Duree du timer invalide');
    }
    // Un nom vide est valide : c'est le mode anonyme.
    if (config.playerName && !PLAYERS.includes(config.playerName) && !(globalThis.Passeport?.profilId && config.playerName === 'profil')) {
        errors.push('Joueur inconnu');
    }

    return { isValid: errors.length === 0, errors };
}

// Applique le theme choisi. La couleur part sur <html> plutot que sur <body>
// pour que le fond couvre aussi la zone de rebond du scroll sur iOS, et elle
// alimente <meta name="theme-color"> pour teinter la barre du navigateur.
function applyTheme(config) {
    document.documentElement.style.setProperty('--bg-color', config.bgColor);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
        meta.setAttribute('content', config.bgColor);
    }
}

const gameConfig = loadConfig();
if (globalThis.Passeport?.profilId) gameConfig.playerName = 'profil';
applyTheme(gameConfig);
