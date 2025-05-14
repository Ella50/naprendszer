document.addEventListener('DOMContentLoaded', function() {
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
    saveCurrentBtn.innerHTML = '<i class="fas fa-save"></i>';
    saveCurrentBtn.title = 'Aktuális naprendszer mentése';
    saveCurrentBtn.classList.add('action-btn');
    actionButtons.appendChild(saveCurrentBtn);

    // 3. Edit current system button
    const editCurrentBtn = document.createElement('button');
    editCurrentBtn.innerHTML = '<i class="fas fa-edit"></i>';
    editCurrentBtn.title = 'Aktuális naprendszer szerkesztése';
    editCurrentBtn.classList.add('action-btn');
    actionButtons.appendChild(editCurrentBtn);

    // Font Awesome betöltése
    const fontAwesome = document.createElement('link');
    fontAwesome.rel = 'stylesheet';
    fontAwesome.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
    document.head.appendChild(fontAwesome);

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
        
        .action-btn i {
            font-size: 1.2em;
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
        if (!window.planetSystem || window.planetSystem.planets.length === 0) {
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
        const planetsData = window.planetSystem.planets.map(planet => {
            return {
                name: planet.name,
                size: planet.mesh.geometry.parameters.radius,
                distance: planet.distance,
                speed: planet.speed,
                color: planet.mesh.material.color.getHexString(),
                isGasGiant: planet.mesh.material.roughness > 0.7,
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
            savedSystems[existingIndex] = systemData;
        } else {
            savedSystems.push(systemData);
        }
        
        localStorage.setItem('savedSystems', JSON.stringify(savedSystems));
        nameDialog.style.display = 'none';
        
        if (window.focusIndicator) {
            window.focusIndicator.textContent = `Mentve: ${systemName}`;
            setTimeout(() => {
                window.focusIndicator.textContent = 'Középpont: Nap';
            }, 2000);
        }
    });

    // 6. Edit current system functionality
    editCurrentBtn.addEventListener('click', () => {
        if (!window.planetSystem || window.planetSystem.planets.length === 0) {
            alert("Nincs naprendszer a szerkesztéshez!");
            return;
        }
        
        // Check if editor exists
        if (!window.editor) {
            console.error("Editor not found!");
            return;
        }
        
        window.editor.style.display = 'block';
        const container = document.getElementById('planet-forms-container');
        if (container) container.innerHTML = '';
        
        // Set system name
        let systemName = "Szerkesztett naprendszer";
        const savedSystems = JSON.parse(localStorage.getItem('savedSystems') || '[]');
        
        const matchingSystem = savedSystems.find(sys => {
            if (sys.planets.length !== window.planetSystem.planets.length) return false;
            return sys.planets.every((p, i) => {
                const planet = window.planetSystem.planets[i];
                return p.name === planet.name && 
                       p.distance === planet.distance &&
                       Math.abs(p.size - planet.mesh.geometry.parameters.radius) < 0.1;
            });
        });
        
        if (matchingSystem) {
            systemName = matchingSystem.name;
        }
        
        const systemNameInput = document.getElementById('system-name');
        if (systemNameInput) systemNameInput.value = systemName;
        
        // Create forms for each planet
        window.planetSystem.planets.forEach((planet, index) => {
            const material = planet.mesh.material;
            const isGasGiant = material.roughness > 0.7;
            const hasRings = planet.mesh.children.some(child => 
                child.type === 'Mesh' && child.geometry.type === 'RingGeometry'
            );
            
            let colorHex;
            if (material.color && material.color.getHex) {
                colorHex = '#' + material.color.getHexString();
            } else if (material.color) {
                colorHex = '#' + material.color.toString(16).padStart(6, '0');
            } else {
                colorHex = '#ffffff';
            }
            
            const planetData = {
                name: planet.name,
                size: planet.mesh.geometry.parameters.radius,
                distance: planet.distance,
                speed: planet.speed,
                color: colorHex,
                isGasGiant: isGasGiant,
                hasRings: hasRings,
                texture: material.map ? material.map.image ? material.map.image.currentSrc || '' : '' : ''
            };
            
            if (container) container.insertAdjacentHTML('beforeend', createPlanetForm(planetData, index));
        });
        
        if (window.currentPlanetCount !== undefined) {
            window.currentPlanetCount = window.planetSystem.planets.length;
        }
    });
});
