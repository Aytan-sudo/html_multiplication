let number_diamonds = 0;
let num_A = 0;
let num_B = 0;
document.getElementById('NumA').innerHTML = num_A;
document.getElementById('NumB').innerHTML = num_B;


function random(){ // generate a number between 0 and 9
    i = Math.floor(Math.random() * 10);
    return i;
}

var start_button = document.getElementById("start");
start_button.addEventListener('click', function(){
    num_A = random();
    num_B = random();
    document.getElementById('NumA').innerHTML = num_A;
    document.getElementById('NumB').innerHTML = num_B;
    document.getElementById('start').style.visibility = 'hidden';
    document.getElementById('question').style.visibility = 'visible';
})

var submitting_answer = document.getElementById("submitting_answer");
submitting_answer.addEventListener('keydown', function (e) {
    if (e.key === "Enter") {
        // check validation
        number_diamonds += 1;
        alert(number_diamonds);
    }
})

