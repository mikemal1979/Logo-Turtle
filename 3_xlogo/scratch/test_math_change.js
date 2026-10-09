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

console.log('--- Test math_change generated code (haz "x 10 -> haz "x :x + 5) ---');
interpreter.execute('haz "x 10');
interpreter.execute('haz "x :x + 5');

console.log('Value of x:', interpreter.variables['x']);
if (interpreter.variables['x'] === 15) {
    console.log('MATH_CHANGE LOGO CODE EXECUTED PERFECTLY!');
} else {
    console.log('FAILED');
}
