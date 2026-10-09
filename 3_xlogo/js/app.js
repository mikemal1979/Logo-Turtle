/**
 * Main XLogo Application Controller
 * Connects UI event listeners, Mode switching, History, Examples, and Execution
 */

document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Canvas and Turtle Instances
    const turtleA = new TurtleCanvas('turtle-canvas');
    const interpreterA = new LogoInterpreter(turtleA);

    const turtleB = new TurtleCanvas('turtle-canvas-b');
    const interpreterB = new LogoInterpreter(turtleB);

    // 2. Initialize Blockly in Mode B
    let blocklyObj = null;
    try {
        blocklyObj = initBlockly();
    } catch (e) {
        console.warn('Blockly could not be initialized:', e);
    }

    // 3. UI State
    let currentMode = 'A';
    const commandHistory = [];
    let historyIndex = -1;

    // DOM Elements
    const btnModeA = document.getElementById('btn-mode-a');
    const btnModeB = document.getElementById('btn-mode-b');
    const modeAView = document.getElementById('mode-a-view');
    const modeBView = document.getElementById('mode-b-view');

    const btnRun = document.getElementById('btn-run');
    const btnStop = document.getElementById('btn-stop');
    const btnClear = document.getElementById('btn-clear');
    const speedSlider = document.getElementById('speed-slider');
    const speedVal = document.getElementById('speed-val');
    const exampleSelect = document.getElementById('example-select');

    const cmdInput = document.getElementById('cmd-input');
    const btnSendCmd = document.getElementById('btn-send-cmd');
    const multiCodeEditor = document.getElementById('multi-code-editor');
    const btnRunEditor = document.getElementById('btn-run-editor');
    const historyList = document.getElementById('history-list');
    const procedureList = document.getElementById('procedure-list');
    const btnClearHistory = document.getElementById('btn-clear-history');
    const turtleInfoBadge = document.getElementById('turtle-info-badge');
    const chkGrid = document.getElementById('chk-grid');

    const tabCmdLine = document.getElementById('tab-cmd-line');
    const tabMultiEditor = document.getElementById('tab-multi-editor');
    const viewCmdLine = document.getElementById('view-cmd-line');
    const viewMultiEditor = document.getElementById('view-multi-editor');

    const btnRunBlockly = document.getElementById('btn-run-blockly');
    const btnBlocklyToCode = document.getElementById('btn-blockly-to-code');
    const codeModal = document.getElementById('code-modal');
    const modalClose = document.querySelector('.modal-close');
    const generatedCodeDisplay = document.getElementById('generated-code-display');
    const btnCopyGeneratedCode = document.getElementById('btn-copy-generated-code');
    const btnSendToEditor = document.getElementById('btn-send-to-editor');
    const btnExportImg = document.getElementById('btn-export-img');

    // Zoom & Grid Buttons Mode A & Mode B
    const btnZoomIn = document.getElementById('btn-zoom-in');
    const btnZoomOut = document.getElementById('btn-zoom-out');
    const btnZoomReset = document.getElementById('btn-zoom-reset');

    const btnZoomInB = document.getElementById('btn-zoom-in-b');
    const btnZoomOutB = document.getElementById('btn-zoom-out-b');
    const btnZoomResetB = document.getElementById('btn-zoom-reset-b');
    const btnGridToggleB = document.getElementById('btn-grid-toggle-b');

    if (btnZoomIn) btnZoomIn.addEventListener('click', () => turtleA.zoomIn());
    if (btnZoomOut) btnZoomOut.addEventListener('click', () => turtleA.zoomOut());
    if (btnZoomReset) btnZoomReset.addEventListener('click', () => turtleA.zoomReset());

    if (btnZoomInB) btnZoomInB.addEventListener('click', () => turtleB.zoomIn());
    if (btnZoomOutB) btnZoomOutB.addEventListener('click', () => turtleB.zoomOut());
    if (btnZoomResetB) btnZoomResetB.addEventListener('click', () => turtleB.zoomReset());
    if (btnGridToggleB) {
        btnGridToggleB.addEventListener('click', () => {
            turtleB.setShowGrid(!turtleB.showGrid);
            if (turtleB.showGrid) btnGridToggleB.classList.add('active');
            else btnGridToggleB.classList.remove('active');
        });
    }

    // =========================================================================
    // CANVAS PAN SLIDERS & TOUCH/TABLET BINDINGS
    // =========================================================================
    function setupPanSliders(turtle, sliderXId, sliderYId, valXId, valYId) {
        const sliderX = document.getElementById(sliderXId);
        const sliderY = document.getElementById(sliderYId);
        const valX = document.getElementById(valXId);
        const valY = document.getElementById(valYId);

        if (!sliderX || !sliderY) return;

        function updateUI(px, py) {
            const rx = Math.round(px);
            const ry = Math.round(py);
            if (sliderX.value != rx) sliderX.value = rx;
            if (sliderY.value != -ry) sliderY.value = -ry;
            if (valX) valX.textContent = `${rx}px`;
            if (valY) valY.textContent = `${ry}px`;
        }

        turtle.onPanChange = (px, py) => {
            updateUI(px, py);
        };

        sliderX.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            turtle.setPanX(val);
            if (valX) valX.textContent = `${Math.round(val)}px`;
        });

        sliderY.addEventListener('input', (e) => {
            const val = parseFloat(e.target.value) || 0;
            turtle.setPanY(-val);
            if (valY) valY.textContent = `${Math.round(-val)}px`;
        });
    }

    setupPanSliders(turtleA, 'slider-pan-x-a', 'slider-pan-y-a', 'val-pan-x-a', 'val-pan-y-a');
    setupPanSliders(turtleB, 'slider-pan-x-b', 'slider-pan-y-b', 'val-pan-x-b', 'val-pan-y-b');

    // Handle Window Resize for Canvas Auto-fit
    window.addEventListener('resize', () => {
        if (turtleA) turtleA.fitToContainer();
        if (turtleB) turtleB.fitToContainer();
        if (currentMode === 'B' && blocklyObj && blocklyObj.workspace) {
            Blockly.svgResize(blocklyObj.workspace);
        }
    });

    setTimeout(() => {
        if (turtleA) turtleA.fitToContainer();
        if (turtleB) turtleB.fitToContainer();
    }, 200);

    // =========================================================================
    // MODE SWITCHING (MODE A vs MODE B)
    // =========================================================================
    if (btnModeA) btnModeA.addEventListener('click', () => switchMode('A'));
    if (btnModeB) btnModeB.addEventListener('click', () => switchMode('B'));

    function colorizeBlocklyToolbox() {
        setTimeout(() => {
            const categories = [
                { keyword: 'Eventos', color: '#FFBF00', bg: 'rgba(255, 191, 0, 0.22)' },
                { keyword: 'Movimiento', color: '#4C97FF', bg: 'rgba(76, 151, 255, 0.22)' },
                { keyword: 'Dibujo', color: '#0FBD8C', bg: 'rgba(15, 189, 140, 0.22)' },
                { keyword: 'Control', color: '#FFAB19', bg: 'rgba(255, 171, 25, 0.22)' },
                { keyword: 'Matemáticas', color: '#59C059', bg: 'rgba(89, 192, 89, 0.22)' },
                { keyword: 'Texto', color: '#FF6680', bg: 'rgba(255, 102, 128, 0.22)' },
                { keyword: 'Variables', color: '#FF8C1A', bg: 'rgba(255, 140, 26, 0.22)' },
                { keyword: 'Procedimientos', color: '#FF6680', bg: 'rgba(255, 102, 128, 0.22)' }
            ];

            const rows = document.querySelectorAll('.blocklyTreeRow, .blocklyToolboxCategory, div[role="treeitem"]');
            rows.forEach((row, idx) => {
                const text = row.textContent || '';
                let cat = categories.find(c => text.includes(c.keyword));
                if (!cat && categories[idx]) cat = categories[idx];

                if (cat) {
                    row.style.setProperty('background-color', cat.bg, 'important');
                    row.style.setProperty('border-left', `5px solid ${cat.color}`, 'important');
                    row.style.setProperty('border-radius', '8px', 'important');
                    row.style.setProperty('margin', '6px 2px', 'important');
                    row.style.setProperty('padding', '10px 14px', 'important');
                    row.style.setProperty('font-weight', '700', 'important');

                    const labels = row.querySelectorAll('.blocklyTreeLabel, .blocklyTreeRowContentContainer *');
                    labels.forEach(l => {
                        l.style.setProperty('color', '#ffffff', 'important');
                        l.style.setProperty('font-weight', '700', 'important');
                        l.style.setProperty('margin-top', '-6px', 'important');
                        l.style.setProperty('float', 'left', 'important');
                    });
                }
            });
        }, 150);
    }

    // =========================================================================
    // CUSTOM VARIABLE CREATION MODAL OVERRIDE
    // =========================================================================
    const varModal = document.getElementById('variable-modal');
    const varModalMsg = document.getElementById('var-modal-msg');
    const varModalInput = document.getElementById('var-modal-input');
    const btnVarConfirm = document.getElementById('btn-var-confirm');
    const varModalCloseBtns = document.querySelectorAll('.var-modal-close');

    let currentVarCallback = null;

    function showCustomVariableModal(message, defaultValue, callback) {
        if (!varModal) {
            const res = prompt(message, defaultValue);
            if (callback) callback(res);
            return;
        }
        currentVarCallback = callback;
        if (varModalMsg) varModalMsg.textContent = message || 'Nombre de la variable:';
        if (varModalInput) varModalInput.value = defaultValue || '';
        varModal.classList.add('active');
        setTimeout(() => {
            if (varModalInput) {
                varModalInput.focus();
                varModalInput.select();
            }
        }, 100);
    }

    if (btnVarConfirm) {
        btnVarConfirm.addEventListener('click', () => {
            const val = varModalInput ? varModalInput.value.trim() : '';
            if (varModal) varModal.classList.remove('active');
            if (currentVarCallback) {
                currentVarCallback(val || null);
                currentVarCallback = null;
            }
        });
    }

    function closeVarModal() {
        if (varModal) varModal.classList.remove('active');
        if (currentVarCallback) {
            currentVarCallback(null);
            currentVarCallback = null;
        }
    }

    varModalCloseBtns.forEach(btn => btn.addEventListener('click', closeVarModal));

    if (varModalInput) {
        varModalInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                if (btnVarConfirm) btnVarConfirm.click();
            } else if (e.key === 'Escape') {
                closeVarModal();
            }
        });
    }

    if (typeof Blockly !== 'undefined' && Blockly.dialog && Blockly.dialog.setPrompt) {
        Blockly.dialog.setPrompt((message, defaultValue, callback) => {
            showCustomVariableModal(message, defaultValue, callback);
        });
    }

    function switchMode(mode) {
        currentMode = mode;
        if (mode === 'A') {
            if (btnModeA) btnModeA.classList.add('active');
            if (btnModeB) btnModeB.classList.remove('active');
            if (modeAView) modeAView.classList.add('active');
            if (modeBView) modeBView.classList.remove('active');
            turtleA.fitToContainer();
            turtleA.redraw();
        } else {
            if (btnModeB) btnModeB.classList.add('active');
            if (btnModeA) btnModeA.classList.remove('active');
            if (modeBView) modeBView.classList.add('active');
            if (modeAView) modeAView.classList.remove('active');
            if (blocklyObj && blocklyObj.workspace) {
                Blockly.svgResize(blocklyObj.workspace);
            }
            turtleB.fitToContainer();
            turtleB.redraw();
            colorizeBlocklyToolbox();
        }
    }

    // =========================================================================
    // TERMINAL TABS (Single Line vs Multi-Line Editor)
    // =========================================================================
    if (tabCmdLine) {
        tabCmdLine.addEventListener('click', () => {
            tabCmdLine.classList.add('active');
            if (tabMultiEditor) tabMultiEditor.classList.remove('active');
            if (viewCmdLine) viewCmdLine.classList.add('active');
            if (viewMultiEditor) viewMultiEditor.classList.remove('active');
        });
    }

    if (tabMultiEditor) {
        tabMultiEditor.addEventListener('click', () => {
            tabMultiEditor.classList.add('active');
            if (tabCmdLine) tabCmdLine.classList.remove('active');
            if (viewMultiEditor) viewMultiEditor.classList.add('active');
            if (viewCmdLine) viewCmdLine.classList.remove('active');
        });
    }

    // =========================================================================
    // EXECUTION LOGIC FOR MODE A
    // =========================================================================
    const terminalFeedback = document.getElementById('terminal-feedback');

    function showTerminalFeedback(message, isError = false) {
        if (!terminalFeedback) return;
        if (isError) {
            terminalFeedback.style.color = '#ff5252';
            terminalFeedback.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #ff5252;"></i> <strong>Advertencia:</strong> ${message}`;
        } else {
            terminalFeedback.style.color = '#00e676';
            terminalFeedback.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #00e676;"></i> ${message}`;
        }
    }

    function runCodeModeA(code) {
        if (!code || !code.trim()) return;

        code = code.trim();

        // 1. Validate & Execute code via interpreter FIRST
        try {
            interpreterA.execute(code);

            // If valid, add to history
            if (!commandHistory.includes(code)) {
                commandHistory.push(code);
                addHistoryItem(code);
            }
            historyIndex = commandHistory.length;

            // Play animation
            turtleA.playAnimation(
                () => updateTurtleInfoBadge(turtleA),
                (x, y, angle) => updateTurtleInfoBadge(turtleA, x, y, angle)
            );

            updateProcedureList();
            showTerminalFeedback(`Comando "${code}" ejecutado correctamente.`, false);
        } catch (err) {
            console.warn('Error de sintaxis:', err.message);
            showTerminalFeedback(err.message, true);
        }
    }

    if (btnSendCmd) {
        btnSendCmd.addEventListener('click', () => {
            const code = cmdInput ? cmdInput.value : '';
            runCodeModeA(code);
            if (cmdInput) cmdInput.value = '';
        });
    }

    if (cmdInput) {
        cmdInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                const code = cmdInput.value;
                runCodeModeA(code);
                cmdInput.value = '';
            } else if (e.key === 'ArrowUp') {
                if (historyIndex > 0) {
                    historyIndex--;
                    cmdInput.value = commandHistory[historyIndex];
                }
            } else if (e.key === 'ArrowDown') {
                if (historyIndex < commandHistory.length - 1) {
                    historyIndex++;
                    cmdInput.value = commandHistory[historyIndex];
                } else {
                    historyIndex = commandHistory.length;
                    cmdInput.value = '';
                }
            }
        });
    }

    if (btnRunEditor) {
        btnRunEditor.addEventListener('click', () => {
            const code = multiCodeEditor ? multiCodeEditor.value : '';
            runCodeModeA(code);
        });
    }

    if (multiCodeEditor) {
        multiCodeEditor.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.key === 'Enter') {
                runCodeModeA(multiCodeEditor.value);
            }
        });
    }

    if (btnRun) {
        btnRun.addEventListener('click', () => {
            if (currentMode === 'A') {
                if (viewCmdLine && viewCmdLine.classList.contains('active')) {
                    runCodeModeA(cmdInput ? cmdInput.value : '');
                    if (cmdInput) cmdInput.value = '';
                } else {
                    runCodeModeA(multiCodeEditor ? multiCodeEditor.value : '');
                }
            } else {
                runBlocklyCode();
            }
        });
    }

    if (btnStop) {
        btnStop.addEventListener('click', () => {
            turtleA.stopAnimation();
            turtleB.stopAnimation();
        });
    }

    if (btnClear) {
        btnClear.addEventListener('click', () => {
            if (currentMode === 'A') turtleA.clear();
            else turtleB.clear();
        });
    }

    // Speed Slider
    if (speedSlider) {
        speedSlider.addEventListener('input', (e) => {
            const val = e.target.value;
            if (speedVal) speedVal.textContent = val + '%';
            turtleA.setSpeed(val);
            turtleB.setSpeed(val);
        });
    }

    // Grid Checkbox & Toggle Buttons (Mode A & Mode B)
    const chkGridB = document.getElementById('chk-grid-b');

    function syncGridState(showGrid) {
        turtleA.setShowGrid(showGrid);
        turtleB.setShowGrid(showGrid);
        if (chkGrid) chkGrid.checked = showGrid;
        if (chkGridB) chkGridB.checked = showGrid;
    }

    if (chkGrid) {
        chkGrid.addEventListener('change', (e) => syncGridState(e.target.checked));
    }

    if (chkGridB) {
        chkGridB.addEventListener('change', (e) => syncGridState(e.target.checked));
    }

    // =========================================================================
    // HISTORY & PROCEDURES LIST MANAGEMENT
    // =========================================================================
    function addHistoryItem(code) {
        if (!historyList) return;
        const emptyMsg = historyList.querySelector('.empty-msg');
        if (emptyMsg) emptyMsg.remove();

        const li = document.createElement('li');
        li.textContent = code;
        li.title = 'Haz clic para cargar e ejecutar este comando';
        li.addEventListener('click', () => {
            if (cmdInput) cmdInput.value = code;
            runCodeModeA(code);
        });
        historyList.prepend(li);
    }

    function updateProcedureList() {
        if (!procedureList) return;
        procedureList.innerHTML = '';
        const procs = Object.keys(interpreterA.procedures);

        if (procs.length === 0) {
            procedureList.innerHTML = '<li class="empty-msg">Ningún procedimiento creado.</li>';
            return;
        }

        procs.forEach(pName => {
            const proc = interpreterA.procedures[pName];
            const li = document.createElement('li');
            li.textContent = `PARA ${pName} :${proc.params.join(' :')}`;
            li.title = 'Haz clic para insertar llamadas a este procedimiento';
            li.addEventListener('click', () => {
                if (cmdInput) {
                    cmdInput.value = `${pName} ${proc.params.map(() => 100).join(' ')}`;
                    cmdInput.focus();
                }
            });
            procedureList.appendChild(li);
        });
    }

    if (btnClearHistory) {
        btnClearHistory.addEventListener('click', () => {
            commandHistory.length = 0;
            if (historyList) historyList.innerHTML = '<li class="empty-msg">No hay comandos aún. ¡Escribe un comando abajo!</li>';
        });
    }

    function updateTurtleInfoBadge(turtle, x, y, angle) {
        if (!turtleInfoBadge) return;
        const currX = x !== undefined ? Math.round(x) : Math.round(turtle.x);
        const currY = y !== undefined ? Math.round(y) : Math.round(turtle.y);
        const currAngle = angle !== undefined ? Math.round(angle) : Math.round(turtle.angle);

        turtleInfoBadge.innerHTML = `<i class="fa-solid fa-location-crosshairs"></i> X: ${currX} | Y: ${currY} | Ángulo: ${currAngle}°`;
    }

    // =========================================================================
    // MODE B: BLOCKLY EXECUTION & CODE MODAL
    // =========================================================================
    function runBlocklyCode() {
        if (!blocklyObj || !blocklyObj.workspace) return;
        try {
            const code = blocklyObj.logoGenerator.workspaceToCode(blocklyObj.workspace);

            if (!code.trim()) {
                alert('¡Arrastra algunos bloques al área de trabajo primero!');
                return;
            }

            turtleB.clear();
            interpreterB.execute(code);
            turtleB.playAnimation();
        } catch (err) {
            alert('Error al ejecutar bloques: ' + err.message);
        }
    }

    if (btnRunBlockly) btnRunBlockly.addEventListener('click', runBlocklyCode);

    if (btnBlocklyToCode) {
        btnBlocklyToCode.addEventListener('click', () => {
            if (!blocklyObj || !blocklyObj.workspace) return;
            try {
                const code = blocklyObj.logoGenerator.workspaceToCode(blocklyObj.workspace);
                if (generatedCodeDisplay) generatedCodeDisplay.textContent = code.trim() || '// (Área de bloques vacía)';
                if (codeModal) codeModal.classList.add('active');
            } catch (err) {
                alert('Error al generar código: ' + err.message);
            }
        });
    }

    if (modalClose) modalClose.addEventListener('click', () => { if (codeModal) codeModal.classList.remove('active'); });
    if (codeModal) {
        codeModal.addEventListener('click', (e) => {
            if (e.target === codeModal) codeModal.classList.remove('active');
        });
    }

    if (btnCopyGeneratedCode) {
        btnCopyGeneratedCode.addEventListener('click', () => {
            if (generatedCodeDisplay) navigator.clipboard.writeText(generatedCodeDisplay.textContent);
            btnCopyGeneratedCode.innerHTML = '<i class="fa-solid fa-check"></i> ¡Copiado!';
            setTimeout(() => {
                btnCopyGeneratedCode.innerHTML = '<i class="fa-solid fa-copy"></i> Copiar Código';
            }, 2000);
        });
    }

    if (btnSendToEditor) {
        btnSendToEditor.addEventListener('click', () => {
            const code = generatedCodeDisplay ? generatedCodeDisplay.textContent : '';
            if (codeModal) codeModal.classList.remove('active');
            switchMode('A');
            if (tabMultiEditor) tabMultiEditor.click();
            if (multiCodeEditor) multiCodeEditor.value = code;
        });
    }

    // =========================================================================
    // PRESET EXAMPLES LIBRARY
    // =========================================================================
    const examples = {
        'cuadrado': 'repite 4 [ av 120 gd 90 ]',
        'estrella': 'pc amarillo pg 3 repite 5 [ av 150 gd 144 ]',
        'espiral': 'pc cian pg 2 repite 36 [ av 120 gd 95 ]',
        'flor': 'pc rosa pg 2 repite 18 [ repite 4 [ av 90 gd 90 ] gd 20 ]',
        'arbol': `PARA rama :longitud\n  si :longitud < 10 [ av :longitud re :longitud ]\n  pc verde\n  av :longitud\n  gi 30\n  av :longitud / 2\n  re :longitud / 2\n  gd 60\n  av :longitud / 2\n  re :longitud / 2\n  gi 30\n  re :longitud\nFIN\n\nrama 80`,
        'cubo': `PARA cuadrado3d :tam\n  pc cian repite 4 [ av :tam gd 90 ]\n  gd 45 av :tam / 2 gi 45\n  pc violeta repite 4 [ av :tam gd 90 ]\nFIN\n\ncuadrado3d 100`
    };

    if (exampleSelect) {
        exampleSelect.addEventListener('change', (e) => {
            const key = e.target.value;
            if (!key || !examples[key]) return;

            const code = examples[key];
            if (currentMode === 'A') {
                if (code.includes('\n') || code.includes('PARA')) {
                    if (tabMultiEditor) tabMultiEditor.click();
                    if (multiCodeEditor) multiCodeEditor.value = code;
                    runCodeModeA(code);
                } else {
                    if (tabCmdLine) tabCmdLine.click();
                    if (cmdInput) cmdInput.value = code;
                    runCodeModeA(code);
                }
            } else {
                alert('Carga el ejemplo en el Modo Consola A o envía su código generado.');
            }
        });
    }

    // Export PNG Image
    if (btnExportImg) {
        btnExportImg.addEventListener('click', () => {
            const canvas = currentMode === 'A' ? document.getElementById('turtle-canvas') : document.getElementById('turtle-canvas-b');
            if (!canvas) return;
            const link = document.createElement('a');
            link.download = `xlogo_drawing_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
        });
    }

    // =========================================================================
    // SAVE AND LOAD PROGRAM / PROJECT (.xlogo / .json / .logo)
    // =========================================================================
    const btnSaveProject = document.getElementById('btn-save-project');
    const btnLoadProject = document.getElementById('btn-load-project');
    const btnSaveBlocks = document.getElementById('btn-save-blocks');
    const btnLoadBlocks = document.getElementById('btn-load-blocks');
    const btnSaveConsole = document.getElementById('btn-save-console');
    const btnLoadConsole = document.getElementById('btn-load-console');
    const fileInputLoad = document.getElementById('file-input-load');

    const saveModal = document.getElementById('save-modal');
    const saveFilenameInput = document.getElementById('save-filename-input');
    const btnConfirmSave = document.getElementById('btn-confirm-save');
    const saveModalCloseBtns = document.querySelectorAll('.save-modal-close');
    const saveTypeCards = document.querySelectorAll('.save-type-card');

    let currentSaveDefaultFormat = 'xlogo';

    // Interactive Radio selection cards inside Save Modal
    saveTypeCards.forEach(card => {
        card.addEventListener('click', () => {
            saveTypeCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            const radio = card.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;
        });
    });

    function openSaveModal(defaultFormat = 'xlogo') {
        currentSaveDefaultFormat = defaultFormat;
        if (!saveModal) return;

        const defaultName = `programa_xlogo_${new Date().toISOString().slice(0, 10)}`;
        if (saveFilenameInput) saveFilenameInput.value = defaultName;

        saveTypeCards.forEach(card => {
            const radio = card.querySelector('input[type="radio"]');
            if (radio) {
                if (radio.value === defaultFormat) {
                    radio.checked = true;
                    card.classList.add('active');
                } else {
                    radio.checked = false;
                    card.classList.remove('active');
                }
            }
        });

        saveModal.classList.add('active');
        setTimeout(() => {
            if (saveFilenameInput) {
                saveFilenameInput.focus();
                saveFilenameInput.select();
            }
        }, 100);
    }

    function closeSaveModal() {
        if (saveModal) saveModal.classList.remove('active');
    }

    saveModalCloseBtns.forEach(btn => btn.addEventListener('click', closeSaveModal));
    if (saveModal) {
        saveModal.addEventListener('click', (e) => {
            if (e.target === saveModal) closeSaveModal();
        });
    }

    function downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    function doSaveProgram(filename, format) {
        filename = (filename || 'mi_programa_xlogo').trim().replace(/[/\\?%*:|"<>]/g, '_');

        let blocklyJson = null;
        let blocklyXml = null;

        if (blocklyObj && blocklyObj.workspace) {
            try {
                if (typeof Blockly !== 'undefined' && Blockly.serialization && Blockly.serialization.workspaces) {
                    blocklyJson = Blockly.serialization.workspaces.save(blocklyObj.workspace);
                }
            } catch (e) {
                console.warn('Error guardando JSON de Blockly:', e);
            }

            try {
                if (typeof Blockly !== 'undefined' && Blockly.Xml) {
                    const dom = Blockly.Xml.workspaceToDom(blocklyObj.workspace);
                    blocklyXml = Blockly.Xml.domToText(dom);
                }
            } catch (e) {
                console.warn('Error guardando XML de Blockly:', e);
            }
        }

        let consoleCode = multiCodeEditor ? multiCodeEditor.value : '';
        if (currentMode === 'B' && blocklyObj && blocklyObj.workspace) {
            try {
                const generatedCode = blocklyObj.logoGenerator.workspaceToCode(blocklyObj.workspace);
                if (generatedCode.trim()) {
                    consoleCode = generatedCode.trim();
                }
            } catch (e) {
                console.warn('Error generando código desde bloques para guardado:', e);
            }
        }

        if (format === 'xlogo') {
            const projectData = {
                fileType: 'XLogoProgram',
                version: '1.0',
                created: new Date().toISOString(),
                activeMode: currentMode,
                console: {
                    editorCode: consoleCode,
                    history: [...commandHistory]
                },
                blockly: {
                    json: blocklyJson,
                    xml: blocklyXml
                }
            };

            const jsonStr = JSON.stringify(projectData, null, 2);
            const fullFileName = filename.endsWith('.xlogo') ? filename : `${filename}.xlogo`;
            downloadFile(jsonStr, fullFileName, 'application/json');
            showTerminalFeedback(`Proyecto guardado exitosamente como "${fullFileName}".`, false);
        } else {
            const fullFileName = filename.endsWith('.logo') ? filename : `${filename}.logo`;
            downloadFile(consoleCode, fullFileName, 'text/plain');
            showTerminalFeedback(`Código Logo guardado exitosamente como "${fullFileName}".`, false);
        }
    }

    if (btnConfirmSave) {
        btnConfirmSave.addEventListener('click', () => {
            const filename = saveFilenameInput ? saveFilenameInput.value : 'mi_programa_xlogo';
            const selectedRadio = document.querySelector('input[name="save-format"]:checked');
            const format = selectedRadio ? selectedRadio.value : 'xlogo';
            doSaveProgram(filename, format);
            closeSaveModal();
        });
    }

    if (btnSaveProject) btnSaveProject.addEventListener('click', () => openSaveModal('xlogo'));
    if (btnSaveBlocks) btnSaveBlocks.addEventListener('click', () => openSaveModal('xlogo'));
    if (btnSaveConsole) btnSaveConsole.addEventListener('click', () => openSaveModal('logo'));

    function triggerLoadFile() {
        if (fileInputLoad) {
            fileInputLoad.value = '';
            fileInputLoad.click();
        }
    }

    if (btnLoadProject) btnLoadProject.addEventListener('click', triggerLoadFile);
    if (btnLoadBlocks) btnLoadBlocks.addEventListener('click', triggerLoadFile);
    if (btnLoadConsole) btnLoadConsole.addEventListener('click', triggerLoadFile);

    if (fileInputLoad) {
        fileInputLoad.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = (evt) => {
                const content = evt.target.result;
                loadProgramContent(content, file.name);
            };
            reader.onerror = () => {
                alert('Error al leer el archivo seleccionado.');
            };
            reader.readAsText(file);
        });
    }

    function loadProgramContent(content, fileName) {
        if (!content) {
            alert('El archivo seleccionado está vacío.');
            return;
        }

        let parsedData = null;
        try {
            parsedData = JSON.parse(content);
        } catch (e) {
            parsedData = null;
        }

        if (parsedData && (parsedData.fileType === 'XLogoProgram' || parsedData.blockly || parsedData.console)) {
            if (parsedData.blockly && blocklyObj && blocklyObj.workspace) {
                try {
                    blocklyObj.workspace.clear();
                    if (parsedData.blockly.json && typeof Blockly !== 'undefined' && Blockly.serialization && Blockly.serialization.workspaces) {
                        Blockly.serialization.workspaces.load(parsedData.blockly.json, blocklyObj.workspace);
                    } else if (parsedData.blockly.xml && typeof Blockly !== 'undefined' && Blockly.Xml) {
                        const xmlDom = Blockly.Xml.textToDom(parsedData.blockly.xml);
                        Blockly.Xml.domToWorkspace(xmlDom, blocklyObj.workspace);
                    }
                } catch (err) {
                    console.warn('Error al restaurar bloques de Blockly:', err);
                }
            }

            if (parsedData.console) {
                if (parsedData.console.editorCode !== undefined && multiCodeEditor) {
                    multiCodeEditor.value = parsedData.console.editorCode;
                }
                if (Array.isArray(parsedData.console.history)) {
                    commandHistory.length = 0;
                    if (historyList) historyList.innerHTML = '';
                    parsedData.console.history.forEach(cmd => {
                        commandHistory.push(cmd);
                        addHistoryItem(cmd);
                    });
                }
            }

            const targetMode = parsedData.activeMode || 'B';
            switchMode(targetMode);

            showTerminalFeedback(`Proyecto "${fileName}" cargado correctamente con todas sus estructuras y bloques.`, false);
        } else {
            if (multiCodeEditor) {
                multiCodeEditor.value = content;
            }
            switchMode('A');
            if (tabMultiEditor) tabMultiEditor.click();
            showTerminalFeedback(`Código Logo de "${fileName}" cargado en el Editor de Consola.`, false);
        }
    }

    // =========================================================================
    // HELP MODAL & FULLSCREEN CONTROLS
    // =========================================================================
    const btnHelp = document.getElementById('btn-help');
    const helpModal = document.getElementById('help-modal');
    const helpModalCloseBtns = document.querySelectorAll('.help-modal-close');
    const helpSearchInput = document.getElementById('help-search-input');
    const btnFullscreen = document.getElementById('btn-fullscreen');

    if (btnHelp && helpModal) {
        btnHelp.addEventListener('click', () => {
            helpModal.classList.add('active');
        });

        helpModalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => helpModal.classList.remove('active'));
        });

        helpModal.addEventListener('click', (e) => {
            if (e.target === helpModal) helpModal.classList.remove('active');
        });
    }

    // =========================================================================
    // CREDITS & DEVELOPERS MODAL CONTROLS
    // =========================================================================
    const logoBrand = document.getElementById('logo-brand');
    const creditsModal = document.getElementById('credits-modal');
    const creditsModalCloseBtns = document.querySelectorAll('.credits-modal-close');

    if (logoBrand && creditsModal) {
        logoBrand.addEventListener('click', () => {
            creditsModal.classList.add('active');
        });

        creditsModalCloseBtns.forEach(btn => {
            btn.addEventListener('click', () => creditsModal.classList.remove('active'));
        });

        creditsModal.addEventListener('click', (e) => {
            if (e.target === creditsModal) creditsModal.classList.remove('active');
        });
    }

    // Help Search Filter
    if (helpSearchInput) {
        helpSearchInput.addEventListener('input', (e) => {
            const term = e.target.value.toLowerCase().trim();
            const cards = document.querySelectorAll('.help-card');

            cards.forEach(card => {
                const text = card.textContent.toLowerCase();
                if (text.includes(term)) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    }

    // Cross-browser Fullscreen Toggle with CSS fallback
    function isFullscreen() {
        return !!(document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement || document.body.classList.contains('fullscreen-active'));
    }

    function enableCssFullscreen() {
        document.body.classList.add('fullscreen-active');
        updateFullscreenBtnState(true);
    }

    function disableCssFullscreen() {
        document.body.classList.remove('fullscreen-active');
        updateFullscreenBtnState(false);
    }

    function updateFullscreenBtnState(active) {
        if (!btnFullscreen) return;
        if (active) {
            btnFullscreen.innerHTML = '<i class="fa-solid fa-compress"></i>';
            btnFullscreen.title = 'Salir de Pantalla Completa';
        } else {
            btnFullscreen.innerHTML = '<i class="fa-solid fa-expand"></i>';
            btnFullscreen.title = 'Pantalla Completa (F11)';
        }
    }

    function toggleFullscreen() {
        const elem = document.documentElement;

        if (!isFullscreen()) {
            let promise;
            if (elem.requestFullscreen) {
                promise = elem.requestFullscreen();
            } else if (elem.webkitRequestFullscreen) {
                promise = elem.webkitRequestFullscreen();
            } else if (elem.mozRequestFullScreen) {
                promise = elem.mozRequestFullScreen();
            } else if (elem.msRequestFullscreen) {
                promise = elem.msRequestFullscreen();
            }

            if (promise && promise.catch) {
                promise.catch(() => enableCssFullscreen());
            } else if (!promise) {
                enableCssFullscreen();
            }
        } else {
            let promise;
            if (document.exitFullscreen) {
                promise = document.exitFullscreen();
            } else if (document.webkitExitFullscreen) {
                promise = document.webkitExitFullscreen();
            } else if (document.mozCancelFullScreen) {
                promise = document.mozCancelFullScreen();
            } else if (document.msExitFullscreen) {
                promise = document.msExitFullscreen();
            }

            if (promise && promise.catch) {
                promise.catch(() => disableCssFullscreen());
            }
            disableCssFullscreen();
        }
    }

    if (btnFullscreen) {
        btnFullscreen.addEventListener('click', toggleFullscreen);

        ['fullscreenchange', 'webkitfullscreenchange', 'mozfullscreenchange', 'MSFullscreenChange'].forEach(evt => {
            document.addEventListener(evt, () => {
                const active = isFullscreen();
                if (!active) disableCssFullscreen();
                else updateFullscreenBtnState(true);
            });
        });
    }

    // =========================================================================
    // INITIAL STARTUP STATE
    // =========================================================================
    setTimeout(() => {
        const initialCmd = '';
        if (cmdInput) cmdInput.value = initialCmd;
        if (initialCmd) runCodeModeA(initialCmd);
    }, 300);
});
