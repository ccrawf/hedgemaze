import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";


const lightSettings = {
    baseIntensity: 2
};

class GameController {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.loader = new GLTFLoader();
        this.flickerLights = [];
        this.hedgeTexture = null;

        this.difficulty = null;
        this.mazeLayout = null;
        this.strawberries = [];
        this.score = 0;
        this.isGameOver = false;
    }

    initScene() {
        // Renderer setup
        this.renderer.outputEncoding = THREE.sRGBEncoding
        this.renderer.shadowMap.enabled = true
        this.renderer.shadowMap.type = THREE.VSMShadowMap
        onResize(this.camera, this.renderer)
        this.renderer.setSize(window.innerWidth, window.innerHeight)
        document.body.appendChild(this.renderer.domElement)

        // Fog setup
        this.scene.fog = new THREE.Fog(0xffffff, 0.0025, 100)

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
            ['0','0','1','0','0','0','1','0','0','0','1','0','0','0','0','0','0','0','0','0','1'],
            ['1','0','1','0','1','1','1','0','1','0','1','1','1','1','1','0','1','1','1','0','1'],
            ['1','0','1','0','0','0','1','0','1','0','0','0','0','0','1','0','0','0','1','0','1'],
            ['1','0','1','1','1','0','1','0','1','1','1','1','1','0','1','1','1','1','1','0','1'],
            ['1','0','0','0','1','0','0','0','1','0','1','0','0','0','1','0','0','0','1','0','1'],
            ['1','1','1','0','1','1','1','1','1','0','1','0','1','0','1','0','1','0','1','0','1'],
            ['1','0','0','0','1','0','0','0','0','0','0','0','1','0','0','0','1','0','0','0','1'],
            ['1','0','1','1','1','0','1','0','1','0','1','0','1','1','1','0','1','0','1','0','1'],
            ['1','0','0','0','0','0','1','0','1','0','1','0','0','0','1','0','1','0','1','0','1'],
            ['1','1','1','0','1','1','1','1','1','0','1','0','1','1','1','0','1','0','1','0','1'],
            ['1','0','0','0','1','0','0','0','0','0','1','0','0','0','1','0','1','0','1','0','1'],
            ['1','0','1','1','1','0','1','1','1','0','1','1','1','0','1','0','1','1','1','1','1'],
            ['1','0','1','0','1','0','0','0','1','0','1','0','0','0','1','0','0','0','1','0','1'],
            ['1','0','1','0','1','0','1','1','1','1','1','1','1','1','1','0','1','1','1','0','1'],
            ['1','0','1','0','0','0','1','0','0','0','0','0','0','0','0','0','1','0','0','0','1'],
            ['1','1','1','1','1','0','1','0','1','0','1','1','1','1','1','0','1','0','1','0','1'],
            ['1','0','0','0','0','0','1','0','1','0','1','0','0','0','1','0','0','0','1','0','1'],
            ['1','0','1','1','1','1','1','0','1','0','1','1','1','0','1','1','1','1','1','0','1'],
            ['1','0','0','0','0','0','1','0','1','0','0','0','1','0','0','0','0','0','0','0','0'],
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
        this.loader.load('models/wooden_lantern/scene.gltf', (loadedObject) => {
            const lantern = loadedObject.scene;
            visitChildren(lantern, (el) => {
                el.castShadow = true
                el.receiveShadow = true
            })
            
            // Set attributes of lantern
            lantern.position.set(position.x, position.y, position.z)
            lantern.scale.set(0.5,0.5,0.5)
            lantern.rotateY(rotation)

            // Create PointLight for lantern
            const light = new THREE.PointLight(0xffddaa, lightSettings.baseIntensity)
            light.position.set(0, 5, -4.65);
            light.castShadow = true;
            light.shadow.bias = -0.005;

            // Add light object to array
            lantern.add(light);
            this.flickerLights.push(light);
            this.scene.add(lantern)
        })
    }

    // Function to animate flicker effects in 
    animateFlicker() {
        this.flickerLights.forEach(light => {
            const variation = lightSettings.baseIntensity * 0.1 * Math.sin(performance.now() * 0.005 + Math.random() * 5);
            light.intensity = lightSettings.baseIntensity + variation;
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
        const berry = new Strawberry(position);

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
        })
        this.strawberries.push(berry)
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
    
        // Shuffle and select N random positions
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

    playerController() {
        this.player = new Player();
        this.cameraOffset = new THREE.Vector3(-5, 10, 0);

        this.loader.load('models/deer/scene.gltf', (gltf) => {
            const model = gltf.scene;
            visitChildren(model, (el) => {
                el.castShadow = true
                el.receiveShadow = true  
            })
            model.position.set(2, 0.5, 2)
            model.scale.set(0.5, 0.5, 0.5)
            this.scene.add(model);
            this.player.model = model;
        })
    }

    render() {
        this.player.updatePosition();

        // Camera follows player
        const cameraTarget = this.player.position.clone().add(this.cameraOffset);
        this.camera.position.lerp(cameraTarget, 0.1); // smooth follow
        this.camera.lookAt(this.player.position);

        this.player.model.position.copy(this.player.position);

        this.animateFlicker();
        this.renderer.render(this.scene, this.camera)
    }

}

class Player {
    constructor(startPosition = new THREE.Vector3(2, 0.5, 2)) {
        this.position = startPosition;
        this.velocity = new THREE.Vector3(0, 0, 0);
        // this.cameraMode = cameraMode;
        this.score = 0;

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

class Enemy {
    constructor() {
        this.position = position;
        this.velocity = velocity;
        this.model = null;
        this.targetRotation = 0;
    }
}

class Strawberry {
    constructor(position) {
        this.position = position;
        this.isCollected = false;
        this.model = null;
    }
}

const gameController = new GameController();
gameController.initScene();
gameController.createMaze();
gameController.playerController();

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