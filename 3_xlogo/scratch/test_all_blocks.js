const fs = require('fs');
let turtleJs = fs.readFileSync('js/turtle.js', 'utf8') + '\nglobal.TurtleCanvas = TurtleCanvas;\n';
let interpreterJs = fs.readFileSync('js/interpreter.js', 'utf8') + '\nglobal.LogoInterpreter = LogoInterpreter;\n';
let blocklyConfigJs = fs.readFileSync('js/blockly_config.js', 'utf8') + '\n';

const mockCtx = {
    clearRect:()=>{}, beginPath:()=>{}, moveTo:()=>{}, lineTo:()=>{}, stroke:()=>{},
    fillText:()=>{}, save:()=>{}, restore:()=>{}, translate:()=>{}, rotate:()=>{}, drawImage:()=>{}, fill:()=>{}, closePath: me=>{}, fillRect:()=>{}, arc:()=>{}, ellipse:()=>{}
};
global.document = {
    getElementById: () => ({ getContext: () => mockCtx, width: 800, height: 600, style: {} })
};
global.window = {};
global.prompt = () => "10";

eval(turtleJs);
eval(interpreterJs);

// Mock Blockly for testing block generator registrations
global.Blockly = {
    defineBlocksWithJsonArray: (arr) => {},
    Toolbox: { prototype: {} },
    VerticalFlyout: { prototype: {} },
    Generator: class {
        constructor() {
            this.PRECEDENCE = 0;
        }
        valueToCode(block, name, order) {
            if (name === 'COLOR') return '4';
            if (name === 'X' || name === 'Y' || name === 'A' || name === 'B' || name === 'NUM' || name === 'DIST' || name === 'ANGLE' || name === 'WIDTH' || name === 'RAD' || name === 'RX' || name === 'RY' || name === 'TIMES' || name === 'MAX' || name === 'DELTA' || name === 'VALUE' || name === 'R' || name === 'G' || name === 'B') return '10';
            if (name === 'IF0') return '1';
            if (name === 'COND' || name === 'BOOL') return '0';
            if (name === 'TEXT') return '"Hola"';
            return '10';
        }
        statementToCode(block, name) {
            return 'av 10';
        }
        forBlock = {};
    },
    Themes: { Dark: {} },
    inject: () => ({ getFlyout: () => ({ position: () => {} }) })
};

eval(blocklyConfigJs);

const res = initBlockly();
const generator = res.logoGenerator;

const turtle = new global.TurtleCanvas('mock');
const interpreter = new global.LogoInterpreter(turtle);

const allBlockTypes = [
    // Event & Control (Statements)
    'logo_when_run', 'logo_repeat', 'logo_while', 'logo_do_while', 'controls_whileuntil', 'controls_if', 'controls_ifelse',
    
    // Movement (Statements & Expressions)
    'logo_forward', 'logo_backward', 'logo_turn_right', 'logo_turn_left',
    'logo_goto', 'logo_set_x', 'logo_set_y', 'logo_get_x', 'logo_get_y', 'logo_home',

    // Pen & Drawing (Statements & Expressions)
    'logo_pen_up', 'logo_pen_down', 'logo_pen_erase', 'logo_set_color', 'logo_set_color_num',
    'logo_color_rgb', 'logo_set_width', 'logo_circle', 'logo_circle_filled', 'logo_ellipse',
    'logo_ellipse_filled', 'logo_set_flood_color', 'logo_fill', 'logo_clear', 'logo_hide_turtle', 'logo_show_turtle',

    // Math & Logic (Expressions & Values)
    'logo_logic_compare', 'logo_logic_operation', 'logo_logic_negate', 'logo_logic_boolean',
    'logo_math_add', 'logo_math_minus', 'logo_math_multiply', 'logo_math_divide', 'logo_math_power',
    'logo_math_modulo', 'logo_math_single', 'logo_math_random', 'logo_math_pi',
    'math_number', 'math_arithmetic', 'math_single', 'math_change', 'math_random_int',
    'logic_compare', 'logic_operation', 'logic_negate', 'logic_boolean',

    // Text & Sensors
    'logo_text_print', 'logo_text_join', 'logo_text_ask', 'logo_text_answer', 'text',

    // Variables
    'variables_get', 'variables_set'
];

let successCount = 0;
let failCount = 0;

for (const blockType of allBlockTypes) {
    const fn = generator.forBlock[blockType];
    if (!fn) {
        console.error(`[MISSING GENERATOR] ${blockType}`);
        failCount++;
        continue;
    }

    const mockBlock = {
        type: blockType,
        getFieldValue: (field) => {
            if (field === 'COLOR') return '4';
            if (field === 'OP') return '=';
            if (field === 'BOOL') return 'TRUE';
            if (field === 'TEXT') return 'test';
            if (field === 'VAR') return 'x';
            if (field === 'NUM') return '10';
            return '1';
        },
        getField: () => ({ getText: () => 'x' }),
        workspace: null
    };

    try {
        const codeRes = fn(mockBlock);
        const isValue = Array.isArray(codeRes);
        const rawCode = isValue ? codeRes[0] : codeRes;
        
        if (rawCode === undefined || rawCode === null) {
            throw new Error('Generated code is null/undefined');
        }

        // Test statement vs expression in interpreter
        const testCode = isValue ? `escribe ${rawCode}` : rawCode;

        if (testCode.trim()) {
            interpreter.validate(testCode);
            interpreter.execute(testCode);
        }
        console.log(`[OK] ${blockType} -> Logo: ${JSON.stringify(rawCode)}`);
        successCount++;
    } catch (err) {
        console.error(`[FAIL] ${blockType}: ${err.message}`);
        failCount++;
    }
}

console.log(`\n========================================`);
console.log(`TOTAL BLOCKS TESTED: ${allBlockTypes.length}`);
console.log(`PASSED: ${successCount}`);
console.log(`FAILED: ${failCount}`);
console.log(`========================================`);
