// Page des meilleurs scores.

const ALL_TABLES = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

function activeFilters(kind) {
    return Array.from(document.querySelectorAll(`input[data-filter="${kind}"]:checked`))
        .map(cb => cb.value);
}

function formatDate(iso) {
    const d = new Date(iso);
    const pad = n => String(n).padStart(2, '0');
    return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatTime(seconds) {
    return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function describe(score) {
    const operation = score.operation === 'addition' ? 'Addition' : 'Multiplication';
    const difficulty = score.difficulty === 'easy' ? 'Facile' : 'Difficile';
    const complete = ALL_TABLES.every(n => score.selectedNumbers.includes(n));
    const tables = complete ? 'toutes les tables' : `tables ${score.selectedNumbers.join(', ')}`;
    // Le nombre d'erreurs n'existe pas dans les scores enregistres avant la v2.
    const mistakes = typeof score.mistakes === 'number'
        ? ` &middot; ${score.mistakes} erreur${score.mistakes > 1 ? 's' : ''}`
        : '';
    return `${operation} &middot; ${difficulty} &middot; ${tables} &middot; ${score.timerDuration}s${mistakes}<br>${formatDate(score.date)}`;
}

function render() {
    const container = document.getElementById('scores');
    const operations = activeFilters('operation');
    const difficulties = activeFilters('difficulty');

    const scores = GameStorage.getJSON('highscores', [])
        .filter(s => operations.includes(s.operation) && difficulties.includes(s.difficulty))
        .sort((a, b) => a.time - b.time);

    if (scores.length === 0) {
        container.replaceChildren(
            Object.assign(document.createElement('p'), {
                className: 'empty',
                textContent: 'Aucun score pour ces filtres.'
            })
        );
        return;
    }

    const fragment = document.createDocumentFragment();
    scores.forEach((score, index) => {
        const item = document.createElement('div');
        item.className = 'score';
        item.innerHTML = `
            <div class="score-rank">${index + 1}</div>
            <div class="score-player"></div>
            <div class="score-time">${formatTime(score.time)}</div>
            <div class="score-meta">${describe(score)}</div>`;
        // Le nom vient du stockage local : on l'insere en texte, jamais en HTML.
        item.querySelector('.score-player').textContent = score.players;
        fragment.appendChild(item);
    });
    container.replaceChildren(fragment);
}

document.addEventListener('DOMContentLoaded', () => {
    render();

    document.querySelectorAll('input[data-filter]').forEach(cb => {
        cb.addEventListener('change', render);
    });

    document.getElementById('back-button').addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    document.getElementById('clear-button').addEventListener('click', () => {
        if (!confirm('Effacer tous les scores ? Cette action est definitive.')) return;
        GameStorage.remove('highscores');
        render();
    });
});
