import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

// Class for GameController - initializes scene, controls game logic related to scene
class GameController {
    constructor() {
        // Scene creation
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.loader = new GLTFLoader();
        this.flickerLights = [];
        this.listener = new THREE.AudioListener();        

        // Hedges/Hitboxes
        this.hedgeTexture = null;
        this.playerHitbox = null;
        this.hedgeBoxes = [];
        this.collision = false;
        this.clock = new THREE.Clock();

        // Other arrays/score
        this.mazeLayout = [];
        this.strawberries = [];
        this.bears = [];
        this.score = 0;
    }

    // Sets values based on difficulty, calls functions to initialize the game
    start(difficulty) {
        switch(difficulty) {
            case 'easy':
                this.fogDistance = 40
                this.offsetX = -5
                this.offsetY = 10
                this.numBears = 1
                break;
            case 'medium':
                this.fogDistance = 25
                this.offsetX = -3
                this.offsetY = 7
                this.numBears = 2
                break;
            case 'hard':
                this.fogDistance = 15
                this.offsetX = -2
                this.offsetY = 5
                this.numBears = 3
                break;
        }

        this.initScene();
        this.createMaze();
        this.addPlayer();
        this.addEnemy();
        this.playMusic();
        this.startTimer();
    }

    // Create scene with plane and skybox
    initScene() {
        // Renderer setup
        this.renderer.outputEncoding = THREE.sRGBEncoding
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.VSMShadowMap
        onResize(this.camera, this.renderer)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        document.body.appendChild(this.renderer.domElement)

        // Add AudioListener to camera
        this.camera.add(this.listener);

        // Fog setup
        this.scene.fog = new THREE.Fog(0xffffff, 0.0025, this.fogDistance)

        // Lighting
        this.scene.add(new THREE.AmbientLight(0x272727, 1, 100, 50))

        // Skybox
        const skyLoader = new THREE.CubeTextureLoader();
        const skyboxTexture = skyLoader.load([
            'assets/forest.jpg', 'assets/forest.jpg',
            'assets/black.jpg', 'assets/black.jpg',
            'assets/forest.jpg', 'assets/forest.jpg',
        ]);
        this.scene.background = skyboxTexture;

        // Load textures
        const textureLoader = new THREE.TextureLoader();
        this.hedgeTexture = textureLoader.load('assets/hedge.jpg');
        this.hedgeTexture.wrapS = THREE.RepeatWrapping;
        this.hedgeTexture.wrapT = THREE.RepeatWrapping;

        const stoneTexture = textureLoader.load('assets/stone.jpg');
        stoneTexture.wrapS = THREE.RepeatWrapping;
        stoneTexture.wrapT = THREE.RepeatWrapping;
        stoneTexture.repeat.set(25, 25);

        // Plane
        const groundGeo = new THREE.PlaneGeometry(50, 50);
        const groundMat = new THREE.MeshLambertMaterial({ map: stoneTexture, side: THREE.DoubleSide });
        const groundMesh = new THREE.Mesh(groundGeo, groundMat);
        groundMesh.position.set(20, -0.02, 20);
        groundMesh.rotation.set(-Math.PI / 2, 0, 0);
        groundMesh.castShadow = true;
        groundMesh.receiveShadow = true;
        this.scene.add(groundMesh);
    }

