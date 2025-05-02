import * as THREE from 'three';
import { initScene } from "./bootstrap/bootstrap.js"
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { visitChildren } from './bootstrap/modelUtil.js'
import GUI from 'lil-gui'

const props = {
      fogColor: 0xffffff
};

const lightSettings = {
    baseIntensity: 2
};

// Scene Setup
initScene(props)(({scene, camera, renderer, orbitControls}) => {

    const fogSettings = {
        near: scene.fog.near,
        far: scene.fog.far
    };

    // Set camera position
    camera.position.set(15, 10, 15)
    orbitControls.update()

    // GUI for light/fog intensity
    const gui = new GUI();
    gui.add(lightSettings, 'baseIntensity', 0, 5).name('Lantern Intensity');
    gui.add(fogSettings, 'far', 5, 100).name('Fog Distance').onChange((value) => {
        scene.fog.far = value;
    });

    // Create skybox (dark forest)
    const skyLoader = new THREE.CubeTextureLoader();
    const skyboxTexture = skyLoader.load([
        'assets/forest.jpg',
        'assets/forest.jpg',
        'assets/black.jpg',
        'assets/black.jpg',
        'assets/forest.jpg',
        'assets/forest.jpg',
    ]);

    scene.background = skyboxTexture;

    // TextureLoader for Hedge Texture
    const textureLoader = new THREE.TextureLoader();
    const hedgeTexture = textureLoader.load('assets/hedge.jpg');
    hedgeTexture.wrapS = THREE.RepeatWrapping;
    hedgeTexture.wrapT = THREE.RepeatWrapping;
    
    // Stone Texture
    const stoneTexture = textureLoader.load('assets/stone.jpg');
    stoneTexture.wrapS = THREE.RepeatWrapping;
    stoneTexture.wrapT = THREE.RepeatWrapping;

    // Add plane
    stoneTexture.repeat.set(25, 25)
    const groundGeometry = new THREE.PlaneGeometry(50, 50);
    const groundMaterial = new THREE.MeshLambertMaterial({
        map: stoneTexture,
        side: THREE.DoubleSide,
    });
    const groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
    groundMesh.position.set(20, -0.02, 20);
    groundMesh.rotation.set(Math.PI / -2, 0, 0);
    groundMesh.castShadow = true;
    groundMesh.receiveShadow = true;
    scene.add(groundMesh);

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
    const cellSize = 2;
    buildMazeFromGrid(mazeLayout, cellSize, scene);

    // Creating lanterns
    const loader = new GLTFLoader() // Loader for lantern texture
    const flickerLights = []; // Array to hold light objects when adding flicker

    // Positions/orientations of lanterns
    const lanterns = [
        [-3, 0, 0, 3 * Math.PI / 4],
        [9, 0, 11, - Math.PI / 4],
        [7, 0, 23, Math.PI / 5],
        [11, 0, 25, 4 * Math.PI / 5],
        [18, 0, 11, Math.PI],
        [14, 0, 38, 0],
        [27, 0, 5, 4 * Math.PI / 5],
        [39, 0, 14, Math.PI / 2],
        [29, 0, 35, - Math.PI / 5],
        [43, 0, 40, - Math.PI / 5]
    ]

    // Add lanterns iteratively to scene
    addLanterns(lanterns, scene)

    // Set lantern position/orientation as specified in array, then build lantern object
    function addLanterns(grid, scene) {
        for (let i = 0; i < grid.length; i++) {
            const position = new THREE.Vector3(
                grid[i][0], grid[i][1], grid[i][2]
            )
            const rotation = grid[i][3]
            buildLantern(position, rotation)
        }      
    }

    // Function to create lanterns
    function buildLantern(position, rotation) {
        loader.load('wooden_lantern/scene.gltf', (loadedObject) => {
            const lantern = loadedObject.scene;
            visitChildren(lantern, (el) => {
                if (el.type === 'Mesh') {
                    if (el.material.name === 'paint') {
                        el.material.color = new THREE.Color(0xffffff)
                        el.material.metalness = 1
                        el.material.roughness = 0.2
                
                        exrCubeMap(renderer, (texture) => {
                        if (el.material) {
                            el.material.envMap = texture
                            el.material.needsUpdate = true
                        }
                    })
                }
                el.castShadow = true
                el.receiveShadow = true
            }
            })
            
            // Set attributes of lantern
            lantern.position.set(position.x, position.y, position.z)
            lantern.scale.set(0.5,0.5,0.5)
            lantern.rotateY(rotation)

            // Create PointLight for lantern
            const light = new THREE.PointLight(0xffddaa, lightSettings.baseIntensity)
            light.position.set(0, 5, -4.65);
            light.shadow.bias = -0.005;
            light.castShadow = true;

            // Add light object to array
            flickerLights.push(light);

            lantern.add(light);
            scene.add(lantern)
        })
    }

    // Animate lights to include flicker
    function animateFlicker() {
        flickerLights.forEach(light => {
            const variation = lightSettings.baseIntensity * 0.1 * Math.sin(performance.now() * 0.005 + Math.random() * 5);
            light.intensity = lightSettings.baseIntensity + variation;
        });
    }

    // Function to build hedge maze using maze layout
    function buildMazeFromGrid(grid, cellSize, scene) {
        const wallHeight = 5;
      
        for (let row = 0; row < grid.length; row++) {
          for (let col = 0; col < grid[row].length; col++) {
            if (grid[row][col] === '1') {
              const position = new THREE.Vector3(
                col * cellSize,
                wallHeight / 2,
                row * cellSize
              );
      
              const scale = new THREE.Vector3(cellSize, wallHeight, cellSize);
              const hedge = createHedgeSection(position, scale);
              scene.add(hedge);
            }
          }
        }
    }      

    // Function to create hedge box
    function createHedgeSection(position, scale) {
        hedgeTexture.repeat.set(scale.x / 2, scale.y / 2);
        const geometry = new THREE.BoxGeometry(scale.x, scale.y, scale.z);
        const material = new THREE.MeshStandardMaterial({
          map: hedgeTexture,
        });
        const hedge = new THREE.Mesh(geometry, material);
        hedge.position.set(position.x, position.y, position.z);
        hedge.castShadow = true;
        hedge.receiveShadow = true;
      
        return hedge;
    }

    // Render the scene
    function animate() {
        requestAnimationFrame(animate)
        animateFlicker();
        renderer.render(scene, camera)
        controller.update()
    }
    animate();
})