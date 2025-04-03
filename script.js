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
           coruscant: 'kepek/cosruscant.png'
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

    createPlanet(size, distance, speed, name, isGasGiant = false, hasRings = false, textureUrl) {
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
        focusIndicator.textContent = `Viewing: ${planetData.name}`;
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
        focusIndicator.textContent = 'Viewing: Sun';
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
            `Planet ${i+1}`,
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
        { name: "Merkúr", size: 1.5, distance: 28, speed: 0.02, isGasGiant: false, texture: planetTextures.real.mercury },
        { name: "Vénusz", size: 3.7, distance: 40, speed: 0.015, isGasGiant: false, texture: planetTextures.real.venus },
        { name: "Föld", size: 3.9, distance: 55, speed: 0.01, isGasGiant: false, texture: planetTextures.real.earth },
        { name: "Mars", size: 2.1, distance: 75, speed: 0.008, isGasGiant: false, texture: planetTextures.real.mars },
        { name: "Jupiter", size: 12, distance: 100, speed: 0.004, isGasGiant: true, texture: planetTextures.real.jupiter },
        { name: "Szaturnusz", size: 10, distance: 130, speed: 0.003, isGasGiant: true, hasRings: true, texture: planetTextures.real.saturn },
        { name: "Uránusz", size: 7, distance: 160, speed: 0.002, isGasGiant: true, texture: planetTextures.real.uranus },
        { name: "Neptunusz", size: 6.8, distance: 190, speed: 0.0018, isGasGiant: true, texture: planetTextures.real.neptune}
    ];

    const starWarsSolarSystem = [
        { name: "Naboo", size: 1.5, distance: 28, speed: 0.02, isGasGiant: false, texture: planetTextures.starWars.naboo },
        { name: "Tatooine", size: 3.7, distance: 40, speed: 0.015, isGasGiant: false, texture: planetTextures.starWars.tatooine },
        { name: "Coruscant", size: 3.9, distance: 55, speed: 0.01, isGasGiant: false, texture: planetTextures.starWars.coruscant },
        { name: "Endor", size: 2.1, distance: 75, speed: 0.008, isGasGiant: false, texture: planetTextures.starWars.endor },
        { name: "Dagobah", size: 12, distance: 100, speed: 0.004, isGasGiant: true, texture: planetTextures.starWars.dagobah },
        { name: "Mustafar", size: 10, distance: 130, speed: 0.003, isGasGiant: true, hasRings: true, texture: planetTextures.starWars.mustafar },
        { name: "Alderaan", size: 7, distance: 160, speed: 0.002, isGasGiant: true, texture: planetTextures.starWars.alderaan },
        { name: "Hoth", size: 6.8, distance: 190, speed: 0.0018, isGasGiant: true, texture: planetTextures.starWars.hoth},
        { name: "Death Star", size: 3.0, distance: 0, speed: 0.00000001, isGasGiant: false, texture: planetTextures.starWars.deathStar }
    ]

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

// Button setup
const randomBtn = document.createElement('button');
randomBtn.innerText = 'Random naprendszer';
randomBtn.style.position = 'absolute';
randomBtn.style.top = '20px';
randomBtn.style.left = '20px';
randomBtn.style.padding = '10px';
randomBtn.style.fontSize = '16px';
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
realBtn.style.position = 'absolute';
realBtn.style.top = '20px';
realBtn.style.left = '200px';
realBtn.style.padding = '10px';
realBtn.style.fontSize = '16px';
realBtn.addEventListener('click', () => {
    if (currentFocus && currentFocus !== sun) {
        planetSystem.focusOnSun();
        setTimeout(createRealSystem, 1500); // Wait for camera to reset
    } else {
        createRealSystem();
    }
});
document.body.appendChild(realBtn);


const customBtn = document.createElement('button');
customBtn.innerText = 'Saját naprendszer';
customBtn.style.position = 'absolute';
customBtn.style.top = '20px';
customBtn.style.left = '380px'; // Adjust position as needed
customBtn.style.padding = '10px';
customBtn.style.fontSize = '16px';
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



// Resize handler
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Start with random system
createRandomSystem();
planetSystem.focusOnSun();