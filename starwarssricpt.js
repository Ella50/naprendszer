// Alap Three.js setup


const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);


let currentFocus = null; // Tracks which object is currently centered
const originalCameraPosition = new THREE.Vector3(0, 15, 55);



// OrbitControls
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxDistance = 500;
camera.position.set(0, 10, 50);
controls.update();


const ambientLight = new THREE.AmbientLight(0x333333, 0.5);
scene.add(ambientLight);

// Texture loader
const loadingManager = new THREE.LoadingManager(
    () => console.log("All textures loaded"),
    (url, loaded, total) => console.log(`Loading ${url} (${loaded}/${total})`),
    (url) => console.error(`Error loading ${url}`)
);
const textureLoader = new THREE.TextureLoader(loadingManager);



// Enable shadows
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

// Fények
const sunLight = new THREE.PointLight(0xffffee, 2, 1000);
sunLight.position.set(0, 0, 0);
sunLight.decay = 2;
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 3000;
sunLight.shadow.mapSize.height = 3000;
scene.add(sunLight);

const dirLight = new THREE.DirectionalLight(0xffffee, 0.5);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);



// Nap generálása
const sunTexture = textureLoader.load(
    'kepek/deathStar.png',

);

const sunGeometry = new THREE.SphereGeometry(15, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
    map: sunTexture,
    //color: 0xffcc00,
    transparent: false,
    blending: THREE.AdditiveBlending
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);
sun.rotation.z = 0.3;



//const glowLayers = [6, 8, 10];
/*glowLayers.forEach(size => {
    const glowGeometry = new THREE.SphereGeometry(size, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        //color: 0xff9900,
        transparent: true,
        opacity: 0.3 * (1 - (size/15)),
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(glow);
});*/



// Háttér
/*const galaxyTexture = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/galaxy.png');
scene.background = galaxyTexture;*/

// Csillagok
function createStarfield() {
    const geometry = new THREE.BufferGeometry();
    const material = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.15,
        sizeAttenuation: true
    });
    
    const vertices = [];
    for (let i = 0; i < 10000; i++) {
        vertices.push(
            (Math.random() - 0.5) * 2500,
            (Math.random() - 0.5) * 2500,
            (Math.random() - 0.5) * 2500
        );
    }
    
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    const stars = new THREE.Points(geometry, material);
    scene.add(stars);
}
createStarfield();



const planetTextures = {
    // REAL SOLAR SYSTEM (accurate textures)
    real: {
        mercury: 'kepek/2k_mercury.jpg',    
        venus: 'kepek/2k_venus_surface.jpg',
        earth: 'https://threejs.org/examples/textures/planets/earth_atmos_2048.jpg',
        mars: 'kepek/2k_mars.jpg',
        jupiter: 'kepek/2k_jupiter.jpg',
        saturn: 'kepek/2k_saturn.jpg',
        uranus: 'kepek/2k_uranus.jpg',
        neptune: 'kepek/2k_neptune.jpg'
    },
    
      // RANDOM PLANETS (all direct image links)
        random: [
        'https://threejs.org/examples/textures/planets/earth_clouds_1024.png', // Cloudy
        'https://threejs.org/examples/textures/planets/moon_1024.jpg', // Moon-like
        'kepek/2k_eris_fictional.jpg', // Icy
        'kepek/2k_ceres_fictional.jpg', // Rocky
        'kepek/2k_makemake_fictional.jpg',
        'kepek/2k_haumea_fictional.jpg', // White
        'kepek/2k_venus_atmosphere.jpg' // Gas clouds
        ],
    starWars: {
        coruscant: 'kepek/coruscant.png',
        tatooine: 'kepek/tatooine.png',
        kashyyyk: 'kepek/kashyyyk.png',
        naboo: 'kepek/naboo.png',
        mustafar: 'kepek/mustafar.png',
        deathStar: 'kepek/deathStar.png',
        dagobah: 'kepek/dagobah.png',
        hoth: 'kepek/hoth.png',
        alderaan: 'kepek/alderaan.png'
    },
};


