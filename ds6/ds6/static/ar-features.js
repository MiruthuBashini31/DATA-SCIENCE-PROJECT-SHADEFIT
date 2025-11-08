// AR Virtual Try-On Features
class ARTryOnManager {
    constructor() {
        this.isActive = false;
        this.currentProduct = null;
        this.intensity = 0.7;
        this.canvas = null;
        this.ctx = null;
        this.video = null;
        this.init();
    }

    init() {
        this.setupARInterface();
        this.loadFaceDetection();
    }

    setupARInterface() {
        // Create AR Try-On section if it doesn't exist
        const analysisSection = document.getElementById('analysis');
        if (!analysisSection) return;

        const arSection = document.createElement('div');
        arSection.className = 'ar-tryon-section';
        arSection.style.display = 'none';
        arSection.innerHTML = `
            <div class="ar-header">
                <h3><i class="fas fa-magic"></i> AR Virtual Try-On</h3>
                <button class="btn-secondary" id="toggle-ar">
                    <i class="fas fa-eye"></i>
                    Start AR
                </button>
            </div>
            
            <div class="ar-container" id="ar-container">
                <div class="ar-camera-view">
                    <video id="ar-video" autoplay playsinline style="display: none;"></video>
                    <canvas id="ar-canvas"></canvas>
                    <div class="ar-overlay">
                        <div class="face-guide">
                            <div class="guide-circle"></div>
                            <p>Position your face in the circle</p>
                        </div>
                    </div>
                </div>
                
                <div class="ar-controls">
                    <div class="product-selector">
                        <h4>Select Product</h4>
                        <div class="product-tabs">
                            <button class="product-tab active" data-product="foundation">Foundation</button>
                            <button class="product-tab" data-product="lipstick">Lipstick</button>
                            <button class="product-tab" data-product="blush">Blush</button>
                            <button class="product-tab" data-product="eyeshadow">Eyeshadow</button>
                        </div>
                    </div>
                    
                    <div class="color-palette" id="ar-color-palette">
                        <!-- Colors will be populated based on selected product -->
                    </div>
                    
                    <div class="intensity-control">
                        <label>Intensity</label>
                        <input type="range" id="intensity-slider" min="0.1" max="1" step="0.1" value="0.7">
                        <span id="intensity-value">70%</span>
                    </div>
                    
                    <div class="ar-actions">
                        <button class="btn-primary" id="capture-ar">
                            <i class="fas fa-camera"></i>
                            Capture Look
                        </button>
                        <button class="btn-secondary" id="reset-ar">
                            <i class="fas fa-undo"></i>
                            Reset
                        </button>
                    </div>
                </div>
            </div>
        `;

        analysisSection.appendChild(arSection);
        this.setupAREventListeners();
    }

