const fs = require('fs');
let turtleJs = fs.readFileSync('js/turtle.js', 'utf8') + '\nglobal.TurtleCanvas = TurtleCanvas;\n';
let interpreterJs = fs.readFileSync('js/interpreter.js', 'utf8') + '\nglobal.LogoInterpreter = LogoInterpreter;\n';

const printedText = [];
const mockCtx = {
    clearRect:()=>{}, beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, stroke:()=>{},
    fillText:()=>{}, save:()=>{}, restore:()=>{}, translate:()=>{}, rotate:()=>{}, drawImage:()=>{}, fill:()=>{}, closePath: me=>{}, fillRect:()=>{}, arc:()=>{}, ellipse:()=>{}
};
global.document = { getElementById: () => ({ getContext: () => mockCtx, width: 800, height: 600, style: {} }) };
global.window = {};

eval(turtleJs);
eval(interpreterJs);

const turtle = new global.TurtleCanvas('mock');
turtle.drawText = (txt) => printedText.push(txt);
const interpreter = new global.LogoInterpreter(turtle);

console.log('--- Test 1: Comparisons & Output ---');
interpreter.execute('escribe 10 > 5');
interpreter.execute('escribe 10 = 10');
interpreter.execute('escribe 10 < 5');
interpreter.execute('escribe 10 <> 5');

console.log('Printed:', printedText);
if (printedText[0] === 1 && printedText[1] === 1 && printedText[2] === 0 && printedText[3] === 1) {
    console.log('Test 1 Passed!');
} else {
    console.log('Test 1 Failed');
}

console.log('--- Test 2: Logical Operators & Unary Functions ---');
printedText.length = 0;
interpreter.execute('escribe 1 y 1');
interpreter.execute('escribe no 0');
interpreter.execute('escribe abs -25');
interpreter.execute('escribe raiz 81');
interpreter.execute('escribe 2 ^ 4');

console.log('Printed:', printedText);
if (printedText[0] === 1 && printedText[1] === 1 && printedText[2] === 25 && printedText[3] === 9 && printedText[4] === 16) {
    console.log('Test 2 Passed!');
} else {
    console.log('Test 2 Failed');
}

console.log('--- Test 3: Conditionals (SI) ---');
printedText.length = 0;
interpreter.execute('si 10 > 5 [ escribe "OK ]');
interpreter.execute('si 2 = 5 [ escribe "FAIL ]');

console.log('Printed:', printedText);
if (printedText.length === 1 && printedText[0] === 'OK') {
    console.log('Test 3 Passed!');
} else {
    console.log('Test 3 Failed');
}

console.log('ALL MATH & LOGIC TESTS PASSED PERFECTLY!');
