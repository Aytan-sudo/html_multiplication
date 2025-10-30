// Configuration par défaut du jeu
const defaultConfig = {
    operation: 'multiplication',  // 'addition' ou 'multiplication'
    selectedNumbers: [2, 3, 4, 5, 10],  // nombres utilisés pour le second opérande
    difficulty: 'hard',  // 'easy' (perte partielle) ou 'hard' (remise à zéro complète)
    timerDuration: 15,  // durée du timer en secondes (15, 20 ou 30)
    diamondsPerRow: 10,  // nombre de diamants par rangée
    totalRows: 3,  // nombre de rangées pour gagner
    maxFirstOperand: 9,  // valeur maximale pour le premier opérande (0 à cette valeur)
    playerName: 'Emilie'  // nom du joueur (choix: Emilie, Louane, Arthur, Flora)
};

// Fonctions pour gerer les cookies
function setCookie(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + expires.toUTCString() + ';path=/';
    console.log('setCookie - Cookie defini:', name, '=', value);
}

function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            const value = decodeURIComponent(c.substring(nameEQ.length, c.length));
            console.log('getCookie - Cookie trouve:', name, '=', value);
            return value;
        }
    }
    console.log('getCookie - Cookie non trouve:', name);
    return null;
}

// Charge la configuration depuis les cookies ou utilise la config par défaut
function loadConfig() {
    // Essaie d'abord localStorage (pour compatibilite avec versions anterieures sur serveur)
    let savedConfig = null;
    try {
        savedConfig = localStorage.getItem('gameConfig');
        if (savedConfig) {
            console.log('loadConfig - Config trouvee dans localStorage, migration vers cookies');
            // Migre vers cookies
            setCookie('gameConfig', savedConfig);
            localStorage.removeItem('gameConfig');
        }
    } catch (e) {
        console.log('loadConfig - localStorage non disponible, utilisation des cookies');
    }

    // Charge depuis les cookies
    if (!savedConfig) {
        savedConfig = getCookie('gameConfig');
    }

    console.log('loadConfig - savedConfig brut:', savedConfig);

    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);
            console.log('loadConfig - config parse:', config);

            // Migration: convertit playerNames (array) en playerName (string)
            if (config.playerNames && Array.isArray(config.playerNames)) {
                config.playerName = config.playerNames[0] || 'Emilie';
                delete config.playerNames;
                console.log('Migration playerNames -> playerName:', config.playerName);
            }

            // Assure qu'on a bien un playerName
            if (!config.playerName) {
                config.playerName = 'Emilie';
                console.log('playerName manquant, mise a Emilie par defaut');
            }

            console.log('loadConfig - config finale:', config);
            return config;
        } catch (e) {
            console.error('Erreur lors du chargement de la configuration:', e);
            return { ...defaultConfig };
        }
    }
    console.log('Pas de config sauvegardee, utilisation des valeurs par defaut');
    return { ...defaultConfig };
}

// Sauvegarde la configuration dans les cookies
function saveConfig(config) {
    try {
        const configString = JSON.stringify(config);
        console.log('saveConfig - Sauvegarde de:', configString);
        setCookie('gameConfig', configString);

        // Verification
        const verification = getCookie('gameConfig');
        console.log('saveConfig - Verification apres sauvegarde:', verification);
        return verification !== null;
    } catch (e) {
        console.error('Erreur lors de la sauvegarde de la configuration:', e);
        return false;
    }
}

// Réinitialise la configuration aux valeurs par défaut
function resetConfig() {
    return { ...defaultConfig };
}

// Valide la configuration
function validateConfig(config) {
    const errors = [];

    if (!['addition', 'multiplication'].includes(config.operation)) {
        errors.push('Opération invalide');
    }

    if (!Array.isArray(config.selectedNumbers) || config.selectedNumbers.length === 0) {
        errors.push('Aucun nombre sélectionné');
    }

    if (!['easy', 'hard'].includes(config.difficulty)) {
        errors.push('Difficulté invalide');
    }

    if (![15, 20, 30].includes(config.timerDuration)) {
        errors.push('Durée du timer invalide');
    }

    if (!config.playerName || config.playerName.trim() === '') {
        errors.push('Aucun joueur selectionne');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Initialise la configuration globale
let gameConfig = loadConfig();
