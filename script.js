// initialize the parameters for the game
let number_diamonds = 0;
let num_A = 0;
let num_B = 0;
var timer;
var interval;
let currentRow = 0; // 0, 1 ou 2 pour les 3 rangees
let gameStartTime = 0; // timestamp du debut de partie
let totalGameTime = 0; // temps total en secondes
let isMuted = false; // etat du son (par defaut: non mute)

// declare the audio
const audio_theme = new Audio("img/theme.mp3");
audio_theme.loop = true;
audio_theme.volume=0.8;
const audio_victory = new Audio("img/victory.mp3");
const audio_error = new Audio("img/erreur.wav");

// import code of confettis (victory celebration)
function confettis_victory(){
    confetti({
        particleCount: 100,
        spread: 360,
        origin: {
            x: Math.random(),
            y: Math.random() - 0.2}
    });
    }

function randomize_numbers() {
    num_A = Math.floor(Math.random() * (gameConfig.maxFirstOperand + 1));
    calcNum_B = Math.floor(Math.random() * gameConfig.selectedNumbers.length);
    num_B = gameConfig.selectedNumbers[calcNum_B];
    document.getElementById('NumA').innerHTML = num_A;
    document.getElementById('NumB').innerHTML = num_B;
}

// Calcule le résultat attendu selon l'opération
function getExpectedResult() {
    if (gameConfig.operation === 'addition') {
        return num_A + num_B;
    } else {
        return num_A * num_B;
    }
}

// Retourne le symbole de l'opération
function getOperationSymbol() {
    return gameConfig.operation === 'addition' ? '+' : 'x';
}

// initialization of the game
var start_button = document.getElementById("start");

// Met à jour le texte du bouton au chargement de la page
window.addEventListener('DOMContentLoaded', function() {
    updateStartButtonText();

    // Gestion du bouton mute/unmute
    const muteButton = document.getElementById('mute-button');
    muteButton.addEventListener('click', function() {
        isMuted = !isMuted;

        // Change l'icone
        const img = muteButton.querySelector('img');
        if (isMuted) {
            img.src = 'img/mute.png';
            img.alt = 'Son coupe';
            // Coupe tous les sons
            audio_theme.muted = true;
            audio_victory.muted = true;
            audio_error.muted = true;
        } else {
            img.src = 'img/unmute.png';
            img.alt = 'Son active';
            // Reactive tous les sons
            audio_theme.muted = false;
            audio_victory.muted = false;
            audio_error.muted = false;
        }
    });
});

start_button.addEventListener('click', function(){
    // Initialise le timer avec la configuration
    timer = gameConfig.timerDuration;
    document.getElementById("timer").innerHTML = timer;

    // Demarre le chronometre total
    gameStartTime = Date.now();
    totalGameTime = 0;

    // Met a jour le symbole de l'operation dans la question
    updateOperationSymbol();

    randomize_numbers();
    start_timer();
    document.getElementById('start_box').style.visibility = 'hidden';
    document.getElementById('question').style.visibility = 'visible';
    document.getElementById('answer').style.visibility = 'visible';
    document.getElementById('config-button').style.display = 'none';
    document.getElementById('highscores-button').style.display = 'none';
    document.getElementById('submitting_answer').focus()
    audio_theme.play()
})

// Met a jour le texte du bouton de demarrage
function updateStartButtonText() {
    start_button.innerHTML = `C'est parti, ${gameConfig.playerName} !`;
}

// Met à jour le symbole de l'opération dans le HTML
function updateOperationSymbol() {
    const questionDiv = document.getElementById('question');
    questionDiv.innerHTML = `<span id="NumA"></span> ${getOperationSymbol()} <span id="NumB"></span>`;
}

function start_timer() {
    interval = setInterval(function() {
        timer --;
        document.getElementById("timer").innerHTML = timer;
        if (timer < 0) {
            clearInterval(interval);
            timer = gameConfig.timerDuration;

            // Joue le son d'erreur
            audio_error.currentTime = 0;
            audio_error.play();

            // Gere la perte selon la difficulte
            if (gameConfig.difficulty === 'hard') {
                // Mode difficile : remise a zero complete
                number_diamonds = 0;
                currentRow = 0;
                document.getElementById("diamonds").innerHTML = "";
            } else {
                // Mode facile : on perd seulement les diamants de la rangee actuelle
                const diamondsInCurrentRow = number_diamonds % gameConfig.diamondsPerRow;
                number_diamonds -= diamondsInCurrentRow;
                currentRow = Math.floor(number_diamonds / gameConfig.diamondsPerRow);
                redrawDiamonds();
            }

            document.getElementById("timer").innerHTML = timer;
            randomize_numbers();
            start_timer();
        }
    }, 1000);
}

function reset_timer() {
    clearInterval(interval);
    timer = gameConfig.timerDuration;
    document.getElementById("timer").innerHTML = timer;
    start_timer();
}

// Redessine tous les diamants selon le score actuel
function redrawDiamonds() {
    const num_diamonds = document.getElementById("diamonds");
    num_diamonds.innerHTML = "";

    const diamondColors = ['diamond_yellow.png', 'diamond_pink.png', 'diamond_shine.png'];

    // Calcule la rangee actuelle et le nombre de diamants a afficher
    currentRow = Math.floor((number_diamonds - 1) / gameConfig.diamondsPerRow);
    if (currentRow < 0) currentRow = 0;

    const diamondsToShow = ((number_diamonds - 1) % gameConfig.diamondsPerRow) + 1;

    if (currentRow < gameConfig.totalRows) {
        const colorIndex = Math.min(currentRow, diamondColors.length - 1);
        for (let i = 0; i < diamondsToShow; i++) {
            num_diamonds.innerHTML += `<img src='img/${diamondColors[colorIndex]}' height=64px/>`;
        }
    }
}

