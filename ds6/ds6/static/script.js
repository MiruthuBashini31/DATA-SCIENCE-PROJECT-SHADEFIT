// StyleMatch AI - Complete Application
class StyleMatchApp {
    constructor() {
        this.currentSection = 'home';
        this.skinAnalysis = null;
        this.userProfile = JSON.parse(localStorage.getItem('styleProfile')) || {
            analyses: [],
            wishlist: [],
            clothingWishlist: [],
            preferences: {},
            achievements: [],
            points: 0
        };
        this.products = [];
        this.clothingItems = [];
        this.currentView = 'grid';
        this.currentStyle = 'casual';
        this.sessionStartTime = Date.now();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupCamera();
        this.setupProductDiscovery();
        this.setupClothing();
        this.setupProfile();
        this.loadUserProfile();
        this.generateSampleProducts();
        this.generateClothingItems();
        this.showWelcomeMessage();
        this.trackUsage();
    }

    // Navigation
    setupNavigation() {
        const navBtns = document.querySelectorAll('.nav-btn');
        navBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const section = btn.dataset.section;
                this.switchSection(section);
                this.trackEvent('navigation', section);
            });
        });
    }

    switchSection(sectionName) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.remove('active');
        });
        
        document.getElementById(sectionName).classList.add('active');
        
        document.querySelectorAll('.nav-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-section="${sectionName}"]`).classList.add('active');
        
        this.currentSection = sectionName;
        
        // Load section-specific data
        if (sectionName === 'clothing' && this.skinAnalysis) {
            this.updateClothingRecommendations(this.skinAnalysis);
        }
    }

    // Camera and Skin Analysis
    setupCamera() {
        const startBtn = document.getElementById('start-camera');
        const captureBtn = document.getElementById('capture');
        const uploadBtn = document.getElementById('upload-btn');
        const uploadInput = document.getElementById('upload');
        const demoBtn = document.getElementById('demo-btn');

        startBtn.addEventListener('click', () => this.startCamera());
        captureBtn.addEventListener('click', () => this.captureSkinTone());
        uploadBtn.addEventListener('click', () => uploadInput.click());
        uploadInput.addEventListener('change', (e) => this.handleImageUpload(e));
        demoBtn.addEventListener('click', () => this.runDemo());

        // Setup result actions
        document.addEventListener('click', (e) => {
            if (e.target.id === 'save-analysis') this.saveAnalysis();
            if (e.target.id === 'view-products') this.viewMatchingProducts();
        });
    }

    async startCamera() {
        try {
            this.showLoading('Accessing camera...');
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'user',
                    width: { ideal: 640 },
                    height: { ideal: 480 }
                } 
            });
            
            const video = document.getElementById('camera');
            const placeholder = document.getElementById('camera-placeholder');
            
            video.srcObject = stream;
            video.style.display = 'block';
            placeholder.style.display = 'none';
            
            document.getElementById('start-camera').style.display = 'none';
            document.getElementById('capture').style.display = 'inline-flex';
            
            this.hideLoading();
            this.showNotification('Camera started successfully!', 'success');
            this.trackEvent('camera', 'started');
            
        } catch (error) {
            console.error('Camera access denied:', error);
            this.hideLoading();
            this.showNotification('Camera access required for skin tone analysis', 'error');
        }
    }

    captureSkinTone() {
        this.showLoading('Analyzing your skin tone...');
        
        const video = document.getElementById('camera');
        const canvas = document.getElementById('canvas');
        const ctx = canvas.getContext('2d');
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        setTimeout(() => {
            this.analyzeSkinTone(canvas);
            this.hideLoading();
        }, 2000);
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        if (file) {
            this.showLoading('Processing uploaded image...');
            
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    const canvas = document.getElementById('canvas');
                    const ctx = canvas.getContext('2d');
                    canvas.width = img.width;
                    canvas.height = img.height;
                    ctx.drawImage(img, 0, 0);
                    
                    setTimeout(() => {
                        this.analyzeSkinTone(canvas);
                        this.hideLoading();
                    }, 1500);
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
            this.trackEvent('upload', 'image');
        }
    }

    runDemo() {
        this.showLoading('Running demo analysis...');
        
        const demoColors = [
            { r: 241, g: 194, b: 161 }, // Light warm
            { r: 232, g: 180, b: 160 }, // Light-medium warm
            { r: 212, g: 165, b: 116 }, // Medium neutral
            { r: 193, g: 150, b: 96 },  // Medium-deep warm
            { r: 166, g: 124, b: 82 }   // Deep warm
        ];
        
        const randomColor = demoColors[Math.floor(Math.random() * demoColors.length)];
        
        setTimeout(() => {
            const analysis = this.categorizeSkinTone(randomColor.r, randomColor.g, randomColor.b);
            this.displayResults(analysis);
            this.hideLoading();
            this.showNotification('Demo analysis complete!', 'success');
        }, 2000);
        
        this.trackEvent('demo', 'run');
    }

    analyzeSkinTone(canvas) {
        const ctx = canvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const sampleRadius = Math.min(canvas.width, canvas.height) / 8;
        
        let totalR = 0, totalG = 0, totalB = 0, sampleCount = 0;
        
        const regions = [
            { x: centerX, y: centerY - sampleRadius/2 },
            { x: centerX - sampleRadius/3, y: centerY },
            { x: centerX + sampleRadius/3, y: centerY },
            { x: centerX, y: centerY + sampleRadius/3 }
        ];
        
        regions.forEach(region => {
            for (let y = region.y - sampleRadius/4; y < region.y + sampleRadius/4; y += 3) {
                for (let x = region.x - sampleRadius/4; x < region.x + sampleRadius/4; x += 3) {
                    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                        const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
                        const r = data[index];
                        const g = data[index + 1];
                        const b = data[index + 2];
                        
                        if (this.isSkinPixel(r, g, b)) {
                            totalR += r;
                            totalG += g;
                            totalB += b;
                            sampleCount++;
                        }
                    }
                }
            }
        });
        
        if (sampleCount === 0) {
            this.showNotification('Could not detect skin in image. Please try again.', 'error');
            return;
        }
        
        const avgR = Math.round(totalR / sampleCount);
        const avgG = Math.round(totalG / sampleCount);
        const avgB = Math.round(totalB / sampleCount);
        
        const analysis = this.categorizeSkinTone(avgR, avgG, avgB);
        this.displayResults(analysis);
        this.trackEvent('analysis', 'completed');
    }

    isSkinPixel(r, g, b) {
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        if (r < 60 || g < 40 || b < 20) return false;
        if (r > 250 || g > 250 || b > 250) return false;
        
        if (r > g && g > b && (r - g) >= 15 && (g - b) >= 15) return true;
        if (max - min < 15) return false;
        
        return r > 95 && g > 40 && b > 20 && 
               r > g && r > b && 
               r - Math.min(g, b) > 15;
    }

    categorizeSkinTone(r, g, b) {
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        const undertone = this.determineUndertone(r, g, b);
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
        
        let category = '';
        if (brightness < 70) category = 'Deep';
        else if (brightness < 100) category = 'Medium-Deep';
        else if (brightness < 130) category = 'Medium';
        else if (brightness < 160) category = 'Light-Medium';
        else if (brightness < 190) category = 'Light';
        else category = 'Very Light';
        
        const fullCategory = `${category} ${undertone.charAt(0).toUpperCase() + undertone.slice(1)}`;
        const confidence = this.calculateConfidence(r, g, b, brightness);
        
        return {
            rgb: `rgb(${r}, ${g}, ${b})`,
            hex: hex,
            hsl: this.rgbToHsl(r, g, b),
            undertone: undertone,
            category: fullCategory,
            dominantColor: { r, g, b },
            brightness: Math.round(brightness),
            confidence: confidence
        };
    }

    determineUndertone(r, g, b) {
        const ratioRG = r / g;
        const ratioRB = r / b;
        const ratioGB = g / b;
        
        if (ratioRG > 1.1 && ratioRB > 1.2) return 'warm';
        if (ratioRB > 1.3 && ratioGB < 1.1) return 'cool';
        if (b > r && b > g) return 'cool';
        if (Math.abs(ratioRG - 1) < 0.1 && Math.abs(ratioRB - 1.1) < 0.2) return 'neutral';
        if (r > g && r > b) return 'warm';
        if (b > r && b > g) return 'cool';
        return 'neutral';
    }

    calculateConfidence(r, g, b, brightness) {
        let confidence = 85;
        const colorRange = Math.max(r, g, b) - Math.min(r, g, b);
        if (colorRange > 50) confidence += 10;
        if (colorRange < 20) confidence -= 15;
        if (brightness > 50 && brightness < 200) confidence += 5;
        return Math.max(75, Math.min(98, confidence));
    }

    rgbToHsl(r, g, b) {
        r /= 255; g /= 255; b /= 255;
        const max = Math.max(r, g, b), min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;
        
        if (max === min) {
            h = s = 0;
        } else {
            const d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }
        
        return `hsl(${Math.round(h * 360)}, ${Math.round(s * 100)}%, ${Math.round(l * 100)}%)`;
    }

    displayResults(analysis) {
        document.getElementById('results').style.display = 'block';
        
        const confidenceFill = document.getElementById('confidence-fill');
        const confidenceValue = document.getElementById('confidence-value');
        confidenceFill.style.width = `${analysis.confidence}%`;
        confidenceValue.textContent = `${analysis.confidence}%`;
        
        document.getElementById('dominant-color').style.backgroundColor = analysis.hex;
        
        const { r, g, b } = analysis.dominantColor;
        document.getElementById('lighter-shade').style.backgroundColor = 
            `rgb(${Math.min(255, r + 25)}, ${Math.min(255, g + 25)}, ${Math.min(255, b + 25)})`;
        document.getElementById('darker-shade').style.backgroundColor = 
            `rgb(${Math.max(0, r - 25)}, ${Math.max(0, g - 25)}, ${Math.max(0, b - 25)})`;
        
        document.getElementById('tone-category').textContent = analysis.category;
        document.getElementById('undertone').textContent = analysis.undertone;
        document.getElementById('hex-value').textContent = analysis.hex;
        document.getElementById('rgb-value').textContent = analysis.rgb;
        
        this.generateShadeRecommendations(analysis);
        this.generateSeasonalTips(analysis);
        this.generateColorHarmony(analysis);
        this.generateTrendInsights(analysis);
        
        this.skinAnalysis = analysis;
        this.showNotification('Skin analysis completed successfully!', 'success');
        
        document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
    }

    generateShadeRecommendations(analysis) {
        const container = document.getElementById('shade-recommendations');
        container.innerHTML = '';
        
        const { r, g, b } = analysis.dominantColor;
        const recommendations = [
            { 
                name: 'Perfect Match', 
                color: `rgb(${r}, ${g}, ${b})`,
                description: 'Your exact skin tone'
            },
            { 
                name: 'One Shade Lighter', 
                color: `rgb(${Math.min(255, r + 15)}, ${Math.min(255, g + 15)}, ${Math.min(255, b + 15)})`,
                description: 'For highlighting'
            },
            { 
                name: 'One Shade Darker', 
                color: `rgb(${Math.max(0, r - 15)}, ${Math.max(0, g - 15)}, ${Math.max(0, b - 15)})`,
                description: 'For contouring'
            },
            { 
                name: 'Warm Variation', 
                color: `rgb(${Math.min(255, r + 10)}, ${g}, ${Math.max(0, b - 8)})`,
                description: 'Enhanced warmth'
            }
        ];
        
        recommendations.forEach(rec => {
            const shadeDiv = document.createElement('div');
            shadeDiv.className = 'shade-item';
            shadeDiv.innerHTML = `
                <div class="shade-color" style="background-color: ${rec.color}"></div>
                <h5>${rec.name}</h5>
                <p>${rec.description}</p>
            `;
            container.appendChild(shadeDiv);
        });
    }

    generateSeasonalTips(analysis) {
        const container = document.getElementById('seasonal-tips');
        const season = this.getCurrentSeason();
        
        const tips = {
            spring: [
                { icon: '🌸', tip: 'Try lighter, fresher tones for spring' },
                { icon: '☀️', tip: 'Don\'t forget SPF as sun exposure increases' }
            ],
            summer: [
                { icon: '🌞', tip: 'Your skin may be slightly darker from sun exposure' },
                { icon: '💧', tip: 'Use hydrating products in hot weather' }
            ],
            fall: [
                { icon: '🍂', tip: 'Consider warmer tones as your tan fades' },
                { icon: '🧴', tip: 'Switch to more moisturizing formulas' }
            ],
            winter: [
                { icon: '❄️', tip: 'Your skin may be lighter in winter months' },
                { icon: '🧴', tip: 'Use richer, more hydrating products' }
            ]
        };
        
        container.innerHTML = tips[season].map(tip => `
            <div class="tip-card">
                <span style="font-size: 1.5rem; margin-right: 0.5rem;">${tip.icon}</span>
                ${tip.tip}
            </div>
        `).join('');
    }
    
    generateColorHarmony(analysis) {
        const container = document.getElementById('color-harmony');
        if (!container || !window.ColorAnalyzer) return;
        
        const complementaryColors = ColorAnalyzer.getComplementaryColors(analysis.hex);
        
        container.innerHTML = `
            <div class="harmony-section">
                <h5>Complementary Color</h5>
                <div class="color-swatch-small" style="background-color: ${complementaryColors.complementary}"></div>
                <span>${complementaryColors.complementary}</span>
            </div>
            <div class="harmony-section">
                <h5>Analogous Colors</h5>
                <div class="color-group">
                    ${complementaryColors.analogous.map(color => `
                        <div class="color-item-small">
                            <div class="color-swatch-small" style="background-color: ${color}"></div>
                            <span>${color}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="harmony-section">
                <h5>Triadic Colors</h5>
                <div class="color-group">
                    ${complementaryColors.triadic.map(color => `
                        <div class="color-item-small">
                            <div class="color-swatch-small" style="background-color: ${color}"></div>
                            <span>${color}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    generateTrendInsights(analysis) {
        const container = document.getElementById('trend-insights');
        if (!container || !window.TrendForecaster) return;
        
        const currentTrends = TrendForecaster.getCurrentTrends();
        const seasonalTrends = TrendForecaster.getSeasonalTrends(this.getCurrentSeason());
        
        container.innerHTML = `
            <div class="trend-section">
                <h5>Trending Colors</h5>
                <div class="trend-colors">
                    ${currentTrends.colors.map(color => `
                        <div class="trend-item">
                            <div class="trend-color" style="background: linear-gradient(45deg, ${color}, ${analysis.hex})"></div>
                            <span>${color}</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            <div class="trend-section">
                <h5>Seasonal Styles</h5>
                <div class="trend-styles">
                    ${seasonalTrends.styles.map(style => `
                        <div class="trend-tag">${style}</div>
                    `).join('')}
                </div>
            </div>
            <div class="trend-section">
                <h5>Recommended Fabrics</h5>
                <div class="trend-fabrics">
                    ${seasonalTrends.fabrics.map(fabric => `
                        <div class="trend-tag fabric-tag">${fabric}</div>
                    `).join('')}
                </div>
            </div>
        `;
    }

    getCurrentSeason() {
        const month = new Date().getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'fall';
        return 'winter';
    }

    saveAnalysis() {
        if (this.skinAnalysis) {
            this.userProfile.analyses.unshift({
                ...this.skinAnalysis,
                date: new Date().toISOString(),
                season: this.getCurrentSeason()
            });
            
            this.userProfile.analyses = this.userProfile.analyses.slice(0, 10);
            this.userProfile.points += 10;
            this.saveProfile();
            this.showNotification('Analysis saved to your profile!', 'success');
            this.updateProfileStats();
            this.checkAchievements();
        }
    }

    viewMatchingProducts() {
        this.switchSection('products');
        this.showNotification('Showing products that match your skin tone!', 'info');
    }

    // Product Discovery
    setupProductDiscovery() {
        const brandFilter = document.getElementById('brand-filter');
        const priceFilter = document.getElementById('price-filter');
        const categoryFilter = document.getElementById('category-filter');
        const searchInput = document.getElementById('product-search');
        const viewBtns = document.querySelectorAll('.view-btn');
        
        const ratingFilter = document.getElementById('rating-filter');
        
        [brandFilter, priceFilter, categoryFilter, ratingFilter].forEach(filter => {
            if (filter) filter.addEventListener('change', () => this.filterProducts());
        });
        
        if (searchInput) {
            searchInput.addEventListener('input', this.debounce(() => this.filterProducts(), 300));
        }
        
        viewBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                viewBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentView = btn.dataset.view;
                this.updateProductView();
            });
        });
        
        this.displayProducts();
    }

    generateSampleProducts() {
        this.products = [
            // INDIAN FOUNDATIONS
            {
                id: 1, name: 'Lakme Absolute Skin Natural Foundation', brand: 'Lakme', brandKey: 'lakme',
                price: 1200, image: 'https://images.unsplash.com/photo-1631214540242-6c3e0c4b8b8e?w=300&h=300&fit=crop',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660', '#a67c52'], rating: 4.3, reviews: 1847,
                coverage: 'medium', finish: 'natural', category: 'foundation',
                description: 'Natural finish foundation perfect for Indian skin tones',
                badges: ['Indian Brand', 'Affordable']
            },
            {
                id: 2, name: 'Maybelline Fit Me Foundation', brand: 'Maybelline India', brandKey: 'maybelline',
                price: 899, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=300&fit=crop',
                shades: ['#f5d5ae', '#e6b885', '#d4a574', '#c19660', '#a67c52'], rating: 4.4, reviews: 3423,
                coverage: 'medium', finish: 'matte', category: 'foundation',
                description: 'Affordable foundation with great shade range for Indian skin',
                badges: ['Budget-Friendly', 'Popular']
            },
            {
                id: 3, name: 'Colorbar Perfect Match Foundation', brand: 'Colorbar', brandKey: 'colorbar',
                price: 1650, image: 'https://images.unsplash.com/photo-1583334022089-42e3b0b7d4c4?w=300&h=300&fit=crop',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660'], rating: 4.2, reviews: 987,
                coverage: 'full', finish: 'matte', category: 'foundation',
                description: 'Indian brand foundation with perfect shade matching',
                badges: ['Made in India', 'Full Coverage']
            },
            {
                id: 4, name: 'Sugar Cosmetics Ace of Base Foundation', brand: 'Sugar Cosmetics', brandKey: 'sugar',
                price: 1499, image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=300&fit=crop',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660', '#a67c52', '#8b5a3c'], rating: 4.5, reviews: 2156,
                coverage: 'buildable', finish: 'natural', category: 'foundation',
                description: 'Trendy Indian brand with buildable coverage',
                badges: ['Cruelty-Free', 'Trendy']
            },
            {
                id: 5, name: 'Faces Canada Ultime Pro Foundation', brand: 'Faces Canada', brandKey: 'faces',
                price: 1350, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&h=300&fit=crop',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660'], rating: 4.1, reviews: 1234,
                coverage: 'medium', finish: 'radiant', category: 'foundation',
                description: 'Professional foundation with radiant finish',
                badges: ['Professional', 'Radiant']
            },
            {
                id: 2, name: 'Liquid Touch Weightless Foundation', brand: 'Rare Beauty', brandKey: 'rare',
                price: 2350, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
                shades: ['#f5d5ae', '#e6b885', '#d4a574', '#c19660', '#a67c52'], rating: 4.6, reviews: 1923,
                coverage: 'medium', finish: 'natural', category: 'foundation',
                description: 'Weightless, blendable foundation for natural coverage',
                badges: ['New']
            },
            {
                id: 3, name: 'Natural Radiant Longwear Foundation', brand: 'NARS', brandKey: 'nars',
                price: 3900, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660'], rating: 4.7, reviews: 3156,
                coverage: 'medium', finish: 'radiant', category: 'foundation',
                description: 'Radiant finish foundation with 12-hour wear',
                badges: ['Pro Choice']
            },
            {
                id: 4, name: 'Studio Fix Fluid Foundation', brand: 'MAC', brandKey: 'mac',
                price: 2700, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660', '#a67c52', '#8b5a3c'], rating: 4.5, reviews: 4521,
                coverage: 'full', finish: 'matte', category: 'foundation',
                description: 'Professional full coverage foundation',
                badges: ['Classic']
            },
            {
                id: 5, name: 'Airbrush Flawless Foundation', brand: 'Charlotte Tilbury', brandKey: 'charlotte',
                price: 3600, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660'], rating: 4.9, reviews: 1876,
                coverage: 'medium', finish: 'natural', category: 'foundation',
                description: 'Luxury foundation with airbrush finish',
                badges: ['Luxury', 'Award Winner']
            },
            {
                id: 6, name: 'Serum Foundation', brand: 'The Ordinary', brandKey: 'ordinary',
                price: 850, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660', '#a67c52'], rating: 4.3, reviews: 5432,
                coverage: 'light', finish: 'natural', category: 'foundation',
                description: 'Affordable serum foundation with skincare benefits',
                badges: ['Budget-Friendly', 'Skincare']
            },
            
            // INDIAN LIPSTICKS
            {
                id: 6, name: 'Lakme 9to5 Primer + Matte Lipstick', brand: 'Lakme', brandKey: 'lakme',
                price: 675, image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=300&h=300&fit=crop',
                shades: ['#dc2626', '#ec4899', '#7c3aed', '#059669'], rating: 4.4, reviews: 4521,
                coverage: 'full', finish: 'matte', category: 'lipstick',
                description: 'Primer-infused matte lipstick for all-day wear',
                badges: ['Primer Infused', 'Long-Wear']
            },
            {
                id: 7, name: 'Sugar Cosmetics Matte As Hell Lipstick', brand: 'Sugar Cosmetics', brandKey: 'sugar',
                price: 899, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&h=300&fit=crop',
                shades: ['#dc2626', '#ec4899', '#ff6b6b', '#8b3a62'], rating: 4.6, reviews: 3876,
                coverage: 'full', finish: 'matte', category: 'lipstick',
                description: 'Bold matte lipstick with intense pigmentation',
                badges: ['Cruelty-Free', 'Vegan']
            },
            {
                id: 8, name: 'Colorbar Velvet Matte Lipstick', brand: 'Colorbar', brandKey: 'colorbar',
                price: 750, image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=300&fit=crop',
                shades: ['#ec4899', '#7c3aed', '#dc2626', '#ff9ff3'], rating: 4.2, reviews: 2210,
                coverage: 'full', finish: 'matte', category: 'lipstick',
                description: 'Velvet matte finish with comfortable wear',
                badges: ['Comfortable', 'Indian Made']
            },
            {
                id: 9, name: 'Nykaa So Matte Lipstick', brand: 'Nykaa Cosmetics', brandKey: 'nykaa',
                price: 599, image: 'https://images.unsplash.com/photo-1588159343745-445ae0b16383?w=300&h=300&fit=crop',
                shades: ['#ff8787', '#ec4899', '#ffa8a8', '#ff6b6b'], rating: 4.3, reviews: 5876,
                coverage: 'full', finish: 'matte', category: 'lipstick',
                description: 'Affordable matte lipstick with rich pigmentation',
                badges: ['Budget-Friendly', 'High Pigment']
            },
            {
                id: 8, name: 'Rouge Dior Lipstick', brand: 'Dior', brandKey: 'dior',
                price: 3200, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&h=300&fit=crop',
                shades: ['#dc2626', '#ec4899', '#ff6b6b', '#8b3a62'], rating: 4.8, reviews: 1876,
                coverage: 'full', finish: 'satin', category: 'lipstick',
                description: 'Luxurious lipstick with couture colors',
                badges: ['Luxury', 'Iconic']
            },
            {
                id: 9, name: 'Liquid Lipstick', brand: 'Kylie Cosmetics', brandKey: 'kylie',
                price: 2100, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&h=300&fit=crop',
                shades: ['#ec4899', '#7c3aed', '#dc2626', '#ff9ff3'], rating: 4.4, reviews: 3210,
                coverage: 'full', finish: 'matte', category: 'lipstick',
                description: 'High-impact liquid lipstick with all-day wear',
                badges: ['Trending', 'Long-Wear']
            },
            {
                id: 10, name: 'Lip Tint', brand: 'Glossier', brandKey: 'glossier',
                price: 1600, image: 'https://images.unsplash.com/photo-1586495777744-4413f21062fa?w=300&h=300&fit=crop',
                shades: ['#ff8787', '#ec4899', '#ffa8a8', '#ff6b6b'], rating: 4.2, reviews: 2876,
                coverage: 'sheer', finish: 'glossy', category: 'lipstick',
                description: 'Natural-looking lip tint with buildable color',
                badges: ['Natural', 'Buildable']
            },
            
            // INDIAN BLUSH
            {
                id: 10, name: 'Lakme Absolute Face Stylist Blush', brand: 'Lakme', brandKey: 'lakme',
                price: 850, image: 'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=300&h=300&fit=crop',
                shades: ['#ffa8a8', '#ff8787', '#ff6b6b', '#fa5252'], rating: 4.3, reviews: 2876,
                coverage: 'buildable', finish: 'natural', category: 'blush',
                description: 'Silky powder blush for natural glow',
                badges: ['Silky Texture', 'Natural Glow']
            },
            {
                id: 11, name: 'Sugar Cosmetics Contour De Force Blush', brand: 'Sugar Cosmetics', brandKey: 'sugar',
                price: 1199, image: 'https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=300&h=300&fit=crop',
                shades: ['#ff8787', '#ec4899', '#ffa8a8', '#f783ac'], rating: 4.5, reviews: 1654,
                coverage: 'medium', finish: 'satin', category: 'blush',
                description: 'Highly pigmented blush with satin finish',
                badges: ['High Pigment', 'Blendable']
            },
            {
                id: 12, name: 'Cream Blush', brand: 'Rare Beauty', brandKey: 'rare',
                price: 1900, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=300&fit=crop',
                shades: ['#ff8787', '#ec4899', '#ffa8a8', '#f783ac'], rating: 4.5, reviews: 2134,
                coverage: 'medium', finish: 'natural', category: 'blush',
                description: 'Blendable cream blush for seamless application',
                badges: ['Cream Formula', 'Blendable']
            },
            {
                id: 13, name: 'Liquid Blush', brand: 'Glossier', brandKey: 'glossier',
                price: 1700, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=300&fit=crop',
                shades: ['#ff8787', '#ffa8a8', '#ec4899', '#ff6b6b'], rating: 4.3, reviews: 1654,
                coverage: 'sheer', finish: 'dewy', category: 'blush',
                description: 'Gel-like liquid blush for natural glow',
                badges: ['Dewy Finish', 'Natural']
            },
            
            // INDIAN EYESHADOW
            {
                id: 12, name: 'Colorbar USA Pro Eye Shadow Palette', brand: 'Colorbar', brandKey: 'colorbar',
                price: 1899, image: 'https://images.unsplash.com/photo-1609205807107-e8ec2120f9de?w=300&h=300&fit=crop',
                shades: ['#8b5a3c', '#a0522d', '#cd853f', '#daa520'], rating: 4.4, reviews: 1876,
                coverage: 'full', finish: 'shimmer', category: 'eyeshadow',
                description: '9-shade eyeshadow palette with Indian-inspired colors',
                badges: ['Indian Inspired', 'Versatile']
            },
            {
                id: 13, name: 'Sugar Cosmetics Blend The Rules Eyeshadow Palette', brand: 'Sugar Cosmetics', brandKey: 'sugar',
                price: 1799, image: 'https://images.unsplash.com/photo-1634449571010-02389ed0f9b0?w=300&h=300&fit=crop',
                shades: ['#d4a574', '#cd853f', '#8b5a3c', '#a0522d'], rating: 4.6, reviews: 2543,
                coverage: 'full', finish: 'matte', category: 'eyeshadow',
                description: 'Highly pigmented eyeshadow palette for bold looks',
                badges: ['High Pigment', 'Blendable']
            },
            {
                id: 15, name: 'Naked Palette', brand: 'Urban Decay', brandKey: 'urban',
                price: 4200, image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=300&fit=crop',
                shades: ['#d4a574', '#cd853f', '#8b5a3c', '#a0522d'], rating: 4.9, reviews: 8765,
                coverage: 'full', finish: 'matte', category: 'eyeshadow',
                description: 'Iconic neutral eyeshadow palette',
                badges: ['Iconic', 'Bestseller']
            },
            {
                id: 16, name: 'Single Eyeshadow', brand: 'MAC', brandKey: 'mac',
                price: 1200, image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?w=300&h=300&fit=crop',
                shades: ['#8b5a3c', '#cd853f', '#daa520', '#6c5ce7'], rating: 4.4, reviews: 2341,
                coverage: 'full', finish: 'various', category: 'eyeshadow',
                description: 'Professional single eyeshadow in various finishes',
                badges: ['Professional', 'Customizable']
            },
            
            // INDIAN CONCEALER
            {
                id: 14, name: 'Lakme Absolute White Intense Concealer', brand: 'Lakme', brandKey: 'lakme',
                price: 950, image: 'https://images.unsplash.com/photo-1631214540242-6c3e0c4b8b8e?w=300&h=300&fit=crop',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660'], rating: 4.2, reviews: 1987,
                coverage: 'full', finish: 'natural', category: 'concealer',
                description: 'High-coverage concealer perfect for Indian skin tones',
                badges: ['Indian Formulation', 'Full Coverage']
            },
            {
                id: 15, name: 'Nykaa SKINgenius Concealer', brand: 'Nykaa Cosmetics', brandKey: 'nykaa',
                price: 799, image: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&h=300&fit=crop',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660', '#a67c52'], rating: 4.4, reviews: 3456,
                coverage: 'medium', finish: 'natural', category: 'concealer',
                description: 'Lightweight concealer with skincare benefits',
                badges: ['Skincare Benefits', 'Lightweight']
            },
            {
                id: 18, name: 'Radiant Creamy Concealer', brand: 'NARS', brandKey: 'nars',
                price: 2400, image: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300&h=300&fit=crop',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660', '#a67c52'], rating: 4.6, reviews: 2876,
                coverage: 'medium', finish: 'radiant', category: 'concealer',
                description: 'Creamy concealer with radiant finish',
                badges: ['Radiant Finish', 'Blendable']
            },
            
            // HIGHLIGHTER
            {
                id: 19, name: 'Liquid Highlighter', brand: 'Glossier', brandKey: 'glossier',
                price: 1600, image: 'https://images.unsplash.com/photo-1583334022089-42e3b0b7d4c4?w=300&h=300&fit=crop',
                shades: ['#ffd700', '#e6b800', '#d4af37', '#b8860b'], rating: 4.4, reviews: 1234,
                coverage: 'light', finish: 'dewy', category: 'highlighter',
                description: 'Liquid highlighter for natural glow',
                badges: ['Clean Beauty', 'Natural Glow']
            },
            {
                id: 20, name: 'Powder Highlighter', brand: 'Fenty Beauty', brandKey: 'fenty',
                price: 2800, image: 'https://images.unsplash.com/photo-1583334022089-42e3b0b7d4c4?w=300&h=300&fit=crop',
                shades: ['#ffd700', '#d4af37', '#dda0dd', '#ffefd5'], rating: 4.7, reviews: 3456,
                coverage: 'buildable', finish: 'shimmer', category: 'highlighter',
                description: 'Buttery powder highlighter with intense glow',
                badges: ['Intense Glow', 'Inclusive']
            }
        ];
    }

    displayProducts(filteredProducts = this.products) {
        const grid = document.getElementById('product-grid');
        if (!grid) return;
        
        grid.innerHTML = '';
        grid.className = `product-grid ${this.currentView}-view`;
        
        filteredProducts.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 4rem; background: linear-gradient(135deg, #f8fafc, #e2e8f0);">💄</div>
                    ${product.badges.length > 0 ? `<div class="product-badge">${product.badges[0]}</div>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-brand">${product.brand}</div>
                    <h4>${product.name}</h4>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0.5rem 0;">${product.description}</p>
                    <div class="product-rating">
                        <span class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}</span>
                        <span>${product.rating} (${product.reviews})</span>
                    </div>
                    <p class="product-price">₹${product.price}</p>
                    <div class="product-shades">
                        ${product.shades.map(shade => `<div class="shade-dot" style="background-color: ${shade}" title="${shade}"></div>`).join('')}
                    </div>
                    <div class="product-actions">
                        <button class="btn-primary" onclick="app.addToWishlist(${product.id})">
                            <i class="fas fa-heart"></i>
                            Wishlist
                        </button>
                        <button class="btn-secondary" onclick="app.viewProduct(${product.id})">
                            <i class="fas fa-eye"></i>
                            Details
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(productCard);
        });
    }

    filterProducts() {
        const brandFilter = document.getElementById('brand-filter')?.value || '';
        const priceFilter = document.getElementById('price-filter')?.value || '';
        const categoryFilter = document.getElementById('category-filter')?.value || '';
        const ratingFilter = document.getElementById('rating-filter')?.value || '';
        const searchTerm = document.getElementById('product-search')?.value.toLowerCase() || '';
        
        let filtered = this.products;
        
        if (brandFilter) {
            filtered = filtered.filter(p => p.brandKey === brandFilter);
        }
        
        if (priceFilter) {
            if (priceFilter === '0-1000') {
                filtered = filtered.filter(p => p.price <= 1000);
            } else if (priceFilter === '1000-2000') {
                filtered = filtered.filter(p => p.price > 1000 && p.price <= 2000);
            } else if (priceFilter === '2000-3000') {
                filtered = filtered.filter(p => p.price > 2000 && p.price <= 3000);
            } else if (priceFilter === '3000-5000') {
                filtered = filtered.filter(p => p.price > 3000 && p.price <= 5000);
            } else if (priceFilter === '5000+') {
                filtered = filtered.filter(p => p.price > 5000);
            }
        }
        
        if (categoryFilter) {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }
        
        if (ratingFilter) {
            const minRating = parseFloat(ratingFilter.replace('+', ''));
            filtered = filtered.filter(p => p.rating >= minRating);
        }
        
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.brand.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm) ||
                p.category.toLowerCase().includes(searchTerm)
            );
        }
        
        this.displayProducts(filtered);
        this.trackEvent('filter', 'products');
    }

    updateProductView() {
        this.displayProducts();
        this.trackEvent('view_change', this.currentView);
    }

    addToWishlist(productId) {
        if (!this.userProfile.wishlist.includes(productId)) {
            this.userProfile.wishlist.push(productId);
            this.userProfile.points += 5;
            this.saveProfile();
            this.showNotification('Added to wishlist!', 'success');
            this.updateProfileStats();
            this.checkAchievements();
        } else {
            this.showNotification('Already in wishlist!', 'info');
        }
        this.trackEvent('wishlist', 'add');
    }

    viewProduct(productId) {
        const product = this.products.find(p => p.id === productId);
        if (product) {
            this.showNotification(`Viewing ${product.name}`, 'info');
            this.trackEvent('product_view', product.name);
        }
    }

    // Clothing Recommendations
    setupClothing() {
        const styleBtns = document.querySelectorAll('.style-btn');
        
        styleBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                styleBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentStyle = btn.dataset.style;
                this.updateClothingDisplay();
            });
        });
    }

    generateClothingItems() {
        this.clothingItems = [
            // CASUAL TOPS
            {
                id: 1, name: 'Cotton Crew Neck T-Shirt', brand: 'Uniqlo', price: 1200,
                category: 'tops', style: 'casual', colors: ['#ffffff', '#000000', '#4a90e2', '#f5a623'],
                image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['cool', 'neutral', 'warm'],
                description: 'Classic cotton tee perfect for everyday wear', rating: 4.5, reviews: 1234
            },
            {
                id: 2, name: 'Oversized Hoodie', brand: 'H&M', price: 2500,
                category: 'tops', style: 'casual', colors: ['#6b7280', '#1f2937', '#fbbf24', '#ec4899'],
                image: 'https://images.unsplash.com/photo-1556821840-3a9c6dcb0e78?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['cool', 'neutral', 'warm'],
                description: 'Comfortable oversized hoodie for relaxed days', rating: 4.3, reviews: 892
            },
            {
                id: 3, name: 'Striped Long Sleeve Tee', brand: 'Gap', price: 1800,
                category: 'tops', style: 'casual', colors: ['#ffffff', '#1e3a8a', '#dc2626'],
                image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium'], undertones: ['cool', 'neutral'],
                description: 'Classic striped long sleeve for timeless style', rating: 4.4, reviews: 567
            },
            {
                id: 4, name: 'Denim Jacket', brand: 'Levi\'s', price: 4500,
                category: 'tops', style: 'casual', colors: ['#1e3a8a', '#374151'],
                image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['cool', 'neutral', 'warm'],
                description: 'Timeless denim jacket for layering', rating: 4.7, reviews: 2341
            },
            {
                id: 5, name: 'Graphic Print Tee', brand: 'Zara', price: 1500,
                category: 'tops', style: 'casual', colors: ['#000000', '#ffffff', '#7c3aed'],
                image: 'https://images.unsplash.com/photo-1583743814966-8936f37f4678?w=300&h=300&fit=crop',
                suitableFor: ['medium', 'deep'], undertones: ['cool', 'warm'],
                description: 'Trendy graphic tee with artistic prints', rating: 4.2, reviews: 678
            },
            
            // CASUAL BOTTOMS
            {
                id: 6, name: 'High-Waisted Denim Jeans', brand: 'Levi\'s', price: 7200,
                category: 'bottoms', style: 'casual', colors: ['#1e3a8a', '#374151', '#000000'],
                image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['cool', 'neutral', 'warm'],
                description: 'Versatile denim jeans that go with everything', rating: 4.6, reviews: 3456
            },
            {
                id: 7, name: 'Jogger Pants', brand: 'Nike', price: 3200,
                category: 'bottoms', style: 'casual', colors: ['#6b7280', '#000000', '#1e3a8a'],
                image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['cool', 'neutral', 'warm'],
                description: 'Comfortable joggers for active lifestyle', rating: 4.4, reviews: 1876
            },
            {
                id: 8, name: 'Cargo Pants', brand: 'Urban Outfitters', price: 4800,
                category: 'bottoms', style: 'casual', colors: ['#65a30d', '#92400e', '#000000'],
                image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=300&h=300&fit=crop',
                suitableFor: ['medium', 'deep'], undertones: ['warm', 'neutral'],
                description: 'Utility cargo pants with multiple pockets', rating: 4.1, reviews: 543
            },
            {
                id: 9, name: 'Chino Shorts', brand: 'J.Crew', price: 2800,
                category: 'bottoms', style: 'casual', colors: ['#fbbf24', '#65a30d', '#1e3a8a'],
                image: 'https://images.unsplash.com/photo-1506629905607-45c9e8e46a45?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium'], undertones: ['warm', 'neutral'],
                description: 'Classic chino shorts for summer comfort', rating: 4.3, reviews: 789
            },
            
            // FORMAL WEAR
            {
                id: 10, name: 'Silk Blouse', brand: 'Theory', price: 15800,
                category: 'tops', style: 'formal', colors: ['#ffffff', '#1f2937', '#7c3aed'],
                image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['cool', 'neutral'],
                description: 'Elegant silk blouse for professional settings', rating: 4.8, reviews: 1234
            },
            {
                id: 11, name: 'Tailored Blazer', brand: 'Hugo Boss', price: 24200,
                category: 'tops', style: 'formal', colors: ['#1f2937', '#374151', '#7c3aed'],
                image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&h=300&fit=crop',
                suitableFor: ['medium', 'deep'], undertones: ['cool', 'neutral'],
                description: 'Sharp tailored blazer for business occasions', rating: 4.9, reviews: 876
            },
            {
                id: 12, name: 'Button-Down Shirt', brand: 'Brooks Brothers', price: 8900,
                category: 'tops', style: 'formal', colors: ['#ffffff', '#60a5fa', '#f1f5f9'],
                image: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['cool', 'neutral', 'warm'],
                description: 'Classic button-down for professional look', rating: 4.7, reviews: 2134
            },
            {
                id: 13, name: 'Pencil Skirt', brand: 'Ann Taylor', price: 7200,
                category: 'bottoms', style: 'formal', colors: ['#000000', '#374151', '#7c3aed'],
                image: 'https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['cool', 'neutral'],
                description: 'Classic pencil skirt for professional look', rating: 4.5, reviews: 1567
            },
            {
                id: 14, name: 'Dress Pants', brand: 'Banana Republic', price: 9800,
                category: 'bottoms', style: 'formal', colors: ['#1f2937', '#374151', '#000000'],
                image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['cool', 'neutral', 'warm'],
                description: 'Professional dress pants for office wear', rating: 4.6, reviews: 987
            },
            
            // PARTY WEAR
            {
                id: 15, name: 'Sequin Cocktail Dress', brand: 'BCBG', price: 15300,
                category: 'dresses', style: 'party', colors: ['#000000', '#dc2626', '#7c3aed'],
                image: 'https://images.unsplash.com/photo-1566479179817-c0ae8e5b4b5e?w=300&h=300&fit=crop',
                suitableFor: ['medium', 'deep'], undertones: ['cool', 'warm'],
                description: 'Glamorous sequin dress for special occasions', rating: 4.7, reviews: 654
            },
            {
                id: 16, name: 'Satin Camisole', brand: 'Reformation', price: 6300,
                category: 'tops', style: 'party', colors: ['#ec4899', '#7c3aed', '#000000'],
                image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium'], undertones: ['cool', 'warm'],
                description: 'Luxurious satin top for evening events', rating: 4.4, reviews: 432
            },
            {
                id: 17, name: 'Velvet Blazer', brand: 'Zara', price: 8900,
                category: 'tops', style: 'party', colors: ['#7c3aed', '#dc2626', '#000000'],
                image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
                suitableFor: ['medium', 'deep'], undertones: ['cool', 'warm'],
                description: 'Elegant velvet blazer for evening sophistication', rating: 4.6, reviews: 789
            },
            {
                id: 18, name: 'Metallic Mini Skirt', brand: 'Forever 21', price: 3200,
                category: 'bottoms', style: 'party', colors: ['#ffd700', '#c0c0c0', '#ec4899'],
                image: 'https://images.unsplash.com/photo-1583496661160-fb5886a13d77?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium'], undertones: ['warm', 'cool'],
                description: 'Shimmery metallic skirt for night out', rating: 4.2, reviews: 345
            },
            
            // INDIAN TRADITIONAL WEAR
            {
                id: 19, name: 'Anarkali Kurta Set', brand: 'Fabindia', price: 4500,
                category: 'dresses', style: 'casual', colors: ['#fbbf24', '#ec4899', '#65a30d'],
                image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['warm', 'neutral'],
                description: 'Traditional Indian kurta with modern styling', rating: 4.5, reviews: 1876
            },
            {
                id: 20, name: 'Silk Saree', brand: 'Sabyasachi', price: 25000,
                category: 'dresses', style: 'formal', colors: ['#dc2626', '#7c3aed', '#059669'],
                image: 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?w=300&h=300&fit=crop',
                suitableFor: ['medium', 'deep'], undertones: ['cool', 'warm'],
                description: 'Elegant silk saree for special occasions', rating: 4.9, reviews: 567
            },
            {
                id: 21, name: 'Palazzo Pants', brand: 'W for Woman', price: 2800,
                category: 'bottoms', style: 'casual', colors: ['#fbbf24', '#ec4899', '#8b5cf6'],
                image: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['warm', 'neutral'],
                description: 'Comfortable palazzo pants for daily wear', rating: 4.3, reviews: 1234
            },
            {
                id: 22, name: 'Lehenga Choli', brand: 'Manish Malhotra', price: 45000,
                category: 'dresses', style: 'party', colors: ['#dc2626', '#fbbf24', '#7c3aed'],
                image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['cool', 'warm', 'neutral'],
                description: 'Designer lehenga for weddings and festivals', rating: 4.8, reviews: 234
            },
            {
                id: 23, name: 'Sharara Set', brand: 'Biba', price: 6800,
                category: 'dresses', style: 'party', colors: ['#ec4899', '#fbbf24', '#7c3aed'],
                image: 'https://images.unsplash.com/photo-1583391733956-6c78276477e2?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['warm', 'cool'],
                description: 'Trendy sharara set for festive occasions', rating: 4.4, reviews: 876
            },
            
            // ACCESSORIES & OUTERWEAR
            {
                id: 24, name: 'Leather Jacket', brand: 'All Saints', price: 18900,
                category: 'tops', style: 'casual', colors: ['#000000', '#92400e'],
                image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
                suitableFor: ['medium', 'deep'], undertones: ['cool', 'warm'],
                description: 'Edgy leather jacket for rock-chic style', rating: 4.7, reviews: 543
            },
            {
                id: 25, name: 'Trench Coat', brand: 'Burberry', price: 35000,
                category: 'tops', style: 'formal', colors: ['#92400e', '#1f2937'],
                image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['warm', 'neutral'],
                description: 'Classic trench coat for sophisticated elegance', rating: 4.9, reviews: 321
            },
            {
                id: 26, name: 'Cardigan Sweater', brand: 'Uniqlo', price: 3200,
                category: 'tops', style: 'casual', colors: ['#6b7280', '#fbbf24', '#ec4899'],
                image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium'], undertones: ['cool', 'warm'],
                description: 'Cozy cardigan for layering comfort', rating: 4.3, reviews: 1098
            },
            {
                id: 27, name: 'Maxi Dress', brand: 'Free People', price: 8900,
                category: 'dresses', style: 'casual', colors: ['#fbbf24', '#65a30d', '#ec4899'],
                image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium'], undertones: ['warm', 'neutral'],
                description: 'Flowy maxi dress for bohemian elegance', rating: 4.5, reviews: 765
            },
            {
                id: 28, name: 'Wrap Dress', brand: 'Diane von Furstenberg', price: 12800,
                category: 'dresses', style: 'formal', colors: ['#7c3aed', '#dc2626', '#000000'],
                image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium', 'deep'], undertones: ['cool', 'warm'],
                description: 'Flattering wrap dress for versatile styling', rating: 4.6, reviews: 432
            },
            {
                id: 29, name: 'Jumpsuit', brand: 'Zara', price: 5600,
                category: 'dresses', style: 'party', colors: ['#000000', '#1f2937', '#7c3aed'],
                image: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=300&h=300&fit=crop',
                suitableFor: ['medium', 'deep'], undertones: ['cool', 'neutral'],
                description: 'Chic jumpsuit for effortless sophistication', rating: 4.4, reviews: 654
            },
            {
                id: 30, name: 'Kimono Robe', brand: 'Anthropologie', price: 7800,
                category: 'tops', style: 'casual', colors: ['#fbbf24', '#ec4899', '#65a30d'],
                image: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=300&h=300&fit=crop',
                suitableFor: ['light', 'medium'], undertones: ['warm', 'neutral'],
                description: 'Flowing kimono for relaxed elegance', rating: 4.2, reviews: 345
            }
        ];
    }

    updateClothingRecommendations(analysis) {
        const clothingAnalysis = document.getElementById('clothing-analysis');
        const clothingGrid = document.getElementById('clothing-grid');
        
        clothingAnalysis.style.display = 'block';
        
        document.getElementById('clothing-tone-swatch').style.backgroundColor = analysis.hex;
        document.getElementById('clothing-tone-category').textContent = analysis.category;
        document.getElementById('clothing-tone-undertone').textContent = `${analysis.undertone} undertone`;
        
        this.generateColorRecommendations(analysis);
        this.updateClothingDisplay();
    }

    generateColorRecommendations(analysis) {
        const bestColors = this.getBestColors(analysis.undertone);
        const avoidColors = this.getColorsToAvoid(analysis.undertone);
        
        this.displayColorPalette('best-colors', bestColors);
        this.displayColorPalette('avoid-colors', avoidColors);
    }

    getBestColors(undertone) {
        const colorMap = {
            cool: [
                { name: 'Navy Blue', hex: '#1e3a8a' },
                { name: 'Emerald', hex: '#059669' },
                { name: 'Purple', hex: '#7c3aed' },
                { name: 'Pink', hex: '#ec4899' },
                { name: 'Silver Gray', hex: '#6b7280' },
                { name: 'Pure White', hex: '#ffffff' }
            ],
            warm: [
                { name: 'Coral', hex: '#f97316' },
                { name: 'Golden Yellow', hex: '#fbbf24' },
                { name: 'Olive Green', hex: '#65a30d' },
                { name: 'Rust Orange', hex: '#ea580c' },
                { name: 'Cream', hex: '#fef3c7' },
                { name: 'Chocolate', hex: '#92400e' }
            ],
            neutral: [
                { name: 'Soft Pink', hex: '#f9a8d4' },
                { name: 'Sage Green', hex: '#84cc16' },
                { name: 'Dusty Blue', hex: '#60a5fa' },
                { name: 'Lavender', hex: '#a78bfa' },
                { name: 'Beige', hex: '#d6d3d1' },
                { name: 'Charcoal', hex: '#374151' }
            ]
        };
        
        return colorMap[undertone] || colorMap.neutral;
    }

    getColorsToAvoid(undertone) {
        const avoidMap = {
            cool: [
                { name: 'Orange', hex: '#ea580c' },
                { name: 'Yellow', hex: '#fbbf24' },
                { name: 'Brown', hex: '#92400e' },
                { name: 'Gold', hex: '#d97706' }
            ],
            warm: [
                { name: 'Icy Blue', hex: '#0ea5e9' },
                { name: 'Pure White', hex: '#ffffff' },
                { name: 'Black', hex: '#000000' },
                { name: 'Silver', hex: '#6b7280' }
            ],
            neutral: [
                { name: 'Neon Green', hex: '#22c55e' },
                { name: 'Hot Pink', hex: '#ec4899' },
                { name: 'Bright Orange', hex: '#f97316' }
            ]
        };
        
        return avoidMap[undertone] || [];
    }

    displayColorPalette(containerId, colors) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        container.innerHTML = colors.map(color => `
            <div class="color-item">
                <div class="color-swatch-small" style="background-color: ${color.hex}"></div>
                <div class="color-name">${color.name}</div>
            </div>
        `).join('');
    }

    updateClothingDisplay() {
        if (!this.skinAnalysis) return;
        
        const filteredItems = this.clothingItems.filter(item => {
            const styleMatch = this.currentStyle === 'all' || item.style === this.currentStyle || 
                              (this.currentStyle === 'traditional' && ['casual', 'formal', 'party'].includes(item.style) && 
                               ['Fabindia', 'Sabyasachi', 'W for Woman', 'Manish Malhotra', 'Biba'].includes(item.brand));
            const skinMatch = this.isItemSuitableForSkin(item, this.skinAnalysis);
            return styleMatch && skinMatch;
        });
        
        this.displayClothingItems(filteredItems);
    }

    isItemSuitableForSkin(item, analysis) {
        const skinCategory = analysis.category.toLowerCase();
        const undertone = analysis.undertone;
        
        const categoryMatch = item.suitableFor.some(cat => skinCategory.includes(cat));
        const undertoneMatch = item.undertones.includes(undertone);
        
        return categoryMatch && undertoneMatch;
    }

    displayClothingItems(items) {
        const grid = document.getElementById('clothing-grid');
        if (!grid) return;
        
        if (items.length === 0) {
            grid.innerHTML = `
                <div class="no-analysis">
                    <i class="fas fa-search" style="font-size: 3rem; color: var(--text-muted); margin-bottom: 1rem;"></i>
                    <h3>No Items Found</h3>
                    <p>No ${this.currentStyle} items match your skin tone. Try a different style!</p>
                </div>
            `;
            return;
        }
        
        grid.innerHTML = items.map(item => `
            <div class="clothing-item">
                <div class="clothing-image">
                    <img src="${item.image}" alt="${item.name}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                    <div style="display: none; width: 100%; height: 100%; align-items: center; justify-content: center; font-size: 4rem; background: var(--secondary-gradient);">👕</div>
                    <div class="clothing-badge">Perfect Match</div>
                </div>
                <div class="clothing-info">
                    <div class="clothing-brand">${item.brand}</div>
                    <h4>${item.name}</h4>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0.5rem 0;">${item.description}</p>
                    <div class="clothing-price">₹${item.price}</div>
                    <div class="clothing-colors">
                        ${item.colors.map(color => `<div class="clothing-color-dot" style="background-color: ${color}" title="${color}"></div>`).join('')}
                    </div>
                    <div class="product-actions" style="margin-top: 1rem;">
                        <button class="btn-primary" onclick="app.addClothingToWishlist(${item.id})">
                            <i class="fas fa-heart"></i>
                            Add to Wishlist
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    addClothingToWishlist(itemId) {
        if (!this.userProfile.clothingWishlist) this.userProfile.clothingWishlist = [];
        
        if (!this.userProfile.clothingWishlist.includes(itemId)) {
            this.userProfile.clothingWishlist.push(itemId);
            this.userProfile.points += 3;
            this.saveProfile();
            this.showNotification('Added to clothing wishlist!', 'success');
        } else {
            this.showNotification('Already in wishlist!', 'info');
        }
    }

    // Profile Management
    setupProfile() {
        const exportBtn = document.getElementById('export-history');
        const clearBtn = document.getElementById('clear-wishlist');
        
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportHistory());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearWishlist());
        
        this.updateProfileStats();
        this.displayAchievements();
    }

    updateProfileStats() {
        const analysesCount = document.getElementById('analyses-count');
        const wishlistCount = document.getElementById('wishlist-count');
        const pointsCount = document.getElementById('points-count');
        
        if (analysesCount) analysesCount.textContent = this.userProfile.analyses.length;
        if (wishlistCount) wishlistCount.textContent = this.userProfile.wishlist.length + (this.userProfile.clothingWishlist?.length || 0);
        if (pointsCount) pointsCount.textContent = this.userProfile.points;
        
        this.displaySkinHistory();
        this.displaySavedProducts();
    }

    displaySkinHistory() {
        const container = document.getElementById('skin-history');
        if (!container || !this.userProfile.analyses.length) {
            if (container) container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No analysis history yet. Complete your first skin analysis!</p>';
            return;
        }
        
        container.innerHTML = this.userProfile.analyses.map(analysis => `
            <div class="history-item" style="margin-bottom: 1rem; padding: 1.5rem; background: var(--input-bg); border-radius: 12px; border-left: 4px solid var(--accent-purple);">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 50px; height: 50px; background: ${analysis.hex}; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"></div>
                    <div style="flex: 1;">
                        <h5 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">${analysis.category}</h5>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">
                            <i class="fas fa-palette"></i> ${analysis.undertone} undertone • 
                            <i class="fas fa-calendar"></i> ${new Date(analysis.date).toLocaleDateString()} • 
                            <i class="fas fa-leaf"></i> ${analysis.season}
                        </p>
                        <div style="margin-top: 0.5rem;">
                            <span style="background: white; padding: 0.2rem 0.5rem; border-radius: 8px; font-size: 0.8rem; margin-right: 0.5rem;">${analysis.hex}</span>
                            <span style="background: white; padding: 0.2rem 0.5rem; border-radius: 8px; font-size: 0.8rem;">${analysis.confidence}% confidence</span>
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displaySavedProducts() {
        const container = document.getElementById('saved-items');
        if (!container) return;
        
        const savedProducts = this.products.filter(p => this.userProfile.wishlist.includes(p.id));
        const savedClothing = this.clothingItems.filter(c => this.userProfile.clothingWishlist?.includes(c.id));
        const allSaved = [...savedProducts, ...savedClothing];
        
        if (allSaved.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: var(--text-muted); padding: 2rem;">No saved items yet. Start exploring our catalogs!</p>';
            return;
        }
        
        container.innerHTML = allSaved.map(item => `
            <div class="saved-item" style="margin-bottom: 1rem; padding: 1.5rem; background: var(--input-bg); border-radius: 12px; border-left: 4px solid var(--accent-cyan);">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="font-size: 2.5rem;">${item.category ? '💄' : '👕'}</div>
                    <div style="flex: 1;">
                        <h5 style="margin: 0 0 0.5rem 0;">${item.name}</h5>
                        <p style="margin: 0; color: var(--text-secondary); font-size: 0.9rem;">${item.brand}</p>
                        <p style="margin: 0.5rem 0; font-weight: 600; color: var(--accent-purple);">₹${item.price}</p>
                    </div>
                    <button onclick="app.removeFromWishlist(${item.id}, '${item.category ? 'product' : 'clothing'}')" style="background: none; border: none; color: var(--text-muted); cursor: pointer; font-size: 1.2rem;" title="Remove from wishlist">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>
        `).join('');
    }

    displayAchievements() {
        const container = document.getElementById('achievements-grid');
        if (!container) return;
        
        const achievements = [
            { id: 'first_analysis', name: 'First Analysis', icon: '🎯', description: 'Complete your first skin analysis', unlocked: this.userProfile.analyses.length > 0 },
            { id: 'analysis_expert', name: 'Analysis Expert', icon: '🔬', description: 'Complete 5 skin analyses', unlocked: this.userProfile.analyses.length >= 5 },
            { id: 'product_explorer', name: 'Product Explorer', icon: '🛍️', description: 'Add 3 products to wishlist', unlocked: this.userProfile.wishlist.length >= 3 },
            { id: 'beauty_enthusiast', name: 'Beauty Enthusiast', icon: '💄', description: 'Earn 50 points', unlocked: this.userProfile.points >= 50 },
            { id: 'seasonal_tracker', name: 'Seasonal Tracker', icon: '🍂', description: 'Analyze skin in different seasons', unlocked: this.hasSeasonalAnalyses() },
            { id: 'style_maven', name: 'Style Maven', icon: '👗', description: 'Save 5 clothing items', unlocked: (this.userProfile.clothingWishlist?.length || 0) >= 5 }
        ];
        
        container.innerHTML = achievements.map(achievement => `
            <div class="achievement-item ${achievement.unlocked ? 'unlocked' : ''}">
                <div class="achievement-icon">${achievement.icon}</div>
                <h5>${achievement.name}</h5>
                <p>${achievement.description}</p>
                ${achievement.unlocked ? '<i class="fas fa-check" style="color: var(--success-green);"></i>' : ''}
            </div>
        `).join('');
    }

    hasSeasonalAnalyses() {
        const seasons = [...new Set(this.userProfile.analyses.map(a => a.season))];
        return seasons.length >= 2;
    }

    checkAchievements() {
        const newAchievements = [];
        
        if (this.userProfile.analyses.length === 1 && !this.userProfile.achievements.includes('first_analysis')) {
            newAchievements.push('first_analysis');
        }
        
        if (this.userProfile.analyses.length === 5 && !this.userProfile.achievements.includes('analysis_expert')) {
            newAchievements.push('analysis_expert');
        }
        
        if (this.userProfile.wishlist.length === 3 && !this.userProfile.achievements.includes('product_explorer')) {
            newAchievements.push('product_explorer');
        }
        
        if (this.userProfile.points >= 50 && !this.userProfile.achievements.includes('beauty_enthusiast')) {
            newAchievements.push('beauty_enthusiast');
        }
        
        newAchievements.forEach(achievement => {
            this.userProfile.achievements.push(achievement);
            this.showNotification(`🎉 Achievement unlocked: ${achievement.replace('_', ' ')}!`, 'success');
        });
        
        if (newAchievements.length > 0) {
            this.displayAchievements();
            this.saveProfile();
        }
    }

    removeFromWishlist(itemId, type) {
        if (type === 'product') {
            this.userProfile.wishlist = this.userProfile.wishlist.filter(id => id !== itemId);
        } else {
            this.userProfile.clothingWishlist = this.userProfile.clothingWishlist.filter(id => id !== itemId);
        }
        this.saveProfile();
        this.updateProfileStats();
        this.showNotification('Removed from wishlist', 'info');
    }

    exportHistory() {
        const data = JSON.stringify(this.userProfile.analyses, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'beauty-analysis-history.json';
        a.click();
        URL.revokeObjectURL(url);
        this.showNotification('History exported successfully!', 'success');
    }

    clearWishlist() {
        if (confirm('Are you sure you want to clear your entire wishlist?')) {
            this.userProfile.wishlist = [];
            this.userProfile.clothingWishlist = [];
            this.saveProfile();
            this.updateProfileStats();
            this.showNotification('Wishlist cleared', 'info');
        }
    }

    // Utility Functions
    saveProfile() {
        localStorage.setItem('styleProfile', JSON.stringify(this.userProfile));
    }

    loadUserProfile() {
        this.updateProfileStats();
        this.displayAchievements();
    }

    showWelcomeMessage() {
        if (!localStorage.getItem('welcomeShown')) {
            setTimeout(() => {
                this.showNotification('Welcome to StyleMatch AI! Start with a skin tone analysis.', 'info');
                localStorage.setItem('welcomeShown', 'true');
            }, 2000);
        }
    }

    // UI Helper Functions
    showLoading(message = 'Loading...') {
        const overlay = document.getElementById('loading-overlay');
        const text = overlay.querySelector('p');
        text.textContent = message;
        overlay.style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loading-overlay').style.display = 'none';
    }

    showNotification(message, type = 'info') {
        const container = document.getElementById('notifications');
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div style="display: flex; align-items: center; gap: 0.5rem;">
                <i class="fas fa-${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
        `;
        
        container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 4000);
    }

    getNotificationIcon(type) {
        const icons = {
            success: 'check-circle',
            error: 'exclamation-circle',
            warning: 'exclamation-triangle',
            info: 'info-circle'
        };
        return icons[type] || 'info-circle';
    }

    // Analytics and Tracking
    trackEvent(category, action, label = '') {
        console.log(`Event: ${category} - ${action} - ${label}`);
    }

    trackUsage() {
        setInterval(() => {
            const sessionDuration = Date.now() - this.sessionStartTime;
            localStorage.setItem('sessionDuration', sessionDuration);
        }, 30000);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StyleMatchApp();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}