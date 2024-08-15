const convertButton = document.getElementById("convert-btn");
const numberInput = document.getElementById("number");
const output = document.getElementById("output");

output.classList.remove('output');

numberInput.addEventListener("change", () => {
    output.innerText = "";
    output.classList.remove('alert');
    output.classList.remove('output');
});

form.addEventListener('submit', e => {
    e.preventDefault();
    updateUI();
});

convertButton.addEventListener("click", () => {
    updateUI();
});

function updateUI() {

    let valueStr = numberInput.value;
    let valueInt = parseInt(numberInput.value, 10);

    output.classList.remove('hidden');
    output.classList.add('output');
    clearOutput();

    if (validNumberInputStr(valueInt, valueStr)) {
        output.innerText = convertToRoman(valueInt);
    }
}

function convertToRoman(value) {

    const ref = [
        ['M', 1000],
        ['CM', 900],
        ['D', 500],
        ['CD', 400],
        ['C', 100],
        ['XC', 90],
        ['L', 50],
        ['XL', 40],
        ['X', 10],
        ['IX', 9],
        ['V', 5],
        ['IV', 4],
        ['I', 1]
    ];

    const res = [];

    ref.forEach((arr) => {
        while (value >= arr[1]) {
            res.push(arr[0]);
            value -= arr[1];
        }
    });

    return res.join("");
}

function clearOutput() {
    output.innerText = "";
    output.classList.remove('alert');
}

function validNumberInputStr(valueInt, valueStr) {

    let messageError = "";

    if (!valueInt || valueStr.match(/[e.]/g)) {
        messageError = "Please enter a valid number";
    } else if (valueInt < 1) {
        messageError = "Please enter a number greater than or equal to 1";
    } else if (valueInt > 3999) {
        messageError = "Please enter a number less than or equal to 3999";
    } else {
        return true;
    }

    output.innerText = messageError;
    output.classList.add("alert");
    return false;
}