const focusIndicator = document.createElement('div');
focusIndicator.style.position = 'absolute';
focusIndicator.style.bottom = '20px';
focusIndicator.style.left = '20px';
focusIndicator.style.color = 'white';
focusIndicator.style.fontSize = '25px';
focusIndicator.style.backgroundColor = 'rgba(0,0,0,0.7)';
focusIndicator.style.textShadow = '0 0 5px rgba(255,255,255,0.5)';
document.body.appendChild(focusIndicator);


// Bolygó generátor osztály
class PlanetSystem {
    constructor() {
        this.planets = [];
        this.orbits = [];
    }

    clear() {
        this.planets.forEach(planet => scene.remove(planet.mesh));
        this.orbits.forEach(orbit => scene.remove(orbit));
        this.planets = [];
        this.orbits = [];
    }

    createPlanet(size, distance, speed, name, isGasGiant = true, hasRings = false, textureUrl) {
        const geometry = new THREE.SphereGeometry(size, 64, 64);
        //const textureUrl = isGasGiant ? this.textures.jupiter : this.textures.earth;
        
        const material = new THREE.MeshStandardMaterial({
            map: textureLoader.load(textureUrl),
            roughness: isGasGiant ? 0.8 : 0.5,
            metalness: isGasGiant ? 0.2 : 0.1,
            bumpScale: isGasGiant ? 0.1 : 0.05
        });

        textureLoader.load(
            textureUrl,
            (texture) => {
                material.map = texture;
                material.needsUpdate = true;
            },
            undefined,
            (err) => {
                console.error(`Error loading texture ${textureUrl}:`, err);
                material.color.setHex(isGasGiant ? 0xffaa33 : 0x3399ff);
            }
        );
        
        const planet = new THREE.Mesh(geometry, material);
        planet.castShadow = true;
        planet.receiveShadow = true;
        planet.position.x = distance;
        planet.rotation.z = Math.random() * 0.5 - 0.25;
        
        if (!isGasGiant) {
            this.createAtmosphere(planet, size);
        }
        
        if (hasRings) {
            this.createRings(planet, size);
        }
        
        scene.add(planet);
        this.planets.push({ mesh: planet, distance, speed, name });
    }


    

    focusOn(planetMesh) {
        if (currentFocus === planetMesh) {
            // If already focused, return to sun view
            this.focusOnSun();
            return;
        }
        
        currentFocus = planetMesh;

        const planetData = this.planets.find(p => p.mesh === planetMesh);
        if (!planetData) return; // Safety check

        const direction = new THREE.Vector3()
            .subVectors(planetMesh.position, camera.position)
            .normalize();
    
        // Calculate distance based on planet size with minimum distance
        const planetSize = planetMesh.geometry.parameters.radius;
        const distance = Math.min(
            Math.max(planetSize * 8, 15), // Minimum distance ---------------------------------
            50 // Maximum distance
        );
        
        // Target position with slight elevation
        const targetPosition = new THREE.Vector3()
            .copy(planetMesh.position)
            .addScaledVector(direction, -distance);
        targetPosition.y += distance * 0.3;
    
        // Animate camera
        gsap.to(camera.position, {
            x: targetPosition.x,
            y: targetPosition.y,
            z: targetPosition.z,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => {
                camera.lookAt(planetMesh.position);
                controls.target.copy(planetMesh.position);
            }
            });

        planetMesh.material.emissive = new THREE.Color(0x333333);
        planetMesh.material.emissiveIntensity = 0.3;
        planetMesh.material.needsUpdate = true;
    
        // Remove highlight from other planets
        this.planets.forEach(p => {
            if (p.mesh !== planetMesh) {
                p.mesh.material.emissiveIntensity = 0;
                p.mesh.material.needsUpdate = true;
            }
        });
        focusIndicator.textContent = `Középpont: ${planetData.name}`;
    }

    focusOnSun() {
        currentFocus = null;
        
        gsap.to(camera.position, {
            x: originalCameraPosition.x,
            y: originalCameraPosition.y,
            z: originalCameraPosition.z,
            duration: 1.5,
            ease: "power2.inOut",
            onUpdate: () => {
                camera.lookAt(0, 0, 0);
                controls.target.set(0, 0, 0);
            }
        });

        this.planets.forEach(p => {
            p.mesh.material.emissiveIntensity = 0;
            p.mesh.material.needsUpdate = true;
        });
        focusIndicator.textContent = 'Középpont: Halálcsillag';
    }

