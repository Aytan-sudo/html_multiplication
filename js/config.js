// Configuration du jeu : valeurs par defaut, chargement, validation.

const DEFAULT_CONFIG = {
    operation: 'multiplication',   // 'addition' ou 'multiplication'
    selectedNumbers: [0, 1, 2, 3, 4, 5, 10], // tables revisees (second operande)
    difficulty: 'hard',            // 'easy' (perte de la rangee) ou 'hard' (remise a zero)
    timerDuration: 15,             // secondes par question (15, 20 ou 30)
    diamondsPerRow: 10,
    totalRows: 3,
    maxFirstOperand: 9,            // premier operande tire entre 0 et cette valeur
    playerName: 'Emilie',
    bgColor: '#f8c3d3',
    adaptive: true,                // tirage pondere par les erreurs passees
    soundEnabled: true
};

const PLAYERS = ['Emilie', 'Louane', 'Arthur', 'Flora', 'Papa', 'Maman'];

const BG_COLORS = [
    { value: '#f8c3d3', label: 'Rose' },
    { value: '#b3d9ff', label: 'Bleu' },
    { value: '#c8e6c9', label: 'Vert' },
    { value: '#fff9c4', label: 'Jaune' }
];

const CONFIG_KEY = 'gameConfig';

function loadConfig() {
    const saved = GameStorage.getJSON(CONFIG_KEY, null);
    if (!saved) {
        return { ...DEFAULT_CONFIG };
    }

    // Les versions <= 1.3 stockaient une liste de joueurs au lieu d'un seul.
    if (Array.isArray(saved.playerNames)) {
        saved.playerName = saved.playerNames[0];
        delete saved.playerNames;
    }

    // Fusion avec les valeurs par defaut : une config enregistree par une
    // ancienne version n'a pas les clefs ajoutees depuis.
    const config = { ...DEFAULT_CONFIG, ...saved };

    if (!PLAYERS.includes(config.playerName)) {
        config.playerName = DEFAULT_CONFIG.playerName;
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
    return { ...DEFAULT_CONFIG };
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
    if (!PLAYERS.includes(config.playerName)) {
        errors.push('Aucun joueur selectionne');
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
applyTheme(gameConfig);
