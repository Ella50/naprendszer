// Alap Three.js setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// FONTOS! OrbitControls elérése így: `new THREE.OrbitControls`
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;
controls.maxDistance = 500;

camera.position.set(0, 10, 50);
controls.update();


// Fények
const light = new THREE.PointLight(0xffffff, 2, 1000);
light.position.set(0, 0, 0);
scene.add(light);
scene.add(new THREE.AmbientLight(0x222222));

// Nap generálása
const sunGeometry = new THREE.SphereGeometry(5, 32, 32);
const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
const sun = new THREE.Mesh(sunGeometry, sunMaterial);
scene.add(sun);

let planets = [];

// Véletlenszerű naprendszer generálása
function generateSolarSystem() {
    // Töröljük az előző bolygókat
    planets.forEach(planet => scene.remove(planet.mesh));
    planets = [];

    const numPlanets = Math.floor(Math.random() * 6) + 3; // 3-8 bolygó
    for (let i = 0; i < numPlanets; i++) {
        const radius = Math.random() * 2 + 1;
        const distance = (i + 1) * (Math.random() * 5 + 7);
        const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        
        const geometry = new THREE.SphereGeometry(radius, 32, 32);
        const material = new THREE.MeshStandardMaterial({ color });
        const planet = new THREE.Mesh(geometry, material);
        
        planet.position.x = distance;
        scene.add(planet);
        planets.push({ mesh: planet, distance, speed: Math.random() * 0.02 + 0.01 });
    }
}

generateSolarSystem();

// Randomizáló gomb
const button = document.createElement('button');
button.innerText = 'A naprendszer';
button.style.position = 'absolute';
button.style.top = '20px';
button.style.left = '20px';
button.style.padding = '10px';
button.style.fontSize = '16px';
document.body.appendChild(button);
button.addEventListener('click', generateSolarSystem);

// Naprendszer gomb
const napr = document.createElement('button');
napr.innerText = 'Valós naprendszer';
napr.style.position = 'absolute';
napr.style.top = '20px';
napr.style.left = '200px';
napr.style.padding = '10px';
napr.style.fontSize = '16px';
document.body.appendChild(napr);
napr.addEventListener('click', createNaprendszer);

const realSolarSystem = [
    { name: "Merkúr", size: 0.38, distance: 20, color: 0xaaaaaa, speed: 0.02 },
    { name: "Vénusz", size: 0.95, distance: 30, color: 0xffcc00, speed: 0.015 },
    { name: "Föld", size: 1, distance: 40, color: 0x0099ff, speed: 0.01 },
    { name: "Mars", size: 0.53, distance: 50, color: 0xff3300, speed: 0.008 },
    { name: "Jupiter", size: 11.2, distance: 70, color: 0xff9900, speed: 0.004 },
    { name: "Szaturnusz", size: 9.45, distance: 90, color: 0xffcc66, speed: 0.003 },
    { name: "Uránusz", size: 4, distance: 110, color: 0x66ccff, speed: 0.002 },
    { name: "Neptunusz", size: 3.88, distance: 130, color: 0x0000ff, speed: 0.0018 }
];

function createNaprendszer() {
    // Töröljük az előző bolygókat
    planets.forEach(planet => scene.remove(planet.mesh));
    planets = [];

    realSolarSystem.forEach(planet => {
        createPlanet(planet.size * 2, planet.distance, planet.color, planet.speed, planet.name);
    });
}

function createPlanet(size, distance, color, speed, name) {
    const geometry = new THREE.SphereGeometry(size, 32, 32);
    const material = new THREE.MeshStandardMaterial({ color });
    const planet = new THREE.Mesh(geometry, material);

    planet.position.x = distance;
    scene.add(planet);
    planets.push({ mesh: planet, distance, speed, name });
}

// Animációs ciklus
function animate() {
    requestAnimationFrame(animate);
    planets.forEach(planet => {
        planet.mesh.position.x = Math.cos(Date.now() * 0.0005 * planet.speed) * planet.distance;
        planet.mesh.position.z = Math.sin(Date.now() * 0.0005 * planet.speed) * planet.distance;
    });
    renderer.render(scene, camera);
}
animate();

// Rescale ablakméret változáskor
window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
});

// Tooltip

const tooltip = document.createElement('div');
tooltip.style.position = 'absolute';
tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
tooltip.style.color = 'white';
tooltip.style.padding = '5px 10px';
tooltip.style.borderRadius = '5px';
tooltip.style.fontSize = '20px';
tooltip.style.display = 'none'; // Alapból el van rejtve

document.body.appendChild(tooltip);

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();



window.addEventListener('mousemove', (event) => {
    // Egérpozíció átszámítása Three.js koordinátákra
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Raycaster frissítése a kamerához képest
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(planets.map(p => p.mesh));

    if (intersects.length > 0) {
        const planet = intersects[0].object;
        const planetData = planets.find(p => p.mesh === planet);

        if (planetData) {
            tooltip.innerText = planetData.name; // Kiírjuk a bolygó nevét
            tooltip.style.left = `${event.clientX + 10}px`;
            tooltip.style.top = `${event.clientY + 10}px`;
            tooltip.style.display = 'block';
        }
    } else {
        tooltip.style.display = 'none';
    }
});