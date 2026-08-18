// Moteur du jeu.

const DIAMOND_IMAGES = ['diamond_yellow.webp', 'diamond_pink.webp', 'diamond_shine.webp'];
const HIGHSCORES_KEY = 'highscores';
const MAX_HIGHSCORES = 50;
const TICK_MS = 100;

const el = {};
const state = {
    phase: 'title',        // 'title' | 'playing' | 'paused' | 'victory'
    diamonds: 0,
    fact: null,
    picker: null,
    deadline: 0,
    remainingOnPause: 0,
    tickHandle: null,
    startedAt: 0,
    correctCount: 0,
    mistakeCount: 0
};

// ---------------------------------------------------------------- son
//
// Les fichiers ne sont crees qu'au lancement de la partie : inutile de faire
// telecharger 1,5 Mo de musique a quelqu'un qui ouvre la page pour consulter
// les scores. Seul le son d'erreur (8 Ko) est charge d'emblee.

const sounds = {
    theme: null,
    victory: null,
    error: new Audio('assets/audio/error.mp3')
};

function loadSounds() {
    if (!sounds.theme) {
        sounds.theme = new Audio('assets/audio/theme.mp3');
        sounds.theme.loop = true;
        sounds.theme.volume = 0.8;
    }
    if (!sounds.victory) {
        sounds.victory = new Audio('assets/audio/victory.mp3');
    }
    applyMute();
}

function applyMute() {
    const muted = !gameConfig.soundEnabled;
    for (const sound of Object.values(sounds)) {
        if (sound) sound.muted = muted;
    }
    const img = el.soundToggle.querySelector('img');
    img.src = muted ? 'assets/img/mute.webp' : 'assets/img/unmute.webp';
    img.alt = muted ? 'Son coupe' : 'Son active';
    el.soundToggle.setAttribute('aria-pressed', String(muted));
}

// Un play() refuse par la politique d'autoplay rejette sa promesse. Sans ce
// catch, la console se remplit d'erreurs non capturees a chaque partie.
function play(sound) {
    if (!sound) return;
    sound.currentTime = 0;
    const attempt = sound.play();
    if (attempt) attempt.catch(() => {});
}

// ---------------------------------------------------------------- affichage

function showScreen(name) {
    el.screenTitle.hidden = name !== 'title';
    el.screenGame.hidden = name !== 'game';
    el.screenVictory.hidden = name !== 'victory';
    el.quitBtn.hidden = name !== 'game';
    el.navLinks.hidden = name === 'game';
}

function renderDiamonds() {
    const perRow = gameConfig.diamondsPerRow;
    const row = state.diamonds === 0 ? 0 : Math.floor((state.diamonds - 1) / perRow);
    const inRow = state.diamonds === 0 ? 0 : ((state.diamonds - 1) % perRow) + 1;
    const image = DIAMOND_IMAGES[Math.min(row, DIAMOND_IMAGES.length - 1)];

    // Un fragment plutot que « innerHTML += » dans une boucle : la v1.7
    // reparsait tout le conteneur a chaque diamant ajoute.
    //
    // La rangee est toujours dessinee en entier, les emplacements non encore
    // gagnes en transparence. La hauteur du bloc ne change donc jamais et la
    // mise en page ne sursaute pas a chaque bonne reponse.
    const fragment = document.createDocumentFragment();
    for (let i = 0; i < perRow; i++) {
        const img = document.createElement('img');
        img.src = `assets/img/${image}`;
        img.alt = '';
        img.className = 'diamond';
        if (i >= inRow) {
            img.classList.add('diamond--empty');
        } else if (i === inRow - 1) {
            img.classList.add('diamond--new');
        }
        fragment.appendChild(img);
    }
    el.diamonds.replaceChildren(fragment);

    el.progress.textContent = `Rangee ${Math.min(row + 1, gameConfig.totalRows)} sur ${gameConfig.totalRows}`;
    el.diamonds.setAttribute('aria-label', `${state.diamonds} diamants sur ${perRow * gameConfig.totalRows}`);
}

function renderQuestion() {
    el.numA.textContent = state.fact.a;
    el.numB.textContent = state.fact.b;
    el.operator.textContent = operationSymbol(gameConfig.operation);
}

function flash(kind) {
    el.questionCard.classList.remove('is-correct', 'is-wrong');
    // Force un reflow pour que l'animation reparte meme sur deux reponses
    // consecutives de meme nature.
    void el.questionCard.offsetWidth;
    el.questionCard.classList.add(kind === 'correct' ? 'is-correct' : 'is-wrong');
}

// ---------------------------------------------------------------- timer
//
// Le timer vise une echeance absolue plutot que de decrementer un compteur.
// setInterval derive et se fait brider par les navigateurs mobiles quand
// l'onglet passe en arriere-plan ; comparer a Date.now() reste juste.