    createMaze() {
        // Build hedge maze
        const mazeLayout = [
            ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1'],
            ['1','0','1','0','0','0','1','0','0','0','1','0','0','0','0','0','0','0','0','0','1'],
            ['1','0','1','0','1','0','1','0','1','0','1','1','1','1','1','0','1','1','1','0','1'],
            ['1','0','0','0','0','0','1','0','1','0','0','0','0','0','1','0','0','0','1','0','1'],
            ['1','0','1','1','1','0','1','0','1','1','1','1','1','0','1','0','1','1','1','0','1'],
            ['1','0','0','0','1','0','0','0','1','0','1','0','0','0','1','0','0','0','1','0','1'],
            ['1','1','1','0','1','1','1','1','1','0','1','0','1','0','1','0','1','0','1','0','1'],
            ['1','0','0','0','1','0','0','0','0','0','0','0','1','0','0','0','1','0','0','0','1'],
            ['1','0','1','1','1','0','1','0','1','0','1','0','1','1','1','0','1','0','1','0','1'],
            ['1','0','0','0','0','0','1','0','1','0','1','0','0','0','1','0','1','0','1','0','1'],
            ['1','1','1','0','1','1','1','1','1','0','1','0','1','1','1','0','1','0','1','0','1'],
            ['1','0','0','0','1','0','0','0','0','0','1','0','0','0','1','0','1','0','1','0','1'],
            ['1','0','1','1','1','0','1','1','1','0','1','1','1','0','1','0','1','1','1','1','1'],
            ['1','0','1','0','1','0','0','0','1','0','1','0','0','0','1','0','0','0','1','0','1'],
            ['1','0','1','0','1','0','1','1','1','1','1','0','1','1','1','0','1','1','1','0','1'],
            ['1','0','1','0','0','0','1','0','0','0','0','0','0','0','0','0','1','0','0','0','1'],
            ['1','0','1','1','1','0','1','0','1','0','1','1','1','1','1','0','1','0','1','0','1'],
            ['1','0','0','0','0','0','1','0','1','0','1','0','0','0','1','0','0','0','1','0','1'],
            ['1','0','1','1','1','1','1','0','1','0','1','0','1','0','1','1','1','1','1','0','1'],
            ['1','0','0','0','0','0','1','0','1','0','0','0','1','0','0','0','0','0','0','0','1'],
            ['1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1','1']
        ];
        this.mazeLayout = mazeLayout

        // Build maze
        const cellSize = 2;
        this.buildMazeFromGrid(mazeLayout, cellSize);  

        // Positions/orientations of lanterns
        const lanterns = [
            [-3, 0, 0, 3 * Math.PI / 4],
            [9, 0, 11, - Math.PI / 4],
            [7, 0, 23, Math.PI / 5],
            [11, 0, 25, 4 * Math.PI / 5],
            [18, 0, 9, Math.PI],
            [14, 0, 39, 0],
            [27, 0, 5, 4 * Math.PI / 5],
            [39, 0, 14, Math.PI / 2],
            [29, 0, 35, - Math.PI / 5],
            [43, 0, 40, - Math.PI / 5]
        ]
     
        // Create lanterns
        this.addLanterns(lanterns)   
        this.spawnStrawberries()
    }

    // For loop to build each lantern
    addLanterns(grid) {
        for (let i = 0; i < grid.length; i++) {
            const position = new THREE.Vector3(
                grid[i][0], grid[i][1], grid[i][2]
            )
            const rotation = grid[i][3]
            this.buildLantern(position, rotation)
        }      
    }

    // Function to create new lantern object
    buildLantern(position, rotation) {
        // Load model
        this.loader.load('models/wooden_lantern/scene.gltf', (loadedObject) => {
            const lantern = loadedObject.scene;
            visitChildren(lantern, (el) => {
                el.castShadow = true
                el.receiveShadow = true
            })
            
            // Set physical attributes of lantern
            lantern.position.set(position.x, position.y, position.z)
            lantern.scale.set(0.5,0.5,0.5)
            lantern.rotateY(rotation)

            // Create PointLight for lantern
            const light = new THREE.PointLight(0xffddaa, 2)
            light.position.set(0, 5, -4.65);
            light.castShadow = true;
            light.shadow.bias = -0.005;

            // Add light object to array, add lantern to scene
            lantern.add(light);
            this.flickerLights.push(light);
            this.scene.add(lantern)
        })
    }

    // Function to animate flicker effects in lanterns
    animateFlicker() {
        this.flickerLights.forEach(light => {
            const variation = 2 * 0.1 * Math.sin(performance.now() * 0.005 + Math.random() * 5);
            light.intensity = 2 + variation;
        });
    }

