const fs = require('fs');
let turtleJs = fs.readFileSync('js/turtle.js', 'utf8') + '\nglobal.TurtleCanvas = TurtleCanvas;\n';
let interpreterJs = fs.readFileSync('js/interpreter.js', 'utf8') + '\nglobal.LogoInterpreter = LogoInterpreter;\n';
let blocklyConfigJs = fs.readFileSync('js/blockly_config.js', 'utf8') + '\n';

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

console.log('=== TEST 1: REPETIR keyword alias ===');
interpreter.execute('haz "count 0 REPETIR 5 [ haz "count :count + 1 ]');
console.log('REPETIR count:', interpreter.variables['count']);
if (interpreter.variables['count'] !== 5) {
    throw new Error(`Expected REPETIR count to be 5, got ${interpreter.variables['count']}`);
}
console.log('Test 1 Passed!\n');

console.log('=== TEST 2: MIENTRAS (while) loop ===');
interpreter.execute('haz "i 0 MIENTRAS :i < 4 [ av 10 haz "i :i + 1 ]');
console.log('MIENTRAS i:', interpreter.variables['i']);
if (interpreter.variables['i'] !== 4) {
    throw new Error(`Expected MIENTRAS i to be 4, got ${interpreter.variables['i']}`);
}
console.log('Test 2 Passed!\n');

console.log('=== TEST 3: HAZ...MIENTRAS (do...while) loop ===');
interpreter.execute('haz "j 0 HAZ [ av 10 haz "j :j + 1 ] MIENTRAS :j < 3');
console.log('HAZ...MIENTRAS j:', interpreter.variables['j']);
if (interpreter.variables['j'] !== 3) {
    throw new Error(`Expected HAZ...MIENTRAS j to be 3, got ${interpreter.variables['j']}`);
}
console.log('Test 3 Passed!\n');

console.log('=== TEST 4: HAZ_MIENTRAS single keyword do...while loop ===');
interpreter.execute('haz "k 0 HAZ_MIENTRAS [ av 10 haz "k :k + 1 ] :k < 2');
console.log('HAZ_MIENTRAS k:', interpreter.variables['k']);
if (interpreter.variables['k'] !== 2) {
    throw new Error(`Expected HAZ_MIENTRAS k to be 2, got ${interpreter.variables['k']}`);
}
console.log('Test 4 Passed!\n');

console.log('=== TEST 5: DO...WHILE executes at least once when condition is false ===');
interpreter.execute('haz "x 100 HAZ [ haz "x :x + 1 ] MIENTRAS :x < 5');
console.log('Do...while false condition x:', interpreter.variables['x']);
if (interpreter.variables['x'] !== 101) {
    throw new Error(`Expected x to be 101, got ${interpreter.variables['x']}`);
}
console.log('Test 5 Passed!\n');

// Mock Blockly for testing generator registrations
global.Blockly = {
    defineBlocksWithJsonArray: (arr) => {},
    Toolbox: { prototype: {} },
    VerticalFlyout: { prototype: {} },
    Generator: class {
        constructor() { this.PRECEDENCE = 0; }
        valueToCode(block, name, order) {
            if (name === 'COND') return ':i < 3';
            if (name === 'TIMES') return '4';
            return '1';
        }
        statementToCode(block, name) {
            return 'av 10 haz "i :i + 1';
        }
        forBlock = {};
    },
    Themes: { Dark: {} },
    inject: () => ({ getFlyout: () => ({ position: () => {} }) })
};

eval(blocklyConfigJs);
const res = initBlockly();
const generator = res.logoGenerator;

console.log('=== TEST 6: Blockly logo_while generator ===');
const whileGen = generator.forBlock['logo_while'];
const whileBlock = { type: 'logo_while', getFieldValue: () => '' };
const whileCode = whileGen(whileBlock);
console.log('Generated code:', whileCode);
if (!whileCode.includes('mientras :i < 3')) {
    throw new Error(`Invalid logo_while generator output: ${whileCode}`);
}
console.log('Test 6 Passed!\n');

console.log('=== TEST 7: Blockly logo_do_while generator ===');
const doWhileGen = generator.forBlock['logo_do_while'];
const doWhileBlock = { type: 'logo_do_while', getFieldValue: () => '' };
const doWhileCode = doWhileGen(doWhileBlock);
console.log('Generated code:', doWhileCode);
if (!doWhileCode.includes('haz [ av 10 haz "i :i + 1 ] mientras :i < 3')) {
    throw new Error(`Invalid logo_do_while generator output: ${doWhileCode}`);
}
console.log('Test 7 Passed!\n');

console.log('ALL LOOP TESTS PASSED PERFECTLY!');