function startTimer(seconds = gameConfig.timerDuration) {
    stopTimer();
    state.deadline = Date.now() + seconds * 1000;
    state.tickHandle = setInterval(tick, TICK_MS);
    tick();
}

function stopTimer() {
    if (state.tickHandle !== null) {
        clearInterval(state.tickHandle);
        state.tickHandle = null;
    }
}

function tick() {
    const remaining = Math.max(0, state.deadline - Date.now());
    const seconds = Math.ceil(remaining / 1000);
    el.timerValue.textContent = seconds;
    el.timerFill.style.width = `${(remaining / (gameConfig.timerDuration * 1000)) * 100}%`;
    el.timerFill.classList.toggle('is-urgent', seconds <= 5);

    if (remaining === 0) {
        stopTimer();
        onTimeout();
    }
}

function pauseGame() {
    if (state.phase !== 'playing') return;
    state.phase = 'paused';
    state.remainingOnPause = Math.max(0, state.deadline - Date.now());
    stopTimer();
    if (sounds.theme) sounds.theme.pause();
    el.pauseOverlay.hidden = false;
}

function resumeGame() {
    if (state.phase !== 'paused') return;
    state.phase = 'playing';
    el.pauseOverlay.hidden = true;
    state.deadline = Date.now() + state.remainingOnPause;
    state.tickHandle = setInterval(tick, TICK_MS);
    tick();
    play(sounds.theme);
    focusAnswer();
}

// ---------------------------------------------------------------- partie

function focusAnswer() {
    // On garde le focus dans le champ pour que le clavier mobile reste ouvert
    // entre deux questions, sinon il faut retaper l'ecran a chaque fois.
    el.answerInput.focus({ preventScroll: true });
}

function nextQuestion() {
    state.fact = state.picker.next();
    renderQuestion();
    el.answerInput.value = '';
    startTimer();
}

// Une erreur ou un temps ecoule coutent la meme chose. La v1.7 dupliquait ce
// bloc a deux endroits, qu'il fallait penser a modifier ensemble.
function applyPenalty() {
    state.mistakeCount++;
    play(sounds.error);

    if (gameConfig.difficulty === 'hard') {
        state.diamonds = 0;
    } else {
        state.diamonds -= state.diamonds % gameConfig.diamondsPerRow;
    }
    renderDiamonds();
}

function onTimeout() {
    if (state.phase !== 'playing') return;
    state.picker.record(state.fact, false);
    flash('wrong');
    applyPenalty();
    nextQuestion();
}

function onSubmit(event) {
    event.preventDefault();
    if (state.phase !== 'playing') return;

    const raw = el.answerInput.value.trim();
    if (raw === '') {
        focusAnswer();
        return;
    }

    const isCorrect = Number(raw) === expectedResult(state.fact, gameConfig.operation);
    state.picker.record(state.fact, isCorrect);

    if (isCorrect) {
        state.correctCount++;
        state.diamonds++;
        flash('correct');

        if (state.diamonds >= gameConfig.diamondsPerRow * gameConfig.totalRows) {
            stopTimer();
            onVictory();
            return;
        }
        renderDiamonds();
    } else {
        flash('wrong');
        applyPenalty();
    }

    nextQuestion();
    focusAnswer();
}

function startGame() {
    loadSounds();
    state.phase = 'playing';
    state.diamonds = 0;
    state.correctCount = 0;
    state.mistakeCount = 0;
    state.startedAt = Date.now();
    state.picker = new QuestionPicker(gameConfig);

    showScreen('game');
    renderDiamonds();
    nextQuestion();
    play(sounds.theme);
    focusAnswer();
}

function quitGame() {
    stopTimer();
    state.phase = 'title';
    if (sounds.theme) sounds.theme.pause();
    el.pauseOverlay.hidden = true;
    showScreen('title');
}

// ---------------------------------------------------------------- victoire

function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

function saveVictory(totalSeconds) {
    const entry = {
        // La v1.7 retrouvait le rang en comparant des dates reconstruites a la
        // main, ce qui ne matchait jamais. Un identifiant unique regle le sujet.
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        date: new Date().toISOString(),
        players: playerLabel(gameConfig),
        time: totalSeconds,
        mistakes: state.mistakeCount,
        operation: gameConfig.operation,
        difficulty: gameConfig.difficulty,
        timerDuration: gameConfig.timerDuration,
        selectedNumbers: [...gameConfig.selectedNumbers]
    };

    const highscores = GameStorage.getJSON(HIGHSCORES_KEY, []);
    highscores.push(entry);
    highscores.sort((a, b) => a.time - b.time);
    const kept = highscores.slice(0, MAX_HIGHSCORES);
    GameStorage.setJSON(HIGHSCORES_KEY, kept);

    return { entry, rank: kept.findIndex(s => s.id === entry.id) + 1 };
}

