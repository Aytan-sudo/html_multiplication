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
        ? ` · ${score.mistakes} erreur${score.mistakes > 1 ? 's' : ''}`
        : '';
    return `${operation} · ${difficulty} · ${tables} · ${score.timerDuration}s${mistakes}\n${formatDate(score.date)}`;
}

function render() {
    const container = document.getElementById('scores');
    const operations = activeFilters('operation');
    const difficulties = activeFilters('difficulty');

    const stored = GameStorage.getJSON('highscores', []);
    const scores = (Array.isArray(stored) ? stored : [])
        .filter(s => s && Array.isArray(s.selectedNumbers) && Number.isFinite(s.time))
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
        // Tous les champs peuvent provenir d'une sauvegarde importée : les
        // descriptions, comme les noms, sont du texte et jamais du HTML.
        for (const [name, value] of [['rank', index + 1], ['player', score.players], ['time', formatTime(score.time)], ['meta', describe(score)]]) {
            const node = document.createElement('div'); node.className = 'score-' + name;
            node.textContent = value; item.appendChild(node);
        }
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
        window.location.href = 'index.html' + (globalThis.Passeport ? '?profil=' + encodeURIComponent(globalThis.Passeport.profilId || '') : '');
    });

    document.getElementById('clear-button').addEventListener('click', () => {
        if (!confirm('Effacer tous les scores ? Cette action est definitive.')) return;
        GameStorage.remove('highscores');
        render();
    });
});
