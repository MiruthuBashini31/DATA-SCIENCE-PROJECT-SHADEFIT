from flask import Flask, request, jsonify, render_template
import cv2
import numpy as np
from sklearn.cluster import KMeans
import colorsys
import base64
from io import BytesIO
from PIL import Image
import json

app = Flask(__name__)

class SkinToneAnalyzer:
    def __init__(self):
        self.skin_tone_categories = {
            'very_light': {'range': (0, 80), 'undertones': ['cool', 'neutral', 'warm']},
            'light': {'range': (80, 120), 'undertones': ['cool', 'neutral', 'warm']},
            'light_medium': {'range': (120, 160), 'undertones': ['cool', 'neutral', 'warm']},
            'medium': {'range': (160, 200), 'undertones': ['cool', 'neutral', 'warm']},
            'medium_deep': {'range': (200, 230), 'undertones': ['cool', 'neutral', 'warm']},
            'deep': {'range': (230, 255), 'undertones': ['cool', 'neutral', 'warm']}
        }
        
        self.foundation_database = {
            'fenty_beauty': {
                'very_light_cool': ['100', '110', '120'],
                'light_warm': ['150', '160', '170'],
                'medium_neutral': ['240', '250', '260'],
                'deep_warm': ['385', '400', '420']
            },
            'rare_beauty': {
                'light_cool': ['110C', '120C', '130C'],
                'medium_warm': ['210W', '220W', '230W'],
                'deep_neutral': ['340N', '350N', '360N']
            }
        }

    def analyze_image(self, image_data):
        """Analyze skin tone from base64 image data"""
        try:
            # Decode base64 image
            image_bytes = base64.b64decode(image_data.split(',')[1])
            image = Image.open(BytesIO(image_bytes))
            image_np = np.array(image)
            
            # Convert to RGB if needed
            if len(image_np.shape) == 3 and image_np.shape[2] == 4:
                image_np = cv2.cvtColor(image_np, cv2.COLOR_RGBA2RGB)
            elif len(image_np.shape) == 3 and image_np.shape[2] == 3:
                image_np = cv2.cvtColor(image_np, cv2.COLOR_BGR2RGB)
            
            # Extract skin tone
            skin_color = self.extract_dominant_skin_color(image_np)
            
            # Analyze undertones and category
            analysis = self.categorize_skin_tone(skin_color)
            
            # Get product recommendations
            recommendations = self.get_product_recommendations(analysis)
            
            return {
                'success': True,
                'analysis': analysis,
                'recommendations': recommendations
            }
            
        except Exception as e:
            return {'success': False, 'error': str(e)}

    def extract_dominant_skin_color(self, image):
        """Extract dominant skin color using face detection and color clustering"""
        # Load face cascade
        face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
        
        # Convert to grayscale for face detection
        gray = cv2.cvtColor(image, cv2.COLOR_RGB2GRAY)
        
        # Detect faces
        faces = face_cascade.detectMultiScale(gray, 1.1, 4)
        
        if len(faces) > 0:
            # Use the first detected face
            (x, y, w, h) = faces[0]
            
            # Extract face region with some padding
            padding = 20
            face_region = image[max(0, y-padding):min(image.shape[0], y+h+padding),
                              max(0, x-padding):min(image.shape[1], x+w+padding)]
        else:
            # If no face detected, use center region
            h, w = image.shape[:2]
            center_x, center_y = w//2, h//2
            region_size = min(w, h) // 3
            face_region = image[center_y-region_size//2:center_y+region_size//2,
                              center_x-region_size//2:center_x+region_size//2]
        
        # Reshape for clustering
        pixels = face_region.reshape(-1, 3)
        
        # Remove very dark and very light pixels (likely not skin)
        mask = np.all(pixels > [30, 30, 30], axis=1) & np.all(pixels < [250, 250, 250], axis=1)
        skin_pixels = pixels[mask]
        
        if len(skin_pixels) == 0:
            # Fallback to all pixels
            skin_pixels = pixels
        
        # Use K-means to find dominant colors
        kmeans = KMeans(n_clusters=3, random_state=42, n_init=10)
        kmeans.fit(skin_pixels)
        
        # Get the most frequent cluster (dominant color)
        labels = kmeans.labels_
        unique, counts = np.unique(labels, return_counts=True)
        dominant_cluster = unique[np.argmax(counts)]
        dominant_color = kmeans.cluster_centers_[dominant_cluster]
        
        return dominant_color.astype(int)

    def categorize_skin_tone(self, rgb_color):
        """Categorize skin tone and determine undertones"""
        r, g, b = rgb_color
        
        # Calculate brightness
        brightness = (r + g + b) / 3
        
        # Determine category based on brightness
        category = 'medium'
        for cat_name, cat_info in self.skin_tone_categories.items():
            if cat_info['range'][0] <= brightness <= cat_info['range'][1]:
                category = cat_name
                break
        
        # Determine undertone
        undertone = self.determine_undertone(r, g, b)
        
        # Convert to other color spaces
        hex_color = f"#{r:02x}{g:02x}{b:02x}"
        hsl = self.rgb_to_hsl(r, g, b)
        
        return {
            'category': category.replace('_', ' ').title(),
            'undertone': undertone,
            'rgb': f"rgb({r}, {g}, {b})",
            'hex': hex_color,
            'hsl': f"hsl({hsl[0]}, {hsl[1]}%, {hsl[2]}%)",
            'brightness': brightness,
            'dominant_color': {'r': int(r), 'g': int(g), 'b': int(b)}
        }

    def determine_undertone(self, r, g, b):
        """Determine undertone based on RGB values"""
        # Convert to different color space for better undertone detection
        h, s, v = colorsys.rgb_to_hsv(r/255, g/255, b/255)
        
        # Hue-based undertone detection
        hue_degrees = h * 360
        
        if 15 <= hue_degrees <= 45:  # Yellow-orange range
            return 'warm'
        elif 200 <= hue_degrees <= 260:  # Blue range
            return 'cool'
        else:
            # Additional checks based on RGB ratios
            if r > g and r > b:
                return 'warm'
            elif b > r and b > g:
                return 'cool'
            else:
                return 'neutral'

    def rgb_to_hsl(self, r, g, b):
        """Convert RGB to HSL"""
        r, g, b = r/255.0, g/255.0, b/255.0
        max_val = max(r, g, b)
        min_val = min(r, g, b)
        diff = max_val - min_val
        
        # Lightness
        l = (max_val + min_val) / 2
        
        if diff == 0:
            h = s = 0
        else:
            # Saturation
            s = diff / (2 - max_val - min_val) if l > 0.5 else diff / (max_val + min_val)
            
            # Hue
            if max_val == r:
                h = (g - b) / diff + (6 if g < b else 0)
            elif max_val == g:
                h = (b - r) / diff + 2
            else:
                h = (r - g) / diff + 4
            h /= 6
        
        return [round(h * 360), round(s * 100), round(l * 100)]

    def get_product_recommendations(self, analysis):
        """Get foundation and product recommendations based on analysis"""
        category = analysis['category'].lower().replace(' ', '_')
        undertone = analysis['undertone']
        
        recommendations = []
        
        # Foundation recommendations
        for brand, shades in self.foundation_database.items():
            key = f"{category}_{undertone}"
            if key in shades:
                for shade in shades[key][:2]:  # Top 2 shades per brand
                    recommendations.append({
                        'type': 'foundation',
                        'brand': brand.replace('_', ' ').title(),
                        'shade': shade,
                        'match_confidence': 0.9
                    })
        
        # Generate complementary shades
        r, g, b = analysis['dominant_color']['r'], analysis['dominant_color']['g'], analysis['dominant_color']['b']
        
        # Perfect match
        recommendations.append({
            'type': 'perfect_match',
            'name': 'Perfect Match',
            'color': f"rgb({r}, {g}, {b})",
            'hex': analysis['hex']
        })
        
        # Slightly lighter
        lighter_r = min(255, r + 20)
        lighter_g = min(255, g + 20)
        lighter_b = min(255, b + 20)
        recommendations.append({
            'type': 'lighter',
            'name': 'Slightly Lighter',
            'color': f"rgb({lighter_r}, {lighter_g}, {lighter_b})",
            'hex': f"#{lighter_r:02x}{lighter_g:02x}{lighter_b:02x}"
        })
        
        # Slightly darker
        darker_r = max(0, r - 20)
        darker_g = max(0, g - 20)
        darker_b = max(0, b - 20)
        recommendations.append({
            'type': 'darker',
            'name': 'Slightly Darker',
            'color': f"rgb({darker_r}, {darker_g}, {darker_b})",
            'hex': f"#{darker_r:02x}{darker_g:02x}{darker_b:02x}"
        })
        
        return recommendations

# Initialize analyzer
analyzer = SkinToneAnalyzer()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/analyze', methods=['POST'])
def analyze_skin_tone():
    """API endpoint for skin tone analysis"""
    try:
        data = request.get_json()
        image_data = data.get('image')
        
        if not image_data:
            return jsonify({'success': False, 'error': 'No image data provided'})
        
        result = analyzer.analyze_image(image_data)
        return jsonify(result)
        
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/products', methods=['GET'])
def get_products():
    """API endpoint for product catalog"""
    products = [
        {
            'id': 1,
            'name': 'Fenty Beauty Pro Filt\'r Foundation',
            'brand': 'Fenty Beauty',
            'price': 36,
            'category': 'foundation',
            'shades': ['100', '110', '120', '150', '160', '170', '240', '250', '260'],
            'rating': 4.8,
            'coverage': 'full',
            'finish': 'matte'
        },
        {
            'id': 2,
            'name': 'Rare Beauty Liquid Touch Foundation',
            'brand': 'Rare Beauty',
            'price': 29,
            'category': 'foundation',
            'shades': ['110C', '120C', '130C', '210W', '220W', '230W'],
            'rating': 4.6,
            'coverage': 'medium',
            'finish': 'natural'
        },
        {
            'id': 3,
            'name': 'NARS Natural Radiant Foundation',
            'brand': 'NARS',
            'price': 48,
            'category': 'foundation',
            'shades': ['Siberia', 'Gobi', 'Stromboli', 'Cadiz'],
            'rating': 4.7,
            'coverage': 'medium-full',
            'finish': 'radiant'
        }
    ]
    
    # Filter by query parameters
    brand = request.args.get('brand')
    price_range = request.args.get('price_range')
    
    filtered_products = products
    
    if brand:
        filtered_products = [p for p in filtered_products if p['brand'].lower().replace(' ', '_') == brand]
    
    if price_range:
        if price_range == '0-25':
            filtered_products = [p for p in filtered_products if p['price'] <= 25]
        elif price_range == '25-50':
            filtered_products = [p for p in filtered_products if 25 < p['price'] <= 50]
        elif price_range == '50+':
            filtered_products = [p for p in filtered_products if p['price'] > 50]
    
    return jsonify({'products': filtered_products})

@app.route('/dashboard-data', methods=['GET'])
def get_dashboard_data():
    """Enhanced dashboard analytics data"""
    try:
        return jsonify({
            'analytics': {
                'total_users': 125000,
                'analyses_today': 3247,
                'popular_products': [
                    {'name': 'Fenty Beauty Foundation', 'count': 8456},
                    {'name': 'Lakme Absolute Foundation', 'count': 6890},
                    {'name': 'Sugar Cosmetics Lipstick', 'count': 5134}
                ],
                'skin_tone_distribution': {
                    'light': 28,
                    'medium': 52,
                    'deep': 20
                },
                'undertone_distribution': {
                    'warm': 45,
                    'cool': 32,
                    'neutral': 23
                }
            }
        })
    except Exception as e:
        return jsonify({'error': str(e)})

# Removed chat functionality - focusing on analytics
def removed_chat_assistant():
    """AI Beauty Assistant Chat API"""
    try:
        data = request.get_json()
        message = data.get('message', '').lower()
        
        # Enhanced rule-based responses with more comprehensive coverage
        responses = {
            'foundation': 'For foundation, choose a shade that matches your undertone. Test on your jawline in natural light for the best match. Consider your coverage needs - sheer for natural look, full for events.',
            'skincare': 'A good skincare routine includes: cleansing, toning, moisturizing, and SPF protection. What\'s your skin type? I can recommend products based on your concerns.',
            'makeup tips': 'Pro tips: Prime before foundation, blend eyeshadow in circular motions, use setting spray for longevity! Always start with skincare prep.',
            'shade matching': 'Shade matching is key! Consider your undertone (cool, warm, neutral) and test in natural lighting. Your neck and chest should match your face.',
            'undertone': 'To find your undertone: Check your veins (blue=cool, green=warm, both=neutral) or see which metals look best on you (silver=cool, gold=warm).',
            'skin tone': 'Skin tone refers to the surface color, while undertone is the subtle hue beneath. Both are important for makeup matching and clothing choices.',
            'product recommendation': 'I can recommend products based on your skin analysis. What type of product are you looking for? Foundation, lipstick, blush, or skincare?',
            'lipstick': 'Choose lipstick based on your undertone: cool undertones suit berry and blue-based reds, warm undertones look great in coral and orange-based shades.',
            'blush': 'Blush should complement your natural flush. Apply to the apples of your cheeks and blend upward toward your temples.',
            'eyeshadow': 'Eyeshadow colors that complement your eye color: brown eyes - purples and golds, blue eyes - oranges and browns, green eyes - reds and pinks.',
            'contouring': 'Contour with a shade 2-3 tones darker than your skin. Focus on hollows of cheeks, sides of nose, and jawline. Blend well for natural look.',
            'highlighting': 'Apply highlighter to high points: cheekbones, nose bridge, cupid\'s bow, and inner corners of eyes for a natural glow.',
            'seasonal': 'Adjust your makeup for seasons: lighter coverage in summer, richer colors in fall/winter. Don\'t forget SPF year-round!',
            'indian skin': 'Indian skin tones are beautifully diverse! Focus on warm undertones, try brands like Lakme, Sugar, and Nykaa that cater specifically to Indian skin.',
            'budget': 'Great budget options: Lakme, Maybelline, Colorbar for makeup. The Ordinary for skincare. Drugstore brands often have excellent quality!'
        }
        
        # Find matching response with better keyword matching
        response = 'I can help with makeup tips, product recommendations, skincare advice, and shade matching. What would you like to know?'
        
        for keyword, resp in responses.items():
            if keyword in message:
                response = resp
                break
        
        # Add personalized touch if user has analysis data
        if 'recommend' in message or 'suggestion' in message:
            response += ' Based on your skin analysis, I can provide more personalized recommendations!'
        
        return jsonify({'response': response})
        
    except Exception as e:
        return jsonify({'response': 'Sorry, I encountered an error. Please try again.'})

@app.route('/save_profile', methods=['POST'])
def save_profile():
    """Save user profile data"""
    try:
        data = request.get_json()
        # In a real app, this would save to a database
        # For now, we'll just return success
        return jsonify({'success': True, 'message': 'Profile saved successfully'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)})

