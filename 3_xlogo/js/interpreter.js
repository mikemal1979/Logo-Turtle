/**
 * Logo Language Parser & Interpreter
 * Supports Spanish (`AV`, `RE`, `GD`, `GI`, `REPITE`, `PARA`, etc.) and English (`FORWARD`, `RIGHT`, `REPEAT`, etc.)
 */

class LogoInterpreter {
    constructor(turtle) {
        this.turtle = turtle;
        this.procedures = {};
        this.variables = {};
    }

    // Color map helper (supports names, hex, rgb, and numeric color indices 0-15)
    parseColor(token) {
        if (token === undefined || token === null) return '#00e676';

        // 1. Array / Matrix [r, g, b]
        if (Array.isArray(token)) {
            const r = Math.min(255, Math.max(0, Math.round(Number(token[0]) || 0)));
            const g = Math.min(255, Math.max(0, Math.round(Number(token[1]) || 0)));
            const b = Math.min(255, Math.max(0, Math.round(Number(token[2]) || 0)));
            return `rgb(${r}, ${g}, ${b})`;
        }

        let strToken = token.toString().trim().toLowerCase();

        // 2. Bracket Matrix String format "[255 0 0]" or "[255, 0, 0]" or "255 0 0"
        if (strToken.startsWith('[') && strToken.endsWith(']')) {
            const inner = strToken.slice(1, -1).trim();
            const parts = inner.split(/[\s,]+/).map(Number);
            if (parts.length >= 3 && !parts.some(isNaN)) {
                const r = Math.min(255, Math.max(0, Math.round(parts[0])));
                const g = Math.min(255, Math.max(0, Math.round(parts[1])));
                const b = Math.min(255, Math.max(0, Math.round(parts[2])));
                return `rgb(${r}, ${g}, ${b})`;
            }
        }

        // 3. Palette indices 0-15 (XLogo / MSWLogo standard)
        const numMap = {
            '0': '#000000', // Negro
            '1': '#448aff', // Azul
            '2': '#00e676', // Verde
            '3': '#00e5ff', // Cian
            '4': '#ff5252', // Rojo
            '5': '#ff4081', // Rosa/Magenta
            '6': '#ffd600', // Amarillo
            '7': '#ffffff', // Blanco
            '8': '#ff9100', // Naranja
            '9': '#e040fb', // Violeta
            '10': '#8d6e63', // Marrón
            '11': '#00b0ff', // Azul Claro
            '12': '#76ff03', // Verde Lima
            '13': '#18ffff', // Turquesa
            '14': '#ff6e40', // Coral
            '15': '#e0e0e0'  // Gris
        };
        if (numMap[strToken]) return numMap[strToken];

        // Any numeric value (e.g. 0 to 15 or computed number)
        if (!isNaN(strToken) && strToken !== '') {
            const idx = Math.abs(Math.round(parseFloat(strToken))) % 16;
            return numMap[String(idx)] || '#00e676';
        }

        const colorMap = {
            'rojo': '#ff5252', 'red': '#ff5252',
            'verde': '#00e676', 'green': '#00e676',
            'azul': '#448aff', 'blue': '#448aff',
            'amarillo': '#ffd600', 'yellow': '#ffd600',
            'blanco': '#ffffff', 'white': '#ffffff',
            'negro': '#000000', 'black': '#000000',
            'cian': '#00e5ff', 'cyan': '#00e5ff',
            'violeta': '#e040fb', 'purple': '#e040fb',
            'naranja': '#ff9100', 'orange': '#ff9100',
            'rosa': '#ff4081', 'pink': '#ff4081',
            'gris': '#90a4ae', 'gray': '#90a4ae'
        };

        if (colorMap[strToken]) return colorMap[strToken];
        if (strToken.startsWith('#') || strToken.startsWith('rgb')) return strToken;
        return '#00e676';
    }

    parseColorArg(tokens, currentI, localVars = {}) {
        let i = currentI + 1;
        if (i >= tokens.length) return { color: '#00e676', nextI: i };

        if (tokens[i] === '[') {
            i++; // skip '['
            const rIdx = { i };
            const r = this.evaluateExpression(tokens, rIdx, localVars);
            i = rIdx.i;
            if (i < tokens.length && tokens[i] === ',') i++;

            const gIdx = { i };
            const g = this.evaluateExpression(tokens, gIdx, localVars);
            i = gIdx.i;
            if (i < tokens.length && tokens[i] === ',') i++;

            const bIdx = { i };
            const b = this.evaluateExpression(tokens, bIdx, localVars);
            i = bIdx.i;

            while (i < tokens.length && tokens[i] !== ']') i++;
            if (i < tokens.length && tokens[i] === ']') i++;

            const color = this.parseColor([r, g, b]);
            return { color, nextI: i };
        } else {
            const idx = { i };
            const val = this.evaluateExpression(tokens, idx, localVars);
            i = idx.i;
            const color = this.parseColor(val);
            return { color, nextI: i };
        }
    }

