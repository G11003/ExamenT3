import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';

let camera, scene, renderer, clock, mixer, model, actions, activeAction, previousAction;
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
    scene.fog = new THREE.Fog(0x050505, 400, 2000); // Ampliar la cantidad de niebla

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

    // Agregar algunos cubos al mapa
    const cubeGeometry = new THREE.BoxGeometry(50, 50, 50);
    const cubeMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00 });
    for (let i = 0; i < 10; i++) {
        const cube = new THREE.Mesh(cubeGeometry, cubeMaterial);
        cube.position.set(
            Math.random() * 2000 - 1000,
            25,
            Math.random() * 2000 - 1000
        );
        cube.castShadow = true;
        cube.receiveShadow = true;
        scene.add(cube);
        collidableObjects.push(cube);
    }

    const loader = new FBXLoader();

    // Cargar el modelo Soldier
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

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);

    clock = new THREE.Clock();
    container.appendChild(stats.dom);
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