    // Function to build hedge maze using maze layout
    buildMazeFromGrid(grid, cellSize) {
        const wallHeight = 2; // wall height = 2 for easy, 4 or 5 for hard
    
        for (let i = 0; i < grid.length; i++) {
            for (let j = 0; j < grid[i].length; j++) {
                if (grid[i][j] === '1') {
                const position = new THREE.Vector3(
                    j * cellSize,
                    wallHeight / 2,
                    i * cellSize
                );
        
                const scale = new THREE.Vector3(cellSize, wallHeight, cellSize);
                const hedge = this.createHedgeSection(position, scale);
                this.scene.add(hedge);

                const hedgeBox = new THREE.Box3().setFromObject(hedge);
                this.hedgeBoxes.push(hedgeBox);
                }
            }
        }
    }   

    // Function to create hedge box
    createHedgeSection(position, scale) {
        this.hedgeTexture.repeat.set(scale.x / 2, scale.y / 2);
        const geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z);
        const material = new THREE.MeshStandardMaterial({
            map: this.hedgeTexture,
        });
        const hedge = new THREE.Mesh(geometry, material);
        hedge.position.set(position.x, position.y, position.z);
        hedge.castShadow = true;
        hedge.receiveShadow = true;
        return hedge;
    }

    // Function to add strawberry 
    addStrawberry(position) {
        const berry = new Strawberry(position, this.listener);

        this.loader.load('models/strawberry/scene.gltf', (gltf) => {
            const model = gltf.scene;
            visitChildren(model, (el) => {
                el.castShadow = true
                el.receiveShadow = true  
            })
            model.position.copy(position)
            model.scale.set(0.2, 0.2, 0.2)
            this.scene.add(model);
            berry.model = model;

            // Create hitbox and add to array of strawberries
            const box = new THREE.Box3().setFromObject(model)
            berry.hitbox = box;
            this.strawberries.push(berry)
        })
    }

    // Randomly spawn in ten strawberries
    spawnStrawberries() {
        const walkableCells = [];
    
        // Collect walkable cells from the layout
        for (let i = 0; i < this.mazeLayout.length; i++) {
            for (let j = 0; j < this.mazeLayout[i].length; j++) {
                if (this.mazeLayout[i][j] === '0') {
                    walkableCells.push([i, j]);
                }
            }
        }
    
        // Shuffle and select 10 random positions
        for (let n = 0; n < 10; n++) {
            if (walkableCells.length === 0) break;
    
            const index = Math.floor(Math.random() * walkableCells.length);
            const [i, j] = walkableCells.splice(index, 1)[0];
    
            const cellSize = 2;
            const position = new THREE.Vector3(
                j * cellSize,
                0.5,
                i * cellSize
            );
    
            this.addStrawberry(position);
        }
    }

    // Create player
    addPlayer() {
        this.player = new Player();
        this.cameraOffset = new THREE.Vector3(this.offsetX, this.offsetY, 0);

        this.loader.load('models/deer/scene.gltf', (gltf) => {
            const model = gltf.scene;
            visitChildren(model, (el) => {
                el.castShadow = true
                el.receiveShadow = true  
            })

            // Set physical attributes, add to scene, create hitbox
            model.position.set(2, 0.5, 2)
            model.scale.set(0.5, 0.5, 0.5)
            this.scene.add(model);
            this.player.model = model;
            this.initPlayerHitbox();
        })
    }

    // Add BoxGeometry for player's hitbox
    initPlayerHitbox() {
        this.playerHitbox = new THREE.Mesh(
            new THREE.BoxGeometry(0.7, 2, 0.7),
            new THREE.MeshBasicMaterial({ visible: false })
        );
        this.scene.add(this.playerHitbox);
    }

    addEnemy() {
        const spawnPositions = [
            new THREE.Vector3(37.5, 0, 38),
            new THREE.Vector3(1.5, 0, 38),
            new THREE.Vector3(38, 0, 1.5),
        ];

        for (let i = 0; i < this.numBears; i++) {
            const position = spawnPositions[i]
            const enemy = new Enemy(position.clone());

            this.loader.load('models/bear/scene.gltf', (gltf) => {
                const model = gltf.scene;
                visitChildren(model, (el) => {
                    el.castShadow = true
                    el.receiveShadow = true  
                })
                model.position.copy(enemy.position);
                model.scale.set(3, 4, 4)
                this.scene.add(model);
                enemy.model = model;
                
                // Add hitbox
                enemy.hitbox = new THREE.Mesh(
                    new THREE.BoxGeometry(1.5, 2, 1.5),
                    new THREE.MeshBasicMaterial({ visible: false })
                );
                this.scene.add(enemy.hitbox)
                this.bears.push(enemy);
            })
        }
    }

    // Collision logic for player with hedge wall/strawberry/enemy
    detectCollision() {
        const playerBox = new THREE.Box3().setFromObject(this.playerHitbox);
    
        // Collision with hedges
        this.collision = false;
        for (const hedgeBox of this.hedgeBoxes) {
            if (playerBox.intersectsBox(hedgeBox)) {
                this.collision = true;
                break;
            }
        }

        // Collision with strawberries
        for (const strawberry of this.strawberries) {
            if (!strawberry.isCollected && strawberry.hitbox) {    
                // If collision detected: collect strawberry, increase score, check for win    
                if (playerBox.intersectsBox(strawberry.hitbox)) {
                    strawberry.collect();
                    this.score += 1;
                    document.getElementById('scoreDisplay').textContent = `Score: ${this.score}`;

                    // Win condition: score = 10
                    if (this.score == 10) {
                        this.isGameOver = true;
                        clearInterval(this.timerInterval);
                        endGame(true);
                    }
                }
            }
        }

        // Collision with enemy
        for (const bear of this.bears) {
            const bearBox = new THREE.Box3().setFromObject(bear.hitbox);
            if (playerBox.intersectsBox(bearBox)) {
                // Play sound effect
                const audioLoader = new THREE.AudioLoader();
                this.sound = new THREE.Audio(this.listener);
                audioLoader.load('assets/bearRoar.wav', (buffer) => {
                    this.sound.setBuffer(buffer);
                    this.sound.setVolume(0.5);
                    // Conditional to avoid sound playing multiple times
                    if (!this.isGameOver) this.sound.play();
                    this.isGameOver = true;
                    clearInterval(this.timerInterval);
                })

                // End game as lose condition
                endGame(false);
                return;
            }
        }
    }

    // Load and play mp3 for music
    playMusic() {
        const audioLoader = new THREE.AudioLoader();
        this.music = new THREE.Audio(this.listener);
        audioLoader.load('assets/horror-spooky-piano.mp3', (buffer) => {
            this.music.setBuffer(buffer);
            this.music.setLoop(true);
            this.music.setVolume(0.5);
            this.music.play();
        })
    }

    // Begin timer
    startTimer() {
        this.startTime = null;
        this.elapsedTime = 0;
        this.timerInterval = null;

        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
            const now = Date.now();
            this.elapsedTime = Math.floor((now - this.startTime) / 1000);
            this.updateTimeDisplay();
        }, 1000);
    }

    // Function to continuously update timer
    updateTimeDisplay() {
        // Convert elapsed time to h/mm/ss
        const hours = Math.floor(this.elapsedTime / 3600);
        const minutes = Math.floor((this.elapsedTime % 3600) / 60);
        const seconds = this.elapsedTime % 60;

        // Covert to string and update HTML element
        const time = `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        document.getElementById('timeDisplay').textContent = `Time: ${time}`;
    }

    // Render function called in main animate
    render() { 
        // Check for collisions
        this.detectCollision();
    
        // If game running, update player/enemy positions and camera
        if (!this.isGameOver) {
            // Update player position
            if (!this.collision) this.player.updatePosition();
            else {
                // Step back slightly along reverse velocity direction
                const stepBack = this.player.velocity.clone().normalize().multiplyScalar(0.02); // Tweak scalar as needed
                this.player.position.sub(stepBack);
            }

            // Set model and hitbox positions to player position
            this.player.model.position.copy(this.player.position);
            this.playerHitbox.position.copy(this.player.position);

            // Update enemy positions
            const delta = this.clock.getDelta();
            for (let i = 0; i < this.bears.length; i++) {
                this.bears[i].update(delta, this.mazeLayout);
                this.bears[i].hitbox.position.copy(this.bears[i].position);
            }
        
            // Update camera
            const cameraTarget = this.player.position.clone().add(this.cameraOffset);
            this.camera.position.lerp(cameraTarget, 0.1);
            this.camera.lookAt(this.player.position);
        }
    
        this.animateFlicker();
        this.renderer.render(this.scene, this.camera);
    }

}

// Player class: handles player movement and controls
class Player {
    constructor(startPosition = new THREE.Vector3(2, 0.5, 2)) {
        this.position = startPosition;
        this.velocity = new THREE.Vector3(0, 0, 0);

        this.moveDirection = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };

        this.model = null;
        this.targetRotation = 0;

        this.initKeyboardControls();
    }

    // Initialize event listeners for WASD controls.
    initKeyboardControls() {
        window.addEventListener('keydown', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveDirection.forward = true; break;
                case 'KeyS': this.moveDirection.backward = true; break;
                case 'KeyA': this.moveDirection.left = true; break;
                case 'KeyD': this.moveDirection.right = true; break;
            }
        });

        window.addEventListener('keyup', (event) => {
            switch (event.code) {
                case 'KeyW': this.moveDirection.forward = false; break;
                case 'KeyS': this.moveDirection.backward = false; break;
                case 'KeyA': this.moveDirection.left = false; break;
                case 'KeyD': this.moveDirection.right = false; break;
            }
        });
    }

    // Update position/orientation of model when moving
    updatePosition() {
        const dir = new THREE.Vector3(); // Vector for movement direction

        if (this.moveDirection.forward) dir.x += 1;
        if (this.moveDirection.backward) dir.x -= 1;
        if (this.moveDirection.left) dir.z -= 1;
        if (this.moveDirection.right) dir.z += 1;


        // If moving, set velocity to dir and update position/rotation
        // If not moving, set velocity to 0
        if (dir.lengthSq() > 0) {
            dir.normalize().multiplyScalar(0.12);
            this.velocity.copy(dir);
            this.position.add(this.velocity);
            this.targetRotation = Math.atan2(dir.z, dir.x) * -1;
        } else {
            this.velocity.set(0, 0, 0);
        }

        // Smooth rotation for targetRotation
        const currentY = this.model.rotation.y;
        const delta = this.targetRotation - currentY;

        // Normalize to [-PI, PI]
        const normalized = Math.atan2(Math.sin(delta), Math.cos(delta));

        this.model.rotation.y += normalized * 0.2;
    }

}

// Enemy class: handles movement AI
class Enemy {
    constructor(startPosition = new THREE.Vector3(37.5, 0, 38)) {
        this.position = startPosition.clone();
        this.velocity = new THREE.Vector3(0, 0, 0);
        this.model = null;
        this.targetRotation = 0;
        this.hitbox = null;

        this.currentDirection = null;
        this.targetTile = null;
    }

    setRandomDirection(mazeLayout) {
        const tileX = Math.floor(this.position.x / 2);
        const tileZ = Math.floor(this.position.z / 2);

        const directions = [
            { name: 'north', dx: 1, dz: 0 },
            { name: 'south', dx: -1, dz: 0 },
            { name: 'west', dx: 0, dz: -1 },
            { name: 'east', dx: 0, dz: 1 },
        ];

        const opposites = {
            north: 'south',
            south: 'north',
            east: 'west',
            west: 'east'
        };

        // Determine valid directions by checking if surrounding tiles are 0 in mazeLayout
        let validDirections = directions.filter(d => {
            const newX = tileX + d.dx;
            const newZ = tileZ + d.dz;
            return mazeLayout[newZ]?.[newX] == 0;
        });

        // If not at dead end, don't turn around
        if (this.currentDirection != null && validDirections.length != 1) {
            const opposite = opposites[this.currentDirection];
            validDirections = validDirections.filter(d => d.name !== opposite);
        }

        if (validDirections.length > 0) {
            const dir = validDirections[Math.floor(Math.random() * validDirections.length)];
            this.currentDirection = dir.name;
            this.targetTile = new THREE.Vector3(
                (tileX + dir.dx) * 2,
                0,
                (tileZ + dir.dz) * 2
            );
            this.targetRotation = Math.atan2(dir.dz, dir.dx) * -1;
        } else {
            this.currentDirection = null;
            this.targetTile = null;
        }
    }

    // Update position/velocity
    update(delta, mazeLayout) {
        // Initial call to setRandomDirection
        if (!this.targetTile) {
            this.setRandomDirection(mazeLayout);
            return;
        }
        
        const dirVec = this.targetTile.clone().sub(this.position).normalize();
        const speed = 4; // units per second
        this.velocity.copy(dirVec.clone().multiplyScalar(speed * delta));
        this.position.add(this.velocity);

        // Snap to tile if close enough
        if (this.position.distanceTo(this.targetTile) < 0.1) {
            this.position.copy(this.targetTile);
            this.setRandomDirection(mazeLayout);
        }

        // Update model position
        if (this.model) {
            this.model.position.copy(this.position);
        }

        // Smooth rotation for targetRotation
        const currentY = this.model.rotation.y;
        const deltaY = this.targetRotation - currentY;

        // Normalize to [-PI, PI]
        const normalized = Math.atan2(Math.sin(deltaY), Math.cos(deltaY));

        this.model.rotation.y += normalized * 0.2;
    }
}

// Strawberry class: handles logic for player collision with strawberry
class Strawberry {
    constructor(position, listener) {
        this.position = position;
        this.isCollected = false;
        this.model = null;
        this.hitbox = null;

        const audioLoader = new THREE.AudioLoader();
        this.sound = new THREE.Audio(listener);
        audioLoader.load('assets/pickup.mp3', (buffer) => {
            this.sound.setBuffer(buffer);
            this.sound.setVolume(0.5);
        });
    }

    collect() {
        this.isCollected = true;
        if (this.model) {
            this.sound.play();
            this.model.visible = false; // Or remove it from the scene
        }
    }
}

const gameController = new GameController();

// Function run when difficulty chosen
window.startGame = function(difficulty) {
    // Hide HTML menu
    document.getElementById("mainMenu").style.display = "none";
    document.getElementById("scoreDisplay").style.display = "block";
    document.getElementById("timeDisplay").style.display = "block";
    gameController.start(difficulty)
}

// Function run after win/lose condition met
window.endGame = function(win = true) {
    const message = win ? 'YOU WIN!' : 'GAME OVER';
    document.getElementById('endMessage').textContent = message;
    document.getElementById('endScreen').style.display = 'flex';
    document.getElementById("scoreDisplay").style.display = "none";
    document.getElementById("timeDisplay").style.display = "none";
};
  
// Reload page after pressing Return To Menu button after game ends
window.returnToMenu = function() {
    location.reload();
};

// Open/close instructions
window.howToPlay = function() {
    document.getElementById('instructions').style.display = 'block';
}
window.closeInstructions = function() {
    document.getElementById('instructions').style.display = 'none';
}
  

function animate() {
    requestAnimationFrame(animate)
    gameController.render();
}
animate();

// Functions from Bootstrap folder in Three.js textbook
function visitChildren(object, fn) {
    if (object.children && object.children.length > 0) {
      for (const child of object.children) {
        visitChildren(child, fn)
      }
    } else {
      fn(object)
    }
}
function onResize(camera, renderer) {
    const resizer = () => {
      camera.aspect = window.innerWidth / window.innerHeight
      camera.updateProjectionMatrix()
      renderer.setSize(window.innerWidth, window.innerHeight)
    }
    window.addEventListener('resize', resizer, false)
}

window.startGame = startGame;
window.endGame = endGame;
window.returnToMenu = returnToMenu;
window.howToPlay = howToPlay;
window.closeInstructions = closeInstructions;