    createAtmosphere(planet, size) {
        const geometry = new THREE.SphereGeometry(size * 1.1, 64, 64);
        const material = new THREE.MeshPhongMaterial({
            color: 0x00aaff,
            transparent: true,
            opacity: 0.2,
            shininess: 10
        });
        const atmosphere = new THREE.Mesh(geometry, material);
        planet.add(atmosphere);
    }

    createRings(planet, size) {
        const ringGeometry = new THREE.RingGeometry(size * 1.5, size * 2.5, 64);
        const ringMaterial = new THREE.MeshStandardMaterial({
            color: 0xcccccc,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
            roughness: 0.8
        });
        const rings = new THREE.Mesh(ringGeometry, ringMaterial);
        rings.rotation.x = Math.PI / 2;
        planet.add(rings);
    }
}

// Solar System instances
const planetSystem = new PlanetSystem();

function createOrbitPath(distance) {
    const geometry = new THREE.BufferGeometry().setFromPoints(
        new THREE.EllipseCurve(0, 0, distance, distance, 0, Math.PI * 2, false, 0)
            .getPoints(100)
    );
    const material = new THREE.LineBasicMaterial({ 
        color: 0x555555,
        transparent: true,
        opacity: 0.5
    });
    return new THREE.Line(geometry, material);
}

function createStarWarsSystem() {
    planetSystem.clear();

    const starWarsSolarSystem = [
        { name: "Naboo", size: 3.86, distance: 80, speed: 0.02, isGasGiant: true, texture: planetTextures.starWars.naboo },
        { name: "Tatooine", size: 3.33, distance: 100, speed: 0.015, isGasGiant: true, texture: planetTextures.starWars.tatooine },
        { name: "Coruscant", size: 3.9, distance: 40, speed: 0.01, isGasGiant: true, texture: planetTextures.starWars.coruscant },
        { name: "Kashyyyk", size: 3.94, distance: 90, speed: 0.008, isGasGiant: true, texture: planetTextures.starWars.kashyyyk },
        { name: "Dagobah", size: 2.84, distance: 120, speed: 0.004, isGasGiant: true, texture: planetTextures.starWars.dagobah },
        { name: "Mustafar", size: 1.34, distance: 130, speed: 0.003, isGasGiant: true, texture: planetTextures.starWars.mustafar },
        { name: "Alderaan", size: 3.98, distance: 60, speed: 0.002, isGasGiant: false, texture: planetTextures.starWars.alderaan },
        { name: "Hoth", size: 2.29, distance: 150, speed: 0.0018, isGasGiant: true, texture: planetTextures.starWars.hoth},
    ];

     starWarsSolarSystem.forEach(planet => {
        planetSystem.createPlanet(
            planet.size,
            planet.distance,
            planet.speed,
            planet.name,
            planet.isGasGiant,
            planet.hasRings,
            planet.texture
        );
    });
}

// Button setup
const randomBtn = document.createElement('button');
randomBtn.innerText = 'Random naprendszer';
randomBtn.classList.add('fogombok');
randomBtn.style.position = 'absolute';
randomBtn.style.top = '20px';
randomBtn.style.left = '20px';
randomBtn.style.padding = '10px';

createStarWarsSystem();

const starWarsBtn = document.createElement('button');
starWarsBtn.innerText = 'Vissza';
starWarsBtn.classList.add('fogombok');
starWarsBtn.style.position = 'absolute';
starWarsBtn.style.top = '20px';
starWarsBtn.style.margin = 'auto' ;
starWarsBtn.style.padding = '10px';
starWarsBtn.addEventListener('click', () => {
    window.location.href = 'index.html';
    
});
document.body.appendChild(starWarsBtn);

