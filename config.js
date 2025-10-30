// Configuration par défaut du jeu
const defaultConfig = {
    operation: 'multiplication',  // 'addition' ou 'multiplication'
    selectedNumbers: [2, 3, 4, 5, 10],  // nombres utilisés pour le second opérande
    difficulty: 'hard',  // 'easy' (perte partielle) ou 'hard' (remise à zéro complète)
    timerDuration: 15,  // durée du timer en secondes (15, 20 ou 30)
    diamondsPerRow: 10,  // nombre de diamants par rangée
    totalRows: 3,  // nombre de rangées pour gagner
    maxFirstOperand: 9,  // valeur maximale pour le premier opérande (0 à cette valeur)
    playerNames: ['Emilie', 'Louane']  // noms des joueurs (choix: Emilie, Louane, Arthur, Flora)
};

// Charge la configuration depuis localStorage ou utilise la config par défaut
function loadConfig() {
    const savedConfig = localStorage.getItem('gameConfig');
    if (savedConfig) {
        try {
            return JSON.parse(savedConfig);
        } catch (e) {
            console.error('Erreur lors du chargement de la configuration:', e);
            return { ...defaultConfig };
        }
    }
    return { ...defaultConfig };
}

// Sauvegarde la configuration dans localStorage
function saveConfig(config) {
    try {
        localStorage.setItem('gameConfig', JSON.stringify(config));
        return true;
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

    if (!Array.isArray(config.playerNames) || config.playerNames.length === 0) {
        errors.push('Aucun joueur sélectionné');
    }

    return {
        isValid: errors.length === 0,
        errors: errors
    };
}

// Initialise la configuration globale
let gameConfig = loadConfig();