function onVictory() {
    state.phase = 'victory';
    const totalSeconds = Math.floor((Date.now() - state.startedAt) / 1000);
    const { rank } = saveVictory(totalSeconds);

    el.victoryTime.textContent = formatTime(totalSeconds);
    el.victoryMode.textContent = `${gameConfig.operation === 'addition' ? 'Addition' : 'Multiplication'} - ${gameConfig.difficulty === 'easy' ? 'Facile' : 'Difficile'}`;
    el.victoryMistakes.textContent = state.mistakeCount;
    el.victoryRank.textContent = rank > 0 ? `#${rank}` : '-';

    showScreen('victory');

    if (sounds.theme) sounds.theme.pause();
    play(sounds.victory);

    const confettiHandle = setInterval(() => {
        confetti({
            particleCount: 80,
            spread: 360,
            origin: { x: Math.random(), y: Math.random() - 0.2 }
        });
    }, 750);
    setTimeout(() => clearInterval(confettiHandle), 8000);
}

// ---------------------------------------------------------------- demarrage

function describeMode() {
    const op = gameConfig.operation === 'addition' ? 'Additions' : 'Multiplications';
    const tables = gameConfig.selectedNumbers.filter(n => n > 1 && n < 10);
    // Enumerer les huit tables tient sur deux lignes sur un telephone : quand
    // elles y sont toutes, une formule courte suffit.
    const tablesText = tables.length === 8 ? 'toutes les tables'
        : tables.length ? `tables ${tables.join(', ')}`
        : 'tables faciles';
    return `${op} - ${tablesText} - ${gameConfig.timerDuration}s`;
}

document.addEventListener('DOMContentLoaded', () => {
    Object.assign(el, {
        screenTitle: document.getElementById('screen-title'),
        screenGame: document.getElementById('screen-game'),
        screenVictory: document.getElementById('screen-victory'),
        navLinks: document.getElementById('nav-links'),
        soundToggle: document.getElementById('sound-toggle'),
        quitBtn: document.getElementById('quit-btn'),
        startBtn: document.getElementById('start-btn'),
        modeSummary: document.getElementById('mode-summary'),
        diamonds: document.getElementById('diamonds'),
        progress: document.getElementById('progress'),
        questionCard: document.getElementById('question-box'),
        numA: document.getElementById('num-a'),
        numB: document.getElementById('num-b'),
        operator: document.getElementById('operator'),
        answerForm: document.getElementById('answer-form'),
        answerInput: document.getElementById('answer-input'),
        timerValue: document.getElementById('timer-value'),
        timerFill: document.getElementById('timer-fill'),
        pauseOverlay: document.getElementById('pause-overlay'),
        resumeBtn: document.getElementById('resume-btn'),
        victoryTime: document.getElementById('victory-time'),
        victoryMode: document.getElementById('victory-mode'),
        victoryMistakes: document.getElementById('victory-mistakes'),
        victoryRank: document.getElementById('victory-rank'),
        replayBtn: document.getElementById('replay-btn'),
        homeBtn: document.getElementById('home-btn')
    });

    // Sans prenom choisi, le bouton ne s'adresse a personne en particulier :
    // c'est le cas par defaut, la tablette passant de main en main.
    el.startBtn.textContent = gameConfig.playerName
        ? `C'est parti, ${gameConfig.playerName} !`
        : "C'est parti !";
    el.modeSummary.textContent = describeMode();
    applyMute();

    el.startBtn.addEventListener('click', startGame);
    el.answerForm.addEventListener('submit', onSubmit);
    el.resumeBtn.addEventListener('click', resumeGame);
    el.replayBtn.addEventListener('click', startGame);
    el.homeBtn.addEventListener('click', quitGame);
    el.quitBtn.addEventListener('click', quitGame);

    el.soundToggle.addEventListener('click', () => {
        gameConfig.soundEnabled = !gameConfig.soundEnabled;
        saveConfig(gameConfig);
        applyMute();
        if (state.phase === 'playing' && gameConfig.soundEnabled) {
            play(sounds.theme);
        }
    });

    // Le champ est en type="text" pour obtenir le pave purement numerique sur
    // iOS ; il faut donc filtrer nous-memes ce qui n'est pas un chiffre.
    el.answerInput.addEventListener('input', () => {
        const digitsOnly = el.answerInput.value.replace(/\D/g, '');
        if (digitsOnly !== el.answerInput.value) {
            el.answerInput.value = digitsOnly;
        }
    });

    // Appel entrant, notification, changement d'application : on met la partie
    // en pause plutot que de laisser le chrono courir dans le vide.
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) pauseGame();
    });

    showScreen('title');
});
