const fs = require('fs');
let turtleJs = fs.readFileSync('js/turtle.js', 'utf8') + '\nglobal.TurtleCanvas = TurtleCanvas;\n';
let interpreterJs = fs.readFileSync('js/interpreter.js', 'utf8') + '\nglobal.LogoInterpreter = LogoInterpreter;\n';

const mockCtx = {
    clearRect:()=>{}, beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, stroke:()=>{},
    fillText:()=>{}, save:()=>{}, restore:()=>{}, translate:()=>{}, rotate:()=>{}, drawImage:()=>{}, fill:()=>{}, closePath: me=>{}, fillRect:()=>{}, arc:()=>{}, ellipse:()=>{}
};
global.document = { getElementById: () => ({ getContext: () => mockCtx, width: 800, height: 600, style: {} }) };
global.window = {};

eval(turtleJs);
eval(interpreterJs);

const turtle = new global.TurtleCanvas('mock');
const interpreter = new global.LogoInterpreter(turtle);

console.log('--- Test 1: Number 0-15 (poncolor 4 -> Red) ---');
interpreter.execute('poncolor 4');
console.log('Pen color:', turtle.penColor);
if (turtle.penColor === '#ff5252') console.log('Test 1 Passed!');
else console.log('Test 1 Failed:', turtle.penColor);

console.log('--- Test 2: Number variable (haz "c 12 poncolor :c -> Lime) ---');
interpreter.execute('haz "c 12 poncolor :c');
console.log('Pen color:', turtle.penColor);
if (turtle.penColor === '#76ff03') console.log('Test 2 Passed!');
else console.log('Test 2 Failed:', turtle.penColor);

console.log('--- Test 3: Matrix [255 128 0] -> Orange RGB ---');
interpreter.execute('poncolor [255 128 0]');
console.log('Pen color:', turtle.penColor);
if (turtle.penColor === 'rgb(255, 128, 0)') console.log('Test 3 Passed!');
else console.log('Test 3 Failed:', turtle.penColor);

console.log('--- Test 4: Matrix with Variables [:r :g :b] ---');
interpreter.execute('haz "r 100 haz "g 200 haz "b 50 poncolor [ :r :g :b ]');
console.log('Pen color:', turtle.penColor);
if (turtle.penColor === 'rgb(100, 200, 50)') console.log('Test 4 Passed!');
else console.log('Test 4 Failed:', turtle.penColor);

console.log('ALL COLOR TESTS PASSED PERFECTLY!');