// Sauvegarde une victoire dans les high scores
function saveVictory() {
    totalGameTime = Math.floor((Date.now() - gameStartTime) / 1000); // en secondes

    const victory = {
        date: new Date().toISOString(),
        players: gameConfig.playerName,
        time: totalGameTime,
        operation: gameConfig.operation,
        difficulty: gameConfig.difficulty,
        timerDuration: gameConfig.timerDuration,
        selectedNumbers: gameConfig.selectedNumbers
    };

    // Recupere les scores existants depuis cookies ou localStorage
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

    let highscores = JSON.parse(highscoresStr || '[]');

    // Ajoute le nouveau score
    highscores.push(victory);

    // Trie par temps (du plus rapide au plus lent)
    highscores.sort((a, b) => a.time - b.time);

    // Garde les 50 meilleurs scores
    highscores = highscores.slice(0, 50);

    // Sauvegarde dans cookies
    setCookie('highscores', JSON.stringify(highscores));
}

// diamonds are the score. Multiple rows of diamonds before victory
function add_diamonds(x) {
    number_diamonds += x;

    // Verifie la victoire
    const totalDiamondsNeeded = gameConfig.diamondsPerRow * gameConfig.totalRows;
    if (number_diamonds >= totalDiamondsNeeded) {
        // Arrete le timer
        clearInterval(interval);

        // Sauvegarde le high score
        saveVictory();

        // Calcule le rang du joueur
        const highscoresStr = getCookie('highscores') || '[]';
        const highscores = JSON.parse(highscoresStr);
        const playerRank = highscores.findIndex(score =>
            score.date === new Date().toISOString().split('.')[0] + '.000Z' ||
            score.time === totalGameTime && score.players === gameConfig.playerName
        ) + 1;

        // Formate le temps
        const minutes = Math.floor(totalGameTime / 60);
        const seconds = totalGameTime % 60;
        const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;

        // Mode de jeu
        const operationText = gameConfig.operation === 'multiplication' ? 'Multiplication' : 'Addition';
        const difficultyText = gameConfig.difficulty === 'easy' ? 'Facile' : 'Difficile';

        // Affiche les informations de victoire en dessous des diamants
        const victoryInfo = document.createElement('div');
        victoryInfo.id = 'victory-info';
        victoryInfo.style.cssText = 'margin-top: 30px; text-align: center;';
        victoryInfo.innerHTML = `
            <div style="font-size: 2em; margin-bottom: 20px; color: goldenrod;">VICTOIRE !</div>
            <div style="font-size: 1.2em;">
                <div>Temps: <strong style="color: goldenrod;">${timeStr}</strong></div>
                <div>Mode: ${operationText} - ${difficultyText}</div>
                ${playerRank > 0 ? `<div>Rang: <strong>#${playerRank}</strong></div>` : ''}
            </div>
            <button id="return-button" style="margin-top: 30px; padding: 15px 40px; font-family: daydream, verdana; font-size: 1.2em; color: white; background-color: #3A3B78; border: none; border-radius: 10px; cursor: pointer;">Retour a l'ecran titre</button>
        `;

        document.getElementById('main').appendChild(victoryInfo);

        // Gere le bouton de retour
        document.getElementById('return-button').addEventListener('click', function() {
            location.reload();
        });

        audio_theme.pause();
        audio_victory.play();
        document.getElementById('question').style.visibility = 'hidden';
        document.getElementById('answer').style.visibility = 'hidden';
        document.getElementById('temps_restant').style.visibility = 'hidden';

        // Lance les confettis pendant 10 secondes
        const confettiInterval = setInterval(confettis_victory, 750);
        setTimeout(function() {
            clearInterval(confettiInterval);
        }, 10000);
    } else {
        redrawDiamonds();
    }
}

// eventlistener of the answer, check if OK
var submitting_answer = document.getElementById("submitting_answer");
submitting_answer.addEventListener('keydown', function (e) {
    if (e.key === "Enter") {
        var input = document.getElementById("submitting_answer").value;
        const expectedResult = getExpectedResult();

        if (expectedResult == input) {
            // Bonne réponse
            add_diamonds(1);
            reset_timer();
        } else {
            // Mauvaise reponse - joue le son d'erreur
            audio_error.currentTime = 0; // Reinitialise le son pour pouvoir le rejouer immediatement
            audio_error.play();

            if (gameConfig.difficulty === 'hard') {
                // Mode difficile : remise a zero complete
                number_diamonds = 0;
                currentRow = 0;
                document.getElementById("diamonds").innerHTML = "";
            } else {
                // Mode facile : on perd seulement les diamants de la rangee actuelle
                const diamondsInCurrentRow = number_diamonds % gameConfig.diamondsPerRow;
                number_diamonds -= diamondsInCurrentRow;
                currentRow = Math.floor(number_diamonds / gameConfig.diamondsPerRow);
                redrawDiamonds();
            }
        }
        randomize_numbers();
        submitting_answer.value = "";
    }
})