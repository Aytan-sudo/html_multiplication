let number_diamonds = 0;
let num_A = 0;
let num_B = 0;
document.getElementById('NumA').innerHTML = num_A;
document.getElementById('NumB').innerHTML = num_B;


function random(){ // generate a number between 0 and 9
    i = Math.floor(Math.random() * 10);
    return i;
}

function randomize_numbers() {
    num_A = random();
    num_B = random();
    document.getElementById('NumA').innerHTML = num_A;
    document.getElementById('NumB').innerHTML = num_B;
}

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
    } else {num_diamonds.innerHTML = "Victoire !"};
}


var start_button = document.getElementById("start");
start_button.addEventListener('click', function(){
    randomize_numbers();
    document.getElementById('start_box').style.visibility = 'hidden';
    document.getElementById('question').style.visibility = 'visible';
    document.getElementById('answer').style.visibility = 'visible';
})

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