@app.route('/analytics', methods=['GET'])
def get_analytics():
    """Get analytics data for dashboard"""
    try:
        # In a real app, this would fetch from database
        # For demo, return sample analytics
        analytics = {
            'total_users': 50000,
            'analyses_today': 1247,
            'popular_products': [
                {'name': 'Fenty Beauty Foundation', 'count': 3456},
                {'name': 'Rare Beauty Blush', 'count': 2890},
                {'name': 'NARS Lipstick', 'count': 2134}
            ],
            'skin_tone_distribution': {
                'light': 25,
                'medium': 45,
                'deep': 30
            },
            'undertone_distribution': {
                'warm': 40,
                'cool': 35,
                'neutral': 25
            }
        }
        return jsonify(analytics)
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/trending', methods=['GET'])
def get_trending():
    """Get trending products and colors"""
    try:
        trending = {
            'colors': [
                {'name': 'Coral Crush', 'hex': '#ff7f7f', 'popularity': 95},
                {'name': 'Golden Hour', 'hex': '#ffd700', 'popularity': 88},
                {'name': 'Berry Bliss', 'hex': '#8b3a62', 'popularity': 82}
            ],
            'products': [
                {'name': 'Dewy Foundation', 'category': 'foundation', 'trend_score': 92},
                {'name': 'Glossy Lips', 'category': 'lipstick', 'trend_score': 87},
                {'name': 'Natural Blush', 'category': 'blush', 'trend_score': 79}
            ],
            'techniques': [
                {'name': 'No-Makeup Makeup', 'difficulty': 'Easy', 'popularity': 94},
                {'name': 'Glass Skin', 'difficulty': 'Medium', 'popularity': 89},
                {'name': 'Soft Glam', 'difficulty': 'Medium', 'popularity': 85}
            ]
        }
        return jsonify(trending)
    except Exception as e:
        return jsonify({'error': str(e)})

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)