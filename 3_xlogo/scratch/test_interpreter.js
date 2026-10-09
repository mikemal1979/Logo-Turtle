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

console.log('--- Test 1: CIRCLE & CIRCULO ---');
const cmd1 = 'CIRCLE 100 CIRCULO 50';
interpreter.validate(cmd1);
interpreter.execute(cmd1);
console.log('Test 1 Passed!');

console.log('--- Test 2: ELLIPSE & ELIPSE ---');
const cmd2 = 'ELLIPSE 150 80 ELIPSE 90 40';
interpreter.validate(cmd2);
interpreter.execute(cmd2);
console.log('Test 2 Passed!');

console.log('--- Test 3: Filled Shapes (PARC & PALE) ---');
const cmd3 = 'PARC 360 100 PALE 150 80 360';
interpreter.validate(cmd3);
interpreter.execute(cmd3);
console.log('Test 3 Passed!');

console.log('--- Test 4: SETFLOODCOLOR & FILL User Example ---');
const cmd4 = 'SETFLOODCOLOR rojo ELLIPSE 100 50 PENUP FORWARD 20 FILL BACK 20 PENDOWN';
interpreter.validate(cmd4);
interpreter.execute(cmd4);
console.log('Test 4 Passed!');

console.log('ALL NEW SHAPE COMMAND TESTS PASSED PERFECTLY!');
