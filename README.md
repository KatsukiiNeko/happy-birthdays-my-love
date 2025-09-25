🎂 Romantic Birthday Website
===========================

A beautiful, interactive birthday surprise website with Three.js cake animation, 
music, and photo gallery. Mobile-friendly with accessibility features.

QUICK START
-----------
1. Replace content in database/wishes.json with your personalized message
2. Add your photos to assets/images/ (see Asset Requirements below)
3. Add your music file to assets/audio/
4. Open index.html in a modern browser

TESTING LOCALLY
---------------
This website needs to be served from a web server (not file://) due to CORS 
restrictions with ES modules and audio. Quick options:

- Python 3: python -m http.server 8000
- Python 2: python -m SimpleHTTPServer 8000  
- Node.js: npx serve . -p 8000
- PHP: php -S localhost:8000

Then visit http://localhost:8000

REPLACING THE MAIN FLYING IMAGE
-------------------------------
1. Replace assets/images/flying-photo.webp with your photo (800-1600px recommended)
2. Create a small LQIP version: assets/images/flying-photo-lqip.jpg (under 20KB)
3. Update the preload link in index.html if you change the filename

ASSET REQUIREMENTS
------------------
Required files to add:
- assets/images/flying-photo.webp (800-1600px, 200-400KB) - Main reveal photo
- assets/images/flying-photo-lqip.jpg (very small, 8-20KB) - Placeholder
- assets/images/cake-thumb.webp (200-400px) - Fallback cake image  
- assets/images/gallery-01.webp (600-1200px each) - Gallery photos
- assets/images/gallery-02.webp
- assets/images/gallery-03.webp  
- assets/audio/happy-birthday-short.mp3 (15-35 seconds, 96-128kbps)

FEATURES
--------
- Interactive 3D cake with paper tag and candle (falls back to 2D on low-end devices)
- Personalized message reveal with typewriter effect
- Music playback with controls (starts only after user interaction)
- Photo gallery with lazy loading
- Confetti animation
- Mobile-friendly responsive design
- Accessibility features (keyboard navigation, screen reader support)
- Performance optimized (lazy loading, reduced motion support)

BROWSER SUPPORT
---------------
- Modern browsers with ES6 modules support
- WebGL support recommended for 3D cake (automatic fallback to 2D)
- Audio autoplay works after user gesture (candle blow)

CUSTOMIZATION
-------------
- Edit database/wishes.json for all text content
- Modify CSS custom properties in css/base.css for colors/spacing
- Adjust Three.js scene in js/three-scene.js for 3D customization
- Gallery images automatically loaded from wishes.json

PERFORMANCE NOTES
-----------------
- 3D scene automatically disabled on devices with <2GB RAM or small screens
- Canvas pixel ratio clamped to 2x for better performance on high-DPI displays  
- Animation paused when tab is hidden to save battery
- Images lazy loaded and optimized

Have fun surprising your special someone! 💖