    tokenize(code) {
        // Tokenizer handling brackets, quotes, colons, words, numbers
        const tokens = [];
        let i = 0;

        while (i < code.length) {
            const char = code[i];

            if (/\s/.test(char)) {
                i++;
                continue;
            }

            if (char === '[' || char === ']') {
                tokens.push(char);
                i++;
                continue;
            }

            if (char === '"') {
                let word = '"';
                i++;
                let hasClosingQuote = false;
                let rest = code.substring(i);
                let nextQuote = rest.indexOf('"');
                let nextNewline = rest.search(/[\r\n]/);
                let firstSpace = rest.search(/[\s\[\]]/);

                if (nextQuote !== -1 && (firstSpace === -1 || nextQuote < firstSpace) && (nextNewline === -1 || nextQuote < nextNewline)) {
                    hasClosingQuote = true;
                }

                while (i < code.length) {
                    const c = code[i];
                    if (c === '"' && hasClosingQuote) {
                        word += '"';
                        i++;
                        break;
                    }
                    if (!hasClosingQuote && (/\s/.test(c) || c === '[' || c === ']')) {
                        break;
                    }
                    if (c === '\n' || c === '\r') break;
                    word += c;
                    i++;
                }
                tokens.push(word);
                continue;
            }

            if (char === ':') {
                let word = ':';
                i++;
                while (i < code.length && /[a-zA-Z0-9_\-áéíóúÁÉÍÓÚñÑ]/.test(code[i])) {
                    word += code[i];
                    i++;
                }
                tokens.push(word);
                continue;
            }

            // Word or Number
            let word = '';
            while (i < code.length && !/\s/.test(code[i]) && code[i] !== '[' && code[i] !== ']') {
                word += code[i];
                i++;
            }
            tokens.push(word);
        }

        return tokens;
    }

    parse(tokens) {
        let index = 0;

        const parseBlock = () => {
            const block = [];
            while (index < tokens.length) {
                const token = tokens[index];

                if (token === ']') {
                    break;
                }

                if (token.toUpperCase() === 'PARA' || token.toUpperCase() === 'TO') {
                    index++;
                    const procName = tokens[index++].toLowerCase();
                    const params = [];
                    while (index < tokens.length && tokens[index].startsWith(':')) {
                        params.push(tokens[index++].substring(1));
                    }

                    const procTokens = [];
                    while (index < tokens.length && tokens[index].toUpperCase() !== 'FIN' && tokens[index].toUpperCase() !== 'END') {
                        procTokens.push(tokens[index++]);
                    }
                    if (index < tokens.length) index++; // Consume FIN/END

                    this.procedures[procName] = { params, body: procTokens };
                    continue;
                }

                block.push(token);
                index++;
            }
            return block;
        };

        return parseBlock();
    }

    validate(code) {
        const tokens = this.tokenize(code);
        if (tokens.length === 0) return true;

        // 1. Check bracket balance
        let openBrackets = 0;
        for (const token of tokens) {
            if (token === '[') openBrackets++;
            if (token === ']') openBrackets--;
            if (openBrackets < 0) {
                throw new Error("Se encontró un corchete de cierre ']' sin su corchete de apertura '[' correspondiente.");
            }
        }
        if (openBrackets > 0) {
            throw new Error(`Faltan ${openBrackets} corchete(s) de cierre ']' para completar la instrucción.`);
        }

        // 2. Validate keywords and arguments
        this.validateTokens(tokens, {});
        return true;
    }

