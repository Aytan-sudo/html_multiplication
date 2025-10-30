// Charge la configuration actuelle dans le formulaire
function loadFormData() {
    const config = loadConfig();

    // Type d'opération
    document.querySelector(`input[name="operation"][value="${config.operation}"]`).checked = true;

    // Nombres sélectionnés
    config.selectedNumbers.forEach(num => {
        const checkbox = document.querySelector(`input[name="numbers"][value="${num}"]`);
        if (checkbox) {
            checkbox.checked = true;
        }
    });

    // Difficulté
    document.querySelector(`input[name="difficulty"][value="${config.difficulty}"]`).checked = true;

    // Timer
    document.querySelector(`input[name="timer"][value="${config.timerDuration}"]`).checked = true;

    // Joueur
    const playerRadio = document.querySelector(`input[name="player"][value="${config.playerName}"]`);
    if (playerRadio) {
        playerRadio.checked = true;
    }

    // Couleur de fond
    const bgColorRadio = document.querySelector(`input[name="bgcolor"][value="${config.bgColor}"]`);
    if (bgColorRadio) {
        bgColorRadio.checked = true;
    }
}

// Récupère les données du formulaire
function getFormData() {
    const config = {};

    // Type d'opération
    config.operation = document.querySelector('input[name="operation"]:checked').value;

    // Nombres sélectionnés
    const numbersCheckboxes = document.querySelectorAll('input[name="numbers"]:checked');
    config.selectedNumbers = Array.from(numbersCheckboxes).map(cb => parseInt(cb.value));

    // Difficulté
    config.difficulty = document.querySelector('input[name="difficulty"]:checked').value;

    // Timer
    config.timerDuration = parseInt(document.querySelector('input[name="timer"]:checked').value);

    // Valeurs par défaut pour les paramètres non modifiables dans le formulaire
    config.diamondsPerRow = gameConfig.diamondsPerRow;
    config.totalRows = gameConfig.totalRows;
    config.maxFirstOperand = gameConfig.maxFirstOperand;

    // Joueur
    config.playerName = document.querySelector('input[name="player"]:checked').value;

    // Couleur de fond
    config.bgColor = document.querySelector('input[name="bgcolor"]:checked').value;

    return config;
}

// Gestion du formulaire
document.getElementById('config-form').addEventListener('submit', function(e) {
    e.preventDefault();

    const newConfig = getFormData();

    // Validation
    if (newConfig.selectedNumbers.length === 0) {
        alert('Veuillez selectionner au moins un nombre !');
        return;
    }

    if (!newConfig.playerName) {
        alert('Veuillez selectionner un joueur !');
        return;
    }

    // Validation complete
    const validation = validateConfig(newConfig);
    if (!validation.isValid) {
        alert('Erreur de configuration :\n' + validation.errors.join('\n'));
        return;
    }

    // Sauvegarde
    if (saveConfig(newConfig)) {
        // Redirection directe vers la page de jeu (pas de popup)
        window.location.href = 'index.html';
    } else {
        alert('Erreur lors de la sauvegarde de la configuration.');
    }
});

// Bouton de reinitialisation
document.getElementById('reset-button').addEventListener('click', function() {
    if (confirm('Voulez-vous vraiment reinitialiser la configuration aux valeurs par defaut ?')) {
        gameConfig = resetConfig();
        saveConfig(gameConfig);
        loadFormData();
        // Pas de popup de confirmation, le rechargement du formulaire suffit
    }
});

// Charge les données au chargement de la page
window.addEventListener('DOMContentLoaded', function() {
    loadFormData();
});
