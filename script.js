// initialize the parameters
let number_diamonds = 0;
let num_A = 0;
let num_B = 0;

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
    num_B = Math.floor(Math.random() * 10);
    document.getElementById('NumA').innerHTML = num_A;
    document.getElementById('NumB').innerHTML = num_B;
}

// initialization of the game
var start_button = document.getElementById("start");
start_button.addEventListener('click', function(){
    randomize_numbers();
    document.getElementById('start_box').style.visibility = 'hidden';
    document.getElementById('question').style.visibility = 'visible';
    document.getElementById('answer').style.visibility = 'visible';
    document.getElementById('submitting_answer').focus()
    audio_theme.play()
})

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
        } else {
            number_diamonds = 0;
            document.getElementById("diamonds").innerHTML = "";
        }
        randomize_numbers();
        submitting_answer.value = "";
    }
})




