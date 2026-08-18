// Page de configuration.

// Ces tables restent toujours dans le tirage : elles servent de respiration
// entre deux calculs difficiles. Elles ne sont donc pas proposees a la
// selection, mais le moteur leur donne un poids faible pour qu'elles ne
// monopolisent pas les questions.
const ALWAYS_INCLUDED = [0, 1, 10];
const SELECTABLE_TABLES = [2, 3, 4, 5, 6, 7, 8, 9];

// Anonyme est une option a part entiere, en tete de liste : c'est le choix par
// defaut, et il doit rester possible d'y revenir.
function buildPlayerOptions() {
    const container = document.getElementById('player-options');
    const names = [{ value: '', label: ANONYMOUS }, ...PLAYERS.map(n => ({ value: n, label: n }))];
    container.replaceChildren(...names.map(({ value, label: text }) => {
        const label = document.createElement('label');
        // « Anonyme » prend la rangee entiere : au gabarit d'un prenom, le mot
        // debordait de sa pastille sur un petit ecran.
        label.className = value ? 'option option--name' : 'option option--name option--anon';
        label.innerHTML = `<input type="radio" name="player" value="${value}"><span>${text}</span>`;
        return label;
    }));
}

function buildTableOptions() {
    const container = document.getElementById('table-options');
    container.replaceChildren(...SELECTABLE_TABLES.map(n => {
        const label = document.createElement('label');
        label.className = 'option option--table';
        label.innerHTML = `<input type="checkbox" name="tables" value="${n}"><span>${n}</span>`;
        return label;
    }));
}

function buildColorOptions() {
    const container = document.getElementById('color-options');
    container.replaceChildren(...BG_COLORS.map(color => {
        const label = document.createElement('label');
        label.className = 'option';
        label.innerHTML = `
            <input type="radio" name="bgcolor" value="${color.value}">
            <span class="swatch" style="background:${color.value}"></span>
            <span>${color.label}</span>`;
        return label;
    }));
}

function check(selector) {
    const input = document.querySelector(selector);
    if (input) input.checked = true;
}

function fillForm(config) {
    check(`input[name="operation"][value="${config.operation}"]`);
    check(`input[name="difficulty"][value="${config.difficulty}"]`);
    check(`input[name="timer"][value="${config.timerDuration}"]`);
    check(`input[name="player"][value="${config.playerName}"]`);
    check(`input[name="bgcolor"][value="${config.bgColor}"]`);

    document.querySelectorAll('input[name="tables"]').forEach(cb => {
        cb.checked = config.selectedNumbers.includes(Number(cb.value));
    });
    document.getElementById('adaptive').checked = config.adaptive;
    syncAllTablesCheckbox();
}

function readForm() {
    const tables = Array.from(document.querySelectorAll('input[name="tables"]:checked'))
        .map(cb => Number(cb.value));

    return {
        ...gameConfig,
        operation: document.querySelector('input[name="operation"]:checked').value,
        difficulty: document.querySelector('input[name="difficulty"]:checked').value,
        timerDuration: Number(document.querySelector('input[name="timer"]:checked').value),
        playerName: (document.querySelector('input[name="player"]:checked') || {}).value || '',
        bgColor: document.querySelector('input[name="bgcolor"]:checked').value,
        adaptive: document.getElementById('adaptive').checked,
        selectedNumbers: [...new Set([...ALWAYS_INCLUDED, ...tables])].sort((a, b) => a - b)
    };
}

function syncAllTablesCheckbox() {
    const boxes = document.querySelectorAll('input[name="tables"]');
    const checked = Array.from(boxes).filter(cb => cb.checked).length;
    const all = document.getElementById('all-tables');
    all.checked = checked === boxes.length;
    all.indeterminate = checked > 0 && checked < boxes.length;
}

document.addEventListener('DOMContentLoaded', () => {
    // Ecrit depuis le JS plutot qu'en dur dans la page : le numero n'a ainsi
    // qu'une seule declaration a maintenir.
    document.getElementById('app-version').textContent = APP_VERSION;

    buildPlayerOptions();
    buildTableOptions();
    buildColorOptions();
    fillForm(gameConfig);

    document.getElementById('all-tables').addEventListener('change', event => {
        document.querySelectorAll('input[name="tables"]').forEach(cb => {
            cb.checked = event.target.checked;
        });
        syncAllTablesCheckbox();
    });

    document.getElementById('table-options').addEventListener('change', syncAllTablesCheckbox);

    // Apercu immediat de la couleur : inutile de sauvegarder pour voir le rendu.
    document.getElementById('color-options').addEventListener('change', event => {
        applyTheme({ bgColor: event.target.value });
    });

    document.getElementById('config-form').addEventListener('submit', event => {
        event.preventDefault();
        const config = readForm();

        // Les tables 0, 1 et 10 etant ajoutees d'office, validateConfig ne verra
        // jamais une liste vide : il faut verifier ici qu'au moins une vraie
        // table est cochee, sinon la partie se resume a des calculs triviaux.
        if (!config.selectedNumbers.some(n => SELECTABLE_TABLES.includes(n))) {
            alert('Choisis au moins une table entre 2 et 9.');
            return;
        }

        const { isValid, errors } = validateConfig(config);
        if (!isValid) {
            alert('Configuration incomplete :\n' + errors.join('\n'));
            return;
        }
        if (!saveConfig(config)) {
            alert('La sauvegarde a echoue. Verifie que le navigateur autorise le stockage local.');
            return;
        }
        window.location.href = 'index.html';
    });

    document.getElementById('reset-button').addEventListener('click', () => {
        if (!confirm('Revenir a la configuration par defaut ?')) return;
        const config = resetConfig();
        saveConfig(config);
        fillForm(config);
        applyTheme(config);
    });
});
