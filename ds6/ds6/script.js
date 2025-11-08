// Enhanced BeautyMatch AI Application
class BeautyMatchApp {
    constructor() {
        this.currentSection = 'home';
        this.skinAnalysis = null;
        this.userProfile = JSON.parse(localStorage.getItem('beautyProfile')) || {
            analyses: [],
            wishlist: [],
            preferences: {},
            achievements: [],
            points: 0
        };
        this.products = [];
        this.currentView = 'grid';
        this.sessionStartTime = Date.now();
        this.init();
    }

    init() {
        this.setupNavigation();
        this.setupCamera();
        this.setupARTryOn();
        this.setupProductDiscovery();
        this.setupChat();
        this.setupProfile();
        this.setupAnalytics();
        this.loadUserProfile();
        this.generateSampleProducts();
        this.showWelcomeMessage();
        this.trackUsage();
    }

    // Enhanced Navigation
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
        if (sectionName === 'analytics') {
            this.updateAnalytics();
        }
    }

    // Enhanced Camera and Skin Analysis
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
            if (e.target.id === 'share-results') this.shareResults();
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
            video.srcObject = stream;
            
            document.getElementById('start-camera').style.display = 'none';
            document.getElementById('capture').style.display = 'inline-flex';
            
            this.updateCameraStatus('Camera active - Position your face in the guide');
            this.hideLoading();
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
        
        // Simulate processing delay for better UX
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
        
        // Generate demo skin tone data
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
        
        // Enhanced face detection area
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const sampleRadius = Math.min(canvas.width, canvas.height) / 8;
        
        let totalR = 0, totalG = 0, totalB = 0, sampleCount = 0;
        const skinPixels = [];
        
        // Sample multiple regions for better accuracy
        const regions = [
            { x: centerX, y: centerY - sampleRadius/2 }, // Forehead
            { x: centerX - sampleRadius/3, y: centerY }, // Left cheek
            { x: centerX + sampleRadius/3, y: centerY }, // Right cheek
            { x: centerX, y: centerY + sampleRadius/3 }  // Chin
        ];
        
        regions.forEach(region => {
            for (let y = region.y - sampleRadius/4; y < region.y + sampleRadius/4; y += 3) {
                for (let x = region.x - sampleRadius/4; x < region.x + sampleRadius/4; x += 3) {
                    if (x >= 0 && x < canvas.width && y >= 0 && y < canvas.height) {
                        const index = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
                        const r = data[index];
                        const g = data[index + 1];
                        const b = data[index + 2];
                        
                        // Filter out non-skin pixels
                        if (this.isSkinPixel(r, g, b)) {
                            totalR += r;
                            totalG += g;
                            totalB += b;
                            sampleCount++;
                            skinPixels.push([r, g, b]);
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
        // Enhanced skin detection algorithm
        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        
        // Basic skin color range
        if (r < 60 || g < 40 || b < 20) return false;
        if (r > 250 || g > 250 || b > 250) return false;
        
        // Skin tone characteristics
        if (r > g && g > b && (r - g) >= 15 && (g - b) >= 15) return true;
        if (max - min < 15) return false;
        
        return r > 95 && g > 40 && b > 20 && 
               r > g && r > b && 
               r - Math.min(g, b) > 15;
    }

    categorizeSkinTone(r, g, b) {
        const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
        
        // Enhanced undertone detection
        const undertone = this.determineUndertone(r, g, b);
        
        // Enhanced brightness calculation
        const brightness = (0.299 * r + 0.587 * g + 0.114 * b);
        
        let category = '';
        if (brightness < 70) category = 'Deep';
        else if (brightness < 100) category = 'Medium-Deep';
        else if (brightness < 130) category = 'Medium';
        else if (brightness < 160) category = 'Light-Medium';
        else if (brightness < 190) category = 'Light';
        else category = 'Very Light';
        
        const fullCategory = `${category} ${undertone.charAt(0).toUpperCase() + undertone.slice(1)}`;
        
        // Calculate confidence score
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
        // Advanced undertone detection
        const ratioRG = r / g;
        const ratioRB = r / b;
        const ratioGB = g / b;
        
        // Yellow undertone indicators
        if (ratioRG > 1.1 && ratioRB > 1.2) return 'warm';
        
        // Pink/red undertone indicators  
        if (ratioRB > 1.3 && ratioGB < 1.1) return 'cool';
        
        // Blue undertone indicators
        if (b > r && b > g) return 'cool';
        
        // Neutral indicators
        if (Math.abs(ratioRG - 1) < 0.1 && Math.abs(ratioRB - 1.1) < 0.2) return 'neutral';
        
        // Fallback to simple comparison
        if (r > g && r > b) return 'warm';
        if (b > r && b > g) return 'cool';
        return 'neutral';
    }

    calculateConfidence(r, g, b, brightness) {
        let confidence = 85; // Base confidence
        
        // Adjust based on color distribution
        const colorRange = Math.max(r, g, b) - Math.min(r, g, b);
        if (colorRange > 50) confidence += 10;
        if (colorRange < 20) confidence -= 15;
        
        // Adjust based on brightness
        if (brightness > 50 && brightness < 200) confidence += 5;
        
        // Ensure confidence is within bounds
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
        
        // Update confidence score
        const confidenceFill = document.getElementById('confidence-fill');
        const confidenceValue = document.getElementById('confidence-value');
        confidenceFill.style.width = `${analysis.confidence}%`;
        confidenceValue.textContent = `${analysis.confidence}%`;
        
        // Update color display
        document.getElementById('dominant-color').style.backgroundColor = analysis.hex;
        
        // Generate and display variations
        const { r, g, b } = analysis.dominantColor;
        document.getElementById('lighter-shade').style.backgroundColor = 
            `rgb(${Math.min(255, r + 25)}, ${Math.min(255, g + 25)}, ${Math.min(255, b + 25)})`;
        document.getElementById('darker-shade').style.backgroundColor = 
            `rgb(${Math.max(0, r - 25)}, ${Math.max(0, g - 25)}, ${Math.max(0, b - 25)})`;
        
        // Update details
        document.getElementById('tone-category').textContent = analysis.category;
        document.getElementById('undertone').textContent = analysis.undertone;
        document.getElementById('hex-value').textContent = analysis.hex;
        document.getElementById('rgb-value').textContent = analysis.rgb;
        
        this.generateShadeRecommendations(analysis);
        this.generateSeasonalTips(analysis);
        
        this.skinAnalysis = analysis;
        this.showNotification('Skin analysis completed successfully!', 'success');
        
        // Scroll to results
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
            
            // Keep only last 10 analyses
            this.userProfile.analyses = this.userProfile.analyses.slice(0, 10);
            
            this.userProfile.points += 10;
            this.saveProfile();
            this.showNotification('Analysis saved to your profile!', 'success');
            this.checkAchievements();
        }
    }

    shareResults() {
        if (this.skinAnalysis && navigator.share) {
            navigator.share({
                title: 'My Skin Tone Analysis - BeautyMatch AI',
                text: `I discovered I have ${this.skinAnalysis.category} skin with ${this.skinAnalysis.undertone} undertones!`,
                url: window.location.href
            });
        } else {
            // Fallback to clipboard
            const shareText = `My skin tone: ${this.skinAnalysis.category} with ${this.skinAnalysis.undertone} undertones. Analyzed with BeautyMatch AI!`;
            navigator.clipboard.writeText(shareText).then(() => {
                this.showNotification('Results copied to clipboard!', 'success');
            });
        }
        this.trackEvent('share', 'results');
    }

    // Enhanced AR Try-On
    setupARTryOn() {
        const productBtns = document.querySelectorAll('.product-btn');
        const intensitySlider = document.getElementById('intensity');
        
        productBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                productBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.switchMakeupProduct(btn.dataset.product);
            });
        });
        
        if (intensitySlider) {
            intensitySlider.addEventListener('input', () => {
                this.updateMakeupIntensity(intensitySlider.value);
            });
        }
        
        this.generateColorPalette();
    }

    switchMakeupProduct(product) {
        this.generateColorPalette(product);
        this.trackEvent('ar_tryOn', product);
    }

    generateColorPalette(product = 'foundation') {
        const palette = document.getElementById('color-palette');
        if (!palette) return;
        
        palette.innerHTML = '';
        
        const colors = {
            foundation: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660', '#a67c52', '#8b5a3c'],
            lipstick: ['#ff6b6b', '#ff8e8e', '#ff4757', '#c44569', '#8b3a62', '#ff9ff3'],
            blush: ['#ffa8a8', '#ff8787', '#ff6b6b', '#fa5252', '#e03131', '#f783ac'],
            eyeshadow: ['#8b5a3c', '#a0522d', '#cd853f', '#daa520', '#b8860b', '#6c5ce7']
        };
        
        colors[product].forEach(color => {
            const colorDiv = document.createElement('div');
            colorDiv.className = 'color-option';
            colorDiv.style.backgroundColor = color;
            colorDiv.title = color;
            colorDiv.addEventListener('click', () => this.selectColor(color));
            palette.appendChild(colorDiv);
        });
    }

    selectColor(color) {
        document.querySelectorAll('.color-option').forEach(opt => opt.classList.remove('selected'));
        event.target.classList.add('selected');
        this.trackEvent('color_selection', color);
    }

    updateMakeupIntensity(intensity) {
        // AR intensity logic would go here
        this.trackEvent('intensity_change', intensity);
    }

    // Enhanced Product Discovery
    setupProductDiscovery() {
        const brandFilter = document.getElementById('brand-filter');
        const priceFilter = document.getElementById('price-filter');
        const coverageFilter = document.getElementById('coverage-filter');
        const ratingFilter = document.getElementById('rating-filter');
        const searchInput = document.getElementById('product-search');
        const viewBtns = document.querySelectorAll('.view-btn');
        const loadMoreBtn = document.getElementById('load-more-btn');
        
        [brandFilter, priceFilter, coverageFilter, ratingFilter].forEach(filter => {
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
        
        if (loadMoreBtn) {
            loadMoreBtn.addEventListener('click', () => this.loadMoreProducts());
        }
        
        this.displayProducts();
    }

    generateSampleProducts() {
        this.products = [
            {
                id: 1,
                name: 'Pro Filt\'r Soft Matte Foundation',
                brand: 'Fenty Beauty',
                brandKey: 'fenty',
                price: 36,
                image: '💄',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660', '#a67c52'],
                rating: 4.8,
                reviews: 2847,
                coverage: 'full',
                finish: 'matte',
                category: 'foundation',
                description: 'Long-wearing, buildable foundation with 50 shades',
                badges: ['Bestseller', 'Inclusive']
            },
            {
                id: 2,
                name: 'Liquid Touch Weightless Foundation',
                brand: 'Rare Beauty',
                brandKey: 'rare',
                price: 29,
                image: '🧴',
                shades: ['#f5d5ae', '#e6b885', '#d4a574', '#c19660', '#a67c52'],
                rating: 4.6,
                reviews: 1923,
                coverage: 'medium',
                finish: 'natural',
                category: 'foundation',
                description: 'Weightless, blendable foundation for natural coverage',
                badges: ['New']
            },
            {
                id: 3,
                name: 'Natural Radiant Longwear Foundation',
                brand: 'NARS',
                brandKey: 'nars',
                price: 48,
                image: '✨',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660'],
                rating: 4.7,
                reviews: 3156,
                coverage: 'medium',
                finish: 'radiant',
                category: 'foundation',
                description: 'Radiant finish foundation with 12-hour wear',
                badges: ['Pro Choice']
            },
            {
                id: 4,
                name: 'Studio Fix Fluid Foundation',
                brand: 'MAC',
                brandKey: 'mac',
                price: 33,
                image: '🎨',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660', '#a67c52', '#8b5a3c'],
                rating: 4.5,
                reviews: 4521,
                coverage: 'full',
                finish: 'matte',
                category: 'foundation',
                description: 'Professional full coverage foundation',
                badges: ['Classic']
            },
            {
                id: 5,
                name: 'Airbrush Flawless Foundation',
                brand: 'Charlotte Tilbury',
                brandKey: 'charlotte',
                price: 44,
                image: '👑',
                shades: ['#f4c2a1', '#e8b4a0', '#d4a574', '#c19660'],
                rating: 4.9,
                reviews: 1876,
                coverage: 'medium',
                finish: 'natural',
                category: 'foundation',
                description: 'Luxury foundation with airbrush finish',
                badges: ['Luxury', 'Award Winner']
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
                    ${product.image}
                    ${product.badges.length > 0 ? `<div class="product-badge">${product.badges[0]}</div>` : ''}
                </div>
                <div class="product-info">
                    <div class="product-brand">${product.brand}</div>
                    <h4>${product.name}</h4>
                    <p class="product-description">${product.description}</p>
                    <div class="product-rating">
                        <span class="stars">${'★'.repeat(Math.floor(product.rating))}${'☆'.repeat(5-Math.floor(product.rating))}</span>
                        <span>${product.rating} (${product.reviews})</span>
                    </div>
                    <p class="product-price">$${product.price}</p>
                    <div class="product-shades">
                        ${product.shades.map(shade => `<div class="shade-dot" style="background-color: ${shade}" title="${shade}"></div>`).join('')}
                    </div>
                    <div class="product-actions">
                        <button class="btn-primary" onclick="app.addToWishlist(${product.id})">
                            <i class="fas fa-heart"></i>
                            Add to Wishlist
                        </button>
                        <button class="btn-secondary" onclick="app.viewProduct(${product.id})">
                            <i class="fas fa-eye"></i>
                            View Details
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
        const coverageFilter = document.getElementById('coverage-filter')?.value || '';
        const ratingFilter = document.getElementById('rating-filter')?.value || '';
        const searchTerm = document.getElementById('product-search')?.value.toLowerCase() || '';
        
        let filtered = this.products;
        
        if (brandFilter) {
            filtered = filtered.filter(p => p.brandKey === brandFilter);
        }
        
        if (priceFilter) {
            const [min, max] = priceFilter.includes('+') ? [50, Infinity] : priceFilter.split('-').map(Number);
            filtered = filtered.filter(p => p.price >= min && (max === undefined || p.price <= max));
        }
        
        if (coverageFilter) {
            filtered = filtered.filter(p => p.coverage === coverageFilter);
        }
        
        if (ratingFilter) {
            const minRating = parseFloat(ratingFilter.replace('+', ''));
            filtered = filtered.filter(p => p.rating >= minRating);
        }
        
        if (searchTerm) {
            filtered = filtered.filter(p => 
                p.name.toLowerCase().includes(searchTerm) ||
                p.brand.toLowerCase().includes(searchTerm) ||
                p.description.toLowerCase().includes(searchTerm)
            );
        }
        
        this.displayProducts(filtered);
        this.trackEvent('filter', 'products');
    }

    updateProductView() {
        this.displayProducts();
        this.trackEvent('view_change', this.currentView);
    }

    loadMoreProducts() {
        // Simulate loading more products
        this.showNotification('Loading more products...', 'info');
        this.trackEvent('load_more', 'products');
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

    // Enhanced Chat Assistant
    setupChat() {
        const chatToggle = document.getElementById('chat-toggle');
        const chatClose = document.getElementById('chat-close');
        const chatMinimize = document.getElementById('chat-minimize');
        const chatContainer = document.getElementById('chat-container');
        const chatInput = document.getElementById('chat-input');
        const chatSend = document.getElementById('chat-send');
        const suggestionBtns = document.querySelectorAll('.suggestion-btn');
        
        chatToggle.addEventListener('click', () => {
            const isVisible = chatContainer.style.display !== 'none';
            chatContainer.style.display = isVisible ? 'none' : 'flex';
            if (!isVisible) this.trackEvent('chat', 'opened');
        });
        
        chatClose.addEventListener('click', () => {
            chatContainer.style.display = 'none';
            this.trackEvent('chat', 'closed');
        });
        
        chatMinimize.addEventListener('click', () => {
            chatContainer.style.height = chatContainer.style.height === '60px' ? '500px' : '60px';
        });
        
        chatSend.addEventListener('click', () => this.sendMessage());
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.sendMessage();
        });
        
        suggestionBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const message = btn.dataset.message;
                chatInput.value = message;
                this.sendMessage();
            });
        });
        
        // Welcome message with delay
        setTimeout(() => {
            this.addChatMessage('Hi! I\'m your AI beauty assistant. I can help with skincare, makeup tips, and product recommendations. What would you like to know?', 'bot');
        }, 1000);
    }

    sendMessage() {
        const input = document.getElementById('chat-input');
        const message = input.value.trim();
        
        if (message) {
            this.addChatMessage(message, 'user');
            input.value = '';
            
            // Show typing indicator
            this.showTypingIndicator();
            
            setTimeout(() => {
                this.hideTypingIndicator();
                const response = this.generateChatResponse(message);
                this.addChatMessage(response, 'bot');
            }, 1000 + Math.random() * 1000);
            
            this.trackEvent('chat', 'message_sent');
        }
    }

    addChatMessage(message, sender) {
        const messagesContainer = document.getElementById('chat-messages');
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${sender}`;
        messageDiv.innerHTML = message;
        messagesContainer.appendChild(messageDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }

    showTypingIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'message bot typing-indicator';
        indicator.innerHTML = '<i class="fas fa-ellipsis-h"></i> Typing...';
        indicator.id = 'typing-indicator';
        document.getElementById('chat-messages').appendChild(indicator);
    }

    hideTypingIndicator() {
        const indicator = document.getElementById('typing-indicator');
        if (indicator) indicator.remove();
    }

    generateChatResponse(message) {
        const lowerMessage = message.toLowerCase();
        
        // Enhanced responses with HTML formatting
        const responses = {
            'foundation': `
                <strong>Foundation Tips:</strong><br>
                • Match to your jawline, not your hand<br>
                • Test in natural light when possible<br>
                • Consider your undertone: ${this.skinAnalysis ? this.skinAnalysis.undertone : 'warm, cool, or neutral'}<br>
                • Build coverage gradually for best results
            `,
            'skincare': `
                <strong>Essential Skincare Routine:</strong><br>
                🌅 <em>Morning:</em> Cleanser → Vitamin C → Moisturizer → SPF<br>
                🌙 <em>Evening:</em> Cleanser → Treatment → Moisturizer<br>
                <br>What's your skin type? I can give more specific advice!
            `,
            'makeup tips': `
                <strong>Pro Makeup Tips:</strong><br>
                ✨ Prime before foundation for longer wear<br>
                🎨 Blend eyeshadow in windshield wiper motions<br>
                💋 Line lips before applying lipstick<br>
                🌟 Set with powder for all-day wear<br>
                📸 Use setting spray for photo-ready finish
            `,
            'shade matching': `
                <strong>Perfect Shade Matching:</strong><br>
                ${this.skinAnalysis ? 
                    `Based on your analysis, you have <strong>${this.skinAnalysis.category}</strong> skin with <strong>${this.skinAnalysis.undertone}</strong> undertones. Look for foundations that complement these characteristics!` :
                    'Try our AI skin analysis feature to get personalized shade recommendations!'
                }
            `,
            'undertone': `
                <strong>Finding Your Undertone:</strong><br>
                🔍 <em>Vein test:</em> Blue veins = cool, green = warm, both = neutral<br>
                💍 <em>Jewelry test:</em> Silver looks better = cool, gold = warm<br>
                🌞 <em>Sun reaction:</em> Burn easily = cool, tan easily = warm<br>
                <br>Want a precise analysis? Try our AI skin tone detector!
            `
        };
        
        // Find matching response
        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }
        
        // Default responses based on context
        if (lowerMessage.includes('help') || lowerMessage.includes('?')) {
            return `I'm here to help! I can assist with:<br>
                    • Skin tone analysis and shade matching<br>
                    • Makeup application techniques<br>
                    • Skincare routine recommendations<br>
                    • Product suggestions<br>
                    <br>What specific topic interests you?`;
        }
        
        return `That's a great question! I specialize in beauty advice, skincare tips, and makeup techniques. Could you be more specific about what you'd like to know? 💄✨`;
    }

    // Profile and Analytics
    setupProfile() {
        const editBtn = document.getElementById('edit-profile');
        const exportBtn = document.getElementById('export-history');
        const clearBtn = document.getElementById('clear-wishlist');
        
        if (editBtn) editBtn.addEventListener('click', () => this.editProfile());
        if (exportBtn) exportBtn.addEventListener('click', () => this.exportHistory());
        if (clearBtn) clearBtn.addEventListener('click', () => this.clearWishlist());
        
        this.updateProfileStats();
        this.displayAchievements();
    }

    setupAnalytics() {
        const timeBtns = document.querySelectorAll('.time-btn');
        timeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                timeBtns.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateAnalytics(btn.dataset.period);
            });
        });
    }

    updateProfileStats() {
        const analysesCount = document.getElementById('analyses-count');
        const wishlistCount = document.getElementById('wishlist-count');
        const pointsCount = document.getElementById('points-count');
        
        if (analysesCount) analysesCount.textContent = this.userProfile.analyses.length;
        if (wishlistCount) wishlistCount.textContent = this.userProfile.wishlist.length;
        if (pointsCount) pointsCount.textContent = this.userProfile.points;
        
        this.displaySkinHistory();
        this.displaySavedProducts();
    }

    displaySkinHistory() {
        const container = document.getElementById('skin-history');
        if (!container || !this.userProfile.analyses.length) return;
        
        container.innerHTML = this.userProfile.analyses.map(analysis => `
            <div class="history-item" style="margin-bottom: 1rem; padding: 1.5rem; background: var(--warm-neutral); border-radius: 12px; border-left: 4px solid var(--rose-gold);">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="width: 50px; height: 50px; background: ${analysis.hex}; border-radius: 50%; border: 3px solid #fff; box-shadow: 0 2px 10px rgba(0,0,0,0.1);"></div>
                    <div style="flex: 1;">
                        <h5 style="margin: 0 0 0.5rem 0; color: var(--dark-neutral);">${analysis.category}</h5>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">
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
        
        if (savedProducts.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #666; padding: 2rem;">No saved products yet. Start exploring our product catalog!</p>';
            return;
        }
        
        container.innerHTML = savedProducts.map(product => `
            <div class="saved-item" style="margin-bottom: 1rem; padding: 1.5rem; background: var(--warm-neutral); border-radius: 12px; border-left: 4px solid var(--accent-coral);">
                <div style="display: flex; align-items: center; gap: 1rem;">
                    <div style="font-size: 2.5rem;">${product.image}</div>
                    <div style="flex: 1;">
                        <h5 style="margin: 0 0 0.5rem 0;">${product.name}</h5>
                        <p style="margin: 0; color: #666; font-size: 0.9rem;">${product.brand}</p>
                        <p style="margin: 0.5rem 0; font-weight: 600; color: var(--accent-coral);">$${product.price}</p>
                        <div style="display: flex; gap: 0.3rem; margin-top: 0.5rem;">
                            ${product.shades.slice(0, 4).map(shade => `<div style="width: 16px; height: 16px; background: ${shade}; border-radius: 50%; border: 1px solid #ddd;"></div>`).join('')}
                        </div>
                    </div>
                    <button onclick="app.removeFromWishlist(${product.id})" style="background: none; border: none; color: #999; cursor: pointer; font-size: 1.2rem;" title="Remove from wishlist">
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
            { id: 'chat_master', name: 'Chat Master', icon: '💬', description: 'Have 10 chat conversations', unlocked: false }
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
        // Check and unlock new achievements
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

    updateAnalytics(period = 'week') {
        // Update analytics displays
        const totalAnalyses = document.getElementById('total-analyses');
        const avgSession = document.getElementById('avg-session');
        const favoriteFeature = document.getElementById('favorite-feature');
        
        if (totalAnalyses) totalAnalyses.textContent = this.userProfile.analyses.length;
        if (avgSession) {
            const sessionTime = Math.round((Date.now() - this.sessionStartTime) / 60000);
            avgSession.textContent = `${sessionTime}m`;
        }
        if (favoriteFeature) favoriteFeature.textContent = 'Skin Analysis';
        
        this.trackEvent('analytics', period);
    }

    // Utility Functions
    saveProfile() {
        localStorage.setItem('beautyProfile', JSON.stringify(this.userProfile));
    }

    loadUserProfile() {
        this.updateProfileStats();
        this.displayAchievements();
    }

    removeFromWishlist(productId) {
        this.userProfile.wishlist = this.userProfile.wishlist.filter(id => id !== productId);
        this.saveProfile();
        this.updateProfileStats();
        this.showNotification('Removed from wishlist', 'info');
    }

    editProfile() {
        this.showNotification('Profile editing coming soon!', 'info');
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
            this.saveProfile();
            this.updateProfileStats();
            this.showNotification('Wishlist cleared', 'info');
        }
    }

    showWelcomeMessage() {
        if (!localStorage.getItem('welcomeShown')) {
            setTimeout(() => {
                this.showNotification('Welcome to BeautyMatch AI! Start by analyzing your skin tone.', 'info');
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

    updateCameraStatus(message) {
        const status = document.getElementById('camera-status');
        if (status) {
            status.querySelector('span').textContent = message;
        }
    }

    // Analytics and Tracking
    trackEvent(category, action, label = '') {
        // Analytics tracking would go here
        console.log(`Event: ${category} - ${action} - ${label}`);
    }

    trackUsage() {
        // Track session duration, feature usage, etc.
        setInterval(() => {
            const sessionDuration = Date.now() - this.sessionStartTime;
            localStorage.setItem('sessionDuration', sessionDuration);
        }, 30000); // Update every 30 seconds
    }

    // Utility Functions
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
    window.app = new BeautyMatchApp();
});

// Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}

// PWA Install Prompt
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    
    // Show install button or notification
    const installBtn = document.createElement('button');
    installBtn.textContent = 'Install App';
    installBtn.className = 'btn-primary';
    installBtn.style.position = 'fixed';
    installBtn.style.bottom = '100px';
    installBtn.style.right = '20px';
    installBtn.style.zIndex = '1001';
    
    installBtn.addEventListener('click', () => {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            }
            deferredPrompt = null;
            installBtn.remove();
        });
    });
    
    document.body.appendChild(installBtn);
    
    setTimeout(() => {
        if (installBtn.parentNode) {
            installBtn.remove();
        }
    }, 10000);
});