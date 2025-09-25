// Three.js scene management with fallback
let scene, camera, renderer, cake, paper, candle, flame;
let isInitialized = false;
let animationId = null;
let isPaused = false;
let raycaster, mouse;

export async function initThreeScene(container) {
    try {
        // Dynamic import of Three.js
        const THREE = await import('https://cdn.jsdelivr.net/npm/three@0.152.2/build/three.module.js');
        
        // Scene setup
        scene = new THREE.Scene();
        
        // Camera setup
        const aspect = container.clientWidth / container.clientHeight;
        camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        camera.position.set(0, 2, 5);
        camera.lookAt(0, 0, 0);
        
        // Renderer setup with performance optimizations
        renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: 'high-performance'
        });
        renderer.setSize(container.clientWidth, container.clientHeight);
        
        // Clamp pixel ratio for better performance on Retina devices
        const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
        renderer.setPixelRatio(pixelRatio);
        
        renderer.setClearColor(0x000000, 0);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        
        container.appendChild(renderer.domElement);
        
        // Lighting
        setupLighting(THREE);
        
        // Create cake and interactive elements
        createCake(THREE);
        createPaper(THREE);
        createCandle(THREE);
        
        // Raycasting for interaction
        setupRaycasting(THREE);
        
        // Event listeners
        setupInteractions(container);
        
        // Start animation loop
        animate();
        
        isInitialized = true;
        
        return {
            pause: pauseAnimation,
            resume: resumeAnimation,
            handleResize: () => handleResize(container),
            cleanup: cleanup
        };
        
    } catch (error) {
        console.error('Failed to initialize Three.js scene:', error);
        throw error;
    }
}

function setupLighting(THREE) {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);
    
    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    scene.add(directionalLight);
    
    // Point light for warm glow
    const pointLight = new THREE.PointLight(0xffb6c1, 0.5);
    pointLight.position.set(0, 3, 0);
    scene.add(pointLight);
}

function createCake(THREE) {
    const cakeGroup = new THREE.Group();
    
    // Cake base (cylinder)
    const cakeGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.6, 16);
    const cakeMaterial = new THREE.MeshLambertMaterial({ color: 0xffb6c1 });
    cake = new THREE.Mesh(cakeGeometry, cakeMaterial);
    cake.position.y = 0.3;
    cake.castShadow = true;
    cake.receiveShadow = true;
    
    // Cake frosting (smaller cylinder on top)
    const frostingGeometry = new THREE.CylinderGeometry(1.1, 1.1, 0.2, 16);
    const frostingMaterial = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const frosting = new THREE.Mesh(frostingGeometry, frostingMaterial);
    frosting.position.y = 0.7;
    frosting.castShadow = true;
    
    cakeGroup.add(cake);
    cakeGroup.add(frosting);
    scene.add(cakeGroup);
}

function createPaper(THREE) {
    // Paper tag on cake
    const paperGeometry = new THREE.PlaneGeometry(0.4, 0.6);
    const paperMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xfffff0,
        transparent: true,
        opacity: 0.9
    });
    
    paper = new THREE.Mesh(paperGeometry, paperMaterial);
    paper.position.set(1, 1.2, 0);
    paper.rotation.y = -0.3;
    paper.name = 'paper';
    paper.userData = { interactive: true };
    
    // Add gentle glow animation
    paper.userData.originalColor = 0xfffff0;
    
    scene.add(paper);
}

function createCandle(THREE) {
    const candleGroup = new THREE.Group();
    
    // Candle stick
    const candleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
    const candleMaterial = new THREE.MeshLambertMaterial({ color: 0xffff99 });
    const candleStick = new THREE.Mesh(candleGeometry, candleMaterial);
    candleStick.position.y = 1;
    candleStick.castShadow = true;
    
    // Flame (sphere)
    const flameGeometry = new THREE.SphereGeometry(0.08, 8, 6);
    const flameMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xff6600,
        transparent: true,
        opacity: 0.8
    });
    flame = new THREE.Mesh(flameGeometry, flameMaterial);
    flame.position.y = 1.35;
    flame.name = 'flame';
    flame.userData = { interactive: true };
    
    candleGroup.add(candleStick);
    candleGroup.add(flame);
    candleGroup.position.set(0, 0, 0);
    
    candle = candleGroup;
    scene.add(candleGroup);
}

function setupRaycasting(THREE) {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
}

