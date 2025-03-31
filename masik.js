// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x333333);
scene.add(ambientLight);

const sunLight = new THREE.PointLight(0xffffff, 1, 100);
sunLight.position.set(0, 0, 0);
scene.add(sunLight);

// Camera position
camera.position.z = 30;

// Variables to store solar system objects
let solarSystem = {
    sun: null,
    planets: []
};

// Create the sun
function createSun(radius = 5, color = 0xffff00) {
    if (solarSystem.sun) {
        scene.remove(solarSystem.sun);
    }
    
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ 
        color: color,
        emissive: 0xffaa00,
        emissiveIntensity: 0.5
    });
    const sun = new THREE.Mesh(geometry, material);
    scene.add(sun);
    solarSystem.sun = sun;
    
    // Add sun glow effect
    const glowGeometry = new THREE.SphereGeometry(radius * 1.2, 32, 32);
    const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0.5
    });
    const glow = new THREE.Mesh(glowGeometry, glowMaterial);
    sun.add(glow);
}

// Create a planet
function createPlanet(distanceFromSun, radius, color, speed) {
    const geometry = new THREE.SphereGeometry(radius, 32, 32);
    const material = new THREE.MeshPhongMaterial({ color });
    const planet = new THREE.Mesh(geometry, material);
    
    // Position the planet
    planet.position.x = distanceFromSun;
    
    // Add to scene and solar system array
    scene.add(planet);
    solarSystem.planets.push({
        mesh: planet,
        speed: speed,
        distance: distanceFromSun,
        angle: Math.random() * Math.PI * 2
    });
    
    return planet;
}

// Clear all planets
function clearPlanets() {
    solarSystem.planets.forEach(planet => {
        scene.remove(planet.mesh);
    });
    solarSystem.planets = [];
}

// Generate random solar system
function generateRandomSolarSystem() {
    clearPlanets();
    createSun(5, 0xffff00);
    
    const planetCount = Math.floor(Math.random() * 5) + 3; // 3-7 planets
    
    for (let i = 0; i < planetCount; i++) {
        const distance = 8 + (i * 5) + (Math.random() * 3);
        const radius = 0.5 + Math.random() * 2;
        const color = new THREE.Color(Math.random(), Math.random(), Math.random());
        const speed = 0.001 + Math.random() * 0.005;
        
        createPlanet(distance, radius, color, speed);
    }
}

// Generate real solar system
function generateRealSolarSystem() {
    clearPlanets();
    createSun(5, 0xffff00);
    
    // Real solar system data (simplified)
    const planets = [
        { name: "Mercury", distance: 8, radius: 0.8, color: 0xaaaaaa, speed: 0.008 },
        { name: "Venus", distance: 11, radius: 1.2, color: 0xe6c229, speed: 0.006 },
        { name: "Earth", distance: 14, radius: 1.3, color: 0x3498db, speed: 0.005 },
        { name: "Mars", distance: 17, radius: 1.1, color: 0xe67e22, speed: 0.004 },
        { name: "Jupiter", distance: 22, radius: 2.8, color: 0xf1c40f, speed: 0.002 },
        { name: "Saturn", distance: 28, radius: 2.3, color: 0xf39c12, speed: 0.0015 },
        { name: "Uranus", distance: 33, radius: 1.8, color: 0x1abc9c, speed: 0.001 },
        { name: "Neptune", distance: 38, radius: 1.7, color: 0x3498db, speed: 0.0008 }
    ];
    
    planets.forEach(planet => {
        createPlanet(planet.distance, planet.radius, planet.color, planet.speed);
    });
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Rotate planets around the sun
    solarSystem.planets.forEach(planet => {
        planet.angle += planet.speed;
        planet.mesh.position.x = Math.cos(planet.angle) * planet.distance;
        planet.mesh.position.z = Math.sin(planet.angle) * planet.distance;
    });
    
    // Rotate the sun
    if (solarSystem.sun) {
        solarSystem.sun.rotation.y += 0.005;
    }
    
    renderer.render(scene, camera);
}

// Event listeners
document.getElementById('random-system').addEventListener('click', generateRandomSolarSystem);
document.getElementById('real-system').addEventListener('click', generateRealSolarSystem);

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Start animation
animate();

// Generate default solar system
generateRealSolarSystem();