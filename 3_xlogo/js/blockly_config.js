/**
 * Google Blockly Configuration & Custom Logo Block Generators
 */

function initBlockly() {
    if (typeof Blockly === 'undefined') return null;

    // Enforce minimum 205px width for Toolbox natively so Blockly always positions flyout at >= 205px
    if (Blockly.Toolbox && Blockly.Toolbox.prototype) {
        const origGetWidth = Blockly.Toolbox.prototype.getWidth;
        Blockly.Toolbox.prototype.getWidth = function() {
            const w = origGetWidth ? origGetWidth.call(this) : 0;
            return Math.max(205, w);
        };
    }

    const isMutatorFlyout = (flyout) => {
        if (!flyout) return false;
        if (flyout.isMutator) return true;
        if (flyout.targetWorkspace_ && flyout.targetWorkspace_.isMutator) return true;
        if (flyout.targetWorkspace_ && flyout.targetWorkspace_.options && !flyout.targetWorkspace_.options.hasCategories) return true;
        if (flyout.svgGroup_ && (
            flyout.svgGroup_.classList.contains('blocklyMutatorFlyout') ||
            (flyout.svgGroup_.closest && (flyout.svgGroup_.closest('.blocklyBubble') || flyout.svgGroup_.closest('.blocklyMiniWorkspaceBubble')))
        )) return true;
        return false;
    };

    if (Blockly.VerticalFlyout && Blockly.VerticalFlyout.prototype) {
        const origFlyoutPos = Blockly.VerticalFlyout.prototype.position;
        Blockly.VerticalFlyout.prototype.position = function() {
            if (origFlyoutPos) origFlyoutPos.call(this);
            if (isMutatorFlyout(this)) return; // Keep procedure mutator bubbles 100% native

            const targetX = Math.max(205, this.x_ || 0);
            this.x_ = targetX;
            if (this.svgGroup_) {
                this.svgGroup_.setAttribute('transform', `translate(${targetX}, ${this.y_ || 0})`);
                this.svgGroup_.style.setProperty('transform', `translate(${targetX}px)`, 'important');
            }
        };
    }

    // Define Custom Logo Blocks
    Blockly.defineBlocksWithJsonArray([
        // 0. Event Hat Block (Al presionar ejecutar / Bandera)
        {
            "type": "logo_when_run",
            "message0": "al presionar ejecutar 🟢",
            "nextStatement": null,
            "colour": 40,
            "tooltip": "Inicia la ejecución de los bloques conectados debajo cuando se presiona Ejecutar"
        },
        // 1. Move Forward
        {
            "type": "logo_forward",
            "message0": "adelante / avanzar %1 pasos (AV)",
            "args0": [
                { "type": "input_value", "name": "DIST", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 210,
            "tooltip": "Mueve la tortuga hacia adelante (AV / ADELANTE). Acepta números, variables o parámetros :LADO"
        },
        // 2. Move Backward
        {
            "type": "logo_backward",
            "message0": "retroceder / retrocede %1 pasos (RE / RT)",
            "args0": [
                { "type": "input_value", "name": "DIST", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 210,
            "tooltip": "Mueve la tortuga hacia atrás (RE / RETROCEDE). Acepta números o variables"
        },
        // 3. Turn Right
        {
            "type": "logo_turn_right",
            "message0": "girar a la derecha ↻ %1 grados (GD)",
            "args0": [
                { "type": "input_value", "name": "ANGLE", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 210,
            "tooltip": "Gira la tortuga a la derecha (GD / DERECHA). Acepta números o variables"
        },
        // 4. Turn Left
        {
            "type": "logo_turn_left",
            "message0": "girar a la izquierda ↺ %1 grados (GI)",
            "args0": [
                { "type": "input_value", "name": "ANGLE", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 210,
            "tooltip": "Gira la tortuga a la izquierda (GI / IZQUIERDA). Acepta números o variables"
        },
        // 5. Pen Color
        {
            "type": "logo_set_color",
            "message0": "cambiar color del lápiz a %1 (PC)",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "COLOR",
                    "options": [
                        [ "0: Negro ⬛", "0" ],
                        [ "1: Azul 🔵", "1" ],
                        [ "2: Verde 🟢", "2" ],
                        [ "3: Cian 🌊", "3" ],
                        [ "4: Rojo 🔴", "4" ],
                        [ "5: Rosa 🌸", "5" ],
                        [ "6: Amarillo 🟡", "6" ],
                        [ "7: Blanco ⚪", "7" ],
                        [ "8: Naranja 🟠", "8" ],
                        [ "9: Violeta 🟣", "9" ],
                        [ "10: Marrón 🟤", "10" ],
                        [ "11: Azul Claro 🩵", "11" ],
                        [ "12: Verde Lima 🍏", "12" ],
                        [ "13: Turquesa 💎", "13" ],
                        [ "14: Coral 🪸", "14" ],
                        [ "15: Gris 🩶", "15" ],
                        [ "Verde (verde)", "verde" ],
                        [ "Cian (cian)", "cian" ],
                        [ "Rojo (rojo)", "rojo" ],
                        [ "Amarillo (amarillo)", "amarillo" ]
                    ]
                }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190,
            "tooltip": "Cambia el color de la línea utilizando el número de la paleta (0-15) o nombre"
        },
        {
            "type": "logo_set_color_num",
            "message0": "cambiar color del lápiz a %1 (PC / 0-15 o [R,G,B])",
            "args0": [
                { "type": "input_value", "name": "COLOR" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190,
            "tooltip": "Cambia el color del lápiz utilizando un número de paleta (0-15), una variable o una matriz de color [R, G, B]"
        },
        {
            "type": "logo_color_rgb",
            "message0": "matriz color RGB [ R: %1 G: %2 B: %3 ]",
            "args0": [
                { "type": "input_value", "name": "R", "check": "Number" },
                { "type": "input_value", "name": "G", "check": "Number" },
                { "type": "input_value", "name": "B", "check": "Number" }
            ],
            "output": null,
            "colour": 190,
            "inputsInline": true,
            "tooltip": "Crea una matriz de color [R, G, B] con valores de 0 a 255"
        },
        // 6. Pen Up/Down
        {
            "type": "logo_pen_up",
            "message0": "subir lápiz ✏️ (no dibujar / SP / SL)",
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190
        },
        {
            "type": "logo_pen_down",
            "message0": "bajar lápiz ✏️ (dibujar / CP / BL)",
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190
        },
        // 7. Pen Erase (Modo Borrar)
        {
            "type": "logo_pen_erase",
            "message0": "lápiz borrador 🧹 (BORRA / PE)",
            "previousStatement": null,
            "nextStatement": null,
            "colour": 0,
            "tooltip": "Cambia el lápiz al modo borrador para borrar líneas al desplazarse"
        },
        // 8. Repeat Loop
        {
            "type": "logo_repeat",
            "message0": "repetir %1 veces %2 %3 (REPITE)",
            "args0": [
                { "type": "input_value", "name": "TIMES", "check": "Number" },
                { "type": "input_dummy" },
                { "type": "input_statement", "name": "DO" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 40,
            "tooltip": "Repite las acciones de su interior (REPITE)"
        },
        // 8b. While Loop
        {
            "type": "logo_while",
            "message0": "mientras %1 hacer %2 %3 (MIENTRAS)",
            "args0": [
                { "type": "input_value", "name": "COND", "check": "Boolean" },
                { "type": "input_dummy" },
                { "type": "input_statement", "name": "DO" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 40,
            "tooltip": "Repite las acciones de su interior mientras la condición sea verdadera (MIENTRAS)"
        },
        // 8c. Do While Loop
        {
            "type": "logo_do_while",
            "message0": "hacer %1 %2 mientras %3 (HAZ ... MIENTRAS)",
            "args0": [
                { "type": "input_statement", "name": "DO" },
                { "type": "input_dummy" },
                { "type": "input_value", "name": "COND", "check": "Boolean" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 40,
            "tooltip": "Ejecuta las acciones al menos una vez y las repite mientras la condición sea verdadera (HAZ ... MIENTRAS)"
        },
        // 9. Clear Screen
        {
            "type": "logo_clear",
            "message0": "borrar pantalla 🧹 (BP / LP)",
            "previousStatement": null,
            "nextStatement": null,
            "colour": 0
        },
        // 10. Home Pos
        {
            "type": "logo_home",
            "message0": "ir al origen / centro 🎯 (HOME)",
            "previousStatement": null,
            "nextStatement": null,
            "colour": 210
        },
        // 11. Set Width
        {
            "type": "logo_set_width",
            "message0": "cambiar grosor del lápiz a %1 px",
            "args0": [
                { "type": "input_value", "name": "WIDTH", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190
        },
        // Shape & Fill Blocks
        {
            "type": "logo_circle",
            "message0": "dibujar círculo radio %1 (CIRCULO)",
            "args0": [
                { "type": "input_value", "name": "RAD", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190,
            "tooltip": "Dibuja un círculo centrado en la tortuga sin moverla"
        },
        {
            "type": "logo_circle_filled",
            "message0": "dibujar círculo relleno radio %1 (PARC)",
            "args0": [
                { "type": "input_value", "name": "RAD", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190,
            "tooltip": "Dibuja un círculo relleno centrado en la tortuga"
        },
        {
            "type": "logo_ellipse",
            "message0": "dibujar elipse radio X %1 radio Y %2 (ELIPSE)",
            "args0": [
                { "type": "input_value", "name": "RX", "check": "Number" },
                { "type": "input_value", "name": "RY", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190,
            "inputsInline": true,
            "tooltip": "Dibuja un óvalo centrado en la tortuga"
        },
        {
            "type": "logo_ellipse_filled",
            "message0": "dibujar elipse rellena radio X %1 radio Y %2 (PALE)",
            "args0": [
                { "type": "input_value", "name": "RX", "check": "Number" },
                { "type": "input_value", "name": "RY", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190,
            "inputsInline": true,
            "tooltip": "Dibuja un óvalo relleno centrado en la tortuga"
        },
        {
            "type": "logo_fill",
            "message0": "rellenar área con color 🎨 (FILL)",
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190,
            "tooltip": "Rellena una figura desde la posición de la tortuga"
        },
        {
            "type": "logo_set_flood_color",
            "message0": "cambiar color de relleno a %1",
            "args0": [
                { "type": "field_dropdown", "name": "COLOR", "options": [
                    ["🟢 Verde", "verde"],
                    ["🔴 Rojo", "rojo"],
                    ["🔵 Azul", "azul"],
                    ["🟡 Amarillo", "amarillo"],
                    ["🟣 Violeta", "violeta"],
                    ["🟠 Naranja", "naranja"],
                    ["🩵 Cian", "cian"],
                    ["🌸 Rosa", "rosa"],
                    ["⚪ Blanco", "blanco"],
                    ["⬛ Negro", "negro"]
                ]}
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190
        },
        // 12. Hide Turtle
        {
            "type": "logo_hide_turtle",
            "message0": "ocultar tortuga 🙈 (OT)",
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190,
            "tooltip": "Oculta el icono de la tortuga"
        },
        // 13. Show Turtle
        {
            "type": "logo_show_turtle",
            "message0": "mostrar tortuga 🐢 (MT)",
            "previousStatement": null,
            "nextStatement": null,
            "colour": 190,
            "tooltip": "Muestra el icono de la tortuga"
        },
        // 14. Position Blocks
        {
            "type": "logo_goto",
            "message0": "ir a X: %1 Y: %2 (PONPOS)",
            "args0": [
                { "type": "input_value", "name": "X", "check": "Number" },
                { "type": "input_value", "name": "Y", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 210,
            "inputsInline": true,
            "tooltip": "Mueve la tortuga a las coordenadas X e Y especificadas"
        },
        {
            "type": "logo_set_x",
            "message0": "fijar X a %1 (PONX)",
            "args0": [
                { "type": "input_value", "name": "X", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 210
        },
        {
            "type": "logo_set_y",
            "message0": "fijar Y a %1 (PONY)",
            "args0": [
                { "type": "input_value", "name": "Y", "check": "Number" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 210
        },
        {
            "type": "logo_get_x",
            "message0": "posición X",
            "output": "Number",
            "colour": 210
        },
        {
            "type": "logo_get_y",
            "message0": "posición Y",
            "output": "Number",
            "colour": 210
        },

        // 15. Math Operator Blocks
        {
            "type": "logo_math_add",
            "message0": "%1 + %2",
            "args0": [
                { "type": "input_value", "name": "A", "check": "Number" },
                { "type": "input_value", "name": "B", "check": "Number" }
            ],
            "output": "Number",
            "colour": 120,
            "inputsInline": true
        },
        {
            "type": "logo_math_minus",
            "message0": "%1 - %2",
            "args0": [
                { "type": "input_value", "name": "A", "check": "Number" },
                { "type": "input_value", "name": "B", "check": "Number" }
            ],
            "output": "Number",
            "colour": 120,
            "inputsInline": true
        },
        {
            "type": "logo_math_multiply",
            "message0": "%1 * %2",
            "args0": [
                { "type": "input_value", "name": "A", "check": "Number" },
                { "type": "input_value", "name": "B", "check": "Number" }
            ],
            "output": "Number",
            "colour": 120,
            "inputsInline": true
        },
        {
            "type": "logo_math_divide",
            "message0": "%1 / %2",
            "args0": [
                { "type": "input_value", "name": "A", "check": "Number" },
                { "type": "input_value", "name": "B", "check": "Number" }
            ],
            "output": "Number",
            "colour": 120,
            "inputsInline": true
        },
        {
            "type": "logo_math_modulo",
            "message0": "resto de %1 / %2",
            "args0": [
                { "type": "input_value", "name": "A", "check": "Number" },
                { "type": "input_value", "name": "B", "check": "Number" }
            ],
            "output": "Number",
            "colour": 120,
            "inputsInline": true
        },
        {
            "type": "logo_math_round",
            "message0": "redondear %1",
            "args0": [
                { "type": "input_value", "name": "NUM", "check": "Number" }
            ],
            "output": "Number",
            "colour": 120
        },
        {
            "type": "logo_logic_compare",
            "message0": "%1 %2 %3",
            "args0": [
                { "type": "input_value", "name": "A" },
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        [ "= (igual)", "=" ],
                        [ "<> (diferente)", "<>" ],
                        [ "< (menor que)", "<" ],
                        [ "<= (menor o igual)", "<=" ],
                        [ "> (mayor que)", ">" ],
                        [ ">= (mayor o igual)", ">=" ]
                    ]
                },
                { "type": "input_value", "name": "B" }
            ],
            "output": null,
            "colour": 120,
            "inputsInline": true,
            "tooltip": "Compara dos valores u expresiones y devuelve verdadero (1) o falso (0)"
        },
        {
            "type": "logo_logic_operation",
            "message0": "%1 %2 %3",
            "args0": [
                { "type": "input_value", "name": "A" },
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        [ "y (ambos verdaderos)", "y" ],
                        [ "o (al menos uno verdadero)", "o" ]
                    ]
                },
                { "type": "input_value", "name": "B" }
            ],
            "output": null,
            "colour": 120,
            "inputsInline": true,
            "tooltip": "Combina dos condiciones lógicas (Y / O)"
        },
        {
            "type": "logo_logic_negate",
            "message0": "no %1",
            "args0": [
                { "type": "input_value", "name": "BOOL" }
            ],
            "output": null,
            "colour": 120,
            "tooltip": "Devuelve la negación de la condición (NO / NOT)"
        },
        {
            "type": "logo_logic_boolean",
            "message0": "%1",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "BOOL",
                    "options": [
                        [ "verdadero (1)", "1" ],
                        [ "falso (0)", "0" ]
                    ]
                }
            ],
            "output": null,
            "colour": 120,
            "tooltip": "Devuelve verdadero (1) o falso (0)"
        },
        {
            "type": "logo_math_single",
            "message0": "%1 de %2",
            "args0": [
                {
                    "type": "field_dropdown",
                    "name": "OP",
                    "options": [
                        [ "valor absoluto |x|", "abs" ],
                        [ "raíz cuadrada √x", "raiz" ],
                        [ "redondear", "redondea" ],
                        [ "seno (sin)", "seno" ],
                        [ "coseno (cos)", "coseno" ]
                    ]
                },
                { "type": "input_value", "name": "NUM", "check": "Number" }
            ],
            "output": "Number",
            "colour": 120,
            "inputsInline": true,
            "tooltip": "Calcula una función matemática básica"
        },
        {
            "type": "logo_math_power",
            "message0": "%1 ^ %2 (potencia)",
            "args0": [
                { "type": "input_value", "name": "A", "check": "Number" },
                { "type": "input_value", "name": "B", "check": "Number" }
            ],
            "output": "Number",
            "colour": 120,
            "inputsInline": true,
            "tooltip": "Eleva una base A a un exponente B"
        },
        {
            "type": "logo_math_random",
            "message0": "número al azar hasta %1 (AZAR)",
            "args0": [
                { "type": "input_value", "name": "MAX", "check": "Number" }
            ],
            "output": "Number",
            "colour": 120,
            "tooltip": "Devuelve un número entero aleatorio entre 1 y el número máximo especificado"
        },
        {
            "type": "logo_math_pi",
            "message0": "π (PI)",
            "output": "Number",
            "colour": 120,
            "tooltip": "Constante Pi (3.14159...)"
        },

        // 16. Text & Sensor Blocks
        {
            "type": "logo_text_print",
            "message0": "escribir en pantalla %1 (ESCRIBE)",
            "args0": [
                { "type": "input_value", "name": "TEXT" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 330,
            "tooltip": "Escribe texto sobre el lienzo en la posición actual de la tortuga"
        },
        {
            "type": "logo_text_join",
            "message0": "unir %1 y %2",
            "args0": [
                { "type": "input_value", "name": "A" },
                { "type": "input_value", "name": "B" }
            ],
            "output": "String",
            "colour": 330,
            "inputsInline": true
        },
        {
            "type": "logo_text_ask",
            "message0": "preguntar %1 y esperar (PREGUNTA)",
            "args0": [
                { "type": "input_value", "name": "TEXT" }
            ],
            "previousStatement": null,
            "nextStatement": null,
            "colour": 330,
            "tooltip": "Muestra una pregunta al usuario y guarda el resultado en la variable 'respuesta'"
        },
        {
            "type": "logo_text_answer",
            "message0": "respuesta",
            "output": null,
            "colour": 330,
            "tooltip": "Contiene la última respuesta ingresada por el usuario"
        },
        {
            "type": "text",
            "message0": "%1",
            "args0": [
                { "type": "field_input", "name": "TEXT", "text": "hola" }
            ],
            "output": "String",
            "colour": 330
        }
    ]);

    // Create Logo Generator
    const logoGenerator = new Blockly.Generator('Logo');
    logoGenerator.forBlock = logoGenerator.forBlock || {};

    // ORDER PRECEDENCE CONSTANTS
    logoGenerator.ORDER_ATOMIC = 0;
    logoGenerator.ORDER_NONE = 99;

    logoGenerator.scrub_ = function(block, code, thisOnly) {
        const nextBlock = block.nextConnection && block.nextConnection.targetBlock();
        if (nextBlock && !thisOnly) {
            return code + ' ' + logoGenerator.blockToCode(nextBlock);
        }
        return code;
    };

    // Registration Helper for all Blockly versions
    const reg = (blockType, fn) => {
        logoGenerator[blockType] = fn;
        logoGenerator.forBlock[blockType] = fn;
    };

    reg('logo_when_run', function(block) {
        return '';
    });

    reg('logo_forward', function(block) {
        const dist = logoGenerator.valueToCode(block, 'DIST', 0) || '100';
        return 'av ' + dist;
    });

    reg('logo_backward', function(block) {
        const dist = logoGenerator.valueToCode(block, 'DIST', 0) || '50';
        return 're ' + dist;
    });

    reg('logo_turn_right', function(block) {
        const angle = logoGenerator.valueToCode(block, 'ANGLE', 0) || '90';
        return 'gd ' + angle;
    });

    reg('logo_turn_left', function(block) {
        const angle = logoGenerator.valueToCode(block, 'ANGLE', 0) || '90';
        return 'gi ' + angle;
    });

    reg('logo_set_color', function(block) {
        return 'pc ' + block.getFieldValue('COLOR');
    });

    reg('logo_set_color_num', function(block) {
        const col = logoGenerator.valueToCode(block, 'COLOR', 0) || '4';
        return 'poncolor ' + col;
    });

    reg('logo_color_rgb', function(block) {
        const r = logoGenerator.valueToCode(block, 'R', 0) || '0';
        const g = logoGenerator.valueToCode(block, 'G', 0) || '0';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '0';
        return [`[${r} ${g} ${b}]`, 0];
    });

    reg('logo_set_width', function(block) {
        const width = logoGenerator.valueToCode(block, 'WIDTH', 0) || '3';
        return 'pg ' + width;
    });

    reg('logo_circle', function(block) {
        const rad = logoGenerator.valueToCode(block, 'RAD', 0) || '50';
        return 'CIRCLE ' + rad;
    });

    reg('logo_circle_filled', function(block) {
        const rad = logoGenerator.valueToCode(block, 'RAD', 0) || '50';
        return 'PARC 360 ' + rad;
    });

    reg('logo_ellipse', function(block) {
        const rx = logoGenerator.valueToCode(block, 'RX', 0) || '100';
        const ry = logoGenerator.valueToCode(block, 'RY', 0) || '50';
        return `ELLIPSE ${rx} ${ry}`;
    });

    reg('logo_ellipse_filled', function(block) {
        const rx = logoGenerator.valueToCode(block, 'RX', 0) || '100';
        const ry = logoGenerator.valueToCode(block, 'RY', 0) || '50';
        return `PALE ${rx} ${ry} 360`;
    });

    reg('logo_fill', function(block) {
        return 'FILL';
    });

    reg('logo_set_flood_color', function(block) {
        return 'SETFLOODCOLOR ' + block.getFieldValue('COLOR');
    });

    reg('logo_pen_up', function(block) {
        return 'sl';
    });

    reg('logo_pen_down', function(block) {
        return 'bl';
    });

    reg('logo_pen_erase', function(block) {
        return 'borra';
    });

    reg('logo_hide_turtle', function(block) {
        return 'ot';
    });

    reg('logo_show_turtle', function(block) {
        return 'mt';
    });

    reg('logo_clear', function(block) {
        return 'bp';
    });

    reg('logo_home', function(block) {
        return 'inicio';
    });

    // Position Generators
    reg('logo_goto', function(block) {
        const x = logoGenerator.valueToCode(block, 'X', 0) || '0';
        const y = logoGenerator.valueToCode(block, 'Y', 0) || '0';
        return `ponpos ${x} ${y}`;
    });

    reg('logo_set_x', function(block) {
        const x = logoGenerator.valueToCode(block, 'X', 0) || '0';
        return `ponx ${x}`;
    });

    reg('logo_set_y', function(block) {
        const y = logoGenerator.valueToCode(block, 'Y', 0) || '0';
        return `pony ${y}`;
    });

    reg('logo_get_x', function(block) {
        return ['posx', 0];
    });

    reg('logo_get_y', function(block) {
        return ['posy', 0];
    });

    // Math Operator Generators
    reg('logo_math_add', function(block) {
        const a = logoGenerator.valueToCode(block, 'A', 0) || '0';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '0';
        return [`${a} + ${b}`, 0];
    });

    reg('logo_math_minus', function(block) {
        const a = logoGenerator.valueToCode(block, 'A', 0) || '0';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '0';
        return [`${a} - ${b}`, 0];
    });

    reg('logo_math_multiply', function(block) {
        const a = logoGenerator.valueToCode(block, 'A', 0) || '0';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '0';
        return [`${a} * ${b}`, 0];
    });

    reg('logo_math_divide', function(block) {
        const a = logoGenerator.valueToCode(block, 'A', 0) || '0';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '0';
        return [`${a} / ${b}`, 0];
    });

    reg('logo_math_modulo', function(block) {
        const a = logoGenerator.valueToCode(block, 'A', 0) || '0';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '0';
        return [`${a} % ${b}`, 0];
    });

    reg('logo_math_round', function(block) {
        const num = logoGenerator.valueToCode(block, 'NUM', 0) || '0';
        return [`redondea ${num}`, 0];
    });

    reg('logo_logic_compare', function(block) {
        const op = block.getFieldValue('OP') || '=';
        const a = logoGenerator.valueToCode(block, 'A', 0) || '0';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '0';
        return [`${a} ${op} ${b}`, 0];
    });

    reg('logo_logic_operation', function(block) {
        const op = block.getFieldValue('OP') || 'y';
        const a = logoGenerator.valueToCode(block, 'A', 0) || '1';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '1';
        return [`${a} ${op} ${b}`, 0];
    });

    reg('logo_logic_negate', function(block) {
        const bool = logoGenerator.valueToCode(block, 'BOOL', 0) || '1';
        return [`no ${bool}`, 0];
    });

    reg('logo_logic_boolean', function(block) {
        const bool = block.getFieldValue('BOOL') || '1';
        return [bool, 0];
    });

    reg('logo_math_single', function(block) {
        const op = block.getFieldValue('OP') || 'abs';
        const num = logoGenerator.valueToCode(block, 'NUM', 0) || '0';
        return [`${op} ${num}`, 0];
    });

    reg('logo_math_power', function(block) {
        const a = logoGenerator.valueToCode(block, 'A', 0) || '2';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '3';
        return [`${a} ^ ${b}`, 0];
    });

    reg('logo_math_random', function(block) {
        const max = logoGenerator.valueToCode(block, 'MAX', 0) || '100';
        return [`azar ${max}`, 0];
    });

    reg('logo_math_pi', function(block) {
        return ['pi', 0];
    });

    // Text & Sensor Generators
    reg('logo_text_print', function(block) {
        const txt = logoGenerator.valueToCode(block, 'TEXT', 0) || '"Hola"';
        return `escribe ${txt}`;
    });

    reg('logo_text_join', function(block) {
        const a = logoGenerator.valueToCode(block, 'A', 0) || '""';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '""';
        return [`${a} + ${b}`, 0];
    });

    reg('logo_text_ask', function(block) {
        const q = logoGenerator.valueToCode(block, 'TEXT', 0) || '"¿Cómo te llamas?"';
        return `pregunta ${q}`;
    });

    reg('logo_text_answer', function(block) {
        return [':respuesta', 0];
    });

    reg('text', function(block) {
        const str = block.getFieldValue('TEXT') || '';
        return [`"${str}"`, 0];
    });

    reg('logo_repeat', function(block) {
        const times = logoGenerator.valueToCode(block, 'TIMES', 0) || '4';
        const innerCode = logoGenerator.statementToCode(block, 'DO').trim();
        return `repite ${times} [ ${innerCode} ]`;
    });

    reg('logo_while', function(block) {
        const condition = logoGenerator.valueToCode(block, 'COND', 0) || '1';
        const innerCode = logoGenerator.statementToCode(block, 'DO').trim();
        return `mientras ${condition} [ ${innerCode} ]`;
    });

    reg('logo_do_while', function(block) {
        const innerCode = logoGenerator.statementToCode(block, 'DO').trim();
        const condition = logoGenerator.valueToCode(block, 'COND', 0) || '1';
        return `haz [ ${innerCode} ] mientras ${condition}`;
    });

    reg('controls_whileuntil', function(block) {
        const mode = block.getFieldValue('MODE');
        const condCode = logoGenerator.valueToCode(block, 'BOOL', 0) || '1';
        const doCode = logoGenerator.statementToCode(block, 'DO').trim();
        if (mode === 'UNTIL') {
            return `mientras no (${condCode}) [ ${doCode} ]`;
        }
        return `mientras ${condCode} [ ${doCode} ]`;
    });

    // Helper to get clean human-readable variable names (resolves internal Blockly variable IDs)
    const getVariableName = (block, fieldName = 'VAR') => {
        if (!block) return 'var';
        const field = block.getField(fieldName);
        if (field && typeof field.getText === 'function') {
            const text = field.getText();
            if (text && text.trim() && !text.includes(']') && !text.includes('$')) return text.trim();
        }
        const varId = block.getFieldValue(fieldName);
        if (varId && block.workspace && typeof block.workspace.getVariableById === 'function') {
            const v = block.workspace.getVariableById(varId);
            if (v && v.name) return v.name;
        }
        return (varId && !varId.includes('$')) ? varId : 'var';
    };

    // Procedures / Functions Generators
    reg('procedures_defnoreturn', function(block) {
        const funcName = block.getFieldValue('NAME') || 'funcion';
        const innerCode = logoGenerator.statementToCode(block, 'STACK').trim();
        const args = [];
        if (block.arguments_) {
            for (let i = 0; i < block.arguments_.length; i++) {
                let argName = block.arguments_[i];
                if (block.workspace && typeof block.workspace.getVariableById === 'function') {
                    const v = block.workspace.getVariableById(argName);
                    if (v && v.name) argName = v.name;
                }
                args.push(':' + argName);
            }
        }
        let code = `PARA ${funcName}${args.length ? ' ' + args.join(' ') : ''}\n  ${innerCode}\nFIN\n`;
        return code;
    });

    reg('procedures_defreturn', function(block) {
        return logoGenerator['procedures_defnoreturn'](block);
    });

    reg('procedures_callnoreturn', function(block) {
        const funcName = block.getFieldValue('NAME') || 'funcion';
        const args = [];
        if (block.arguments_) {
            for (let i = 0; i < block.arguments_.length; i++) {
                const argCode = logoGenerator.valueToCode(block, 'ARG' + i, 0) || '0';
                args.push(argCode);
            }
        }
        return `${funcName}${args.length ? ' ' + args.join(' ') : ''}`;
    });

    reg('procedures_callreturn', function(block) {
        const code = logoGenerator['procedures_callnoreturn'](block);
        return [code, 0];
    });

    // Variables Generators
    reg('variables_get', function(block) {
        const varName = ':' + getVariableName(block, 'VAR');
        return [varName, 0];
    });

    reg('variables_set', function(block) {
        const varName = getVariableName(block, 'VAR');
        const value = logoGenerator.valueToCode(block, 'VALUE', 0) || '0';
        return `haz "${varName} ${value}`;
    });

    reg('math_change', function(block) {
        const varName = getVariableName(block, 'VAR');
        const delta = logoGenerator.valueToCode(block, 'DELTA', 0) || '1';
        return `haz "${varName} :${varName} + ${delta}`;
    });

    // Controls & Logic Generators
    reg('controls_if', function(block) {
        const condition = logoGenerator.valueToCode(block, 'IF0', 0) || '1';
        const innerCode = logoGenerator.statementToCode(block, 'DO0').trim();
        return `si ${condition} [ ${innerCode} ]`;
    });

    reg('controls_ifelse', function(block) {
        const condition = logoGenerator.valueToCode(block, 'IF0', 0) || '1';
        const doCode = logoGenerator.statementToCode(block, 'DO0').trim();
        const elseCode = logoGenerator.statementToCode(block, 'ELSE').trim();
        return `si ${condition} [ ${doCode} ] [ ${elseCode} ]`;
    });

    reg('logic_compare', function(block) {
        const OP_MAP = { 'EQ': '=', 'NEQ': '<>', 'LT': '<', 'LTE': '<=', 'GT': '>', 'GTE': '>=' };
        const op = OP_MAP[block.getFieldValue('OP')] || '=';
        const a = logoGenerator.valueToCode(block, 'A', 0) || '0';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '0';
        return [`${a} ${op} ${b}`, 0];
    });

    reg('logic_operation', function(block) {
        const op = block.getFieldValue('OP') === 'OR' ? 'o' : 'y';
        const a = logoGenerator.valueToCode(block, 'A', 0) || '1';
        const b = logoGenerator.valueToCode(block, 'B', 0) || '1';
        return [`${a} ${op} ${b}`, 0];
    });

    reg('logic_negate', function(block) {
        const bool = logoGenerator.valueToCode(block, 'BOOL', 0) || '1';
        return [`no ${bool}`, 0];
    });

    reg('logic_boolean', function(block) {
        const bool = block.getFieldValue('BOOL') === 'TRUE' ? '1' : '0';
        return [bool, 0];
    });

    // Math Generators
    reg('math_number', function(block) {
        const code = Number(block.getFieldValue('NUM'));
        return [code, 0];
    });

    reg('math_single', function(block) {
        const OP_MAP = { 'ROOT': 'raiz', 'ABS': 'abs', 'ROUND': 'redondea', 'LN': 'ln', 'EXP': 'exp' };
        const op = OP_MAP[block.getFieldValue('OP')] || 'abs';
        const num = logoGenerator.valueToCode(block, 'NUM', 0) || '0';
        return [`${op} ${num}`, 0];
    });

    reg('math_arithmetic', function(block) {
        const OPERATORS = {
            'ADD': ' + ',
            'MINUS': ' - ',
            'MULTIPLY': ' * ',
            'DIVIDE': ' / ',
            'POWER': ' ^ '
        };
        const op = OPERATORS[block.getFieldValue('OP')] || ' + ';
        const argA = logoGenerator.valueToCode(block, 'A', 0) || '0';
        const argB = logoGenerator.valueToCode(block, 'B', 0) || '0';
        return [`${argA}${op}${argB}`, 0];
    });

    reg('math_random_int', function(block) {
        const maxVal = logoGenerator.valueToCode(block, 'TO', 0) || '100';
        return [`azar ${maxVal}`, 0];
    });

    logoGenerator.workspaceToCode = function(workspace) {
        if (!workspace) return '';
        const topBlocks = workspace.getTopBlocks(true);
        
        const procCodes = [];
        const mainCodes = [];
        
        const hatBlocks = topBlocks.filter(b => b.type === 'logo_when_run');
        
        topBlocks.forEach(b => {
            if (b.type === 'procedures_defnoreturn' || b.type === 'procedures_defreturn') {
                const code = logoGenerator.blockToCode(b);
                if (code && typeof code === 'string') procCodes.push(code.trim());
            } else if (hatBlocks.length > 0) {
                if (b.type === 'logo_when_run') {
                    const code = logoGenerator.blockToCode(b);
                    if (code && typeof code === 'string' && code.trim()) mainCodes.push(code.trim());
                }
            } else {
                const code = logoGenerator.blockToCode(b);
                if (code && typeof code === 'string' && code.trim()) mainCodes.push(code.trim());
            }
        });

        const procStr = procCodes.join('\n\n');
        const mainStr = mainCodes.join('\n');

        if (procStr && mainStr) {
            return procStr + '\n\n' + mainStr;
        }
        return procStr || mainStr;
    };

    // Inject Workspace
    const workspace = Blockly.inject('blocklyDiv', {
        toolbox: document.getElementById('toolbox'),
        media: 'js/media/',
        scrollbars: true,
        trashcan: true,
        zoom: {
            controls: true,
            wheel: true,
            startScale: 1.0,
            maxScale: 3,
            minScale: 0.3,
            scaleSpeed: 1.2
        },
        theme: Blockly.Themes.Dark || null
    });

    // Enforce minimum Flyout X position of 205px while allowing larger values to adapt
    if (workspace && workspace.getFlyout()) {
        const flyout = workspace.getFlyout();
        const origPos = flyout.position;
        flyout.position = function() {
            if (origPos) origPos.call(this);
            if (isMutatorFlyout(this)) return; // Keep procedure mutator bubbles 100% native

            const targetX = Math.max(205, this.x_ || 0);
            this.x_ = targetX;
            if (this.svgGroup_) {
                this.svgGroup_.setAttribute('transform', `translate(${targetX}, ${this.y_ || 0})`);
                this.svgGroup_.style.setProperty('transform', `translate(${targetX}px)`, 'important');
            }
        };
        flyout.position();
    }

    return { workspace, logoGenerator };
}

window.initBlockly = initBlockly;