    evaluateExpression(tokens, indexObj, localVars = {}) {
        if (indexObj.i >= tokens.length) return 0;

        // Matrix / Array / List Literal [ e1 e2 ... ]
        if (tokens[indexObj.i] === '[') {
            indexObj.i++; // Skip '['
            const arr = [];
            while (indexObj.i < tokens.length && tokens[indexObj.i] !== ']') {
                if (tokens[indexObj.i] === ',') {
                    indexObj.i++;
                    continue;
                }
                const elem = this.evaluateExpression(tokens, indexObj, localVars);
                arr.push(elem);
            }
            if (indexObj.i < tokens.length && tokens[indexObj.i] === ']') {
                indexObj.i++; // Skip ']'
            }
            return arr;
        }

        const parseValue = (valToken) => {
            if (valToken === undefined || valToken === null) return 0;
            if (typeof valToken === 'number') return valToken;

            let resolvedVal = valToken;
            const originalStr = String(valToken).trim();
            const strVal = originalStr.toLowerCase();

            // Unary functions & Constants
            if (strVal === 'pi') return Math.PI;
            if (strVal === 'verdadero' || strVal === 'true') return 1;
            if (strVal === 'falso' || strVal === 'false') return 0;

            if (strVal === 'azar' || strVal === 'random') {
                indexObj.i++;
                const max = parseValue(tokens[indexObj.i]);
                const numMax = (typeof max === 'number' && !isNaN(max)) ? max : 100;
                return Math.floor(Math.random() * numMax) + 1;
            }
            if (strVal === 'abs' || strVal === 'absoluto') {
                indexObj.i++;
                const n = parseValue(tokens[indexObj.i]);
                return Math.abs(Number(n) || 0);
            }
            if (strVal === 'raiz' || strVal === 'sqrt') {
                indexObj.i++;
                const n = parseValue(tokens[indexObj.i]);
                return Math.sqrt(Number(n) || 0);
            }
            if (strVal === 'redondea' || strVal === 'round') {
                indexObj.i++;
                const n = parseValue(tokens[indexObj.i]);
                return Math.round(Number(n) || 0);
            }
            if (strVal === 'seno' || strVal === 'sin') {
                indexObj.i++;
                const n = parseValue(tokens[indexObj.i]);
                return Math.sin((Number(n) || 0) * Math.PI / 180);
            }
            if (strVal === 'coseno' || strVal === 'cos') {
                indexObj.i++;
                const n = parseValue(tokens[indexObj.i]);
                return Math.cos((Number(n) || 0) * Math.PI / 180);
            }
            if (strVal === 'no' || strVal === 'not' || strVal === '!') {
                indexObj.i++;
                const val = parseValue(tokens[indexObj.i]);
                return (!val || val === 0 || val === '0' || val === 'false') ? 1 : 0;
            }

            if (originalStr.startsWith(':')) {
                const varName = originalStr.substring(1);
                if (localVars[varName] !== undefined) resolvedVal = localVars[varName];
                else if (this.variables[varName] !== undefined) resolvedVal = this.variables[varName];
                else resolvedVal = 0;
            } else if (originalStr.startsWith('"')) {
                let text = originalStr.substring(1);
                if (text.endsWith('"')) text = text.slice(0, -1);
                resolvedVal = text;
            }

            if (typeof resolvedVal === 'number') return resolvedVal;
            const strResolved = String(resolvedVal).trim();
            if (strResolved !== '' && !isNaN(strResolved)) {
                return parseFloat(strResolved);
            }
            return resolvedVal;
        };

        if (indexObj.i >= tokens.length) return 0;

        let left = parseValue(tokens[indexObj.i]);
        indexObj.i++;

        while (indexObj.i < tokens.length) {
            const op = tokens[indexObj.i];
            if (op === '+' || op === '-' || op === '*' || op === '/' || op === '%' || op === '^') {
                indexObj.i++;
                if (indexObj.i >= tokens.length) break;
                const right = parseValue(tokens[indexObj.i]);
                indexObj.i++;

                const numLeft = (typeof left === 'number') ? left : (!isNaN(left) && String(left).trim() !== '' ? parseFloat(left) : NaN);
                const numRight = (typeof right === 'number') ? right : (!isNaN(right) && String(right).trim() !== '' ? parseFloat(right) : NaN);

                if (!isNaN(numLeft) && !isNaN(numRight)) {
                    if (op === '+') left = numLeft + numRight;
                    else if (op === '-') left = numLeft - numRight;
                    else if (op === '*') left = numLeft * numRight;
                    else if (op === '/') left = numRight !== 0 ? numLeft / numRight : 0;
                    else if (op === '%') left = numLeft % numRight;
                    else if (op === '^') left = Math.pow(numLeft, numRight);
                } else if (op === '+') {
                    left = String(left) + String(right);
                }
            } else if (op === '=' || op === '==' || op === '<>' || op === '!=' || op === '<' || op === '<=' || op === '>' || op === '>=') {
                indexObj.i++;
                if (indexObj.i >= tokens.length) break;
                const right = parseValue(tokens[indexObj.i]);
                indexObj.i++;

                const numLeft = (typeof left === 'number') ? left : (!isNaN(left) && String(left).trim() !== '' ? parseFloat(left) : NaN);
                const numRight = (typeof right === 'number') ? right : (!isNaN(right) && String(right).trim() !== '' ? parseFloat(right) : NaN);

                if (!isNaN(numLeft) && !isNaN(numRight)) {
                    if (op === '=' || op === '==') left = numLeft === numRight ? 1 : 0;
                    else if (op === '<>' || op === '!=') left = numLeft !== numRight ? 1 : 0;
                    else if (op === '<') left = numLeft < numRight ? 1 : 0;
                    else if (op === '<=') left = numLeft <= numRight ? 1 : 0;
                    else if (op === '>') left = numLeft > numRight ? 1 : 0;
                    else if (op === '>=') left = numLeft >= numRight ? 1 : 0;
                } else {
                    const strL = String(left);
                    const strR = String(right);
                    if (op === '=' || op === '==') left = strL === strR ? 1 : 0;
                    else if (op === '<>' || op === '!=') left = strL !== strR ? 1 : 0;
                    else if (op === '<') left = strL < strR ? 1 : 0;
                    else if (op === '<=') left = strL <= strR ? 1 : 0;
                    else if (op === '>') left = strL > strR ? 1 : 0;
                    else if (op === '>=') left = strL >= strR ? 1 : 0;
                }
            } else if (op === 'y' || op === 'and' || op === '&&') {
                indexObj.i++;
                if (indexObj.i >= tokens.length) break;
                const right = parseValue(tokens[indexObj.i]);
                indexObj.i++;
                left = (left && right) ? 1 : 0;
            } else if (op === 'o' || op === 'or' || op === '||') {
                indexObj.i++;
                if (indexObj.i >= tokens.length) break;
                const right = parseValue(tokens[indexObj.i]);
                indexObj.i++;
                left = (left || right) ? 1 : 0;
            } else {
                break;
            }
        }

        return left;
    }

    isTruthy(val) {
        if (typeof val === 'number') return val !== 0;
        if (typeof val === 'boolean') return val;
        if (typeof val === 'string') return val !== '' && val !== '0' && val.toLowerCase() !== 'false';
        return Boolean(val);
    }

