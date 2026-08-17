// Configuration par défaut du jeu
const defaultConfig = {
    operation: 'multiplication',  // 'addition' ou 'multiplication'
    selectedNumbers: [0, 1, 2, 3, 4, 5, 10],  // nombres utilisés pour le second opérande
    difficulty: 'hard',  // 'easy' (perte partielle) ou 'hard' (remise à zéro complète)
    timerDuration: 15,  // durée du timer en secondes (15, 20 ou 30)
    diamondsPerRow: 10,  // nombre de diamants par rangée
    totalRows: 3,  // nombre de rangées pour gagner
    maxFirstOperand: 9,  // valeur maximale pour le premier opérande (0 à cette valeur)
    playerName: 'Emilie',  // nom du joueur (choix: Emilie, Louane, Arthur, Flora)
    bgColor: '#f8c3d3'  // couleur de fond (rose par défaut)
};

// Fonctions pour gerer les cookies
function setCookie(name, value, days = 365) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + encodeURIComponent(value) + ';expires=' + expires.toUTCString() + ';path=/';
}

function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
    }
    return null;
}

// Charge la configuration depuis les cookies ou utilise la config par défaut
function loadConfig() {
    // Essaie d'abord localStorage (pour compatibilite avec versions anterieures sur serveur)
    let savedConfig = null;
    try {
        savedConfig = localStorage.getItem('gameConfig');
        if (savedConfig) {
            // Migre vers cookies
            setCookie('gameConfig', savedConfig);
            localStorage.removeItem('gameConfig');
        }
    } catch (e) {
        // localStorage non disponible (mode file://), on utilise directement les cookies
    }

    // Charge depuis les cookies
    if (!savedConfig) {
        savedConfig = getCookie('gameConfig');
    }

    if (savedConfig) {
        try {
            const config = JSON.parse(savedConfig);

            // Migration: convertit playerNames (array) en playerName (string)
            if (config.playerNames && Array.isArray(config.playerNames)) {
                config.playerName = config.playerNames[0] || 'Emilie';
                delete config.playerNames;
            }

            // Assure qu'on a bien un playerName
            if (!config.playerName) {
                config.playerName = 'Emilie';
            }

            return config;
        } catch (e) {
            console.error('Erreur lors du chargement de la configuration:', e);
            return { ...defaultConfig };
        }
    }
    return { ...defaultConfig };
}

// Sauvegarde la configuration dans les cookies
function saveConfig(config) {
    try {
        const configString = JSON.stringify(config);
        setCookie('gameConfig', configString);

        // Verification que la sauvegarde a reussi
        const verification = getCookie('gameConfig');
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

// Applique la couleur de fond
function applyBackgroundColor() {
    if (gameConfig.bgColor) {
        document.body.style.backgroundColor = gameConfig.bgColor;

        // Applique aussi au champ de saisie s'il existe
        const inputField = document.getElementById('submitting_answer');
        if (inputField) {
            inputField.style.backgroundColor = gameConfig.bgColor;
        }
    }
}

// Initialise la configuration globale
let gameConfig = loadConfig();

// Applique la couleur de fond au chargement
window.addEventListener('DOMContentLoaded', function() {
    applyBackgroundColor();
});
