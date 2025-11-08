#!/usr/bin/env python3
"""
ShadeFit - Complete Beauty & Fashion Platform
Run this file to start the application
"""

from app import app
import webbrowser
import threading
import time

def open_browser():
    """Open browser after a short delay"""
    time.sleep(1.5)
    webbrowser.open('http://localhost:5000')

if __name__ == '__main__':
    print("Starting ShadeFit - Complete Platform...")
    print("Features included:")
    print("   - AI Skin Tone Detection with Confidence Scoring")
    print("   - Clothing Color Recommendations")
    print("   - Beauty Product Catalog with Filtering")
    print("   - User Profile with Analytics")
    print("   - Achievement System with Rewards")
    print("   - Seasonal Beauty Tips")
    print("   - Data Export/Import Functionality")
    print("\nOpening browser at http://localhost:5000")
    
    # Open browser in a separate thread
    threading.Thread(target=open_browser, daemon=True).start()
    
    # Start Flask app
    app.run(debug=True, host='0.0.0.0', port=5000, use_reloader=False)