    validateTokens(tokens, localVars = {}) {
        let i = 0;

        const isOperator = (t) => t === '+' || t === '-' || t === '*' || t === '/' || t === '%' || t === '^' || t === '=' || t === '==' || t === '<>' || t === '!=' || t === '<' || t === '<=' || t === '>' || t === '>=' || t === 'y' || t === 'and' || t === '&&' || t === 'o' || t === 'or' || t === '||';

        const isUnaryFunc = (t) => {
            if (!t) return false;
            const str = String(t).toLowerCase();
            return str === 'no' || str === 'not' || str === '!' ||
                   str === 'abs' || str === 'absoluto' ||
                   str === 'raiz' || str === 'sqrt' ||
                   str === 'redondea' || str === 'round' ||
                   str === 'seno' || str === 'sin' ||
                   str === 'coseno' || str === 'cos' ||
                   str === 'azar' || str === 'random';
        };

        const consumeExpr = () => {
            if (i >= tokens.length) return;
            if (tokens[i] === '[') {
                consumeColorArg();
                return;
            }
            if (isUnaryFunc(tokens[i])) {
                i++; // Consume unary keyword
                if (i < tokens.length) consumeExpr();
                return;
            }
            i++; // Consume first token of expression
            while (i < tokens.length && isOperator(tokens[i])) {
                i++; // Consume operator
                if (i < tokens.length) {
                    if (isUnaryFunc(tokens[i])) {
                        consumeExpr();
                    } else if (tokens[i] === '[') {
                        consumeColorArg();
                    } else {
                        i++;
                    }
                }
            }
        };

        const consumeColorArg = () => {
            if (i >= tokens.length) return;
            if (tokens[i] === '[') {
                i++; // skip '['
                while (i < tokens.length && tokens[i] !== ']') {
                    consumeExpr();
                }
                if (i < tokens.length && tokens[i] === ']') i++; // skip ']'
            } else {
                consumeExpr();
            }
        };

        while (i < tokens.length) {
            const token = tokens[i];
            const cmd = token.toLowerCase();

            if (token === '[' || token === ']') {
                i++;
                continue;
            }

            // Procedure definition handling (PARA nombre :p1 :p2 ... FIN)
            if (cmd === 'para' || cmd === 'to') {
                i++;
                if (i >= tokens.length) throw new Error("Falta el nombre del procedimiento después de 'PARA'.");
                const procName = tokens[i++].toLowerCase();
                const params = [];
                while (i < tokens.length && tokens[i].startsWith(':')) {
                    params.push(tokens[i++].substring(1));
                }
                const procTokens = [];
                while (i < tokens.length && tokens[i].toUpperCase() !== 'FIN' && tokens[i].toUpperCase() !== 'END') {
                    procTokens.push(tokens[i++]);
                }
                if (i >= tokens.length) {
                    throw new Error(`El procedimiento '${procName}' no tiene la palabra clave 'FIN' al final.`);
                }
                i++; // Consume FIN
                this.procedures[procName] = { params, body: procTokens };
                continue;
            }

            // Command checks
            if (cmd === 'av' || cmd === 'avanzar' || cmd === 'avanza' || cmd === 'adelante' || cmd === 'forward' || cmd === 'fd' ||
                cmd === 're' || cmd === 'retroceder' || cmd === 'retrocede' || cmd === 'back' || cmd === 'backward' || cmd === 'bk' ||
                cmd === 'gd' || cmd === 'giraderecha' || cmd === 'derecha' || cmd === 'de' || cmd === 'right' || cmd === 'rt' ||
                cmd === 'gi' || cmd === 'giraizquierda' || cmd === 'izquierda' || cmd === 'iz' || cmd === 'left' || cmd === 'lt' ||
                cmd === 'setheading' || cmd === 'seth' || cmd === 'ponrumbo' || cmd === 'fijarangulo' || cmd === 'rumbo' ||
                cmd === 'ponx' || cmd === 'setx' || cmd === 'pony' || cmd === 'sety' ||
                cmd === 'escribe' || cmd === 'imprime' || cmd === 'etiqueta' || cmd === 'pregunta' || cmd === 'ask') {
                if (i + 1 >= tokens.length) throw new Error(`La instrucción '${token}' requiere un argumento.`);
                i++;
                consumeExpr();
            }
            else if (cmd === 'setpensize' || cmd === 'pongrosor' || cmd === 'ponancho' || cmd === 'pontl' || cmd === 'pg' || cmd === 'setwidth') {
                if (i + 1 >= tokens.length) throw new Error(`La instrucción '${token}' requiere el tamaño del grosor.`);
                i++;
                consumeColorArg();
            }
            else if (cmd === 'setpencolor' || cmd === 'setpc' || cmd === 'poncolorlápiz' || cmd === 'poncolorlapiz' || cmd === 'poncolor' || cmd === 'pcl' || cmd === 'pc') {
                if (i + 1 >= tokens.length) throw new Error(`La instrucción '${token}' requiere un color.`);
                i++;
                consumeColorArg();
            }
            else if (cmd === 'setscreencolor' || cmd === 'setsc' || cmd === 'poncolorfondo' || cmd === 'pcf') {
                if (i + 1 >= tokens.length) throw new Error(`La instrucción '${token}' requiere un color de fondo.`);
                i++;
                consumeColorArg();
            }
            else if (cmd === 'setfloodcolor' || cmd === 'setfc' || cmd === 'poncolorrelleno' || cmd === 'pcr') {
                if (i + 1 >= tokens.length) throw new Error(`La instrucción '${token}' requiere un color de relleno.`);
                i++;
                consumeColorArg();
            }
            else if (cmd === 'haz' || cmd === 'make' || cmd === 'hacer') {
                if (i + 1 < tokens.length && tokens[i + 1] === '[') {
                    i += 2; // skip 'haz' and '['
                    const blockTokens = [];
                    let depth = 1;
                    while (i < tokens.length && depth > 0) {
                        if (tokens[i] === '[') depth++;
                        else if (tokens[i] === ']') depth--;
                        if (depth > 0) blockTokens.push(tokens[i]);
                        i++;
                    }
                    if (depth > 0) throw new Error("Falta el corchete de cierre ']' en bucle HAZ...MIENTRAS.");
                    this.validateTokens(blockTokens, localVars);
                    if (i < tokens.length && (tokens[i].toLowerCase() === 'mientras' || tokens[i].toLowerCase() === 'while')) {
                        i++;
                    }
                    if (i >= tokens.length) throw new Error("Falta la condición al final del bucle HAZ...MIENTRAS.");
                    consumeExpr();
                } else {
                    if (i + 2 >= tokens.length) throw new Error("La instrucción 'HAZ' requiere el nombre de la variable y un valor.");
                    i += 2; // Advance to value expression
                    consumeColorArg(); // Consumes value expression or matrix
                }
            }
            else if (cmd === 'haz_mientras' || cmd === 'hazmientras' || cmd === 'hacer_mientras' || cmd === 'hacermientras' || cmd === 'do_while' || cmd === 'dowhile') {
                if (i + 1 >= tokens.length || tokens[i + 1] !== '[') {
                    throw new Error("Se esperaba un corchete de apertura '[' en 'HAZ_MIENTRAS'.");
                }
                i += 2; // skip cmd and '['
                const blockTokens = [];
                let depth = 1;
                while (i < tokens.length && depth > 0) {
                    if (tokens[i] === '[') depth++;
                    else if (tokens[i] === ']') depth--;
                    if (depth > 0) blockTokens.push(tokens[i]);
                    i++;
                }
                if (depth > 0) throw new Error("Falta el corchete de cierre ']' en 'HAZ_MIENTRAS'.");
                this.validateTokens(blockTokens, localVars);
                if (i < tokens.length && (tokens[i].toLowerCase() === 'mientras' || tokens[i].toLowerCase() === 'while')) {
                    i++;
                }
                if (i >= tokens.length) throw new Error("La instrucción 'HAZ_MIENTRAS' requiere una condición al final.");
                consumeExpr();
            }
            else if (cmd === 'mientras' || cmd === 'while') {
                if (i + 1 >= tokens.length) throw new Error("La instrucción 'MIENTRAS' requiere una condición.");
                i++;
                consumeExpr();
                if (i < tokens.length && tokens[i] === '[') {
                    // Main loop will validate contents of '['
                }
            }
            else if (cmd === 'circle' || cmd === 'círculo' || cmd === 'circulo' || cmd === 'circulorelleno') {
                if (i + 1 >= tokens.length) throw new Error(`La instrucción '${token}' requiere el radio.`);
                i++;
                consumeExpr();
            }
            else if (cmd === 'parc') {
                if (i + 2 >= tokens.length) throw new Error(`La instrucción '${token}' requiere ángulo y radio.`);
                i++;
                consumeExpr();
                consumeExpr();
            }
            else if (cmd === 'ellipse' || cmd === 'elipse' || cmd === 'elipserellena') {
                if (i + 2 >= tokens.length) throw new Error(`La instrucción '${token}' requiere el radio X y radio Y.`);
                i++;
                consumeExpr();
                consumeExpr();
            }
            else if (cmd === 'pale') {
                if (i + 3 >= tokens.length) throw new Error(`La instrucción '${token}' requiere radio X, radio Y y ángulo.`);
                i++;
                consumeExpr();
                consumeExpr();
                consumeExpr();
            }
            else if (cmd === 'ponxy' || cmd === 'setxy' || cmd === 'ponpos' || cmd === 'ir_a' || cmd === 'ir' || cmd === 'goto') {
                if (i + 2 >= tokens.length) throw new Error(`La instrucción '${token}' requiere las posiciones X e Y.`);
                i++;
                consumeExpr();
                consumeExpr();
            }
            else if (cmd === 'repite' || cmd === 'repetir' || cmd === 'repeat' || cmd === 'repie' || cmd === 'rep') {
                if (i + 1 >= tokens.length) throw new Error("La instrucción 'REPITE' requiere el número de repeticiones.");
                i++;
                consumeExpr();
                if (i >= tokens.length || tokens[i] !== '[') {
                    throw new Error("Se esperaba un corchete de apertura '[' en 'REPITE'.");
                }
            }
            else if (cmd === 'si' || cmd === 'if') {
                if (i + 1 >= tokens.length) throw new Error("La instrucción 'SI' requiere una condición.");
                i++;
                consumeExpr();
                if (i >= tokens.length || tokens[i] !== '[') {
                    throw new Error("Se esperaba un corchete de apertura '[' en 'SI'.");
                }
            }
            else if (cmd === 'sl' || cmd === 'subelapiz' || cmd === 'subirlapiz' || cmd === 'subirlápiz' || cmd === 'sinpluma' || cmd === 'sp' || cmd === 'penup' || cmd === 'pu' ||
                     cmd === 'bl' || cmd === 'bajalapiz' || cmd === 'bajarlapiz' || cmd === 'bajarlápiz' || cmd === 'conpluma' || cmd === 'cp' || cmd === 'pendown' || cmd === 'pd' ||
                     cmd === 'borra' || cmd === 'pe' || cmd === 'ólo' || cmd === 'olo' || cmd === 'borrador' || cmd === 'penerase' ||
                     cmd === 'lápiz' || cmd === 'lapiz' || cmd === 'pinta' || cmd === 'pte' || cmd === 'ppt' || cmd === 'penpaint' ||
                     cmd === 'fill' || cmd === 'rellena' || cmd === 'rellenar' ||
                     cmd === 'bp' || cmd === 'borrapantalla' || cmd === 'borrarpantalla' || cmd === 'limpiapantalla' || cmd === 'limpiar' || cmd === 'lp' || cmd === 'clear' || cmd === 'clearscreen' || cmd === 'cs' ||
                     cmd === 'cleartext' || cmd === 'ct' || cmd === 'borrartexto' || cmd === 'bt' ||
                     cmd === 'centrar' || cmd === 'inicio' || cmd === 'origen' || cmd === 'home' ||
                     cmd === 'ot' || cmd === 'ocultatortuga' || cmd === 'ocultartortuga' || cmd === 'hideturtle' || cmd === 'ht' ||
                     cmd === 'mt' || cmd === 'muestratortuga' || cmd === 'mostrartortuga' || cmd === 'showturtle' || cmd === 'st' ||
                     cmd === 'bye' || cmd === 'adiós' || cmd === 'adios' ||
                     cmd === 'respuesta' || cmd === 'answer' || cmd === 'posx' || cmd === 'posy' || cmd === 'posicionx' || cmd === 'posiciony') {
                i++;
            }
            else if (this.procedures[cmd]) {
                const proc = this.procedures[cmd];
                i++;
                for (let p = 0; p < proc.params.length; p++) {
                    if (i >= tokens.length) throw new Error(`El procedimiento '${cmd}' requiere ${proc.params.length} argumento(s).`);
                    consumeExpr();
                }
            }
            else {
                throw new Error(`Instrucción no reconocida: '${token}'. Usa AV/ADELANTE, RE/RETROCEDE, GD/DERECHA, GI/IZQUIERDA, HAZ, PONPOS...`);
            }
        }
    }