// Animáció
function animate() {
    requestAnimationFrame(animate);
    planetSystem.planets.forEach(planet => {
        // Only update orbital position if not the focused planet
        if (currentFocus !== planet.mesh) {
            planet.mesh.position.x = Math.cos(Date.now() * 0.0005 * planet.speed) * planet.distance;
            planet.mesh.position.z = Math.sin(Date.now() * 0.0005 * planet.speed) * planet.distance;
        }
        
        // Always rotate on axis
        planet.mesh.rotation.y += 0.005;
    });

    // Rotate the focused planet slightly faster for emphasis
    if (currentFocus && currentFocus !== sun) {
        currentFocus.rotation.y += 0.01;
    }

    controls.update();
    renderer.render(scene, camera);
}
animate();

const editor = document.createElement('div');
editor.id = 'system-editor';
editor.style.letterSpacing = '1.5px';
editor.style.position = 'absolute';

editor.style.backgroundColor = 'rgba(0,0,0,0.85)';
editor.style.padding = '25px';
editor.style.borderRadius = '10px';
editor.style.color = 'white';
editor.style.display = 'none';
editor.style.zIndex = '100%';
editor.style.maxHeight = '80%';
editor.style.overflowY = 'auto';


// Editor tartalma
editor.innerHTML = `
<div class="editor-content">
    <h2 style="text-align:center; margin-top: 0; margin-bottom: 80px">Saját Naprendszer Szerkesztő</h2>
    
    <div class="form-actions">
        <button id="generate-system-btn" class="btn btn-primary">
            Rendszer generálása
        </button>
        <button id="cancel-edit-btn" class="btn btn-danger">
            Mégse
        </button>
    </div>
    
    <div class="form-group">
        <h3>Naprendszer neve</h3>
        <input type="text" id="system-name" class="form-control" placeholder="Add meg a naprendszer nevét">
    </div>
    
    <h3>Bolygók</h3>
    <div id="planet-forms-container"></div>
        
    <div class="button-container">
        <button id="add-planet-btn" class="btn btn-secondary">
            Új bolygó hozzáadása
        </button>
    </div>
</div>
`;

// Stílusok hozzáadása
const style = document.createElement('style');
style.innerHTML = `
    /* Alap stílusok */
    #system-editor {

        position: fixed;
        top: 55% !important; 
        left: 50% !important;
        transform: translate(-50%, -50%) !important;
        width: 80%;
        max-width: 800px;
        background: rgba(0,0,0,0.95);
        padding: 10px;
        border-radius: 15px;
        color: white;
        z-index: 1000;
        box-shadow: 0 0 30px rgba(0,0,0,0.7);
        border: 1px solid #444;
        overflow-y: auto;
        max-height: 90vh;
        display: none; /* Keep it hidden by default */
    }

    

    #system-name{
        width: 97%;

    }

    /* Gomb konténer */
    .button-container {
        display: flex;
        justify-content: center;
        bottom: 0px;


    }

    /* Fő gombok */
    .btn {
        padding: 12px 25px;
        margin: 0 10px;
        border: none;
        border-radius: 8px;
        cursor: pointer;
        font-weight: bold;
        font-size: 16px;
        text-align: center;
        transition: all 0.2s;
        min-width: 180px;
        font-family: 'Bebas Neue', sans-serif;
        letter-spacing: 1px;
        font-size: 13pt !important;
        font-weight: normal;
    }

    /* Gomb állapotok */
    .btn:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }
    
    .btn:active {
        transform: translateY(1px);
    }

    /* Gomb típusok */
    .btn-primary {
        background: linear-gradient(145deg, #4CAF50, #388E3C);
        color: white;
        height: 45px;

        top: 80px;

    }

    .btn-secondary {
        background: linear-gradient(145deg, #2196F3, #1976D2);
        color: white;
        height: 45px;
        left: 0px;
        margin-top: 0 !important;
        position: relative;

    }

    .btn-danger {
        background: linear-gradient(145deg, #f44336, #d32f2f);
        color: white;
        height: 45px;
        top: 80px;
        left: 220px;

    }

    /* Törlés gomb */
    .remove-planet-btn {
        position: absolute;
        top: 15px;
        right: 0;
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 30px;
        height: 30px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
        cursor: pointer;
        transition: all 0.2s;


    }

    .remove-planet-btn:hover {
        background: #ff0000;
        transform: scale(1.1);
    }

    /* Form-actions konténer */
    .form-actions {
        display: flex;
        justify-content: center;
        gap: 20px;
        margin-bottom: 20px;
        flex-wrap: wrap;
    }

    #add-planet-btn{



    }

    /* Bolygó form stílus */
    .planet-form {
        background: rgba(255,255,255,0.08);
        padding: 20px;
        margin-bottom: 10px;
        border-radius: 10px;
        position: relative;
        border: 1px solid rgba(255,255,255,0.1);
    }

    #planet-forms-container {

            overflow-y: auto;

    }

    #szín{
        height: 40px;


    }

    /* Grid layout */
    .grid-container {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 15px;
    }

    /* Input mezők */
    .form-control {
        width: 100%;
        padding: 10px;
        border-radius: 6px;
        border: 1px solid #444;
        background-color: rgba(0,0,0,0.5);
        color: white;
        font-size: 14px;
    }

    #nev, #meret, #tav, #gyorsasag, #szín{
        width: 280px;

    }

    /* Címek */
    h2, h3, h4 {
        color: #ffcc00;
        margin-bottom: 15px;

    }

    h4{
        text-align: center;

    }

    .editor-content {
        position: relative;
        max-height: 70vh;
        overflow-y: auto;
        padding: 20px;
    }




    /* Reszponzív beállítások */
    @media (max-width: 768px) {
        #system-editor {
            width: 95%;
            padding: 20px;
        }
        
        .btn {
            min-width: 140px;
            padding: 10px 15px;
        }
        
        .form-actions {
            flex-direction: column;
            gap: 10px;
        }
    }

    @media (max-width: 480px) {
        .grid-container {
            grid-template-columns: 1fr;
        }
        
        #system-editor {
            top: 50px;
        }
    }
`;
document.head.appendChild(style);
document.body.appendChild(editor);


