/**
 * XLogo Turtle Graphics Engine (Canvas 2D / 3D Perspective)
 * Manages Turtle State, Rendering Queue, Animation, and Grid Overlay
 */

class TurtleCanvas {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) return;
        this.ctx = this.canvas.getContext('2d');
        
        // Turtle State
        this.resetState();

        // Canvas Scale & Pan
        this.scale = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.showGrid = true;
        this.speedMs = 15; // Animation delay per step
        this.onPanChange = null;

        // Drawing History for crisp redraws
        this.drawCommands = [];
        this.isAnimating = false;
        this.animQueue = [];
        this.animTimer = null;

        // Interactive Pan & Zoom
        this.setupInteractions();

        // Resize & Initial Draw
        this.fitToContainer();
        this.redraw();
    }

    fitToContainer() {
        if (!this.canvas || !this.canvas.parentElement) return;
        const parent = this.canvas.parentElement;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        if (w > 0 && h > 0 && (this.canvas.width !== w || this.canvas.height !== h)) {
            this.canvas.width = w;
            this.canvas.height = h;
            this.redraw();
        }
    }

    notifyPanChange() {
        if (typeof this.onPanChange === 'function') {
            this.onPanChange(this.panX, this.panY);
        }
    }

    setPanX(x) {
        this.panX = parseFloat(x) || 0;
        this.redraw();
        this.notifyPanChange();
    }

    setPanY(y) {
        this.panY = parseFloat(y) || 0;
        this.redraw();
        this.notifyPanChange();
    }

    setPan(x, y) {
        this.panX = parseFloat(x) || 0;
        this.panY = parseFloat(y) || 0;
        this.redraw();
        this.notifyPanChange();
    }

    zoomIn() {
        this.scale = Math.min(this.scale * 1.25, 5.0);
        this.redraw();
    }

    zoomOut() {
        this.scale = Math.max(this.scale / 1.25, 0.2);
        this.redraw();
    }

    zoomReset() {
        this.scale = 1.0;
        this.panX = 0;
        this.panY = 0;
        this.redraw();
        this.notifyPanChange();
    }

    setupInteractions() {
        if (!this.canvas || typeof this.canvas.addEventListener !== 'function') return;

        let isDragging = false;
        let startX = 0;
        let startY = 0;

        // Touch Interaction State (Tablet / Mobile)
        let isTouchDragging = false;
        let isPinching = false;
        let initialPinchDist = 0;
        let initialScale = 1.0;

        this.canvas.style.cursor = 'crosshair';

        // --- Mouse Dragging ---
        this.canvas.addEventListener('mousedown', (e) => {
            if (e.button === 0 || e.button === 1) {
                isDragging = true;
                startX = e.clientX - this.panX;
                startY = e.clientY - this.panY;
                this.canvas.style.cursor = 'grabbing';
            }
        });

        window.addEventListener('mousemove', (e) => {
            if (isDragging) {
                this.panX = e.clientX - startX;
                this.panY = e.clientY - startY;
                this.redraw();
                this.notifyPanChange();
            }
        });

        window.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                if (this.canvas) this.canvas.style.cursor = 'crosshair';
            }
        });

        // --- Touch Dragging & Pinch Zoom (Restricted ONLY to Canvas Area) ---
        this.canvas.addEventListener('touchstart', (e) => {
            if (e.touches.length === 1) {
                isTouchDragging = true;
                isPinching = false;
                startX = e.touches[0].clientX - this.panX;
                startY = e.touches[0].clientY - this.panY;
                if (e.cancelable) e.preventDefault();
            } else if (e.touches.length === 2) {
                isTouchDragging = false;
                isPinching = true;
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                initialPinchDist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                initialScale = this.scale;
                if (e.cancelable) e.preventDefault();
            }
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            if (e.touches.length === 1 && isTouchDragging) {
                if (isPinching) {
                    isPinching = false;
                    startX = e.touches[0].clientX - this.panX;
                    startY = e.touches[0].clientY - this.panY;
                }
                this.panX = e.touches[0].clientX - startX;
                this.panY = e.touches[0].clientY - startY;
                this.redraw();
                this.notifyPanChange();
                if (e.cancelable) e.preventDefault();
            } else if (e.touches.length === 2 && isPinching) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                if (initialPinchDist > 0) {
                    const factor = dist / initialPinchDist;
                    this.scale = Math.min(Math.max(initialScale * factor, 0.2), 5.0);
                    this.redraw();
                }
                if (e.cancelable) e.preventDefault();
            }
        }, { passive: false });

        const endTouch = (e) => {
            if (e.touches.length === 0) {
                isTouchDragging = false;
                isPinching = false;
            } else if (e.touches.length === 1) {
                isTouchDragging = true;
                isPinching = false;
                startX = e.touches[0].clientX - this.panX;
                startY = e.touches[0].clientY - this.panY;
            }
        };

        this.canvas.addEventListener('touchend', endTouch, { passive: false });
        this.canvas.addEventListener('touchcancel', endTouch, { passive: false });

        // --- Mouse Wheel Zoom ---
        this.canvas.addEventListener('wheel', (e) => {
            e.preventDefault();
            const zoomFactor = e.deltaY < 0 ? 1.15 : 0.85;
            this.scale = Math.min(Math.max(this.scale * zoomFactor, 0.2), 5.0);
            this.redraw();
        }, { passive: false });
    }

    resetState() {
        this.x = 0; // Center origin
        this.y = 0;
        this.angle = 0; // 0 = UP (12 o'clock)
        this.penDown = true;
        this.normalPenColor = '#00e676';
        this.penColor = '#00e676'; // Default neon green
        this.bgColor = '#06080d'; // Background canvas color for eraser mode
        this.penWidth = 2;
        this.visible = true;
        this.drawCommands = [];
        this.animQueue = [];
        if (this.animTimer) clearTimeout(this.animTimer);
        this.isAnimating = false;
    }

    setPenErase() {
        this.penDown = true;
        this.penColor = this.bgColor;
        this.animQueue.push({ type: 'color', color: this.bgColor });
        this.animQueue.push({ type: 'penState', penDown: true });
    }

    setPenNormal() {
        this.penDown = true;
        this.penColor = this.normalPenColor;
        this.animQueue.push({ type: 'color', color: this.normalPenColor });
        this.animQueue.push({ type: 'penState', penDown: true });
    }

    // Convert Logo coordinates (Origin at Center, Y up) to Canvas coordinates
    logoToCanvas(x, y) {
        const cx = this.canvas.width / 2 + this.panX;
        const cy = this.canvas.height / 2 + this.panY;
        return {
            x: cx + x * this.scale,
            y: cy - y * this.scale // Invert Y axis
        };
    }

    setSpeed(speedPercent) {
        // speedPercent from 1 to 100
        this.speedMs = Math.max(1, Math.round(50 * (1 - speedPercent / 100)));
    }

    setShowGrid(visible) {
        this.showGrid = visible;
        this.redraw();
    }

    clear() {
        this.resetState();
        this.redraw();
    }

    // High-level Actions (Added to draw history & animation)
    forward(distance) {
        const rad = (this.angle * Math.PI) / 180;
        const newX = this.x + distance * Math.sin(rad);
        const newY = this.y + distance * Math.cos(rad);
        
        this.animQueue.push({
            type: 'line',
            x1: this.x,
            y1: this.y,
            x2: newX,
            y2: newY,
            color: this.penColor,
            width: this.penWidth,
            penDown: this.penDown
        });

        this.x = newX;
        this.y = newY;
    }

    backward(distance) {
        this.forward(-distance);
    }

    turnRight(degrees) {
        const startAngle = this.angle;
        this.angle = (this.angle + degrees) % 360;
        this.animQueue.push({
            type: 'turn',
            angle: this.angle
        });
    }

    turnLeft(degrees) {
        this.turnRight(-degrees);
    }

    setPenDown(down) {
        this.penDown = down;
        this.animQueue.push({ type: 'penState', penDown: down });
    }

    setPenColor(color) {
        this.penColor = color;
        this.animQueue.push({ type: 'color', color: color });
    }

    setPenWidth(width) {
        const num = parseFloat(width);
        this.penWidth = isNaN(num) || num <= 0 ? 1 : num;
        this.animQueue.push({ type: 'width', width: this.penWidth });
    }

    setPos(x, y) {
        const prevX = this.x;
        const prevY = this.y;
        this.x = x;
        this.y = y;
        this.animQueue.push({
            type: 'line',
            x1: prevX,
            y1: prevY,
            x2: x,
            y2: y,
            color: this.penColor,
            width: this.penWidth,
            penDown: this.penDown
        });
    }

    setHeading(angle) {
        this.angle = angle % 360;
        this.animQueue.push({ type: 'turn', angle: this.angle });
    }

    setScreenColor(color) {
        this.bgColor = color;
        if (this.canvas) this.canvas.style.backgroundColor = color;
        this.animQueue.push({ type: 'screenColor', color: color });
    }

    setFloodColor(color) {
        this.floodColor = color;
        this.animQueue.push({ type: 'floodColor', color: color });
    }

    fill() {
        this.animQueue.push({
            type: 'fill',
            color: this.floodColor || this.penColor,
            x: this.x,
            y: this.y
        });
    }

    clearText() {
        const consoleEl = document.getElementById('console-output') || document.getElementById('terminal') || document.getElementById('output');
        if (consoleEl) consoleEl.innerText = '';
        if (typeof window.clearConsole === 'function') window.clearConsole();
    }

    hideTurtle() {
        this.visible = false;
        this.animQueue.push({ type: 'visibility', visible: false });
    }

    showTurtle() {
        this.visible = true;
        this.animQueue.push({ type: 'visibility', visible: true });
    }

    // Execute Animation Queue
    playAnimation(onComplete, onStep) {
        if (this.animQueue.length === 0) {
            this.redraw();
            if (onComplete) onComplete();
            return;
        }

        this.isAnimating = true;
        let index = 0;

        const step = () => {
            if (!this.isAnimating || index >= this.animQueue.length) {
                this.isAnimating = false;
                this.redraw();
                if (onComplete) onComplete();
                return;
            }

            const item = this.animQueue[index++];
            this.drawCommands.push(item);

            // Update current state for UI display
            if (item.type === 'line') {
                this.x = item.x2;
                this.y = item.y2;
            } else if (item.type === 'turn') {
                this.angle = item.angle;
            }

            this.redraw();
            if (onStep) onStep(this.x, this.y, this.angle);

            this.animTimer = setTimeout(step, this.speedMs);
        };

        step();
    }

    stopAnimation() {
        this.isAnimating = false;
        if (this.animTimer) clearTimeout(this.animTimer);
        this.redraw();
    }

    circle(radius, filled = false) {
        this.animQueue.push({
            type: 'circle',
            x: this.x,
            y: this.y,
            radius: Math.abs(parseFloat(radius)),
            filled: filled,
            color: filled ? (this.floodColor || this.penColor) : this.penColor,
            strokeColor: this.penColor,
            width: this.penWidth,
            penDown: this.penDown
        });
    }

    ellipse(radiusX, radiusY, filled = false) {
        this.animQueue.push({
            type: 'ellipse',
            x: this.x,
            y: this.y,
            radiusX: Math.abs(parseFloat(radiusX)),
            radiusY: Math.abs(parseFloat(radiusY)),
            angle: this.angle,
            filled: filled,
            color: filled ? (this.floodColor || this.penColor) : this.penColor,
            strokeColor: this.penColor,
            width: this.penWidth,
            penDown: this.penDown
        });
    }

    drawText(text) {
        this.animQueue.push({
            type: 'text',
            text: String(text),
            x: this.x,
            y: this.y,
            color: this.penColor
        });
    }

    // Redraw Entire Canvas (Grid + All Executed Lines + Text + Turtle Sprite)
    redraw() {
        const w = this.canvas.width;
        const h = this.canvas.height;
        this.ctx.clearRect(0, 0, w, h);

        if (this.bgColor && this.bgColor !== '#06080d') {
            this.ctx.save();
            this.ctx.fillStyle = this.bgColor;
            this.ctx.fillRect(0, 0, w, h);
            this.ctx.restore();
        }

        // 1. Draw Grid Overlay if enabled
        if (this.showGrid) {
            this.drawCartesianGrid(w, h);
        }

        // 2. Draw Executed Paths and Text
        for (const cmd of this.drawCommands) {
            if (cmd.type === 'line' && cmd.penDown) {
                const p1 = this.logoToCanvas(cmd.x1, cmd.y1);
                const p2 = this.logoToCanvas(cmd.x2, cmd.y2);

                this.ctx.beginPath();
                this.ctx.moveTo(p1.x, p1.y);
                this.ctx.lineTo(p2.x, p2.y);
                this.ctx.strokeStyle = cmd.color;
                this.ctx.lineWidth = cmd.width * this.scale;
                this.ctx.lineCap = 'round';
                this.ctx.stroke();
            } else if (cmd.type === 'circle') {
                const p = this.logoToCanvas(cmd.x, cmd.y);
                const r = cmd.radius * this.scale;
                this.ctx.save();
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
                if (cmd.filled) {
                    this.ctx.fillStyle = cmd.color;
                    this.ctx.fill();
                }
                this.ctx.strokeStyle = cmd.strokeColor || cmd.color;
                this.ctx.lineWidth = cmd.width * this.scale;
                this.ctx.stroke();
                this.ctx.restore();
            } else if (cmd.type === 'ellipse') {
                const p = this.logoToCanvas(cmd.x, cmd.y);
                const rx = cmd.radiusX * this.scale;
                const ry = cmd.radiusY * this.scale;
                const rotRad = (cmd.angle * Math.PI) / 180;
                this.ctx.save();
                this.ctx.beginPath();
                if (typeof this.ctx.ellipse === 'function') {
                    this.ctx.ellipse(p.x, p.y, rx, ry, rotRad, 0, Math.PI * 2);
                } else {
                    this.ctx.translate(p.x, p.y);
                    this.ctx.rotate(rotRad);
                    this.ctx.scale(rx, ry);
                    this.ctx.arc(0, 0, 1, 0, Math.PI * 2);
                }
                if (cmd.filled) {
                    this.ctx.fillStyle = cmd.color;
                    this.ctx.fill();
                }
                this.ctx.strokeStyle = cmd.strokeColor || cmd.color;
                this.ctx.lineWidth = cmd.width * this.scale;
                this.ctx.stroke();
                this.ctx.restore();
            } else if (cmd.type === 'text') {
                const p = this.logoToCanvas(cmd.x, cmd.y);
                this.ctx.save();
                this.ctx.fillStyle = cmd.color || '#ffffff';
                this.ctx.font = `bold ${Math.max(12, Math.round(18 * this.scale))}px 'Fira Code', 'Inter', sans-serif`;
                this.ctx.fillText(cmd.text, p.x, p.y);
                this.ctx.restore();
            } else if (cmd.type === 'fill') {
                const p = this.logoToCanvas(cmd.x, cmd.y);
                this.ctx.save();
                this.ctx.fillStyle = cmd.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, 30 * this.scale, 0, Math.PI * 2);
                this.ctx.fill();
                this.ctx.restore();
            }
        }

        // 3. Draw Turtle Sprite Overlay
        if (this.visible) {
            this.drawTurtleSprite();
        }
    }

    drawCartesianGrid(w, h) {
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.18)';
        this.ctx.lineWidth = 1;

        const gridSize = 50 * this.scale;
        const cx = w / 2 + this.panX;
        const cy = h / 2 + this.panY;

        // Vertical Grid Lines
        for (let x = cx % gridSize; x < w; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, h);
            this.ctx.stroke();
        }

        // Horizontal Grid Lines
        for (let y = cy % gridSize; y < h; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(w, y);
            this.ctx.stroke();
        }

        // Axis Lines (X / Y Main Axes)
        this.ctx.strokeStyle = 'rgba(0, 230, 118, 0.5)';
        this.ctx.lineWidth = 1.5;

        // X Axis
        this.ctx.beginPath();
        this.ctx.moveTo(0, cy);
        this.ctx.lineTo(w, cy);
        this.ctx.stroke();

        // Y Axis
        this.ctx.beginPath();
        this.ctx.moveTo(cx, 0);
        this.ctx.lineTo(cx, h);
        this.ctx.stroke();

        this.ctx.restore();
    }

    drawTurtleSprite() {
        const pos = this.logoToCanvas(this.x, this.y);

        this.ctx.save();
        this.ctx.translate(pos.x, pos.y);
        // Rotate turtle: angle 0 = pointing UP, so rotate by angle
        this.ctx.rotate((this.angle * Math.PI) / 180);

        // Turtle Body (Stylized Geometric Shield Turtle)
        const size = 16 * this.scale;

        // Glow
        this.ctx.shadowColor = '#00e676';
        this.ctx.shadowBlur = 10;

        // Shell Polygon
        this.ctx.beginPath();
        this.ctx.moveTo(0, -size * 1.2); // Head tip
        this.ctx.lineTo(size * 0.8, size * 0.8); // Right leg
        this.ctx.lineTo(0, size * 0.4); // Back center
        this.ctx.lineTo(-size * 0.8, size * 0.8); // Left leg
        this.ctx.closePath();

        this.ctx.fillStyle = '#00e676';
        this.ctx.fill();

        this.ctx.strokeStyle = '#ffffff';
        this.ctx.lineWidth = 1.5;
        this.ctx.stroke();

        this.ctx.restore();
    }
}

window.TurtleCanvas = TurtleCanvas;
