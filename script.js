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
button.innerText = 'Új naprendszer';
button.style.position = 'absolute';
button.style.top = '20px';
button.style.left = '20px';
button.style.padding = '10px';
button.style.fontSize = '16px';
document.body.appendChild(button);
button.addEventListener('click', generateSolarSystem);

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