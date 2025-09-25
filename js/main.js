// Main application logic
import { fetchJSON, preloadImage, createElement } from './utils.js';
import { initThreeScene, cleanupThreeScene } from './three-scene.js';

class BirthdayApp {
    constructor() {
        this.data = null;
        this.audio = null;
        this.isAudioMuted = false;
        this.threeScene = null;
        
        this.init();
    }
    
    async init() {
        try {
            // Load wishes data
            this.data = await fetchJSON('database/wishes.json');
            
            // Initialize UI
            this.setupUI();
            
            // Initialize 3D scene or fallback
            await this.initScene();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup audio
            this.setupAudio();
            
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.showError();
        }
    }
    
    setupUI() {
        // Populate content from wishes.json
        const titleEl = document.getElementById('birthday-title');
        const subtitleEl = document.getElementById('birthday-subtitle');
        const messageEl = document.getElementById('birthday-message');
        const senderEl = document.getElementById('birthday-sender');
        
        if (titleEl) titleEl.textContent = this.data.title;
        if (subtitleEl) subtitleEl.textContent = this.data.subtitle;
        if (messageEl) messageEl.textContent = this.data.message;
        if (senderEl) senderEl.textContent = this.data.sender;
        
        // Populate gallery
        this.populateGallery();
        
        // Setup flying photo
        this.setupFlyingPhoto();
    }
    
    async initScene() {
        const container = document.getElementById('cake-container');
        const fallback = document.getElementById('fallback-cake');
        
        // Check if we should use 3D scene
        const shouldUse3D = this.shouldUse3D();
        
        if (shouldUse3D) {
            try {
                this.threeScene = await initThreeScene(container);
                console.log('3D scene initialized');
            } catch (error) {
                console.warn('3D scene failed, using fallback:', error);
                this.showFallback();
            }
        } else {
            console.log('Using fallback cake due to device constraints');
            this.showFallback();
        }
    }
    
    shouldUse3D() {
        // Device capability checks
        const hasWebGL = this.hasWebGLSupport();
        const hasEnoughMemory = navigator.deviceMemory ? navigator.deviceMemory >= 2 : true;
        const isLargeScreen = window.innerWidth >= 420;
        
        return hasWebGL && hasEnoughMemory && isLargeScreen;
    }
    
    hasWebGLSupport() {
        try {
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            return !!context;
        } catch (e) {
            return false;
        }
    }
    
    showFallback() {
        const fallback = document.getElementById('fallback-cake');
        if (fallback) {
            fallback.style.display = 'flex';
        }
    }
    