    execute(code) {
        this.validate(code);
        const tokens = this.tokenize(code);
        this.executeTokens(tokens, {});
    }

    executeTokens(tokens, localVars = {}) {
        let i = 0;

        while (i < tokens.length) {
            const cmd = tokens[i].toLowerCase();

            if (tokens[i] === '[' || tokens[i] === ']') {
                i++;
                continue;
            }

            // PARA / TO procedure definition
            if (cmd === 'para' || cmd === 'to') {
                i++;
                if (i >= tokens.length) break;
                const procName = tokens[i++].toLowerCase();
                const params = [];
                while (i < tokens.length && tokens[i].startsWith(':')) {
                    params.push(tokens[i++].substring(1));
                }
                const procTokens = [];
                while (i < tokens.length && tokens[i].toUpperCase() !== 'FIN' && tokens[i].toUpperCase() !== 'END') {
                    procTokens.push(tokens[i++]);
                }
                if (i < tokens.length) i++; // Skip FIN / END
                this.procedures[procName] = { params, body: procTokens };
                continue;
            }

            // ADELANTE / AVANZAR / AVANZA / AV / FORWARD / FD
            if (cmd === 'av' || cmd === 'avanzar' || cmd === 'avanza' || cmd === 'adelante' || cmd === 'forward' || cmd === 'fd') {
                const idx = { i: i + 1 };
                const dist = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.forward(dist);
            }
            // RETROCEDE / RETROCEDER / RE / BACK / BACKWARD / BK
            else if (cmd === 're' || cmd === 'retroceder' || cmd === 'retrocede' || cmd === 'back' || cmd === 'backward' || cmd === 'bk') {
                const idx = { i: i + 1 };
                const dist = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.backward(dist);
            }
            // DERECHA / GIRADERECHA / GD / DE / RIGHT / RT
            else if (cmd === 'gd' || cmd === 'giraderecha' || cmd === 'derecha' || cmd === 'de' || cmd === 'right' || cmd === 'rt') {
                const idx = { i: i + 1 };
                const deg = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.turnRight(deg);
            }
            // IZQUIERDA / GIRAIZQUIERDA / GI / IZ / LEFT / LT
            else if (cmd === 'gi' || cmd === 'giraizquierda' || cmd === 'izquierda' || cmd === 'iz' || cmd === 'left' || cmd === 'lt') {
                const idx = { i: i + 1 };
                const deg = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.turnLeft(deg);
            }
            // SETHEADING / SETH / PONRUMBO / FIJARANGULO / RUMBO
            else if (cmd === 'setheading' || cmd === 'seth' || cmd === 'ponrumbo' || cmd === 'fijarangulo' || cmd === 'rumbo') {
                const idx = { i: i + 1 };
                const heading = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.setHeading(heading);
            }
            // SUBIRLAPIZ / SUBELAPIZ / SINPLUMA / SP / SL / PENUP / PU
            else if (cmd === 'sl' || cmd === 'subelapiz' || cmd === 'subirlapiz' || cmd === 'subirlápiz' || cmd === 'sinpluma' || cmd === 'sp' || cmd === 'penup' || cmd === 'pu') {
                this.turtle.setPenDown(false);
                i++;
            }
            // BAJARLAPIZ / BAJALAPIZ / CONPLUMA / CP / BL / PENDOWN / PD
            else if (cmd === 'bl' || cmd === 'bajalapiz' || cmd === 'bajarlapiz' || cmd === 'bajarlápiz' || cmd === 'conpluma' || cmd === 'cp' || cmd === 'pendown' || cmd === 'pd') {
                this.turtle.setPenNormal();
                i++;
            }
            // BORRA / PE / ÓLO / OLO / BORRADOR / PENERASE
            else if (cmd === 'borra' || cmd === 'pe' || cmd === 'ólo' || cmd === 'olo' || cmd === 'borrador' || cmd === 'penerase' || cmd === 'modoeraser') {
                this.turtle.setPenErase();
                i++;
            }
            // LAPIZ / LÁPIZ / PINTA / PTE / PPT / PENPAINT
            else if (cmd === 'lápiz' || cmd === 'lapiz' || cmd === 'pinta' || cmd === 'pte' || cmd === 'ppt' || cmd === 'penpaint') {
                this.turtle.setPenNormal();
                i++;
            }
            // PONCOLOR / PC / PCL / SETPENCOLOR / SETPC / PONCOLORLAPIZ
            else if (cmd === 'pc' || cmd === 'pcl' || cmd === 'poncolor' || cmd === 'ponecolor' || cmd === 'poncolorlapiz' || cmd === 'poncolorlápiz' || cmd === 'setpencolor' || cmd === 'setpc' || cmd === 'setcolor') {
                const res = this.parseColorArg(tokens, i, localVars);
                i = res.nextI;
                this.turtle.setPenColor(res.color);
            }
            // SETSCREENCOLOR / SETSC / PONCOLORFONDO / PCF
            else if (cmd === 'setscreencolor' || cmd === 'setsc' || cmd === 'poncolorfondo' || cmd === 'pcf') {
                const res = this.parseColorArg(tokens, i, localVars);
                i = res.nextI;
                this.turtle.setScreenColor(res.color);
            }
            // SETFLOODCOLOR / SETFC / PONCOLORRELLENO / PCR
            else if (cmd === 'setfloodcolor' || cmd === 'setfc' || cmd === 'poncolorrelleno' || cmd === 'pcr') {
                const res = this.parseColorArg(tokens, i, localVars);
                i = res.nextI;
                this.turtle.setFloodColor(res.color);
            }
            // RELLENA / RELLENAR / FILL
            else if (cmd === 'fill' || cmd === 'rellena' || cmd === 'rellenar') {
                this.turtle.fill();
                i++;
            }
            // CIRCLE / CÍRCULO / CIRCULO
            else if (cmd === 'circle' || cmd === 'círculo' || cmd === 'circulo') {
                const idx = { i: i + 1 };
                const rad = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.circle(rad, false);
            }
            // CIRCULORELLENO
            else if (cmd === 'circulorelleno') {
                const idx = { i: i + 1 };
                const rad = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.circle(rad, true);
            }
            // PARC 360 [radio] or PARC [radio] 360
            else if (cmd === 'parc') {
                const idx = { i: i + 1 };
                const a1 = this.evaluateExpression(tokens, idx, localVars);
                const a2 = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                const rad = a1 === 360 ? a2 : a1;
                this.turtle.circle(rad, true);
            }
            // ELLIPSE / ELIPSE
            else if (cmd === 'ellipse' || cmd === 'elipse') {
                const idx = { i: i + 1 };
                const rx = this.evaluateExpression(tokens, idx, localVars);
                const ry = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.ellipse(rx, ry, false);
            }
            // ELIPSERELLENA
            else if (cmd === 'elipserellena') {
                const idx = { i: i + 1 };
                const rx = this.evaluateExpression(tokens, idx, localVars);
                const ry = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.ellipse(rx, ry, true);
            }
            // PALE [rx] [ry] 360 or PALE 360 [rx] [ry]
            else if (cmd === 'pale') {
                const idx = { i: i + 1 };
                const a1 = this.evaluateExpression(tokens, idx, localVars);
                const a2 = this.evaluateExpression(tokens, idx, localVars);
                const a3 = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                let rx = a1, ry = a2;
                if (a1 === 360) { rx = a2; ry = a3; }
                else if (a3 === 360) { rx = a1; ry = a2; }
                this.turtle.ellipse(rx, ry, true);
            }
            // SETPENSIZE / PONGROSOR / PONANCHO / PONTL / PG / SETWIDTH
            else if (cmd === 'setpensize' || cmd === 'pongrosor' || cmd === 'ponancho' || cmd === 'pontl' || cmd === 'pg' || cmd === 'setwidth') {
                let idx = { i: i + 1 };
                if (idx.i < tokens.length && tokens[idx.i] === '[') {
                    idx.i++; // skip '['
                    const width = this.evaluateExpression(tokens, idx, localVars);
                    while (idx.i < tokens.length && tokens[idx.i] !== ']') idx.i++;
                    if (idx.i < tokens.length && tokens[idx.i] === ']') idx.i++;
                    i = idx.i;
                    this.turtle.setPenWidth(width);
                } else {
                    const width = this.evaluateExpression(tokens, idx, localVars);
                    i = idx.i;
                    this.turtle.setPenWidth(width);
                }
            }
            // BORRAPANTALLA / BP / LP / CLEAR / CS / CLEARSCREEN
            else if (cmd === 'bp' || cmd === 'borrapantalla' || cmd === 'borrarpantalla' || cmd === 'limpiapantalla' || cmd === 'limpiar' || cmd === 'lp' || cmd === 'clear' || cmd === 'clearscreen' || cmd === 'cs') {
                this.turtle.clear();
                i++;
            }
            // CLEARTEXT / CT / BORRARTEXTO / BT
            else if (cmd === 'cleartext' || cmd === 'ct' || cmd === 'borrartexto' || cmd === 'bt') {
                this.turtle.clearText();
                i++;
            }
            // BYE / ADIÓS / ADIOS
            else if (cmd === 'bye' || cmd === 'adiós' || cmd === 'adios') {
                this.turtle.clear();
                i++;
            }
            // PONXY / SETXY / PONPOS / IR_A / IR / GOTO X Y
            else if (cmd === 'ponxy' || cmd === 'setxy' || cmd === 'ponpos' || cmd === 'ir_a' || cmd === 'ir' || cmd === 'goto') {
                const idx = { i: i + 1 };
                const newX = this.evaluateExpression(tokens, idx, localVars);
                const newY = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.setPos(newX, newY);
            }
            // PONX / SETX
            else if (cmd === 'ponx' || cmd === 'setx') {
                const idx = { i: i + 1 };
                const newX = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.setPos(newX, this.turtle.y);
            }
            // PONY / SETY
            else if (cmd === 'pony' || cmd === 'sety') {
                const idx = { i: i + 1 };
                const newY = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.turtle.setPos(this.turtle.x, newY);
            }
            // ESCRIBE / IMPRIME / ETIQUETA
            else if (cmd === 'escribe' || cmd === 'imprime' || cmd === 'etiqueta') {
                const idx = { i: i + 1 };
                let txt = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                if (typeof txt === 'string' && txt.startsWith('"')) txt = txt.substring(1);
                this.turtle.drawText(txt);
            }
            // PREGUNTA / ASK
            else if (cmd === 'pregunta' || cmd === 'ask') {
                const idx = { i: i + 1 };
                let question = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                if (typeof question === 'string' && question.startsWith('"')) question = question.substring(1);
                const answer = prompt(String(question) || 'Introduce un valor:') || '';
                this.variables['respuesta'] = answer;
            }
            // CENTRAR / ORIGEN / INICIO / HOME
            else if (cmd === 'centrar' || cmd === 'inicio' || cmd === 'origen' || cmd === 'home') {
                this.turtle.setPos(0, 0);
                this.turtle.setHeading(0);
                i++;
            }
            // OCULTATORTUGA / OT / OCULTARTORTUGA / HIDETURTLE / HT
            else if (cmd === 'ot' || cmd === 'ocultatortuga' || cmd === 'ocultartortuga' || cmd === 'hideturtle' || cmd === 'ht') {
                this.turtle.hideTurtle();
                i++;
            }
            // MUESTRATORTUGA / MT / MOSTRARTORTUGA / MUESTRATORTUGA / SHOWTURTLE / ST
            else if (cmd === 'mt' || cmd === 'muestratortuga' || cmd === 'mostrartortuga' || cmd === 'showturtle' || cmd === 'st') {
                this.turtle.showTurtle();
                i++;
            }
            // REPITE / REPETIR / REPEAT / REPIE / REP
            else if (cmd === 'repite' || cmd === 'repetir' || cmd === 'repeat' || cmd === 'repie' || cmd === 'rep') {
                const idx = { i: i + 1 };
                const count = Math.floor(this.evaluateExpression(tokens, idx, localVars));
                i = idx.i; // Points to '['

                if (i < tokens.length && tokens[i] === '[') {
                    i++;
                    const blockTokens = [];
                    let depth = 1;
                    while (i < tokens.length && depth > 0) {
                        if (tokens[i] === '[') depth++;
                        else if (tokens[i] === ']') depth--;

                        if (depth > 0) blockTokens.push(tokens[i]);
                        i++;
                    }

                    for (let r = 0; r < count; r++) {
                        this.executeTokens(blockTokens, localVars);
                    }
                } else {
                    i++;
                }
            }
            // MIENTRAS / WHILE
            else if (cmd === 'mientras' || cmd === 'while') {
                const condStartIndex = i + 1;
                let idx = { i: condStartIndex };
                let condVal = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i; // Points to '['

                if (i < tokens.length && tokens[i] === '[') {
                    i++;
                    const blockTokens = [];
                    let depth = 1;
                    while (i < tokens.length && depth > 0) {
                        if (tokens[i] === '[') depth++;
                        else if (tokens[i] === ']') depth--;

                        if (depth > 0) blockTokens.push(tokens[i]);
                        i++;
                    }

                    let maxLoops = 100000;
                    let loopCount = 0;
                    let isTrue = this.isTruthy(condVal);

                    while (isTrue) {
                        if (++loopCount > maxLoops) {
                            throw new Error("El bucle 'MIENTRAS' superó el límite máximo de iteraciones (posible bucle infinito).");
                        }
                        this.executeTokens(blockTokens, localVars);

                        let evalIdx = { i: condStartIndex };
                        condVal = this.evaluateExpression(tokens, evalIdx, localVars);
                        isTrue = this.isTruthy(condVal);
                    }
                } else {
                    i++;
                }
            }
            // HAZ_MIENTRAS / HAZ...MIENTRAS / DO...WHILE
            else if (cmd === 'haz_mientras' || cmd === 'hazmientras' || cmd === 'hacer_mientras' || cmd === 'hacermientras' || cmd === 'do_while' || cmd === 'dowhile' ||
                     ((cmd === 'haz' || cmd === 'hacer' || cmd === 'make') && i + 1 < tokens.length && tokens[i + 1] === '[')) {
                if (cmd === 'haz' || cmd === 'hacer' || cmd === 'make') {
                    i++; // skip 'haz'
                } else {
                    i++; // skip 'haz_mientras'
                }

                if (i < tokens.length && tokens[i] === '[') {
                    i++;
                    const blockTokens = [];
                    let depth = 1;
                    while (i < tokens.length && depth > 0) {
                        if (tokens[i] === '[') depth++;
                        else if (tokens[i] === ']') depth--;

                        if (depth > 0) blockTokens.push(tokens[i]);
                        i++;
                    }

                    if (i < tokens.length && (tokens[i].toLowerCase() === 'mientras' || tokens[i].toLowerCase() === 'while')) {
                        i++;
                    }

                    const condStartIndex = i;
                    let maxLoops = 100000;
                    let loopCount = 0;
                    let isTrue = false;

                    do {
                        if (++loopCount > maxLoops) {
                            throw new Error("El bucle 'HAZ...MIENTRAS' superó el límite máximo de iteraciones (posible bucle infinito).");
                        }
                        this.executeTokens(blockTokens, localVars);

                        let evalIdx = { i: condStartIndex };
                        let condVal = this.evaluateExpression(tokens, evalIdx, localVars);
                        isTrue = this.isTruthy(condVal);
                        i = evalIdx.i;
                    } while (isTrue);
                } else {
                    i++;
                }
            }
            // SI / IF
            else if (cmd === 'si' || cmd === 'if') {
                const idx = { i: i + 1 };
                const cond = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i; // Points to '['

                if (i < tokens.length && tokens[i] === '[') {
                    i++;
                    const blockTokens = [];
                    let depth = 1;
                    while (i < tokens.length && depth > 0) {
                        if (tokens[i] === '[') depth++;
                        else if (tokens[i] === ']') depth--;

                        if (depth > 0) blockTokens.push(tokens[i]);
                        i++;
                    }

                    if (this.isTruthy(cond)) {
                        this.executeTokens(blockTokens, localVars);
                    }
                } else {
                    i++;
                }
            }
            // HAZ "variable valor
            else if (cmd === 'haz' || cmd === 'make' || cmd === 'hacer') {
                i++;
                let varName = tokens[i];
                if (varName.startsWith('"')) varName = varName.substring(1);
                const idx = { i: i + 1 };
                const val = this.evaluateExpression(tokens, idx, localVars);
                i = idx.i;
                this.variables[varName] = val;
            }
            // Custom Procedure Call
            else if (this.procedures[cmd]) {
                const proc = this.procedures[cmd];
                const procLocalVars = { ...localVars };
                const idx = { i: i + 1 };
                for (const param of proc.params) {
                    procLocalVars[param] = this.evaluateExpression(tokens, idx, localVars);
                }
                i = idx.i;
                this.executeTokens(proc.body, procLocalVars);
            } else {
                i++;
            }
        }
    }
}

window.LogoInterpreter = LogoInterpreter;
