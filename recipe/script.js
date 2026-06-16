console.log(sum(range(1, 10)));
console.log(sum(range(1, 10, 2)));
console.log(sum(range(5, 2, -1)));

let array = [1, 2, 3, 4];
console.log(reverseArray(array));
console.log(array);

console.log(JSON.stringify(arrayToList([1, 2, 3, 4])));


function sum(array) {
    let sum = 0;
    for (let i = 0; i < array.length; i++) {
        sum += array[i];
    }
    return sum;
}

function range(start, end, step = 1) {
    let resultArray = [];
    for (let i = start; (step > 0 ? i <= end : i >= end); i += step) {
        resultArray.push(i);
    }
    return resultArray;
}

function reverseArrayInPlace() {

}

function reverseArray(array) {
    let reversedArray = array.slice();
    for (let i = 0; i < reversedArray.length / 2; i++) {
        let temp = reversedArray[i];
        reversedArray[i] = reversedArray[reversedArray.length - 1 - i];
        reversedArray[reversedArray.length - 1 - i] = temp;
    }
    return reversedArray;
}

function arrayToList(array) {
    let nodes;

    for (let i = 0; i < array.length; i++) {
        let node = {value: array[i], rest: null};

        if (nodes === undefined) {
            nodes = node;
        } else {

            let current = nodes;
            while (current.rest !== null) {
                current = current.rest;
            }
            current.rest = node;
        }
    }

    return nodes;
}
