import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let camera, scene, renderer, clock, mixer, model, actions, activeAction, previousAction, controls;
const keyboard = {};
const moveSpeed = 250; // Ajusta la velocidad de movimiento del personaje
const cameraMoveSpeed = 100; // Ajusta la velocidad de movimiento de la cámara
const collidableObjects = []; // Objetos con los que el personaje puede colisionar

const stats = new Stats();

init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(0, 200, 400);
    camera.screenSpacePanning = false;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xa0a0a0);
    scene.fog = new THREE.Fog(0x9d0c0c, 400, 2000); // Ampliar la cantidad de niebla

    const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444);
    hemiLight.position.set(0, 200, 0);
    scene.add(hemiLight);

    const dirLight = new THREE.DirectionalLight(0xffffff);
    dirLight.position.set(0, 200, 100);
    dirLight.castShadow = true;
    dirLight.shadow.camera.top = 180;
    dirLight.shadow.camera.bottom = -100;
    dirLight.shadow.camera.left = -120;
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(4000, 4000),
        new THREE.MeshPhongMaterial({ color: 0x999999, depthWrite: false })
    );
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    const grid = new THREE.GridHelper(4000, 40, 0x000000, 0x000000);
    grid.material.opacity = 0.2;
    grid.material.transparent = true;
    scene.add(grid);

    const loader = new FBXLoader();

    // Cargar el modelo principal
    loader.load('models/fbx/Bruja.fbx', function (object) {
        console.log('Modelo cargado:', object);
        model = object;
        model.scale.set(1, 1, 1); // Ajusta la escala del modelo
        model.traverse(function (child) {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
        scene.add(model);

        mixer = new THREE.AnimationMixer(model);
        actions = {};

        // Cargar la animación de reposo
        loader.load('models/fbx/Idle.fbx', function (anim) {
            const idleAction = mixer.clipAction(anim.animations[0]);
            actions.idle = idleAction;
            if (!activeAction) {
                activeAction = idleAction;
                activeAction.play();
            }
        });

        // Cargar la animación de Caminar
        loader.load('models/fbx/Caminar.fbx', function (anim) {
            const caminarAction = mixer.clipAction(anim.animations[0]);
            actions.caminar = caminarAction;
        });

        // Cargar la primer animacion
        loader.load('models/fbx/Fireball.fbx', function (anim) {
            const MagiaAction = mixer.clipAction(anim.animations[0]);
            actions.magia = MagiaAction;
        });

        // Cargar la segunda animación
        loader.load('models/fbx/magia2.fbx', function (anim) {
            const magia2Action = mixer.clipAction(anim.animations[0]);
            actions.magia2 = magia2Action;
        });

        // Cargar la tercer animación
        loader.load('models/fbx/magia3.fbx', function (anim) {
            const magia3Action = mixer.clipAction(anim.animations[0]);
            actions.magia3 = magia3Action;
        });

        // Cargar el modelo de Monokuma y añadirlo a la escena
        loader.load('models/fbx/Monokuma.fbx', function (monokuma) {
            const brujaScale = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
            const scale = new THREE.Vector3(1 / 140, 1 / 250, 1 / 50).multiply(brujaScale);
            monokuma.scale.set(scale.x, scale.y, scale.z);

            for (let i = 0; i < 10; i++) {
                const clone = monokuma.clone();
                clone.position.set(
                    Math.random() * 2000 - 1000,
                    0,
                    Math.random() * 2000 - 1000
                );
                clone.traverse(function (child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });
                scene.add(clone);
                collidableObjects.push(clone);
            }
        });

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    }, undefined, function (error) {
        console.error('Error al cargar el modelo:', error);
    });

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);

    clock = new THREE.Clock();
    container.appendChild(stats.dom);

    // GUI para iluminación y niebla
    const gui = new GUI();
    const lightFolder = gui.addFolder('Light');
    const fogFolder = gui.addFolder('Fog');

    lightFolder.add(dirLight, 'intensity', 0, 2, 0.01).name('Intensity');
    fogFolder.add(scene.fog, 'far', 500, 3000, 1).name('Fog Far');
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

function handleKeyDown(event) {
    keyboard[event.key.toLowerCase()] = true;
    updateMovement();
}

function handleKeyUp(event) {
    keyboard[event.key.toLowerCase()] = false;
    updateMovement();
}

function updateMovement() {
    if (keyboard['w'] || keyboard['a'] || keyboard['s'] || keyboard['d']) {
        if (activeAction !== actions.caminar) {
            switchAction(actions.caminar);
        }
    } else if (keyboard['x']) { // Tecla x para la animación magia
        if (activeAction !== actions.magia) {
            switchAction(actions.magia);
        }
    } else if (keyboard['c']) { // Tecla c para la animación magia2
        if (activeAction !== actions.magia2) {
            switchAction(actions.magia2);
        }
    } else if (keyboard['v']) { // Tecla v para la animación de saltar
        if (activeAction !== actions.magia3) {
            switchAction(actions.magia3);
        }
    } else {
        if (activeAction !== actions.idle) {
            switchAction(actions.idle);
        }
    }
}

function switchAction(toAction) {
    if (activeAction !== toAction) {
        previousAction = activeAction;
        activeAction = toAction;

        previousAction.fadeOut(0.5);
        activeAction.reset().fadeIn(0.5).play();
    }
}

function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const moveDistance = moveSpeed * delta;
    const cameraMoveDistance = cameraMoveSpeed * delta;

    if (mixer) mixer.update(delta);

    let moveX = 0;
    let moveZ = 0;

    if (keyboard['w']) {
        moveZ = -moveDistance;
    }
    if (keyboard['s']) {
        moveZ = moveDistance;
    }
    if (keyboard['a']) {
        moveX = -moveDistance;
    }
    if (keyboard['d']) {
        moveX = moveDistance;
    }

    if (moveX !== 0 || moveZ !== 0) {
        const moveVector = new THREE.Vector3(moveX, 0, moveZ);
        const direction = moveVector.clone().applyQuaternion(camera.quaternion);
        direction.y = 0; // Evitar el movimiento vertical
        model.lookAt(model.position.clone().add(direction));
        if (!checkCollision(model.position.clone().add(direction))) {
            model.position.add(direction);
        }
    }

    let cameraMoveX = 0;
    let cameraMoveZ = 0;

    if (keyboard['arrowup']) {
        cameraMoveZ = -cameraMoveDistance;
    }
    if (keyboard['arrowdown']) {
        cameraMoveZ = cameraMoveDistance;
    }
    if (keyboard['arrowleft']) {
        cameraMoveX = -cameraMoveDistance;
    }
    if (keyboard['arrowright']) {
        cameraMoveX = cameraMoveDistance;
    }

    if (cameraMoveX !== 0 || cameraMoveZ !== 0) {
        const cameraMoveVector = new THREE.Vector3(cameraMoveX, 0, cameraMoveZ);
        const cameraDirection = cameraMoveVector.clone().applyQuaternion(camera.quaternion);
        camera.position.add(cameraDirection);
    }

    renderer.render(scene, camera);
    stats.update();
}

function checkCollision(newPosition) {
    const box = new THREE.Box3().setFromObject(model);
    const modelBoundingBox = box.clone().translate(newPosition.sub(model.position));

    for (let i = 0; i < collidableObjects.length; i++) {
        const objectBoundingBox = new THREE.Box3().setFromObject(collidableObjects[i]);
        if (modelBoundingBox.intersectsBox(objectBoundingBox)) {
            return true;
        }
    }
    return false;
}