    setupAREventListeners() {
        const toggleBtn = document.getElementById('toggle-ar');
        const productTabs = document.querySelectorAll('.product-tab');
        const intensitySlider = document.getElementById('intensity-slider');
        const captureBtn = document.getElementById('capture-ar');
        const resetBtn = document.getElementById('reset-ar');

        if (toggleBtn) {
            toggleBtn.addEventListener('click', () => this.toggleAR());
        }

        productTabs.forEach(tab => {
            tab.addEventListener('click', () => this.selectProduct(tab.dataset.product));
        });

        if (intensitySlider) {
            intensitySlider.addEventListener('input', (e) => {
                this.intensity = parseFloat(e.target.value);
                document.getElementById('intensity-value').textContent = `${Math.round(this.intensity * 100)}%`;
            });
        }

        if (captureBtn) {
            captureBtn.addEventListener('click', () => this.captureLook());
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetAR());
        }
    }

    async toggleAR() {
        const arSection = document.querySelector('.ar-tryon-section');
        const toggleBtn = document.getElementById('toggle-ar');

        if (!this.isActive) {
            try {
                await this.startAR();
                arSection.style.display = 'block';
                toggleBtn.innerHTML = '<i class="fas fa-eye-slash"></i> Stop AR';
                this.isActive = true;
            } catch (error) {
                console.error('Failed to start AR:', error);
                if (window.app) {
                    window.app.showNotification('Camera access required for AR try-on', 'error');
                }
            }
        } else {
            this.stopAR();
            arSection.style.display = 'none';
            toggleBtn.innerHTML = '<i class="fas fa-eye"></i> Start AR';
            this.isActive = false;
        }
    }

    async startAR() {
        const video = document.getElementById('ar-video');
        const canvas = document.getElementById('ar-canvas');
        
        this.video = video;
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');

        // Get camera stream
        const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'user', width: 640, height: 480 }
        });

        video.srcObject = stream;
        video.style.display = 'block';

        // Set canvas size
        canvas.width = 640;
        canvas.height = 480;

        // Start rendering loop
        this.renderLoop();

        // Initialize with foundation
        this.selectProduct('foundation');
    }

    stopAR() {
        if (this.video && this.video.srcObject) {
            const tracks = this.video.srcObject.getTracks();
            tracks.forEach(track => track.stop());
            this.video.srcObject = null;
        }
    }

    selectProduct(productType) {
        // Update active tab
        document.querySelectorAll('.product-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector(`[data-product="${productType}"]`).classList.add('active');

        this.currentProduct = productType;
        this.updateColorPalette(productType);
    }

    updateColorPalette(productType) {
        const palette = document.getElementById('ar-color-palette');
        if (!palette) return;

        const colors = this.getProductColors(productType);
        
        palette.innerHTML = `
            <h4>${productType.charAt(0).toUpperCase() + productType.slice(1)} Shades</h4>
            <div class="color-grid">
                ${colors.map((color, index) => `
                    <div class="color-option ${index === 0 ? 'active' : ''}" 
                         style="background-color: ${color.hex}" 
                         data-color="${color.hex}"
                         title="${color.name}">
                    </div>
                `).join('')}
            </div>
        `;

        // Add click listeners to color options
        palette.querySelectorAll('.color-option').forEach(option => {
            option.addEventListener('click', () => {
                palette.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
            });
        });
    }

    getProductColors(productType) {
        const colorSets = {
            foundation: [
                { name: 'Light Ivory', hex: '#f4c2a1' },
                { name: 'Light Beige', hex: '#e8b4a0' },
                { name: 'Medium Tan', hex: '#d4a574' },
                { name: 'Deep Caramel', hex: '#c19660' },
                { name: 'Rich Espresso', hex: '#a67c52' }
            ],
            lipstick: [
                { name: 'Classic Red', hex: '#dc2626' },
                { name: 'Berry Pink', hex: '#ec4899' },
                { name: 'Coral Sunset', hex: '#f97316' },
                { name: 'Plum Purple', hex: '#7c3aed' },
                { name: 'Nude Rose', hex: '#f9a8d4' }
            ],
            blush: [
                { name: 'Peachy Pink', hex: '#ffa8a8' },
                { name: 'Rosy Coral', hex: '#ff8787' },
                { name: 'Berry Flush', hex: '#ff6b6b' },
                { name: 'Soft Pink', hex: '#f783ac' },
                { name: 'Warm Apricot', hex: '#ffb347' }
            ],
            eyeshadow: [
                { name: 'Golden Bronze', hex: '#cd853f' },
                { name: 'Smoky Brown', hex: '#8b5a3c' },
                { name: 'Champagne', hex: '#daa520' },
                { name: 'Deep Plum', hex: '#6b46c1' },
                { name: 'Rose Gold', hex: '#e6b800' }
            ]
        };

        return colorSets[productType] || colorSets.foundation;
    }

    renderLoop() {
        if (!this.isActive || !this.video || !this.canvas) return;

        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Draw video frame
        if (this.video.readyState >= 2) {
            this.ctx.drawImage(this.video, 0, 0, this.canvas.width, this.canvas.height);
            
            // Apply makeup effects
            this.applyMakeupEffects();
        }

        // Continue loop
        requestAnimationFrame(() => this.renderLoop());
    }

    applyMakeupEffects() {
        if (!this.currentProduct) return;

        const activeColor = document.querySelector('.color-option.active');
        if (!activeColor) return;

        const color = activeColor.dataset.color;
        
        // Simple face detection simulation (in a real app, you'd use a proper face detection library)
        const faceRegion = this.detectFaceRegion();
        
        if (faceRegion) {
            this.applyProductToFace(faceRegion, color);
        }
    }

    detectFaceRegion() {
        // Simplified face detection - in reality, you'd use libraries like MediaPipe or face-api.js
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const faceWidth = 200;
        const faceHeight = 250;

        return {
            x: centerX - faceWidth / 2,
            y: centerY - faceHeight / 2,
            width: faceWidth,
            height: faceHeight,
            // Facial feature positions (simplified)
            lips: { x: centerX, y: centerY + 50, width: 60, height: 20 },
            cheeks: [
                { x: centerX - 60, y: centerY + 10, radius: 30 },
                { x: centerX + 60, y: centerY + 10, radius: 30 }
            ],
            eyes: [
                { x: centerX - 40, y: centerY - 30, width: 30, height: 15 },
                { x: centerX + 10, y: centerY - 30, width: 30, height: 15 }
            ]
        };\n    }\n\n    applyProductToFace(faceRegion, color) {\n        const rgba = this.hexToRgba(color, this.intensity);\n        \n        this.ctx.globalCompositeOperation = 'multiply';\n        this.ctx.fillStyle = rgba;\n\n        switch (this.currentProduct) {\n            case 'foundation':\n                this.applyFoundation(faceRegion, rgba);\n                break;\n            case 'lipstick':\n                this.applyLipstick(faceRegion.lips, rgba);\n                break;\n            case 'blush':\n                this.applyBlush(faceRegion.cheeks, rgba);\n                break;\n            case 'eyeshadow':\n                this.applyEyeshadow(faceRegion.eyes, rgba);\n                break;\n        }\n\n        this.ctx.globalCompositeOperation = 'source-over';\n    }\n\n    applyFoundation(faceRegion, color) {\n        // Create gradient for natural foundation look\n        const gradient = this.ctx.createRadialGradient(\n            faceRegion.x + faceRegion.width / 2, \n            faceRegion.y + faceRegion.height / 2, \n            0,\n            faceRegion.x + faceRegion.width / 2, \n            faceRegion.y + faceRegion.height / 2, \n            faceRegion.width / 2\n        );\n        \n        gradient.addColorStop(0, color);\n        gradient.addColorStop(1, 'rgba(0,0,0,0)');\n        \n        this.ctx.fillStyle = gradient;\n        this.ctx.fillRect(faceRegion.x, faceRegion.y, faceRegion.width, faceRegion.height);\n    }\n\n    applyLipstick(lips, color) {\n        this.ctx.fillStyle = color;\n        this.ctx.beginPath();\n        this.ctx.ellipse(lips.x, lips.y, lips.width / 2, lips.height / 2, 0, 0, 2 * Math.PI);\n        this.ctx.fill();\n    }\n\n    applyBlush(cheeks, color) {\n        cheeks.forEach(cheek => {\n            const gradient = this.ctx.createRadialGradient(\n                cheek.x, cheek.y, 0,\n                cheek.x, cheek.y, cheek.radius\n            );\n            \n            gradient.addColorStop(0, color);\n            gradient.addColorStop(1, 'rgba(0,0,0,0)');\n            \n            this.ctx.fillStyle = gradient;\n            this.ctx.beginPath();\n            this.ctx.arc(cheek.x, cheek.y, cheek.radius, 0, 2 * Math.PI);\n            this.ctx.fill();\n        });\n    }\n\n    applyEyeshadow(eyes, color) {\n        eyes.forEach(eye => {\n            const gradient = this.ctx.createLinearGradient(\n                eye.x, eye.y,\n                eye.x, eye.y + eye.height\n            );\n            \n            gradient.addColorStop(0, color);\n            gradient.addColorStop(1, 'rgba(0,0,0,0)');\n            \n            this.ctx.fillStyle = gradient;\n            this.ctx.fillRect(eye.x, eye.y, eye.width, eye.height);\n        });\n    }\n\n    hexToRgba(hex, alpha) {\n        const r = parseInt(hex.slice(1, 3), 16);\n        const g = parseInt(hex.slice(3, 5), 16);\n        const b = parseInt(hex.slice(5, 7), 16);\n        return `rgba(${r}, ${g}, ${b}, ${alpha})`;\n    }\n\n    captureLook() {\n        if (!this.canvas) return;\n\n        // Create a new canvas for the captured image\n        const captureCanvas = document.createElement('canvas');\n        const captureCtx = captureCanvas.getContext('2d');\n        \n        captureCanvas.width = this.canvas.width;\n        captureCanvas.height = this.canvas.height;\n        \n        // Draw the current AR view\n        captureCtx.drawImage(this.canvas, 0, 0);\n        \n        // Convert to blob and save\n        captureCanvas.toBlob(blob => {\n            const url = URL.createObjectURL(blob);\n            const a = document.createElement('a');\n            a.href = url;\n            a.download = `ar-look-${Date.now()}.png`;\n            a.click();\n            URL.revokeObjectURL(url);\n            \n            if (window.app) {\n                window.app.showNotification('AR look captured successfully!', 'success');\n            }\n        });\n    }\n\n    resetAR() {\n        // Reset to default settings\n        this.intensity = 0.7;\n        document.getElementById('intensity-slider').value = 0.7;\n        document.getElementById('intensity-value').textContent = '70%';\n        \n        // Reset to foundation\n        this.selectProduct('foundation');\n        \n        if (window.app) {\n            window.app.showNotification('AR settings reset', 'info');\n        }\n    }\n\n    loadFaceDetection() {\n        // In a real implementation, you would load face detection libraries here\n        // For example: face-api.js, MediaPipe, or similar\n        console.log('Face detection libraries would be loaded here');\n    }\n}\n\n// Initialize AR manager when DOM is loaded\ndocument.addEventListener('DOMContentLoaded', () => {\n    if (document.getElementById('analysis')) {\n        window.arManager = new ARTryOnManager();\n    }\n});"
<parameter name="explanation">Creating AR virtual try-on functionality that allows users to test makeup products in real-time using their camera.