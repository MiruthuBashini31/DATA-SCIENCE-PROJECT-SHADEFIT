// Enhanced Features for StyleMatch AI

// Advanced Color Analysis
class ColorAnalyzer {
    static getSeasonalPalette(season, undertone) {
        const palettes = {
            spring: {
                warm: ['#ff6b35', '#f7931e', '#ffd700', '#9acd32', '#ff69b4'],
                cool: ['#ff1493', '#00bfff', '#32cd32', '#ffd700', '#ff6347'],
                neutral: ['#ff7f50', '#ffa500', '#ffff00', '#90ee90', '#ff69b4']
            },
            summer: {
                warm: ['#ff4500', '#ff6347', '#ffd700', '#32cd32', '#ff1493'],
                cool: ['#4169e1', '#00ced1', '#98fb98', '#ffb6c1', '#dda0dd'],
                neutral: ['#ff7f50', '#40e0d0', '#98fb98', '#f0e68c', '#dda0dd']
            },
            fall: {
                warm: ['#8b4513', '#d2691e', '#b8860b', '#228b22', '#dc143c'],
                cool: ['#2f4f4f', '#708090', '#bc8f8f', '#cd853f', '#a0522d'],
                neutral: ['#696969', '#a0522d', '#daa520', '#6b8e23', '#b22222']
            },
            winter: {
                warm: ['#8b0000', '#ff4500', '#ffd700', '#006400', '#4b0082'],
                cool: ['#000080', '#4682b4', '#2e8b57', '#dc143c', '#9400d3'],
                neutral: ['#2f4f4f', '#800080', '#b22222', '#2e8b57', '#4682b4']
            }
        };
        
        return palettes[season]?.[undertone] || palettes.spring.neutral;
    }
    
    static getComplementaryColors(hexColor) {
        const rgb = this.hexToRgb(hexColor);
        const hsl = this.rgbToHsl(rgb.r, rgb.g, rgb.b);
        
        const complementaryHue = (hsl.h + 180) % 360;
        const analogous1 = (hsl.h + 30) % 360;
        const analogous2 = (hsl.h - 30 + 360) % 360;
        const triadic1 = (hsl.h + 120) % 360;
        const triadic2 = (hsl.h + 240) % 360;
        
        return {
            complementary: this.hslToHex(complementaryHue, hsl.s, hsl.l),
            analogous: [
                this.hslToHex(analogous1, hsl.s, hsl.l),
                this.hslToHex(analogous2, hsl.s, hsl.l)
            ],
            triadic: [
                this.hslToHex(triadic1, hsl.s, hsl.l),
                this.hslToHex(triadic2, hsl.s, hsl.l)
            ]
        };
    }
    
    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }
    
    static rgbToHsl(r, g, b) {
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
        
        return { h: h * 360, s: s * 100, l: l * 100 };
    }
    
    static hslToHex(h, s, l) {
        h /= 360; s /= 100; l /= 100;
        const c = (1 - Math.abs(2 * l - 1)) * s;
        const x = c * (1 - Math.abs((h * 6) % 2 - 1));
        const m = l - c / 2;
        let r = 0, g = 0, b = 0;
        
        if (0 <= h && h < 1/6) { r = c; g = x; b = 0; }
        else if (1/6 <= h && h < 2/6) { r = x; g = c; b = 0; }
        else if (2/6 <= h && h < 3/6) { r = 0; g = c; b = x; }
        else if (3/6 <= h && h < 4/6) { r = 0; g = x; b = c; }
        else if (4/6 <= h && h < 5/6) { r = x; g = 0; b = c; }
        else if (5/6 <= h && h < 1) { r = c; g = 0; b = x; }
        
        r = Math.round((r + m) * 255);
        g = Math.round((g + m) * 255);
        b = Math.round((b + m) * 255);
        
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    }
}

// Style Recommendation Engine
class StyleRecommendationEngine {
    static getBodyTypeRecommendations(bodyType) {
        const recommendations = {
            pear: {
                tops: ['Boat neck', 'Off-shoulder', 'Statement sleeves', 'Bright colors'],
                bottoms: ['Dark colors', 'Straight leg', 'Bootcut', 'A-line skirts'],
                dresses: ['Fit and flare', 'Empire waist', 'A-line', 'Wrap dresses'],
                avoid: ['Skinny jeans', 'Pencil skirts', 'Hip details']
            },
            apple: {
                tops: ['V-neck', 'Scoop neck', 'Empire waist', 'Flowy fabrics'],
                bottoms: ['High-waisted', 'Straight leg', 'Wide leg', 'Bootcut'],
                dresses: ['Empire waist', 'A-line', 'Shift dresses', 'Wrap dresses'],
                avoid: ['Tight fitting tops', 'Horizontal stripes', 'Belts at waist']
            },
            hourglass: {
                tops: ['Fitted styles', 'Wrap tops', 'V-neck', 'Scoop neck'],
                bottoms: ['High-waisted', 'Fitted', 'Straight leg', 'Pencil skirts'],
                dresses: ['Bodycon', 'Wrap dresses', 'Fit and flare', 'Sheath'],
                avoid: ['Baggy clothes', 'Boxy shapes', 'Drop waist']
            },
            rectangle: {
                tops: ['Peplum', 'Ruffles', 'Horizontal stripes', 'Layering'],
                bottoms: ['Skinny jeans', 'Flare jeans', 'Pleated skirts', 'Textured fabrics'],
                dresses: ['Fit and flare', 'Belted styles', 'Layered looks'],
                avoid: ['Straight cuts', 'Minimal styling', 'Baggy clothes']
            }
        };
        
        return recommendations[bodyType] || recommendations.hourglass;
    }
    
