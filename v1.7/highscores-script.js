// Charge et affiche les high scores
function loadAndDisplayScores() {
    // Charge depuis cookies ou localStorage (pour migration)
    let highscoresStr = getCookie('highscores');
    if (!highscoresStr) {
        try {
            highscoresStr = localStorage.getItem('highscores');
            if (highscoresStr) {
                // Migration vers cookies
                setCookie('highscores', highscoresStr);
                localStorage.removeItem('highscores');
            }
        } catch (e) {
            // localStorage non disponible (mode file://)
        }
    }

    const highscores = JSON.parse(highscoresStr || '[]');
    const scoresList = document.getElementById('scores-list');

    // Recupere les filtres actifs
    const filterMultiplication = document.getElementById('filter-multiplication').checked;
    const filterAddition = document.getElementById('filter-addition').checked;
    const filterEasy = document.getElementById('filter-easy').checked;
    const filterHard = document.getElementById('filter-hard').checked;

    // Filtre les scores
    const filteredScores = highscores.filter(score => {
        const operationMatch = (score.operation === 'multiplication' && filterMultiplication) ||
                               (score.operation === 'addition' && filterAddition);
        const difficultyMatch = (score.difficulty === 'easy' && filterEasy) ||
                                (score.difficulty === 'hard' && filterHard);
        return operationMatch && difficultyMatch;
    });

    // Affiche les scores
    if (filteredScores.length === 0) {
        scoresList.innerHTML = '<div class="no-scores">Aucun score enregistre pour ces filtres</div>';
        return;
    }

    scoresList.innerHTML = '';
    filteredScores.forEach((score, index) => {
        const scoreItem = document.createElement('div');
        scoreItem.className = 'score-item';

        // Formate la date
        const date = new Date(score.date);
        const dateStr = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;

        // Formate le temps (minutes:secondes)
        const minutes = Math.floor(score.time / 60);
        const seconds = score.time % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Mode de jeu
        const operationText = score.operation === 'multiplication' ? 'Multiplication' : 'Addition';
        const difficultyText = score.difficulty === 'easy' ? 'Facile' : 'Difficile';
        const modeStr = `${operationText} - ${difficultyText}`;

        // Verifie si toutes les tables (0-10) sont incluses
        const allTables = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
        const hasAllTables = allTables.every(num => score.selectedNumbers.includes(num));
        const allTablesIndicator = hasAllTables ? ' ⭐ TOUTES' : '';

        // Details
        const numbersStr = score.selectedNumbers.join(', ');
        const detailsStr = `Tables: ${numbersStr}${allTablesIndicator} | Timer: ${score.timerDuration}s`;

        scoreItem.innerHTML = `
            <div class="score-rank">#${index + 1}</div>
            <div class="score-date">${dateStr}</div>
            <div class="score-players">${score.players}</div>
            <div class="score-time">${timeStr}</div>
            <div class="score-mode">${modeStr}</div>
            <div class="score-details">${detailsStr}</div>
        `;

        scoresList.appendChild(scoreItem);
    });
}

// Efface tous les scores
document.getElementById('clear-button').addEventListener('click', function() {
    if (confirm('Etes-vous sur de vouloir effacer TOUS les high scores ? Cette action est irreversible.')) {
        // Efface le cookie
        document.cookie = 'highscores=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        // Efface aussi localStorage pour compatibilite
        try {
            localStorage.removeItem('highscores');
        } catch (e) {}
        loadAndDisplayScores();
        // Pas de popup de confirmation, la liste vide suffit comme feedback visuel
    }
});

// Retour au jeu
document.getElementById('back-button').addEventListener('click', function() {
    window.location.href = 'index.html';
});

// Gestion des filtres
document.getElementById('filter-multiplication').addEventListener('change', loadAndDisplayScores);
document.getElementById('filter-addition').addEventListener('change', loadAndDisplayScores);
document.getElementById('filter-easy').addEventListener('change', loadAndDisplayScores);
document.getElementById('filter-hard').addEventListener('change', loadAndDisplayScores);

// Charge les scores au chargement de la page
window.addEventListener('DOMContentLoaded', function() {
    loadAndDisplayScores();
});
