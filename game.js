class Game {
    constructor() {
        this.country = {
            name: 'Unnamed',
            gold: 1000,
            population: 100,
            food: 500,
            soldiers: [],
            buildings: [],
            position: { x: 50, y: 50 },
            era: 'Ancient',
            health: 2000, // Base castle health
            maxHealth: 2000,
            maxSoldiers: 10, // Base max soldiers
            currentSoldiers: 0
        };
        
        this.resources = {
            wood: 1000,
            stone: 1000,
            iron: 1000
        };
        
        this.buildings = {
            house: { 
                cost: { gold: 50, wood: 20, stone: 10 },
                capacity: 2,
                upgradeBonus: 1,
                workers: 0,
                upgradeCost: 200
            },
            farm: { 
                cost: { gold: 100, wood: 30, stone: 15 },
                requiredWorkers: 2,
                goldPerDay: 20,
                foodPerDay: 50,
                upgradeCost: 300
            },
            lumbermill: {
                cost: { gold: 150, stone: 40, iron: 20 },
                requiredWorkers: 5,
                production: { min: 50, max: 100 },
                maxWorkers: 10,
                upgradeCost: 400
            },
            quarry: {
                cost: { gold: 200, wood: 50, iron: 20 },
                requiredWorkers: 5,
                production: { min: 50, max: 100 },
                maxWorkers: 10,
                upgradeCost: 400
            },
            mine: {
                cost: { gold: 250, wood: 60, stone: 30 },
                requiredWorkers: 5,
                production: { min: 50, max: 100 },
                maxWorkers: 10,
                upgradeCost: 500
            },
            barracks: { 
                cost: { gold: 300, wood: 50, stone: 30 },
                military: 20,
                upgrades: {
                    pathA: { // Damage path
                        level: 1,
                        maxLevel: 5,
                        cost: 300,
                        effects: [
                            { damage: 20 },
                            { damage: 40 },
                            { damage: 60 },
                            { damage: 80 },
                            { damage: 100, special: 'criticalStrike' } // 20% chance to deal double damage
                        ]
                    },
                    pathB: { // Quantity path
                        level: 1,
                        maxLevel: 5,
                        cost: 300,
                        effects: [
                            { quantity: 2, damage: 5 },
                            { quantity: 3, damage: 10 },
                            { quantity: 4, damage: 15 },
                            { quantity: 5, damage: 20 },
                            { quantity: 6, damage: 25, special: 'rapidDeploy' } // Instant spawn of all soldiers
                        ]
                    }
                }
            },
            wall: { 
                cost: { gold: 150, stone: 80 },
                health: 500,
                stunTime: 2000
            }
        };

        this.eras = ['Ancient', 'Medieval', 'Renaissance', 'Industrial', 'Modern', 'Future'];
        this.currentEraIndex = 0;
        this.eraUpgradeCost = 4000; // Starting cost (2x more than before)

        this.units = {
            soldier: {
                health: 100,
                damage: 20,
                speed: 0.5,
                range: 2
            },
            enemy: {
                health: 80,
                damage: 15,
                speed: 0.3,
                range: 2
            }
        };

        this.enemies = [];
        this.wave = {
            current: 1,
            baseEnemiesPerWave: 5, // Starting number of enemies
            enemyMultiplier: 1.5, // Enemies increase by 50% each wave
            spawnInterval: 2000,
            waveInterval: 30000,
            enemyHealthMultiplier: 1.2,
            enemyDamageMultiplier: 1.1,
            nightSpawnInterval: null // For tracking night spawns
        };
        this.gameLoop = null;
        this.lastSpawn = Date.now();

        this.constructionTime = 5000; // 5 seconds to build
        this.buildingsUnderConstruction = [];

        this.eraStats = {
            'Ancient': {
                soldierType: 'spearman',
                castleHealth: 2000,
                castleIncome: 50,
                damage: 20
            },
            'Medieval': {
                soldierType: 'swordsman',
                castleHealth: 4000,
                castleIncome: 100,
                damage: 35
            },
            'Renaissance': {
                soldierType: 'musketeer',
                castleHealth: 6000,
                castleIncome: 200,
                damage: 50
            },
            'Industrial': {
                soldierType: 'rifleman',
                castleHealth: 10000,
                castleIncome: 500,
                damage: 75
            },
            'Modern': {
                soldierType: 'commando',
                castleHealth: 15000,
                castleIncome: 1000,
                damage: 100
            },
            'Future': {
                soldierType: 'cyborg',
                castleHealth: 25000,
                castleIncome: 2000,
                damage: 150
            }
        };

        this.weaponStats = {
            spear: { damage: 25, range: 3, description: "Basic melee weapon" },
            sword: { damage: 40, range: 2, description: "Powerful close combat weapon" },
            musket: { damage: 60, range: 6, description: "Long-range firearm" },
            rifle: { damage: 80, range: 8, description: "Advanced military weapon" },
            modernGun: { damage: 120, range: 10, description: "High-tech military weapon" }
        };

        this.civilians = [];
        this.isNight = false;
        this.dayCount = 1;
        this.dayDuration = 30000; // 30 seconds per phase
        this.baseIncome = 50; // Base income per day

        this.placingBuilding = null; // Track building being placed

        // Add mouse position tracking
        this.mouseX = 0;
        this.mouseY = 0;

        // Add rotation amount to track wall rotation
        this.placingRotation = 0;

        // Add resource nodes
        this.resourceNodes = {
            trees: [],
            rocks: [],
            ironDeposits: []
        };

        this.init();
        this.startDailyUpdate();
        this.startPopulationGrowth();
        this.startGameLoop();
        this.startDayNightCycle();
        this.spawnCivilians();

        // Start income generation
        setInterval(() => {
            // Base income
            this.country.gold += 1000;

            // Farm income
            let goldFromFarms = 0;
            let foodFromFarms = 0;
            let foodConsumption = 0;

            this.country.buildings.forEach(building => {
                if (building.type === 'farm' && !building.isUnderConstruction) {
                    if (building.workers >= this.buildings.farm.requiredWorkers) {
                        goldFromFarms += this.buildings.farm.goldPerDay;
                        foodFromFarms += this.buildings.farm.foodPerDay;
                    }
                } else if (building.type === 'house') {
                    foodConsumption += building.capacity * 10; // Each person consumes 10 food
                }
            });

            this.country.gold += goldFromFarms;
            this.country.food += foodFromFarms;
            this.country.food -= foodConsumption;

            // Update UI with daily stats
            document.getElementById('goldPerDay').textContent = 
                (1000 + goldFromFarms).toString();
            document.getElementById('foodPerDay').textContent = 
                (foodFromFarms - foodConsumption).toString();

            // Increment day and show notification
            this.dayCount++;
            this.showDayNotification();
            this.updateUI();
        }, this.dayDuration * 2); // Full day cycle (day + night = 60 seconds)
    }

    init() {
        this.setupEventListeners();
        this.updateUI();
        this.createMap();
        this.createCastle();
        this.setupEraUpgrade();
        this.generateResourceNodes();

        // Add initial buildings
        const initialBuildings = [
            { type: 'barracks', count: 2, positions: [
                { x: 35, y: 35 },
                { x: 65, y: 65 }
            ]},
            { type: 'house', count: 5, positions: [
                { x: 30, y: 50 },
                { x: 70, y: 50 },
                { x: 50, y: 30 },
                { x: 50, y: 70 },
                { x: 40, y: 40 }
            ]},
            { type: 'farm', count: 3, positions: [
                { x: 25, y: 25 },
                { x: 75, y: 75 },
                { x: 75, y: 25 }
            ]}
        ];

        initialBuildings.forEach(buildingInfo => {
            for(let i = 0; i < buildingInfo.count; i++) {
                const newBuilding = {
                    type: buildingInfo.type,
                    x: buildingInfo.positions[i].x,
                    y: buildingInfo.positions[i].y,
                    rotation: 0,
                    isUnderConstruction: false,
                    workers: 0
                };

                // Add building to country's buildings array
                this.country.buildings.push(newBuilding);

                // Create visual representation
                this.addBuildingToMap(newBuilding);

                // Assign workers to resource buildings
                if(['lumbermill', 'quarry', 'mine'].includes(buildingInfo.type)) {
                    this.assignWorkersToBuilding(newBuilding);
                }

                // Spawn initial soldiers for barracks
                if(buildingInfo.type === 'barracks') {
                    this.spawnInitialSoldiers(newBuilding);
                }
            }
        });

        // Update population from houses
        this.country.population = this.buildings.house.capacity * 5; // 5 houses
        this.updateUI();
    }

    setupEventListeners() {
        document.getElementById('renameCountry').addEventListener('click', () => {
            const newName = prompt('Enter new country name:');
            if (newName) {
                this.country.name = newName;
                this.updateUI();
            }
        });

        document.querySelectorAll('.build-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const buildingType = e.target.dataset.building;
                this.startPlacingBuilding(buildingType);
            });
        });

        // Add map click and move listeners
        const gameMap = document.getElementById('gameMap');
        
        gameMap.addEventListener('mousemove', (e) => {
            const rect = gameMap.getBoundingClientRect();
            this.mouseX = ((e.clientX - rect.left) / rect.width) * 100;
            this.mouseY = ((e.clientY - rect.top) / rect.height) * 100;
            
            if (this.placingBuilding) {
                this.placingBuilding.style.left = `${this.mouseX}%`;
                this.placingBuilding.style.top = `${this.mouseY}%`;
            }
        });

        gameMap.addEventListener('click', (e) => {
            if (this.placingBuilding) {
                this.finishPlacingBuilding();
            } else {
                // Check if clicked element is a building
                const building = e.target.closest('.building');
                if (building) {
                    const buildingType = building.classList[1]; // Get the building type from class
                    if (buildingType === 'barracks') {
                        this.showUpgradePanel(building);
                    }
                }
            }
        });

        // Add ESC key to cancel placement
        document.addEventListener('keydown', (e) => {
            if (this.placingBuilding) {
                switch(e.key) {
                    case 'ArrowLeft':
                        this.rotateBuilding(-15);
                        break;
                    case 'ArrowRight':
                        this.rotateBuilding(15);
                        break;
                    case 'Escape':
                        this.cancelPlacingBuilding();
                        break;
                }
                e.preventDefault();
            }
        });

        // Add upgrade button handlers
        document.querySelectorAll('.upgrade-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const selectedBuilding = document.querySelector('.building.selected');
                if (selectedBuilding) {
                    const upgradeType = btn.id.replace('upgrade', '').toLowerCase();
                    this.upgradeBuilding(selectedBuilding, upgradeType);
                }
            });
        });

        // Add upgrade path button handlers
        document.querySelectorAll('.upgrade-path-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const path = e.target.dataset.path;
                const selectedBuilding = document.querySelector('.building.selected');
                if (selectedBuilding) {
                    this.upgradeBarracksPath(selectedBuilding, path);
                }
            });
        });
    }

    rotateBuilding(angle) {
        if (this.placingBuilding && this.placingBuildingType === 'wall') {
            this.placingRotation = (this.placingRotation + angle) % 360;
            this.placingBuilding.style.transform = 
                `translate(-50%, -50%) rotate(${this.placingRotation}deg)`;
        }
    }

    startPlacingBuilding(buildingType) {
        const building = this.buildings[buildingType];
        
        // Check if we can afford the building
        if (!this.canAffordBuilding(buildingType)) {
            return;
        }

        // Create ghost building that follows mouse
        const element = document.createElement('div');
        element.className = `building ${buildingType} ${this.country.era.toLowerCase()} ghost`;
        element.style.left = `${this.mouseX}%`;
        element.style.top = `${this.mouseY}%`;
        
        if (buildingType === 'wall') {
            this.placingRotation = 0;
            element.style.transform = 'translate(-50%, -50%) rotate(0deg)';
        }
        
        document.getElementById('gameMap').appendChild(element);
        this.placingBuilding = element;
        this.placingBuildingType = buildingType;
        document.body.style.cursor = 'crosshair';

        const constructionElement = document.createElement('div');
        constructionElement.className = 'construction-overlay';
        element.appendChild(constructionElement);
    }

    finishPlacingBuilding() {
        const buildingType = this.placingBuildingType;
        const building = this.buildings[buildingType];
        
        // Deduct all costs
        const costs = building.cost;
        for(const [resource, amount] of Object.entries(costs)) {
            if(resource === 'gold') {
                this.country.gold -= amount;
            } else {
                this.resources[resource] -= amount;
            }
        }

        const newBuilding = {
            type: buildingType,
            x: this.mouseX,
            y: this.mouseY,
            rotation: this.placingRotation,
            isUnderConstruction: true,
            constructionProgress: 0
        };

        this.country.buildings.push(newBuilding);
        this.addBuildingToMap(newBuilding);
        this.startConstruction(newBuilding);
        
        // Reset placement mode
        this.placingBuilding.remove();
        this.placingBuilding = null;
        this.placingBuildingType = null;
        document.body.style.cursor = 'default';
        
        // Update UI to show new resource amounts
        this.updateUI();
        this.updateResourcesUI();
    }

    cancelPlacingBuilding() {
        if (this.placingBuilding) {
            this.placingBuilding.remove();
            this.placingBuilding = null;
            this.placingBuildingType = null;
            document.body.style.cursor = 'default';
        }
    }

    createMap() {
        const map = document.getElementById('gameMap');
        const countryElement = document.createElement('div');
        countryElement.className = 'country';
        countryElement.style.left = `${this.country.position.x}%`;
        countryElement.style.top = `${this.country.position.y}%`;
        countryElement.style.backgroundColor = this.getRandomColor();
        map.appendChild(countryElement);

        // Add existing buildings to map
        this.country.buildings.forEach(building => {
            this.addBuildingToMap(building);
        });
    }

    addBuildingToMap(building) {
        const map = document.getElementById('gameMap');
        const buildingElement = document.createElement('div');
        buildingElement.className = `building ${building.type} ${this.country.era.toLowerCase()}`;
        buildingElement.style.left = `${building.x}%`;
        buildingElement.style.top = `${building.y}%`;
        
        if (building.type === 'wall') {
            buildingElement.style.transform = `translate(-50%, -50%) rotate(${building.rotation}deg)`;
        }
        
        buildingElement.title = building.type;
        map.appendChild(buildingElement);
    }

    updateUI() {
        document.getElementById('countryName').textContent = this.country.name;
        document.getElementById('gold').textContent = this.country.gold;
        document.getElementById('population').textContent = this.country.population;
        document.getElementById('food').textContent = this.country.food;
        document.getElementById('era').textContent = this.country.era;
        document.getElementById('soldiers').textContent = this.country.soldiers.length;
        document.getElementById('currentEra').textContent = this.country.era;
    }

    getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    }

    createCastle() {
        const map = document.getElementById('gameMap');
        const castle = document.createElement('div');
        castle.className = `castle ${this.country.era.toLowerCase()}`;
        map.appendChild(castle);
    }

    setupEraUpgrade() {
        const upgradeBtn = document.getElementById('upgradeEra');
        upgradeBtn.addEventListener('click', () => this.upgradeEra());
        this.checkEraUpgradePossible();
    }

    upgradeEra() {
        if (this.country.gold >= this.eraUpgradeCost && this.currentEraIndex < this.eras.length - 1) {
            this.country.gold -= this.eraUpgradeCost;
            this.currentEraIndex++;
            this.country.era = this.eras[this.currentEraIndex];
            
            // Update castle health and other era-specific stats
            const eraStats = this.eraStats[this.country.era];
            this.country.health = eraStats.castleHealth;
            this.country.maxHealth = eraStats.castleHealth;
            
            // Update castle appearance
            const castle = document.querySelector('.castle');
            castle.className = `castle ${this.country.era.toLowerCase()}`;
            
            this.eraUpgradeCost *= 4; // Double the multiplier
            this.updateUI();
            this.checkEraUpgradePossible();
        }
    }

    checkEraUpgradePossible() {
        const upgradeBtn = document.getElementById('upgradeEra');
        if (this.currentEraIndex < this.eras.length - 1) {
            upgradeBtn.style.display = 'block';
            upgradeBtn.textContent = `Advance to ${this.eras[this.currentEraIndex + 1]} (${this.eraUpgradeCost} gold)`;
        } else {
            upgradeBtn.style.display = 'none';
        }
    }

    startDailyUpdate() {
        let lastIncomeTime = Date.now();

        setInterval(() => {
            const currentTime = Date.now();
            
            // Only give income every minute
            if (currentTime - lastIncomeTime >= 60000) {
                // Base income
                this.country.gold += 1000;
                lastIncomeTime = currentTime;
            }

            // Farm income and other daily updates
            let goldFromFarms = 0;
            let foodFromFarms = 0;
            let foodConsumption = 0;

            this.country.buildings.forEach(building => {
                if (building.type === 'farm' && !building.isUnderConstruction) {
                    if (building.workers >= this.buildings.farm.requiredWorkers) {
                        goldFromFarms += this.buildings.farm.goldPerDay;
                        foodFromFarms += this.buildings.farm.foodPerDay;
                    }
                } else if (building.type === 'house') {
                    foodConsumption += building.capacity * 10;
                }
            });

            // Add farm income with base income timing
            if (currentTime - lastIncomeTime >= 60000) {
                this.country.gold += goldFromFarms;
            }
            
            this.country.food += foodFromFarms;
            this.country.food -= foodConsumption;

            // Update UI with daily stats
            document.getElementById('goldPerDay').textContent = 
                (1000 + goldFromFarms).toString();
            document.getElementById('foodPerDay').textContent = 
                (foodFromFarms - foodConsumption).toString();

            // Increment day and show notification
            this.dayCount++;
            this.showDayNotification();
            this.updateUI();
        }, this.dayDuration); // Update every 30 seconds
    }

    showDayNotification() {
        const dayInfo = document.createElement('div');
        dayInfo.className = 'day-info';
        dayInfo.innerHTML = `Day ${this.dayCount}`;
        document.querySelector('.game-map').appendChild(dayInfo);
        setTimeout(() => dayInfo.remove(), 3000);
    }

    startPopulationGrowth() {
        setInterval(() => {
            this.country.buildings.forEach(building => {
                if (building.type === 'house') {
                    this.country.population += 1;
                }
            });
            this.updateUI();
        }, 300000); // 5 minutes
    }

    startGameLoop() {
        this.gameLoop = setInterval(() => {
            this.updateUnits();
            this.checkCollisions();
        }, 50); // Update every 50ms
    }

    updateUnits() {
        this.enemies.forEach(enemy => {
            if (enemy.health <= 0) {
                this.removeUnit(enemy, this.enemies);
                return;
            }

            // Skip movement if stunned
            if (enemy.isStunned) return;

            const wallInPath = this.checkWallCollision(enemy);
            if (wallInPath) {
                enemy.isStunned = true;
                setTimeout(() => {
                    enemy.isStunned = false;
                }, this.buildings.wall.stunTime);
                return;
            }

            // Move towards castle (center)
            const dx = 50 - enemy.x;
            const dy = 50 - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance > enemy.range) {
                const moveX = (dx / distance) * enemy.speed;
                const moveY = (dy / distance) * enemy.speed;
                
                enemy.x += moveX;
                enemy.y += moveY;
                
                enemy.element.style.left = `${enemy.x}%`;
                enemy.element.style.top = `${enemy.y}%`;
            } else {
                // Attack castle
                this.country.health -= enemy.damage;
                console.log(`Castle hit! Health: ${this.country.health}`);
                if (this.country.health <= 0) {
                    this.gameOver();
                }
            }
        });

        // Update soldier positions and combat
        this.country.soldiers.forEach(soldier => {
            if (soldier.health <= 0) {
                this.removeUnit(soldier, this.country.soldiers);
                return;
            }

            // Find nearest enemy
            let nearestEnemy = this.findNearestEnemy(soldier);
            if (nearestEnemy) {
                // Move towards enemy
                const dx = nearestEnemy.x - soldier.x;
                const dy = nearestEnemy.y - soldier.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance > soldier.range) {
                    soldier.x += (dx / distance) * soldier.speed;
                    soldier.y += (dy / distance) * soldier.speed;
                    soldier.element.style.left = `${soldier.x}%`;
                    soldier.element.style.top = `${soldier.y}%`;
                } else {
                    // Attack enemy
                    nearestEnemy.health -= soldier.damage;
                    this.updateUnitHealth(nearestEnemy);
                }
            }
        });
    }

    findNearestEnemy(soldier) {
        let nearest = null;
        let minDistance = Infinity;

        this.enemies.forEach(enemy => {
            const dx = enemy.x - soldier.x;
            const dy = enemy.y - soldier.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < minDistance) {
                minDistance = distance;
                nearest = enemy;
            }
        });

        return nearest;
    }

    startDayNightCycle() {
        setInterval(() => {
            this.isNight = !this.isNight;
            const gameMap = document.querySelector('.game-map');
            
            if (this.isNight) {
                gameMap.classList.add('night');
                this.handleNighttime();
                this.startNightSpawns(); // Start continuous night spawns
            } else {
                gameMap.classList.remove('night');
                this.handleDaytime();
                this.stopNightSpawns(); // Stop night spawns when day comes
            }
        }, this.dayDuration);
    }

    startNightSpawns() {
        // Calculate enemies for this wave using exponential growth
        const enemiesThisWave = Math.floor(this.wave.baseEnemiesPerWave * 
            Math.pow(this.wave.enemyMultiplier, this.wave.current - 1));
        
        console.log(`Wave ${this.wave.current}: Spawning ${enemiesThisWave} enemies during night`);

        // Create groups of enemies during the night
        let enemiesSpawned = 0;
        this.wave.nightSpawnInterval = setInterval(() => {
            if (enemiesSpawned < enemiesThisWave) {
                // Spawn a group of 2-4 enemies
                const groupSize = Math.floor(Math.random() * 3) + 2;
                for (let i = 0; i < groupSize && enemiesSpawned < enemiesThisWave; i++) {
                    this.createEnemy();
                    enemiesSpawned++;
                }
            }
        }, 5000); // Spawn group every 5 seconds
    }

    stopNightSpawns() {
        if (this.wave.nightSpawnInterval) {
            clearInterval(this.wave.nightSpawnInterval);
            this.wave.nightSpawnInterval = null;
            this.wave.current++; // Increment wave counter for next night
        }
    }

    createEnemy() {
        // Generate random position on the edge of the map
        const side = Math.floor(Math.random() * 4); // 0: top, 1: right, 2: bottom, 3: left
        let x, y;
        
        switch(side) {
            case 0: // top
                x = Math.random() * 100;
                y = 0;
                break;
            case 1: // right
                x = 100;
                y = Math.random() * 100;
                break;
            case 2: // bottom
                x = Math.random() * 100;
                y = 100;
                break;
            case 3: // left
                x = 0;
                y = Math.random() * 100;
                break;
        }

        const enemy = {
            x: x,
            y: y,
            health: this.units.enemy.health * Math.pow(this.wave.enemyHealthMultiplier, this.wave.current - 1),
            damage: this.units.enemy.damage * Math.pow(this.wave.enemyDamageMultiplier, this.wave.current - 1),
            speed: this.units.enemy.speed,
            range: this.units.enemy.range
        };

        const element = document.createElement('div');
        element.className = 'enemy';
        element.style.left = `${enemy.x}%`;
        element.style.top = `${enemy.y}%`;
        
        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        element.appendChild(healthBar);

        enemy.element = element;
        enemy.healthBar = healthBar;
        this.enemies.push(enemy);
        document.getElementById('gameMap').appendChild(element);
        
        console.log(`Enemy created at position (${x}, ${y})`);
    }

    createSoldier(barracks) {
        if (this.country.currentSoldiers >= this.getMaxSoldiers()) {
            console.log('Maximum soldier limit reached!');
            return;
        }

        const eraStats = this.eraStats[this.country.era];
        const weaponType = eraStats.soldierType.replace('man', ''); // spearman -> spear
        const weaponStats = this.weaponStats[weaponType];

        const soldier = {
            x: barracks.x,
            y: barracks.y,
            health: this.units.soldier.health,
            damage: weaponStats.damage,
            speed: this.units.soldier.speed,
            range: weaponStats.range,
            type: eraStats.soldierType,
            weapon: weaponType,
            kills: 0
        };

        const element = document.createElement('div');
        element.className = `soldier ${eraStats.soldierType}`;
        element.style.left = `${soldier.x}%`;
        element.style.top = `${soldier.y}%`;

        // Add tooltip
        element.title = this.getSoldierTooltip(soldier);

        // Add hover event for detailed info
        const infoBox = document.createElement('div');
        infoBox.className = 'soldier-info';
        infoBox.style.display = 'none';
        element.appendChild(infoBox);

        element.addEventListener('mouseover', () => {
            infoBox.style.display = 'block';
            infoBox.innerHTML = this.getSoldierTooltip(soldier).replace(/\n/g, '<br>');
        });

        element.addEventListener('mouseout', () => {
            infoBox.style.display = 'none';
        });

        const healthBar = document.createElement('div');
        healthBar.className = 'health-bar';
        element.appendChild(healthBar);

        soldier.element = element;
        soldier.healthBar = healthBar;
        soldier.infoBox = infoBox;
        this.country.soldiers.push(soldier);
        this.country.currentSoldiers++;
        document.getElementById('gameMap').appendChild(element);

        // Apply barracks training bonus
        const trainingBonus = barracks.damageBonus || 0;
        soldier.damage *= (1 + trainingBonus / 100);
    }

    getSoldierTooltip(soldier) {
        return `${soldier.type.charAt(0).toUpperCase() + soldier.type.slice(1)}
Health: ${soldier.health}
Damage: ${soldier.damage}
Range: ${soldier.range}
Weapon: ${soldier.weapon}
Kills: ${soldier.kills}
${this.weaponStats[soldier.weapon].description}`;
    }

    getMaxSoldiers() {
        return Math.floor(this.country.population / 10);
    }

    removeUnit(unit, array) {
        const index = array.indexOf(unit);
        if (index > -1) {
            array.splice(index, 1);
            unit.element.remove();
        }
    }

    updateUnitHealth(unit) {
        const healthPercent = (unit.health / this.units[unit.constructor.name.toLowerCase()].health) * 100;
        unit.healthBar.style.width = `${Math.max(0, healthPercent)}%`;
        if (unit.infoBox) {
            unit.infoBox.innerHTML = this.getSoldierTooltip(unit).replace(/\n/g, '<br>');
        }
    }

    checkCollisions() {
        // Implementation of collision detection and handling
    }

    gameOver() {
        clearInterval(this.gameLoop);
        alert('Game Over! Your castle has been destroyed!');
        location.reload(); // Restart the game
    }

    spawnCivilians() {
        const civiliansCount = Math.min(10, this.country.population / 10);
        for (let i = 0; i < civiliansCount; i++) {
            this.createCivilian();
        }
    }

    createCivilian() {
        const civilian = {
            x: 50 + (Math.random() - 0.5) * 40,
            y: 50 + (Math.random() - 0.5) * 40,
            targetX: null,
            targetY: null,
            speed: 0.2,
            element: document.createElement('div')
        };

        civilian.element.className = 'civilian';
        civilian.element.style.left = `${civilian.x}%`;
        civilian.element.style.top = `${civilian.y}%`;
        
        document.getElementById('gameMap').appendChild(civilian.element);
        this.civilians.push(civilian);
        
        this.updateCivilianMovement(civilian);
    }

    updateCivilianMovement(civilian) {
        if (this.isNight) return;

        // Set new random target
        civilian.targetX = 50 + (Math.random() - 0.5) * 40;
        civilian.targetY = 50 + (Math.random() - 0.5) * 40;

        const moveInterval = setInterval(() => {
            if (this.isNight) {
                clearInterval(moveInterval);
                return;
            }

            const dx = civilian.targetX - civilian.x;
            const dy = civilian.targetY - civilian.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 0.1) {
                // Reached target, set new one after delay
                setTimeout(() => this.updateCivilianMovement(civilian), 2000);
                clearInterval(moveInterval);
                return;
            }

            civilian.x += (dx / distance) * civilian.speed;
            civilian.y += (dy / distance) * civilian.speed;
            civilian.element.style.left = `${civilian.x}%`;
            civilian.element.style.top = `${civilian.y}%`;
        }, 50);
    }

    civiliansShelter() {
        this.civilians.forEach(civilian => {
            // Find nearest house
            const house = this.findNearestBuilding(civilian, 'house');
            if (house) {
                civilian.element.classList.add('running');
                this.moveCivilianTo(civilian, house.x, house.y, true);
            }
        });
    }

    civiliansResume() {
        this.civilians.forEach(civilian => {
            civilian.element.classList.remove('running');
            this.updateCivilianMovement(civilian);
        });
    }

    findNearestBuilding(unit, type) {
        let nearest = null;
        let minDistance = Infinity;

        this.country.buildings.forEach(building => {
            if (building.type === type) {
                const dx = building.x - unit.x;
                const dy = building.y - unit.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = building;
                }
            }
        });

        return nearest;
    }

    moveCivilianTo(civilian, targetX, targetY, hide = false) {
        const speed = hide ? civilian.speed * 3 : civilian.speed; // Run 3x faster when scared
        
        const moveInterval = setInterval(() => {
            const dx = targetX - civilian.x;
            const dy = targetY - civilian.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 0.1) {
                clearInterval(moveInterval);
                if (hide) {
                    civilian.element.style.opacity = '0';
                }
                return;
            }

            civilian.x += (dx / distance) * speed;
            civilian.y += (dy / distance) * speed;
            civilian.element.style.left = `${civilian.x}%`;
            civilian.element.style.top = `${civilian.y}%`;
        }, 50);
    }

    checkWallCollision(enemy) {
        if (enemy.isStunned) return null;

        let collision = null;
        this.country.buildings.forEach(building => {
            if (building.type === 'wall') {
                const dx = building.x - enemy.x;
                const dy = building.y - enemy.y;
                
                // Rotate the point around the wall's center
                const angle = building.rotation * (Math.PI / 180);
                const rotatedDx = dx * Math.cos(angle) - dy * Math.sin(angle);
                const rotatedDy = dx * Math.sin(angle) + dy * Math.cos(angle);
                
                // Check collision with rotated wall
                if (Math.abs(rotatedDx) < 50 && Math.abs(rotatedDy) < 20) {
                    collision = building;
                }
            }
        });
        return collision;
    }

    // Add new methods for building upgrades
    upgradeBuilding(building, upgradeType) {
        const buildingType = building.type;
        const upgrade = this.buildings[buildingType].upgrades[upgradeType];
        
        if (upgrade.level >= upgrade.maxLevel) {
            alert('Maximum upgrade level reached!');
            return;
        }

        const cost = upgrade.cost * upgrade.level;
        if (this.country.gold >= cost) {
            this.country.gold -= cost;
            upgrade.level++;

            // Apply upgrade effects
            switch(buildingType) {
                case 'house':
                    if (upgradeType === 'capacity') {
                        building.capacity += upgrade.effect;
                    } else if (upgradeType === 'efficiency') {
                        building.foodConsumption -= upgrade.effect;
                    }
                    break;
                case 'barracks':
                    if (upgradeType === 'training') {
                        building.damageBonus = (upgrade.level - 1) * upgrade.effect;
                    } else if (upgradeType === 'capacity') {
                        building.maxSoldiers = 5 + (upgrade.level - 1) * upgrade.effect;
                    }
                    break;
            }

            this.updateUI();
            this.updateBuildingDisplay(building);
        } else {
            alert('Not enough gold!');
        }
    }

    updateBuildingDisplay(building) {
        // Add upgrade indicators to building
        const element = building.element;
        const upgrades = this.buildings[building.type].upgrades;
        
        let tooltip = `${building.type.charAt(0).toUpperCase() + building.type.slice(1)}\n`;
        for (const [type, upgrade] of Object.entries(upgrades)) {
            tooltip += `${type}: Level ${upgrade.level}/${upgrade.maxLevel}\n`;
        }
        
        element.title = tooltip;

        // Add visual indicator for upgrade level
        element.dataset.upgradeLevel = 
            Math.max(...Object.values(upgrades).map(u => u.level));
    }

    startConstruction(building) {
        const startTime = Date.now();
        
        const constructionInterval = setInterval(() => {
            const elapsed = Date.now() - startTime;
            const progress = (elapsed / this.constructionTime) * 100;
            
            if (progress >= 100) {
                clearInterval(constructionInterval);
                this.completeConstruction(building);
            } else {
                building.constructionProgress = progress;
                this.updateConstructionProgress(building);
            }
        }, 50); // Update every 50ms for smooth progress
    }

    updateConstructionProgress(building) {
        const element = building.element;
        const overlay = element.querySelector('.construction-overlay');
        if (overlay) {
            overlay.style.height = `${100 - building.constructionProgress}%`;
        }
    }

    completeConstruction(building) {
        building.isUnderConstruction = false;
        const element = building.element;
        element.querySelector('.construction-overlay').remove();

        // Apply building effects
        if (building.type === 'house') this.country.population += this.buildings.house.capacity;
        if (building.type === 'barracks') this.spawnInitialSoldiers(building);
    }

    spawnInitialSoldiers(barracks) {
        for (let i = 0; i < 5; i++) {
            setTimeout(() => {
                this.createSoldier(barracks);
            }, i * 500);
        }
    }

    upgradeBarracksPath(building, path) {
        const otherPath = path === 'pathA' ? 'pathB' : 'pathA';
        const upgrade = building.upgrades[path];
        const otherUpgrade = building.upgrades[otherPath];

        if (upgrade.level >= upgrade.maxLevel) {
            alert('Maximum upgrade level reached!');
            return;
        }

        if (otherUpgrade.level > 2) {
            alert('Cannot upgrade this path further due to other path upgrades');
            return;
        }

        const cost = this.buildings.barracks.upgrades[path].cost * upgrade.level;
        if (this.country.gold >= cost) {
            this.country.gold -= cost;
            upgrade.level++;

            // Apply upgrade effects
            const effect = this.buildings.barracks.upgrades[path].effects[upgrade.level - 1];
            if (effect.damage) building.damageBonus = effect.damage;
            if (effect.quantity) building.maxSoldiers = effect.quantity;
            if (effect.special) building.special = effect.special;

            this.updateUI();
            this.updateBuildingDisplay(building);
        }
    }

    generateResourceNodes() {
        const map = document.getElementById('gameMap');
        
        // Generate trees
        for(let i = 0; i < 20; i++) {
            const node = {
                type: 'tree',
                x: Math.random() * 90 + 5,
                y: Math.random() * 90 + 5,
                resources: Math.floor(Math.random() * 51) + 50 // 50-100 resources
            };
            
            const element = document.createElement('div');
            element.className = 'resource-node tree';
            element.style.left = `${node.x}%`;
            element.style.top = `${node.y}%`;
            element.title = `Wood: ${node.resources}`;
            map.appendChild(element);
            
            this.resourceNodes.trees.push(node);
        }

        // Generate rocks
        for(let i = 0; i < 15; i++) {
            const node = {
                type: 'rock',
                x: Math.random() * 90 + 5,
                y: Math.random() * 90 + 5,
                resources: Math.floor(Math.random() * 51) + 50
            };
            
            const element = document.createElement('div');
            element.className = 'resource-node rock';
            element.style.left = `${node.x}%`;
            element.style.top = `${node.y}%`;
            element.title = `Stone: ${node.resources}`;
            map.appendChild(element);
            
            this.resourceNodes.rocks.push(node);
        }

        // Generate iron deposits
        for(let i = 0; i < 10; i++) {
            const node = {
                type: 'iron',
                x: Math.random() * 90 + 5,
                y: Math.random() * 90 + 5,
                resources: Math.floor(Math.random() * 51) + 50
            };
            
            const element = document.createElement('div');
            element.className = 'resource-node iron-deposit';
            element.style.left = `${node.x}%`;
            element.style.top = `${node.y}%`;
            element.title = `Iron: ${node.resources}`;
            map.appendChild(element);
            
            this.resourceNodes.ironDeposits.push(node);
        }
    }

    canAffordBuilding(buildingType) {
        const costs = this.buildings[buildingType].cost;
        let canAfford = true;
        let missingResources = [];

        for (const [resource, amount] of Object.entries(costs)) {
            if (resource === 'gold') {
                if (this.country.gold < amount) {
                    canAfford = false;
                    missingResources.push(`${amount - this.country.gold} gold`);
                }
            } else {
                if (this.resources[resource] < amount) {
                    canAfford = false;
                    missingResources.push(`${amount - this.resources[resource]} ${resource}`);
                }
            }
        }

        if (!canAfford) {
            alert(`Not enough resources! You need:\n${missingResources.join('\n')}`);
            return false;
        }

        return true;
    }

    hasEnoughWorkers(buildingType) {
        const required = this.buildings[buildingType].requiredWorkers || 0;
        const availableWorkers = this.getAvailableWorkers();
        return availableWorkers >= required;
    }

    getAvailableWorkers() {
        let totalPopulation = 0;
        let assignedWorkers = 0;

        this.country.buildings.forEach(building => {
            if(building.type === 'house') {
                totalPopulation += building.capacity;
            }
            assignedWorkers += building.workers || 0;
        });

        return totalPopulation - assignedWorkers;
    }

    handleDaytime() {
        // Workers go to their jobs
        this.civilians.forEach(civilian => {
            civilian.element.style.opacity = '1';
            if(civilian.workplace) {
                this.moveCivilianTo(civilian, civilian.workplace.x, civilian.workplace.y);
            }
        });

        // Hide soldiers
        this.country.soldiers.forEach(soldier => {
            soldier.element.style.opacity = '0.5';
        });

        // Start resource gathering
        this.startResourceGathering();
    }

    handleNighttime() {
        // Civilians hide in houses
        this.civiliansShelter();

        // Show and position soldiers
        this.country.soldiers.forEach(soldier => {
            soldier.element.style.opacity = '1';
            // Position soldiers around buildings strategically
        });

        // Stop resource gathering
        this.stopResourceGathering();
    }

    startResourceGathering() {
        this.country.buildings.forEach(building => {
            if(['lumbermill', 'quarry', 'mine'].includes(building.type)) {
                const productionRate = this.calculateProductionRate(building);
                building.productionInterval = setInterval(() => {
                    this.gatherResources(building, productionRate);
                }, 5000); // Update every 5 seconds
            }
        });
    }

    calculateProductionRate(building) {
        const baseRate = this.buildings[building.type].production;
        const workerEfficiency = building.workers / this.buildings[building.type].requiredWorkers;
        return baseRate * workerEfficiency;
    }

    gatherResources(building, rate) {
        switch(building.type) {
            case 'lumbermill':
                this.resources.wood += rate;
                break;
            case 'quarry':
                this.resources.stone += rate;
                break;
            case 'mine':
                this.resources.iron += rate;
                break;
        }
        this.updateResourcesUI();
    }

    updateResourcesUI() {
        document.getElementById('wood').textContent = Math.floor(this.resources.wood);
        document.getElementById('stone').textContent = Math.floor(this.resources.stone);
        document.getElementById('iron').textContent = Math.floor(this.resources.iron);
    }

    stopResourceGathering() {
        // Implementation of stopping resource gathering
    }

    assignWorkersToBuilding(building) {
        const requiredWorkers = this.buildings[building.type].requiredWorkers;
        const availableWorkers = this.getAvailableWorkers();

        if (availableWorkers < requiredWorkers) {
            alert(`Not enough workers! Need ${requiredWorkers} workers.`);
            return false;
        }

        building.workers = requiredWorkers;
        this.createWorkers(building);
        return true;
    }

    createWorkers(building) {
        for (let i = 0; i < building.workers; i++) {
            const worker = {
                element: document.createElement('div'),
                building: building,
                resourceNode: null
            };

            worker.element.className = 'worker';
            worker.element.style.left = `${building.x}%`;
            worker.element.style.top = `${building.y}%`;
            document.getElementById('gameMap').appendChild(worker.element);

            if (['lumbermill', 'quarry', 'mine'].includes(building.type)) {
                this.assignResourceNode(worker);
            }
        }
    }

    assignResourceNode(worker) {
        let nodes;
        switch (worker.building.type) {
            case 'lumbermill':
                nodes = this.resourceNodes.trees;
                break;
            case 'quarry':
                nodes = this.resourceNodes.rocks;
                break;
            case 'mine':
                nodes = this.resourceNodes.ironDeposits;
                break;
        }

        // Find nearest available node
        let nearestNode = null;
        let minDistance = Infinity;

        nodes.forEach(node => {
            if (node.resources > 0) {
                const dx = node.x - worker.building.x;
                const dy = node.y - worker.building.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < minDistance) {
                    minDistance = distance;
                    nearestNode = node;
                }
            }
        });

        if (nearestNode) {
            worker.resourceNode = nearestNode;
            this.startWorkerGathering(worker);
        }
    }

    startWorkerGathering(worker) {
        if (!worker.resourceNode || this.isNight) return;

        worker.element.classList.add('moving');
        worker.element.style.left = `${worker.resourceNode.x}%`;
        worker.element.style.top = `${worker.resourceNode.y}%`;

        setTimeout(() => {
            worker.element.classList.remove('moving');
            worker.element.classList.add('gathering');

            // Start gathering resources
            const gatherInterval = setInterval(() => {
                if (this.isNight || worker.resourceNode.resources <= 0) {
                    clearInterval(gatherInterval);
                    worker.element.classList.remove('gathering');
                    this.returnWorkerToBuilding(worker);
                    if (worker.resourceNode.resources <= 0) {
                        this.assignResourceNode(worker);
                    }
                    return;
                }

                const production = this.buildings[worker.building.type].production;
                const gatherAmount = Math.floor(Math.random() * 
                    (production.max - production.min + 1)) + production.min;

                worker.resourceNode.resources -= gatherAmount;
                switch (worker.building.type) {
                    case 'lumbermill':
                        this.resources.wood += gatherAmount;
                        break;
                    case 'quarry':
                        this.resources.stone += gatherAmount;
                        break;
                    case 'mine':
                        this.resources.iron += gatherAmount;
                        break;
                }

                this.updateResourcesUI();
                worker.resourceNode.element.title = 
                    `${worker.resourceNode.type}: ${worker.resourceNode.resources}`;
            }, 5000); // Gather every 5 seconds
        }, 500); // After movement animation
    }

    returnWorkerToBuilding(worker) {
        worker.element.classList.add('moving');
        worker.element.style.left = `${worker.building.x}%`;
        worker.element.style.top = `${worker.building.y}%`;

        setTimeout(() => {
            worker.element.classList.remove('moving');
        }, 500);
    }

    showUpgradePanel(buildingElement) {
        // Remove selection from other buildings
        document.querySelectorAll('.building.selected').forEach(b => {
            b.classList.remove('selected');
        });

        // Add selection to clicked building
        buildingElement.classList.add('selected');

        // Show upgrade panel
        const upgradePanel = document.querySelector('.building-upgrades .upgrade-options');
        upgradePanel.style.display = 'block';
        document.getElementById('selectedBuilding').textContent = 'Selected: Barracks';

        // Show upgrade paths for barracks
        const pathsPanel = document.querySelector('.upgrade-paths');
        pathsPanel.style.display = 'block';

        // Update upgrade path levels
        const building = this.country.buildings.find(b => 
            b.x === parseFloat(buildingElement.style.left) && 
            b.y === parseFloat(buildingElement.style.top)
        );

        if (building) {
            document.querySelector('.path-a .upgrade-level').textContent = 
                `Level ${building.upgrades?.pathA?.level || 1}`;
            document.querySelector('.path-b .upgrade-level').textContent = 
                `Level ${building.upgrades?.pathB?.level || 1}`;
        }
    }
}

// Start the game
const game = new Game(); 