function setupInteractions(container) {
    const canvas = container.querySelector('canvas');
    if (!canvas) return;
    
    // Mouse/touch event handlers
    function handlePointerEvent(event) {
        event.preventDefault();
        
        const rect = canvas.getBoundingClientRect();
        const clientX = event.clientX || (event.touches && event.touches[0].clientX);
        const clientY = event.clientY || (event.touches && event.touches[0].clientY);
        
        if (clientX === undefined || clientY === undefined) return;
        
        mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1;
        
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(scene.children, true);
        
        for (let intersect of intersects) {
            const object = intersect.object;
            if (object.userData.interactive) {
                if (object.name === 'paper') {
                    handlePaperClick();
                    break;
                } else if (object.name === 'flame') {
                    handleCandleBlow();
                    break;
                }
            }
        }
    }
    
    // Add event listeners for both mouse and touch
    canvas.addEventListener('click', handlePointerEvent);
    canvas.addEventListener('touchend', handlePointerEvent);
    
    // Keyboard accessibility
    canvas.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            // Default to paper interaction if visible, otherwise candle
            if (paper.visible) {
                handlePaperClick();
            } else if (flame.visible) {
                handleCandleBlow();
            }
        }
    });
    
    // Make canvas focusable
    canvas.setAttribute('tabindex', '0');
    canvas.setAttribute('role', 'button');
    canvas.setAttribute('aria-label', 'Interactive birthday cake - press Enter or click to interact');
}

function handlePaperClick() {
    if (!paper.visible) return;
    
    console.log('3D Paper clicked');
    
    // Animate paper flip and fade
    const startRotation = paper.rotation.y;
    const targetRotation = startRotation + Math.PI;
    const startOpacity = paper.material.opacity;
    
    let progress = 0;
    const duration = 800;
    const startTime = Date.now();
    
    function animatePaper() {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);
        
        // Rotation animation
        paper.rotation.y = startRotation + (targetRotation - startRotation) * progress;
        
        // Opacity animation
        paper.material.opacity = startOpacity * (1 - progress);
        
        if (progress < 1) {
            requestAnimationFrame(animatePaper);
        } else {
            paper.visible = false;
        }
    }
    
    animatePaper();
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('paper:clicked'));
}

function handleCandleBlow() {
    if (!flame.visible) return;
    
    console.log('3D Candle blown');
    
    // Animate flame extinguish
    const startScale = flame.scale.clone();
    const startOpacity = flame.material.opacity;
    
    let progress = 0;
    const duration = 600;
    const startTime = Date.now();
    
    function animateFlame() {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);
        
        // Scale down
        const scale = 1 - progress;
        flame.scale.set(scale, scale, scale);
        
        // Fade out
        flame.material.opacity = startOpacity * (1 - progress);
        
        if (progress < 1) {
            requestAnimationFrame(animateFlame);
        } else {
            flame.visible = false;
        }
    }
    
    animateFlame();
    
    // Dispatch custom event
    document.dispatchEvent(new CustomEvent('candle:blown'));
}

function animate() {
    if (isPaused) return;
    
    animationId = requestAnimationFrame(animate);
    
    // Gentle floating animation for paper
    if (paper && paper.visible) {
        const time = Date.now() * 0.001;
        paper.position.y = 1.2 + Math.sin(time * 2) * 0.05;
        
        // Gentle glow effect
        const glowIntensity = 0.5 + Math.sin(time * 3) * 0.2;
        paper.material.emissive.setHex(0x444444);
        paper.material.emissiveIntensity = glowIntensity;
    }
    
    // Flame flicker animation
    if (flame && flame.visible) {
        const time = Date.now() * 0.001;
        flame.position.y = 1.35 + Math.sin(time * 8) * 0.02;
        flame.scale.setScalar(1 + Math.sin(time * 6) * 0.1);
    }
    
    // Render scene
    renderer.render(scene, camera);
}

function pauseAnimation() {
    isPaused = true;
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
}

function resumeAnimation() {
    isPaused = false;
    animate();
}

function handleResize(container) {
    if (!renderer || !camera) return;
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    
    renderer.setSize(width, height);
    
    // Re-clamp pixel ratio
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(pixelRatio);
}

function cleanup() {
    isPaused = true;
    
    if (animationId) {
        cancelAnimationFrame(animationId);
    }
    
    if (renderer) {
        const canvas = renderer.domElement;
        if (canvas && canvas.parentNode) {
            canvas.parentNode.removeChild(canvas);
        }
        renderer.dispose();
    }
    
    // Clean up geometries and materials
    if (scene) {
        scene.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
    }
    
    scene = camera = renderer = cake = paper = candle = flame = null;
    raycaster = mouse = null;
    isInitialized = false;
}

export function cleanupThreeScene() {
    cleanup();
}