function createPlanetForm(planetData = {}, index = 0) {
    const defaultData = {
        name: `Bolygó ${index + 1}`,
        size: (Math.random() * 2 + 1).toFixed(1),
        distance: (index + 1) * 20,
        speed: (Math.random() * 0.02 + 0.01).toFixed(3),
        color: '#' + Math.floor(Math.random()*16777215).toString(16),
        isGasGiant: false,
        hasRings: false,
        texture: ''
    };
    
    const data = {...defaultData, ...planetData};
    
    return `
        <div class="planet-form" data-index="${index}">
            <div id="elsoSor">
                <button class="remove-planet-btn">×</button>
                <h4>${data.name}</h4>
            </div>

            
            <div class="grid-container">
                <div class="form-group">
                    <label>Név</label>
                    <input type="text" id="nev" class="planet-name form-control" value="${data.name}">
                </div>
                
                <div class="form-group">
                    <label>Szín</label>
                    <input type="color" id="szín" class="planet-color form-control" value="${data.color}">
                </div>
                
                <div class="slider-container">
                    <label>Méret: <span class="slider-value">${data.size}</span></label>
                    <input type="range" id="meret" class="planet-size form-control" min="0.5" max="15" step="0.1" value="${data.size}">
                </div>
                
                <div class="slider-container">
                    <label>Távolság: <span class="slider-value">${data.distance}</span></label>
                    <input type="range" id="tav" class="planet-distance form-control" min="10" max="200" step="1" value="${data.distance}">
                </div>
                
                <div class="slider-container">
                    <label>Sebesség: <span class="slider-value">${data.speed}</span></label>
                    <input type="range" id="gyorsasag" class="planet-speed form-control" min="0.001" max="0.05" step="0.001" value="${data.speed}">
                </div>
                
                <div class="form-group">
                    <label style="padding-top:35px">
                        <input type="checkbox" id="gazOrias" class="planet-gasgiant" ${data.isGasGiant ? 'checked' : ''}>
                        Gázóriás
                    </label><br>
                    <label>
                        <input type="checkbox" id="gyuruk" class="planet-rings" ${data.hasRings ? 'checked' : ''}>
                        Van gyűrűje
                    </label>
                </div>
                

                
                <div class="form-group">
                    <label>Textúra (opcionális)</label>
                    <input type="text" id="textura" class="planet-texture form-control" placeholder="Textúra URL" value="${data.texture}">
                </div>
            </div>
        </div>
    `;
}

