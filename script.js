// initialize the parameters for the game
let number_diamonds = 0;
let num_A = 0;
let num_B = 0;
var timer;
var interval;
let currentRow = 0; // 0, 1 ou 2 pour les 3 rangées

// declare the audio
const audio_theme = new Audio("img/theme.mp3");
audio_theme.loop = true;
audio_theme.volume=0.8;
const audio_victory = new Audio("img/victory.mp3");

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
start_button.addEventListener('click', function(){
    // Initialise le timer avec la configuration
    timer = gameConfig.timerDuration;
    document.getElementById("timer").innerHTML = timer;

    // Met à jour le texte du bouton avec les noms des joueurs
    updateStartButtonText();

    // Met à jour le symbole de l'opération dans la question
    updateOperationSymbol();

    randomize_numbers();
    start_timer();
    document.getElementById('start_box').style.visibility = 'hidden';
    document.getElementById('question').style.visibility = 'visible';
    document.getElementById('answer').style.visibility = 'visible';
    document.getElementById('submitting_answer').focus()
    audio_theme.play()
})

// Met à jour le texte du bouton de démarrage
function updateStartButtonText() {
    const names = gameConfig.playerNames.join(' et ');
    start_button.innerHTML = `C'est parti, ${names} !`;
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

            // Gère la perte selon la difficulté
            if (gameConfig.difficulty === 'hard') {
                // Mode difficile : remise à zéro complète
                number_diamonds = 0;
                currentRow = 0;
                document.getElementById("diamonds").innerHTML = "";
                alert("Temps écoulé ! Le score est remis à zéro.");
            } else {
                // Mode facile : on perd seulement les diamants de la rangée actuelle
                const diamondsInCurrentRow = number_diamonds % gameConfig.diamondsPerRow;
                number_diamonds -= diamondsInCurrentRow;
                redrawDiamonds();
                alert(`Temps écoulé ! Vous perdez ${diamondsInCurrentRow} diamant(s).`);
            }

            document.getElementById("timer").innerHTML = timer;
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
    currentRow = Math.floor(number_diamonds / gameConfig.diamondsPerRow);
    const diamondsInCurrentRow = number_diamonds % gameConfig.diamondsPerRow;

    if (currentRow < gameConfig.totalRows) {
        const colorIndex = Math.min(currentRow, diamondColors.length - 1);
        for (let i = 0; i < diamondsInCurrentRow; i++) {
            num_diamonds.innerHTML += `<img src='img/${diamondColors[colorIndex]}' height=64px/>`;
        }
    }
}

// diamonds are the score. Multiple rows of diamonds before victory
function add_diamonds(x) {
    number_diamonds += x;

    // Vérifie la victoire
    const totalDiamondsNeeded = gameConfig.diamondsPerRow * gameConfig.totalRows;
    if (number_diamonds >= totalDiamondsNeeded) {
        const num_diamonds = document.getElementById("diamonds");
        num_diamonds.innerHTML = "VICTOIRE !";
        audio_theme.pause();
        audio_victory.play();
        document.getElementById('question').style.visibility = 'hidden';
        document.getElementById('answer').style.visibility = 'hidden';
        setInterval(confettis_victory, 750);
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
            // Mauvaise réponse
            if (gameConfig.difficulty === 'hard') {
                // Mode difficile : remise à zéro complète
                number_diamonds = 0;
                currentRow = 0;
                document.getElementById("diamonds").innerHTML = "";
            } else {
                // Mode facile : on perd seulement les diamants de la rangée actuelle
                const diamondsInCurrentRow = number_diamonds % gameConfig.diamondsPerRow;
                number_diamonds -= diamondsInCurrentRow;
                redrawDiamonds();
            }
        }
        randomize_numbers();
        submitting_answer.value = "";
    }
})




