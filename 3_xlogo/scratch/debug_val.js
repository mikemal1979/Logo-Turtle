const fs = require('fs');
global.window = {};
let codeStr = fs.readFileSync('js/interpreter.js','utf8') + '\nglobal.LogoInterpreter = LogoInterpreter;\n';
eval(codeStr);
const interp = new global.LogoInterpreter({});
const code = 'haz "r 100 haz "g 200 haz "b 50 poncolor [ :r :g :b ]';
const tokens = interp.tokenize(code);
console.log('Tokens:', tokens);
try {
    interp.validate(code);
    console.log('Validated successfully!');
} catch(e) {
    console.log('Validation Error:', e.message);
}