    static getOccasionOutfits(occasion, skinTone, season) {
        const outfits = {
            work: {
                professional: ['Blazer + trousers', 'Sheath dress', 'Button-down + pencil skirt'],
                colors: ['Navy', 'Black', 'Gray', 'White', 'Burgundy'],
                accessories: ['Structured bag', 'Classic pumps', 'Minimal jewelry']
            },
            date: {
                casual: ['Midi dress', 'Jeans + nice top', 'Skirt + blouse'],
                formal: ['Cocktail dress', 'Dress pants + silk top', 'Elegant jumpsuit'],
                colors: ['Soft pink', 'Deep red', 'Navy', 'Emerald'],
                accessories: ['Statement earrings', 'Clutch', 'Heels or nice flats']
            },
            party: {
                cocktail: ['Little black dress', 'Sequin top + skirt', 'Jumpsuit'],
                formal: ['Evening gown', 'Cocktail dress', 'Dressy separates'],
                colors: ['Black', 'Gold', 'Silver', 'Deep jewel tones'],
                accessories: ['Statement jewelry', 'Evening bag', 'Heels']
            },
            casual: {
                weekend: ['Jeans + t-shirt', 'Sundress', 'Shorts + tank'],
                comfort: ['Joggers + hoodie', 'Maxi dress', 'Leggings + tunic'],
                colors: ['Denim', 'White', 'Pastels', 'Earth tones'],
                accessories: ['Sneakers', 'Crossbody bag', 'Casual jewelry']
            }
        };
        
        return outfits[occasion] || outfits.casual;
    }
}

// Trend Forecasting
class TrendForecaster {
    static getCurrentTrends() {
        return {
            colors: ['Digital Lime', 'Cyber Yellow', 'Virtual Violet', 'Tech Teal'],
            styles: ['Oversized blazers', 'Wide-leg pants', 'Midi skirts', 'Statement sleeves'],
            patterns: ['Abstract prints', 'Geometric patterns', 'Color blocking', 'Tie-dye'],
            accessories: ['Chunky chains', 'Mini bags', 'Platform shoes', 'Hair accessories']
        };
    }
    
    static getSeasonalTrends(season) {
        const trends = {
            spring: {
                colors: ['Pastel pink', 'Mint green', 'Lavender', 'Butter yellow'],
                styles: ['Flowy dresses', 'Light layers', 'Cropped jackets'],
                fabrics: ['Cotton', 'Linen', 'Chiffon', 'Light knits']
            },
            summer: {
                colors: ['Coral', 'Turquoise', 'Sunshine yellow', 'Hot pink'],
                styles: ['Maxi dresses', 'Shorts', 'Tank tops', 'Sandals'],
                fabrics: ['Cotton', 'Linen', 'Silk', 'Breathable synthetics']
            },
            fall: {
                colors: ['Rust orange', 'Deep burgundy', 'Forest green', 'Camel'],
                styles: ['Layering', 'Boots', 'Sweaters', 'Scarves'],
                fabrics: ['Wool', 'Cashmere', 'Velvet', 'Leather']
            },
            winter: {
                colors: ['Deep navy', 'Rich purple', 'Emerald green', 'Classic black'],
                styles: ['Coats', 'Turtlenecks', 'Boots', 'Heavy knits'],
                fabrics: ['Wool', 'Cashmere', 'Fur', 'Heavy cotton']
            }
        };
        
        return trends[season] || trends.spring;
    }
}

// Wardrobe Analytics
class WardrobeAnalytics {
    static analyzeWardrobe(items) {
        const analysis = {
            totalItems: items.length,
            categories: {},
            colors: {},
            brands: {},
            priceRange: { min: Infinity, max: 0, average: 0 },
            styleDistribution: {},
            recommendations: []
        };
        
        let totalPrice = 0;
        
        items.forEach(item => {
            // Category analysis
            analysis.categories[item.category] = (analysis.categories[item.category] || 0) + 1;
            
            // Brand analysis
            analysis.brands[item.brand] = (analysis.brands[item.brand] || 0) + 1;
            
            // Style analysis
            analysis.styleDistribution[item.style] = (analysis.styleDistribution[item.style] || 0) + 1;
            
            // Price analysis
            totalPrice += item.price;
            analysis.priceRange.min = Math.min(analysis.priceRange.min, item.price);
            analysis.priceRange.max = Math.max(analysis.priceRange.max, item.price);
            
            // Color analysis
            item.colors?.forEach(color => {
                analysis.colors[color] = (analysis.colors[color] || 0) + 1;
            });
        });
        
        analysis.priceRange.average = totalPrice / items.length;
        
        // Generate recommendations
        analysis.recommendations = this.generateWardrobeRecommendations(analysis);
        
        return analysis;
    }
    
    static generateWardrobeRecommendations(analysis) {
        const recommendations = [];
        
        // Check for missing basics
        const basics = ['tops', 'bottoms', 'dresses'];
        basics.forEach(basic => {
            if (!analysis.categories[basic] || analysis.categories[basic] < 3) {
                recommendations.push(`Consider adding more ${basic} to your wardrobe`);
            }
        });
        
        // Check style balance
        const styles = Object.keys(analysis.styleDistribution);
        if (styles.length < 2) {
            recommendations.push('Try exploring different styles to diversify your wardrobe');
        }
        
        // Price recommendations
        if (analysis.priceRange.average > 5000) {
            recommendations.push('Consider mixing high-end pieces with budget-friendly options');
        }
        
        return recommendations;
    }
}

// Export for use in main application
if (typeof window !== 'undefined') {
    window.ColorAnalyzer = ColorAnalyzer;
    window.StyleRecommendationEngine = StyleRecommendationEngine;
    window.TrendForecaster = TrendForecaster;
    window.WardrobeAnalytics = WardrobeAnalytics;
}