    setupEventListeners() {
        // Paper click events (3D scene dispatches custom events)
        document.addEventListener('paper:clicked', () => this.handlePaperClick());
        document.addEventListener('candle:blown', () => this.handleCandleBlow());
        
        // Fallback button events
        const paperBtn = document.getElementById('paper-button');
        const candleBtn = document.getElementById('candle-button');
        
        if (paperBtn) {
            paperBtn.addEventListener('click', () => this.handlePaperClick());
            paperBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handlePaperClick();
                }
            });
        }
        
        if (candleBtn) {
            candleBtn.addEventListener('click', () => this.handleCandleBlow());
            candleBtn.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.handleCandleBlow();
                }
            });
        }
        
        // Audio controls
        const muteBtn = document.getElementById('mute-button');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => this.toggleMute());
        }
        
        // Visibility change for performance
        document.addEventListener('visibilitychange', () => {
            if (this.threeScene) {
                if (document.hidden) {
                    this.threeScene.pause();
                } else {
                    this.threeScene.resume();
                }
            }
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            if (this.threeScene) {
                this.threeScene.handleResize();
            }
        });
    }
    
    handlePaperClick() {
        console.log('Paper clicked - revealing message');
        
        // Hide paper button
        const paperBtn = document.getElementById('paper-button');
        if (paperBtn) {
            paperBtn.style.display = 'none';
        }
        
        // Show message section
        const messageSection = document.getElementById('message-section');
        if (messageSection) {
            messageSection.classList.remove('hidden');
            
            // Focus management for accessibility
            const titleEl = document.getElementById('birthday-title');
            if (titleEl) {
                titleEl.focus();
            }
        }
        
        // Show blow prompt and candle button
        setTimeout(() => {
            const blowPrompt = document.getElementById('blow-prompt');
            const candleBtn = document.getElementById('candle-button');
            
            if (blowPrompt) {
                blowPrompt.classList.remove('hidden');
            }
            
            if (candleBtn) {
                candleBtn.classList.remove('hidden');
                candleBtn.focus(); // Focus on candle for keyboard users
            }
        }, 2000);
    }
    
    handleCandleBlow() {
        console.log('Candle blown - revealing gallery and starting music');
        
        // Hide candle button
        const candleBtn = document.getElementById('candle-button');
        if (candleBtn) {
            candleBtn.style.display = 'none';
        }
        
        // Start music (this is user-initiated, so autoplay is allowed)
        this.playAudio();
        
        // Show audio controls
        const audioControls = document.getElementById('audio-controls');
        if (audioControls) {
            audioControls.classList.remove('hidden');
        }
        
        // Show flying photo
        const flyingPhotoSection = document.getElementById('flying-photo-section');
        if (flyingPhotoSection) {
            flyingPhotoSection.classList.remove('hidden');
            this.revealFlyingPhoto();
        }
        
        // Show gallery
        const gallerySection = document.getElementById('gallery-section');
        if (gallerySection) {
            gallerySection.classList.remove('hidden');
            gallerySection.setAttribute('aria-hidden', 'false');
        }
        
        // Trigger confetti effect
        this.createConfetti();
    }
    
    setupAudio() {
        this.audio = document.getElementById('birthday-audio');
        if (this.audio && this.data.music) {
            this.audio.src = this.data.music;
        }
    }
    
    playAudio() {
        if (this.audio) {
            this.audio.play().catch(error => {
                console.warn('Audio playback failed:', error);
            });
        }
    }
    
    toggleMute() {
        if (this.audio) {
            this.isAudioMuted = !this.isAudioMuted;
            this.audio.muted = this.isAudioMuted;
            
            const muteBtn = document.getElementById('mute-button');
            const unmutedIcon = muteBtn.querySelector('.unmuted');
            const mutedIcon = muteBtn.querySelector('.muted');
            
            if (this.isAudioMuted) {
                unmutedIcon.classList.add('hidden');
                mutedIcon.classList.remove('hidden');
                muteBtn.setAttribute('aria-label', 'Unmute audio');
            } else {
                unmutedIcon.classList.remove('hidden');
                mutedIcon.classList.add('hidden');
                muteBtn.setAttribute('aria-label', 'Mute audio');
            }
        }
    }
    
    populateGallery() {
        const galleryGrid = document.getElementById('gallery-grid');
        if (!galleryGrid || !this.data.gallery) return;
        
        this.data.gallery.forEach((imagePath, index) => {
            const item = createElement('div', { className: 'gallery-item' });
            const img = createElement('img', {
                src: imagePath,
                alt: `Memory ${index + 1}`,
                loading: 'lazy'
            });
            
            item.appendChild(img);
            galleryGrid.appendChild(item);
        });
    }
    
    setupFlyingPhoto() {
        const fullImg = document.getElementById('flying-photo-full');
        if (fullImg) {
            // Preload the full image
            preloadImage(fullImg.src).then(() => {
                console.log('Flying photo preloaded');
            }).catch(error => {
                console.warn('Failed to preload flying photo:', error);
            });
        }
    }
    
    revealFlyingPhoto() {
        const lqipImg = document.getElementById('flying-photo-lqip');
        const fullImg = document.getElementById('flying-photo-full');
        
        if (fullImg && lqipImg) {
            // Wait for full image to load, then crossfade
            if (fullImg.complete) {
                this.crossfadeImages(lqipImg, fullImg);
            } else {
                fullImg.onload = () => {
                    this.crossfadeImages(lqipImg, fullImg);
                };
            }
        }
    }
    
    crossfadeImages(lqip, full) {
        full.classList.remove('hidden');
        full.style.opacity = '0';
        
        // Animate the crossfade
        setTimeout(() => {
            full.style.transition = 'opacity 0.8s ease';
            full.style.opacity = '1';
            
            setTimeout(() => {
                lqip.style.opacity = '0';
            }, 200);
        }, 100);
    }
    
    createConfetti() {
        const container = document.getElementById('confetti-container');
        if (!container) return;
        
        // Check for reduced motion preference
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        
        const colors = ['var(--color-primary)', 'var(--color-accent)', 'var(--color-soft)'];
        const pieces = 50;
        
        for (let i = 0; i < pieces; i++) {
            const piece = createElement('div', { className: 'confetti-piece' });
            
            // Random positioning and styling
            piece.style.left = Math.random() * 100 + '%';
            piece.style.top = Math.random() * 100 + '%';
            piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
            piece.style.animationDelay = Math.random() * 2 + 's';
            piece.style.animationDuration = (Math.random() * 2 + 2) + 's';
            
            container.appendChild(piece);
            
            // Remove after animation
            setTimeout(() => {
                if (piece.parentNode) {
                    piece.parentNode.removeChild(piece);
                }
            }, 5000);
        }
    }
    
    showError() {
        const container = document.querySelector('.main-container');
        if (container) {
            container.innerHTML = `
                <div class="error-message" style="text-align: center; padding: 2rem;">
                    <h1 style="color: var(--color-primary); margin-bottom: 1rem;">
                        Oops! Something went wrong 😔
                    </h1>
                    <p style="color: var(--color-text);">
                        Please refresh the page and try again.
                    </p>
                </div>
            `;
        }
    }
    
    // Cleanup method
    destroy() {
        if (this.threeScene) {
            cleanupThreeScene();
        }
        
        if (this.audio) {
            this.audio.pause();
            this.audio.src = '';
        }
    }
}

// Initialize the app when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new BirthdayApp();
    });
} else {
    new BirthdayApp();
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.birthdayApp) {
        window.birthdayApp.destroy();
    }
});