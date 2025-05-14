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
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
scene.add(sunLight);

const dirLight = new THREE.DirectionalLight(0xffffee, 0.5);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);



// Nap generálása
const sunTexture = textureLoader.load(
    'kepek/2k_sun.jpg',

    () => {
        sun.material.color.set(0xffcc00);
    }
);

const sunGeometry = new THREE.SphereGeometry(5, 64, 64);
const sunMaterial = new THREE.MeshBasicMaterial({
    map: sunTexture,
    color: 0xffcc00,
    transparent: false,
    blending: THREE.AdditiveBlending
});
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);



const glowLayers = [6, 8, 10];
glowLayers.forEach(size => {
    const glowGeometry = new THREE.SphereGeometry(size, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0xff9900,
        transparent: true,
        opacity: 0.3 * (1 - (size/15)),
        blending: THREE.AdditiveBlending
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(glow);
});

const deathStarTexture = textureLoader.load(
    'kepek/deathStar.png',

    () => {
        DS.material.color.set(0xffcc00);
    }
);

const DSGeometry = new THREE.SphereGeometry(5, 64, 64);
const DSMaterial = new THREE.MeshBasicMaterial({
    map: deathStarTexture,
    color: 0xffcc00,
    transparent: false,
    blending: THREE.AdditiveBlending
});
const DS = new THREE.Mesh(DSGeometry, DSMaterial);
scene.add(DS);

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
        focusIndicator.textContent = 'Középpont: Nap';
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


// Gombok
function createRandomSystem() {
    planetSystem.clear();
    const numPlanets = Math.floor(Math.random() * 6) + 3;
    for (let i = 0; i < numPlanets; i++) {
        const isGasGiant = Math.random() > 0.7;
        const randomTexture = planetTextures.random[
            Math.floor(Math.random() * planetTextures.random.length)
        ];
        planetSystem.createPlanet(
            Math.random() * 2 + 1,
            (i + 1) * (Math.random() * 5 + 15),
            Math.random() * 0.02 + 0.01,
            `Bolygó ${i+1}`,
            isGasGiant,
            isGasGiant && Math.random() > 0.5,
            randomTexture 
        );
    }
}

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

function createRealSystem() {
    planetSystem.clear();

    const realSolarSystem = [
        { name: "Merkúr", size: 1.5, distance: 28, speed: 0.02, isGasGiant: true, texture: planetTextures.real.mercury },
        { name: "Vénusz", size: 3.7, distance: 40, speed: 0.015, isGasGiant: true, texture: planetTextures.real.venus },
        { name: "Föld", size: 3.9, distance: 55, speed: 0.01, isGasGiant: true, texture: planetTextures.real.earth },
        { name: "Mars", size: 2.1, distance: 75, speed: 0.008, isGasGiant: true, texture: planetTextures.real.mars },
        { name: "Jupiter", size: 12, distance: 100, speed: 0.004, isGasGiant: true, texture: planetTextures.real.jupiter },
        { name: "Szaturnusz", size: 10, distance: 130, speed: 0.003, isGasGiant: true, hasRings: true, texture: planetTextures.real.saturn },
        { name: "Uránusz", size: 7, distance: 160, speed: 0.002, isGasGiant: true, texture: planetTextures.real.uranus },
        { name: "Neptunusz", size: 6.8, distance: 190, speed: 0.0018, isGasGiant: true, texture: planetTextures.real.neptune}
    ];

    realSolarSystem.forEach(planet => {
        planetSystem.createPlanet(
            planet.size,
            planet.distance,
            planet.speed,
            planet.name,
            planet.isGasGiant,
            planet.hasRings,
            planet.texture
        );

        /*const orbit = createOrbitPath(planet.distance);
        scene.add(orbit);
        planetSystem.orbits.push(orbit);*/
    });
}
function createStarWarsSystem() {
    planetSystem.clear();

    const starWarsSolarSystem = [
        { name: "Naboo", size: 1.5, distance: 28, speed: 0.02, isGasGiant: true, texture: planetTextures.starWars.naboo },
        { name: "Tatooine", size: 3.7, distance: 40, speed: 0.015, isGasGiant: true, texture: planetTextures.starWars.tatooine },
        { name: "Coruscant", size: 3.9, distance: 55, speed: 0.01, isGasGiant: true, texture: planetTextures.starWars.coruscant },
        { name: "Kashyyyk", size: 2.1, distance: 75, speed: 0.008, isGasGiant: true, texture: planetTextures.starWars.kashyyyk },
        { name: "Dagobah", size: 12, distance: 100, speed: 0.004, isGasGiant: false, texture: planetTextures.starWars.dagobah },
        { name: "Mustafar", size: 10, distance: 130, speed: 0.003, isGasGiant: true, texture: planetTextures.starWars.mustafar },
        { name: "Alderaan", size: 7, distance: 160, speed: 0.002, isGasGiant: false, texture: planetTextures.starWars.alderaan },
        { name: "Hoth", size: 6.8, distance: 190, speed: 0.0018, isGasGiant: false, texture: planetTextures.starWars.hoth},
        { name: "Death Star", size: 3.0, distance: 0, speed: 0.00000001, isGasGiant: false, texture: planetTextures.starWars.deathStar }
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

randomBtn.addEventListener('click', () => {
    // Reset view first if currently focused on a planet
    if (currentFocus && currentFocus !== sun) {
        planetSystem.focusOnSun();
        setTimeout(createRandomSystem, 1500); // Wait for camera to reset
    } else {
        createRandomSystem();
    }
});
document.body.appendChild(randomBtn);

const realBtn = document.createElement('button');
realBtn.innerText = 'Valós naprendszer';
realBtn.classList.add('fogombok');
realBtn.style.position = 'absolute';
realBtn.style.top = '20px';
realBtn.style.left = '210px';
realBtn.style.padding = '10px';

realBtn.addEventListener('click', () => {
    if (currentFocus && currentFocus !== sun) {
        planetSystem.focusOnSun();
        setTimeout(createRealSystem, 1500); // Wait for camera to reset
    } else {
        createRealSystem();
    }
});
document.body.appendChild(realBtn);


const starWarsBtn = document.createElement('button');
starWarsBtn.innerText = 'Star Wars naprendszer';
starWarsBtn.style.position = 'absolute';
starWarsBtn.style.top = '20px';
starWarsBtn.style.left = '550px';
starWarsBtn.style.padding = '10px';
starWarsBtn.style.fontSize = '16px';
starWarsBtn.addEventListener('click', () => {
    if (currentFocus && currentFocus !== DS) {
        planetSystem.focusOnSun();
        setTimeout(createStarWarsSystem, 1500); // Wait for camera to reset
    } else {
        createStarWarsSystem();
    }
});
document.body.appendChild(starWarsBtn);

const customBtn = document.createElement('button');
customBtn.innerText = 'Saját naprendszer';
customBtn.classList.add('fogombok');
customBtn.style.position = 'absolute';
customBtn.style.top = '20px';
customBtn.style.left = '385px'; // Adjust position as needed
customBtn.style.padding = '10px';

document.body.appendChild(customBtn);

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

// Szerkesztő megnyitása
customBtn.addEventListener('click', () => {
    editor.style.display = 'block';
    document.getElementById('planet-forms-container').innerHTML = createPlanetForm({}, 0);
    currentPlanetCount = 1;
    setupSliders();
});

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

// Generálás gomb
document.getElementById('generate-system-btn').addEventListener('click', generateCustomSystem);

// Mégse gomb
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




function generateCustomSystem() {
    // Régi rendszer törlése
    planetSystem.clear();

    
    // Rendszer nevének lekérdezése
    const systemName = document.getElementById('system-name').value || "Saját naprendszer";

    
    // Bolygó adatok gyűjtése
    const planetsData = [];
    document.querySelectorAll('.planet-form').forEach(form => {
        planetsData.push({
            name: form.querySelector('.planet-name').value,
            size: parseFloat(form.querySelector('.planet-size').value),
            distance: parseFloat(form.querySelector('.planet-distance').value),
            speed: parseFloat(form.querySelector('.planet-speed').value),
            color: form.querySelector('.planet-color').value,
            isGasGiant: form.querySelector('.planet-gasgiant').checked,
            hasRings: form.querySelector('.planet-rings').checked,
            texture: form.querySelector('.planet-texture').value
        });
    });
    
    // Bolygók létrehozása
    planetsData.forEach(planet => {
        // Ha nincs textúra megadva, használjunk alapértelmezett színt
        if (!planet.texture) {
            // Egyszerű szín alapú anyag, ha nincs textúra
            const material = new THREE.MeshStandardMaterial({
                color: new THREE.Color(planet.color),
                roughness: planet.isGasGiant ? 0.8 : 0.5,
                metalness: planet.isGasGiant ? 0.2 : 0.1
            });
            
            const planetMesh = new THREE.Mesh(
                new THREE.SphereGeometry(planet.size, 64, 64),
                material
            );
            
            planetMesh.position.x = planet.distance;
            scene.add(planetMesh);
            
            planetSystem.planets.push({
                mesh: planetMesh,
                distance: planet.distance,
                speed: planet.speed,
                name: planet.name
            });
            
            if (!planet.isGasGiant) {
                planetSystem.createAtmosphere(planetMesh, planet.size);
            }
            
            if (planet.hasRings) {
                planetSystem.createRings(planetMesh, planet.size);
            }
        } else {
            // Ha van textúra megadva
            textureLoader.load(planet.texture, (texture) => {
                const material = new THREE.MeshStandardMaterial({
                    map: texture,
                    roughness: planet.isGasGiant ? 0.8 : 0.5,
                    metalness: planet.isGasGiant ? 0.2 : 0.1
                });
                
                const planetMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(planet.size, 64, 64),
                    material
                );
                
                planetMesh.position.x = planet.distance;
                scene.add(planetMesh);
                
                planetSystem.planets.push({
                    mesh: planetMesh,
                    distance: planet.distance,
                    speed: planet.speed,
                    name: planet.name
                });
                
                if (!planet.isGasGiant) {
                    planetSystem.createAtmosphere(planetMesh, planet.size);
                }
                
                if (planet.hasRings) {
                    planetSystem.createRings(planetMesh, planet.size);
                }
            }, undefined, (err) => {
                console.error("Textúra betöltési hiba:", err);
                // Hiba esetén használjunk alap színt
                const material = new THREE.MeshStandardMaterial({
                    color: new THREE.Color(planet.color),
                    roughness: planet.isGasGiant ? 0.8 : 0.5,
                    metalness: planet.isGasGiant ? 0.2 : 0.1
                });
                
                const planetMesh = new THREE.Mesh(
                    new THREE.SphereGeometry(planet.size, 64, 64),
                    material
                );
                
                planetMesh.position.x = planet.distance;
                scene.add(planetMesh);
                planetSystem.planets.push({
                    mesh: planetMesh,
                    distance: planet.distance,
                    speed: planet.speed,
                    name: planet.name
                });
            });
        }
    });
    
    // Siker üzenet
    focusIndicator.textContent = `Betöltve: ${systemName}`;
    setTimeout(() => {
        focusIndicator.textContent = 'Középpont: Nap';
    }, 3000);
    
    saveSystem();

    // Editor bezárása
    editor.style.display = 'none';
    
    // Napra fókuszálás
    planetSystem.focusOnSun();
    systemName.innerHTML="Névtelen naprendszer";
}




function createPlanetPreview(color, isGasGiant) {
    const preview = document.createElement('div');
    preview.style.width = '50px';
    preview.style.height = '50px';
    preview.style.borderRadius = '50%';
    preview.style.background = color;
    return preview;
}





const savedSystemsPanel = document.createElement('div');
savedSystemsPanel.id = 'saved-systems-panel';
savedSystemsPanel.innerHTML = `
    <h3 style="color: #ffcc00; text-align: center; margin-top: 0; margin-bottom: 15px; letter-spacing: 2px;">Mentett Naprendszerek</h3>
    <div id="saved-systems-list"></div>
`;
document.body.appendChild(savedSystemsPanel);

// Stílus hozzáadása
const savedSystemsStyle = document.createElement('style');
savedSystemsStyle.innerHTML = `
    #saved-systems-panel {
        position: fixed;
        right: 20px;
        top: 20px;
        width: 270px;
        max-height: 300;
        height:auto;
        min-height: 120px;
        background: rgba(0,0,0,0.7);
        border: 1px solid #444;
        border-radius: 10px;
        padding: 15px;
        overflow-y: auto;
        z-index: 500;

    }
    
    .saved-system-btn {
        display: block;
        width: 250px;
        padding: 10px;
        margin: 5px 0;
        background: rgba(255,255,255,0.1);
        color: white;
        border: none;
        border-radius: 5px;
        cursor: pointer;
        text-align: center;
        transition: all 0.2s;
    }
    
    .saved-system-btn:hover {
        background: rgba(255,255,255,0.2);
    }
    
    #saved-systems-list {
        max-height: 70vh;
        overflow-y: auto;
    }

    .delete-system-btn {
        position: absolute;
        right: 0;
        top: 50%;
        transform: translateY(-50%);
        background: #ff4444;
        color: white;
        border: none;
        border-radius: 50%;
        width: 25px;
        height: 25px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .delete-system-btn:hover {
        background: #ff0000;
    }
    
    .empty-message {
        color: #aaa;
        text-align: center;
        padding: 20px 0;
        font-style: italic;
    }
`;
document.head.appendChild(savedSystemsStyle);







function saveSystem() {
    const systemName = document.getElementById('system-name').value || "Névtelen naprendszer";

    
    // Check if name is provided
    if (!systemName.trim()) {
        alert("Kérlek adj meg egy nevet a naprendszernek!");
        return;
    }

    // Collect planet data
    const planetsData = [];
    document.querySelectorAll('.planet-form').forEach(form => {
        planetsData.push({
            name: form.querySelector('.planet-name').value,
            size: parseFloat(form.querySelector('.planet-size').value),
            distance: parseFloat(form.querySelector('.planet-distance').value),
            speed: parseFloat(form.querySelector('.planet-speed').value),
            color: form.querySelector('.planet-color').value,
            isGasGiant: form.querySelector('.planet-gasgiant').checked,
            hasRings: form.querySelector('.planet-rings').checked,
            texture: form.querySelector('.planet-texture').value
        });
    });

    // Check if there are planets
    if (planetsData.length === 0) {
        alert("Kérlek adj hozzá legalább egy bolygót!");
        return;
    }

    const systemData = {
        name: systemName,
        planets: planetsData,
        createdAt: new Date().toISOString()
    };

    // Save to localStorage - using array instead of object
    let savedSystems = JSON.parse(localStorage.getItem('savedSystems')) || [];
    
    // Check if system with this name already exists
    const existingIndex = savedSystems.findIndex(sys => sys.name === systemName);
    if (existingIndex >= 0) {
        // Update existing system
        savedSystems[existingIndex] = systemData;
    } else {
        // Add new system
        savedSystems.push(systemData);
    }
    
    localStorage.setItem('savedSystems', JSON.stringify(savedSystems));
    
    updateSavedSystemsList();
    
    focusIndicator.textContent = `Mentve: ${systemName}`;
    setTimeout(() => {
        focusIndicator.textContent = 'Középpont: Nap';
    }, 2000);
}







function loadSystem(systemName) {
    const savedSystems = JSON.parse(localStorage.getItem('savedSystems') || '[]');
    const systemData = savedSystems.find(sys => sys.name === systemName);
    
    if (!systemData) {
        console.error("System not found:", systemName);
        return;
    }
    
    // Clear current system
    planetSystem.clear();
    
    // Load planets
    systemData.planets.forEach(planet => {
        // If texture is provided, use it, otherwise use color
        if (planet.texture) {
            // Load planet with texture
            planetSystem.createPlanet(
                planet.size,
                planet.distance,
                planet.speed,
                planet.name,
                planet.isGasGiant,
                planet.hasRings,
                planet.texture
            );
        } else {
            // Create a temporary material with the saved color
            const tempMaterial = new THREE.MeshStandardMaterial({
                color: new THREE.Color(planet.color),
                roughness: planet.isGasGiant ? 0.8 : 0.5,
                metalness: planet.isGasGiant ? 0.2 : 0.1
            });
            
            const geometry = new THREE.SphereGeometry(planet.size, 64, 64);
            const planetMesh = new THREE.Mesh(geometry, tempMaterial);
            planetMesh.position.x = planet.distance;
            scene.add(planetMesh);
            
            planetSystem.planets.push({
                mesh: planetMesh,
                distance: planet.distance,
                speed: planet.speed,
                name: planet.name
            });
            
            if (!planet.isGasGiant) {
                planetSystem.createAtmosphere(planetMesh, planet.size);
            }
            
            if (planet.hasRings) {
                planetSystem.createRings(planetMesh, planet.size);
            }
        }
    });
    
    // Update system name in editor
    document.getElementById('system-name').value = systemData.name;
    
    focusIndicator.textContent = `Betöltve: ${systemName}`;
    setTimeout(() => {
        focusIndicator.textContent = 'Középpont: Nap';
    }, 2000);
    
    // Focus on sun
    planetSystem.focusOnSun();
}




function updateSavedSystemsList() {
    const savedSystems = JSON.parse(localStorage.getItem('savedSystems') || []);
    const listContainer = document.getElementById('saved-systems-list');
    listContainer.innerHTML = '';
    
    if (savedSystems.length === 0) {
        listContainer.innerHTML = '<p style="color: #aaa; text-align: center;">Nincsenek mentett naprendszerek</p>';
        return;
    }

    savedSystems.forEach((system, index) => {
        const container = document.createElement('div');
        container.style.display = 'flex';
        container.style.margin = '5px 0';
        container.style.alignItems = 'center';
        
        const btn = document.createElement('button');
        btn.className = 'saved-system-btn';

        btn.textContent = system.name;
        btn.style.textAlign= 'center';
        btn.style.marginTop =  `${index * 45 + 25}px`;
        btn.style.marginBottom =  '130px';

        btn.style.flex = '1';
        btn.style.fontFamily = 'Bebas Neue';
        btn.style.letterSpacing = '1px';

        btn.addEventListener('click', () => {
            loadSystem(system.name);
            editor.style.display = 'none';
        });
        
        const deleteBtn = document.createElement('button');
        deleteBtn.innerHTML = '×';
        deleteBtn.style.position = 'absolute';
        deleteBtn.style.display = 'flex';
        deleteBtn.style.marginTop = `${index * 45 + 33}px`;
        deleteBtn.style.marginLeft= '10px';
        deleteBtn.style.paddingTop = '4px';
        deleteBtn.style.paddingLeft = '8px';
        deleteBtn.style.background = '#ff4444';
        deleteBtn.style.color = 'white';
        deleteBtn.style.border = 'none';
        deleteBtn.style.borderRadius = '50%';
        deleteBtn.style.width = '25px';
        deleteBtn.style.height = '25px';
        deleteBtn.style.cursor = 'pointer';

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`Biztosan törlöd a "${system.name}" naprendszert?`)) {
                const updatedSystems = savedSystems.filter((_, i) => i !== index);
                localStorage.setItem('savedSystems', JSON.stringify(updatedSystems));
                updateSavedSystemsList();
                planetSystem.clear();
            }
        });
        
        container.appendChild(btn);
        container.appendChild(deleteBtn);
        listContainer.appendChild(container);
    });
}


