// initialize the parameters for Emily and Louane
let number_diamonds = 0;
let num_A = 0;
let num_B = 0;
var timer = 15;
var interval;
const nombresPossibles = [2, 3, 4, 5, 10];

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
    num_A = Math.floor(Math.random() * 10);
    calcNum_B = Math.floor(Math.random() * nombresPossibles.length);
    num_B = nombresPossibles[calcNum_B];
    document.getElementById('NumA').innerHTML = num_A;
    document.getElementById('NumB').innerHTML = num_B;
}

// initialization of the game
var start_button = document.getElementById("start");
start_button.addEventListener('click', function(){
    randomize_numbers();
    start_timer();
    document.getElementById('start_box').style.visibility = 'hidden';
    document.getElementById('question').style.visibility = 'visible';
    document.getElementById('answer').style.visibility = 'visible';
    document.getElementById('submitting_answer').focus()
    audio_theme.play()
})

function start_timer() {
    interval = setInterval(function() {
        timer --;
        document.getElementById("timer").innerHTML = timer;
        if (timer < 0) {
            timer = 15;
            number_diamonds = 0;
            document.getElementById("diamonds").innerHTML = "";
            document.getElementById("timer").innerHTML = timer;
        }
    }, 1000);
}

function reset_timer() {
    clearInterval(interval);
    timer = 15;
    document.getElementById("timer").innerHTML = timer;
    start_timer();
}

// diamonds are the score. 3 rows of 10 diamonds before victory
function add_diamonds(x) {
    var num_diamonds = document.getElementById("diamonds");
    if (number_diamonds < 11) {
        for (var i = 0; i < x; i++) {
            num_diamonds.innerHTML += "<img src='img/diamond_yellow.png' height=64px/>";
        }
    }  else if (number_diamonds < 21) {
        for (var i = 0; i < x; i++) {
            if (number_diamonds == 11) {num_diamonds.innerHTML = ""};
            num_diamonds.innerHTML += "<img src='img/diamond_pink.png' height=64px/>";
        }
    } else if (number_diamonds < 31) {
        for (var i = 0; i < x; i++) {
            if (number_diamonds == 21) {num_diamonds.innerHTML = ""};
            num_diamonds.innerHTML += "<img src='img/diamond_shine.png' height=64px/>";
        } 
    } else {
        num_diamonds.innerHTML = "VICTOIRE !";
        audio_theme.pause();
        audio_victory.play();
        document.getElementById('question').style.visibility = 'hidden';
        document.getElementById('answer').style.visibility = 'hidden';
        setInterval(confettis_victory, 750);        
    }
}

// eventlistener of the answer, check if OK
var submitting_answer = document.getElementById("submitting_answer");
submitting_answer.addEventListener('keydown', function (e) {
    if (e.key === "Enter") {
        var input = document.getElementById("submitting_answer").value;
        if (num_A * num_B == input) {
            number_diamonds += 1;
            add_diamonds(1);
            reset_timer();
        } else {
            number_diamonds = 0;
            document.getElementById("diamonds").innerHTML = "";
        }
        randomize_numbers();
        submitting_answer.value = "";
    }
})