let currentPlanetCount = 0;

// Bolygó hozzáadása
document.getElementById('add-planet-btn').addEventListener('click', () => {
    const container = document.getElementById('planet-forms-container');
    const newForm = createPlanetForm({}, currentPlanetCount);
    
    // Animáció hozzáadása az új formhoz
    container.insertAdjacentHTML('beforeend', newForm);
    const newFormElement = container.lastElementChild;
    newFormElement.style.opacity = '0';
    newFormElement.style.transform = 'translateY(20px)';
    newFormElement.style.transition = 'all 0.3s ease';
    
    setTimeout(() => {
        newFormElement.style.opacity = '1';
        newFormElement.style.transform = 'translateY(0)';
    }, 10);
    
    currentPlanetCount++;
    setupSliders();
    updatePlanetNumbers();
});

// Bolygó eltávolítása
document.addEventListener('click', (e) => {
    if (e.target.classList.contains('remove-planet-btn')) {
        const formToRemove = e.target.closest('.planet-form');
        formToRemove.style.transform = 'translateX(-100%)';
        formToRemove.style.opacity = '0';
        
        setTimeout(() => {
            formToRemove.remove();
            updatePlanetNumbers();
        }, 300);
    }
});

document.getElementById('cancel-edit-btn').addEventListener('click', () => {
    editor.style.display = 'none';
});

// Csúszkák értékeinek frissítése
function setupSliders() {
    document.querySelectorAll('input[type="range"]').forEach(slider => {
        const display = slider.parentElement.querySelector('.slider-value');
        display.textContent = slider.value;
        
        slider.addEventListener('input', () => {
            display.textContent = slider.value;
        });
    });
}

// Bolygók számozásának frissítése
function updatePlanetNumbers() {
    document.querySelectorAll('.planet-form').forEach((form, i) => {
        form.querySelector('h4').textContent = `Bolygó ${i + 1}`;
        form.dataset.index = i;
    });
    currentPlanetCount = document.querySelectorAll('.planet-form').length;
}

function createPlanetPreview(color, isGasGiant) {
    const preview = document.createElement('div');
    preview.style.width = '50px';
    preview.style.height = '50px';
    preview.style.borderRadius = '50%';
    preview.style.background = color;
    return preview;
}

// Stílus hozzáadása
const savedSystemsStyle = document.createElement('style');


// Tooltip
const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
tooltip.style.color = 'white';
tooltip.style.padding = '5px 10px';
tooltip.style.borderRadius = '5px';
tooltip.style.fontSize = '20px';
tooltip.style.display = 'none';
document.body.appendChild(tooltip);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    const intersects = raycaster.intersectObjects(
        [sun, ...planetSystem.planets.map(p => p.mesh)]
    );

    

    if (intersects.length > 0) {
        const planet = intersects[0].object;
        const planetData = planet === sun 
            ? { name: "Sun", mesh: sun }
            : planetSystem.planets.find(p => p.mesh === planet);
        
        if (planetData) {
            // Show pointer cursor
            renderer.domElement.style.cursor = 'pointer';
            
            // Update tooltip for planets (keep your existing tooltip code)
            if (planet !== sun) {
                tooltip.innerText = planetData.name;
                tooltip.style.left = `${event.clientX + 10}px`;
                tooltip.style.top = `${event.clientY + 10}px`;
                tooltip.style.display = 'block';
            }
        }
    } else {
        // Reset to default cursor
        renderer.domElement.style.cursor = '';
        tooltip.style.display = 'none';
    }
});


window.addEventListener('click', (event) => {
    if (event.target.tagName === 'BUTTON') return;
    
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    const intersects = raycaster.intersectObjects(
        [sun, ...planetSystem.planets.map(p => p.mesh)]
    );

    if (intersects.length > 0) {
        const clickedObject = intersects[0].object;
        if (clickedObject === sun) {
            planetSystem.focusOnSun();
        } else {
            planetSystem.focusOn(clickedObject);
        }
    }
});


planetSystem.focusOnSun();

// Resize handler
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

planetSystem.focusOnSun();