//Beállítások 
/*
const beallitasok = document.createElement('div');
beallitasok.style.position = 'fixed';
beallitasok.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
beallitasok.style.color = 'white';
beallitasok.style.padding = '5px 10px';
beallitasok.style.borderRadius = '5px';
beallitasok.style.fontSize = '20px';
beallitasok.style.display = 'none';
beallitasok.style.right= '20px';
beallitasok.style.bottom= '0px';
beallitasok.style.width= '270px';
beallitasok.style.height= '300px';
beallitasok.style.padding= '15px';
beallitasok.style.zIndex= '500';
beallitasok.style.border= '1px solid #444';
beallitasok.style.borderRadius= '10px';



//const tempo = document.createElement('div');
//document.beallitasok.appendChild(tempo);

beallitasok.innerHTML = `
    <p style="color: #ffcc00; text-align: left; margin-top: 0; margin-bottom: 15px; letter-spacing: 2px;">Gyorsaság</p>
    <input type="range" id="tempo" class="planet-size form-control" min="1" max="20" step="1"}">
`;

document.body.appendChild(beallitasok);

*/

/*
// 1. Create action buttons container
const actionButtons = document.createElement('div');
actionButtons.id = 'action-buttons';
actionButtons.style.position = 'fixed';
actionButtons.style.bottom = '20px';
actionButtons.style.right = '20px';
actionButtons.style.display = 'flex';
actionButtons.style.gap = '10px';
document.body.appendChild(actionButtons);

// 2. Save current system button
const saveCurrentBtn = document.createElement('button');
saveCurrentBtn.innerHTML = '💾'; // Save icon
saveCurrentBtn.title = 'Aktuális naprendszer mentése';
saveCurrentBtn.classList.add('action-btn');
actionButtons.appendChild(saveCurrentBtn);

// 3. Edit current system button
const editCurrentBtn = document.createElement('button');
editCurrentBtn.innerHTML = '✏️'; // Edit icon
editCurrentBtn.title = 'Aktuális naprendszer szerkesztése';
editCurrentBtn.classList.add('action-btn');
actionButtons.appendChild(editCurrentBtn);

// Style for action buttons
const actionButtonsStyle = document.createElement('style');
actionButtonsStyle.innerHTML = `
    .action-btn {
        width: 50px;
        height: 50px;
        border-radius: 50%;
        background: rgba(0,0,0,0.7);
        border: 1px solid #444;
        color: white;
        font-size: 20px;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s;
    }
    
    .action-btn:hover {
        background: rgba(0,0,0,0.9);
        transform: scale(1.1);
    }
`;
document.head.appendChild(actionButtonsStyle);

// 4. Name input dialog for saving
const nameDialog = document.createElement('div');
nameDialog.id = 'name-dialog';
nameDialog.style.display = 'none';
nameDialog.style.position = 'fixed';
nameDialog.style.top = '50%';
nameDialog.style.left = '50%';
nameDialog.style.transform = 'translate(-50%, -50%)';
nameDialog.style.backgroundColor = 'rgba(0,0,0,0.9)';
nameDialog.style.padding = '20px';
nameDialog.style.borderRadius = '10px';
nameDialog.style.border = '1px solid #ffcc00';
nameDialog.style.zIndex = '1001';
nameDialog.innerHTML = `
    <h3 style="color: #ffcc00; margin-top: 0; text-align: center;">Naprendszer elnevezése</h3>
    <input type="text" id="system-name-input" style="width: 100%; padding: 10px; margin-bottom: 15px;">
    <div style="display: flex; justify-content: center; gap: 10px;">
        <button id="confirm-save-btn" style="padding: 8px 15px; background: #4CAF50; border: none; border-radius: 5px; color: white;">Mentés</button>
        <button id="cancel-save-btn" style="padding: 8px 15px; background: #f44336; border: none; border-radius: 5px; color: white;">Mégse</button>
    </div>
`;
document.body.appendChild(nameDialog);

// 5. Save current system functionality
saveCurrentBtn.addEventListener('click', () => {
    if (planetSystem.planets.length === 0) {
        alert("Nincs naprendszer a mentéshez!");
        return;
    }
    
    nameDialog.style.display = 'block';
    document.getElementById('system-name-input').value = '';
    document.getElementById('system-name-input').focus();
});

document.getElementById('cancel-save-btn').addEventListener('click', () => {
    nameDialog.style.display = 'none';
});

document.getElementById('confirm-save-btn').addEventListener('click', () => {
    const systemName = document.getElementById('system-name-input').value.trim();
    if (!systemName) {
        alert("Kérlek adj meg egy nevet a naprendszernek!");
        return;
    }
    
    // Collect current system data
    const planetsData = planetSystem.planets.map(planet => {
        return {
            name: planet.name,
            size: planet.mesh.geometry.parameters.radius,
            distance: planet.distance,
            speed: planet.speed,
            color: planet.mesh.material.color.getHexString(),
            isGasGiant: planet.mesh.material.roughness > 0.7, // Approximation
            hasRings: planet.mesh.children.some(child => child.type === 'Mesh' && child.geometry.type === 'RingGeometry'),
            texture: planet.mesh.material.map ? planet.mesh.material.map.sourceFile || '' : ''
        };
    });
    
    const systemData = {
        name: systemName,
        planets: planetsData,
        createdAt: new Date().toISOString()
    };
    
    // Save to localStorage
    let savedSystems = JSON.parse(localStorage.getItem('savedSystems')) || [];
    
    // Check if system with this name already exists
    const existingIndex = savedSystems.findIndex(sys => sys.name === systemName);
    if (existingIndex >= 0) {
        // Update existing system
        savedSystems[existingIndex] = systemData;
    } else {
        // Add new system
        savedSystems.push(systemData);
    }
    
    localStorage.setItem('savedSystems', JSON.stringify(savedSystems));
    updateSavedSystemsList();
    nameDialog.style.display = 'none';
    
    focusIndicator.textContent = `Mentve: ${systemName}`;
    setTimeout(() => {
        focusIndicator.textContent = 'Középpont: Nap';
    }, 2000);
});

// 6. Edit current system functionality
editCurrentBtn.addEventListener('click', () => {
    if (planetSystem.planets.length === 0) {
        alert("Nincs naprendszer a szerkesztéshez!");
        return;
    }
    
    // Open editor with current system data
    editor.style.display = 'block';
    const container = document.getElementById('planet-forms-container');
    container.innerHTML = '';
    
    // Set system name (try to find it in saved systems)
    let systemName = "Szerkesztett naprendszer";
    const savedSystems = JSON.parse(localStorage.getItem('savedSystems')) || [];
    const currentPlanetNames = planetSystem.planets.map(p => p.name);
    
    // Try to find a matching saved system
    const matchingSystem = savedSystems.find(sys => 
        sys.planets.length === planetSystem.planets.length &&
        sys.planets.every((p, i) => p.name === planetSystem.planets[i].name)
    );
    
    if (matchingSystem) {
        systemName = matchingSystem.name;
    }
    
    document.getElementById('system-name').value = systemName;
    
    // Create forms for each planet
    planetSystem.planets.forEach((planet, index) => {
        const planetData = {
            name: planet.name,
            size: planet.mesh.geometry.parameters.radius,
            distance: planet.distance,
            speed: planet.speed,
            color: '#' + planet.mesh.material.color.getHexString(),
            isGasGiant: planet.mesh.material.roughness > 0.7, // Approximation
            hasRings: planet.mesh.children.some(child => child.type === 'Mesh' && child.geometry.type === 'RingGeometry'),
            texture: planet.mesh.material.map ? planet.mesh.material.map.sourceFile || '' : ''
        };
        
        container.insertAdjacentHTML('beforeend', createPlanetForm(planetData, index));
    });
    
    currentPlanetCount = planetSystem.planets.length;
});




*/















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

window.addEventListener('load', () => {
    updateSavedSystemsList();
    
    // Optionally load the last saved system
    const savedSystems = JSON.parse(localStorage.getItem('savedSystems')) || [];
    if (savedSystems.length > 0) {
        loadSystem(savedSystems[0].name);
    } else {
        createRandomSystem();
    }
    planetSystem.focusOnSun();
});
// Start with random system
createRandomSystem();
planetSystem.focusOnSun();

// Resize handler
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Start with random system
createRandomSystem();
planetSystem.focusOnSun();