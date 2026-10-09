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
global.prompt = (msg) => "4"; // User inputs 4

eval(turtleJs);
eval(interpreterJs);

const turtle = new global.TurtleCanvas('mock');
turtle.drawText = (txt) => printedText.push(txt);
const interpreter = new global.LogoInterpreter(turtle);

const code = `
PARA poligono :lado
  escribe 360 / :lado
FIN

pregunta "¿Cantidad de lados?"
poligono :respuesta
`;

interpreter.execute(code);
console.log('Printed output:', printedText);
if (printedText.includes(90) || printedText.includes('90')) {
    console.log('SUCCESS: Division result is 90!');
} else {
    console.log('FAILED: Output was', printedText);
}
