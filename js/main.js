import * as THREE from 'three';
import Stats from 'three/addons/libs/stats.module.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GUI } from 'three/addons/libs/lil-gui.module.min.js';
//Espinosa Gabriela
let camera, scene, renderer, clock, mixer, model, actions, activeAction, previousAction, controls;
const keyboard = {};
const moveSpeed = 250; // Ajusta la velocidad de movimiento del personaje
const cameraMoveSpeed = 100; // Ajusta la velocidad de movimiento de la cámara
const collidableObjects = []; // Objetos con los que el personaje puede colisionar

const stats = new Stats();
//Espinosa Gabriela
init();
animate();

function init() {
    const container = document.createElement('div');
    document.body.appendChild(container);

    // Añadir ventana emergente
    const popup = document.createElement('div');
    popup.style.position = 'absolute';
    popup.style.top = '50%';
    popup.style.left = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.padding = '20px';
    popup.style.backgroundColor = '#f0f0f0';
    popup.style.border = '2px solid #d0d0d0';
    popup.style.zIndex = 1000;//Espinosa Gabriela
    popup.style.fontFamily = 'Century Gothic, sans-serif';
    popup.style.color = 'black';
    popup.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)';
    popup.style.borderRadius = '10px';
    popup.style.display = 'flex';
    popup.style.flexDirection = 'column';
    popup.style.alignItems = 'center';

    const popupText = document.createElement('p');
    popupText.innerText = 'Holi!\nPulsa WASD para moverte\nPrueba con XCVB para experimentar\ndiferentes animaciones';
    popupText.style.margin = '0 0 20px 0';//Espinosa Gabriela
    popupText.style.fontSize = '18px';
    popup.appendChild(popupText);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Cerrar';
    closeButton.style.backgroundColor = '#d0d0d0';
    closeButton.style.border = 'none';
    closeButton.style.padding = '10px 20px';//Espinosa Gabriela
    closeButton.style.cursor = 'pointer';
    closeButton.style.borderRadius = '5px';
    closeButton.style.transition = 'background-color 0.3s';
    closeButton.addEventListener('mouseover', () => {
        closeButton.style.backgroundColor = '#b0b0b0';
    });
    closeButton.addEventListener('mouseout', () => {
        closeButton.style.backgroundColor = '#d0d0d0';
    });
    closeButton.addEventListener('click', () => {
        popup.style.display = 'none';
    });
    popup.appendChild(closeButton);

    document.body.appendChild(popup);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 1, 2000);
    camera.position.set(0, 200, 400);
    camera.screenSpacePanning = false;
//Espinosa Gabriela
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
    dirLight.shadow.camera.left = -120;//Espinosa Gabriela
    dirLight.shadow.camera.right = 120;
    scene.add(dirLight);

    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(4000, 4000),
        new THREE.MeshPhongMaterial({ color: 0x252525, depthWrite: false })
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
    loader.load('Models/Bruja.fbx', function (object) {
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

        // Cargar la animación de reposo (1)
        loader.load('Models/Idle.fbx', function (anim) {
            const idleAction = mixer.clipAction(anim.animations[0]);
            actions.idle = idleAction;
            if (!activeAction) {
                activeAction = idleAction;
                activeAction.play();
            }
        });

        // Cargar la animación de Caminar (2)
        loader.load('Models/Caminar.fbx', function (anim) {
            const caminarAction = mixer.clipAction(anim.animations[0]);
            actions.caminar = caminarAction;
        });

        // Animacion 3
        loader.load('Models/Fireball.fbx', function (anim) {
            const MagiaAction = mixer.clipAction(anim.animations[0]);
            actions.magia = MagiaAction;
        });

        // Animacion 4
        loader.load('Models/magia2.fbx', function (anim) {//Espinosa Gabriela
            const magia2Action = mixer.clipAction(anim.animations[0]);
            actions.magia2 = magia2Action;
        });

        // Animacion 5
        loader.load('Models/magia3.fbx', function (anim) {
            const magia3Action = mixer.clipAction(anim.animations[0]);
            actions.magia3 = magia3Action;
        });
        // Animacion 6
        loader.load('Models/Magis.fbx', function (anim) {
            const MagisAction = mixer.clipAction(anim.animations[0]);
            actions.Magis = MagisAction;
        });
//Espinosa Gabriela
        // Cargar el modelo de Monokuma y añadirlo a la escena
        loader.load('Models/Monokuma.fbx', function (monokuma) {
            const brujaScale = new THREE.Box3().setFromObject(model).getSize(new THREE.Vector3());
            const scale = new THREE.Vector3(1 / 140, 1 / 250, 1 / 50).multiply(brujaScale);
            monokuma.scale.set(scale.x, scale.y, scale.z);

            for (let i = 0; i < 10; i++) {
                const clone = monokuma.clone();
                let position;
                do {
                    position = new THREE.Vector3(
                        Math.random() * 2000 - 1000,
                        0,
                        Math.random() * 2000 - 1000
                    );
                    clone.position.copy(position);
                } while (checkInitialCollision(clone));

                clone.traverse(function (child) {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });//Espinosa Gabriela
                scene.add(clone);
                collidableObjects.push(clone);
            }
        });

        window.addEventListener('keydown', handleKeyDown);
        window.addEventListener('keyup', handleKeyUp);
    }, undefined, function (error) {
        console.error('Error al cargar el modelo:', error);
    });
//Espinosa Gabriela
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    container.appendChild(renderer.domElement);

    controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 100, 0);
    controls.update();

    window.addEventListener('resize', onWindowResize);

    clock = new THREE.Clock();//Espinosa Gabriela
    container.appendChild(stats.dom);

    // GUI para control de iluminación y niebla
    const gui = new GUI();
    const lightFolder = gui.addFolder('Luz');
    const fogFolder = gui.addFolder('Niebla');

    lightFolder.add(dirLight, 'intensity', 0, 2, 0.01).name('Intensidad');
    fogFolder.add(scene.fog, 'far', 500, 3000, 1).name('Distancia');
}                   //Espinosa Gabriela

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
//Espinosa Gabriela
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
    } else if (keyboard['b']) { // Tecla v para la animación de magis
        if (activeAction !== actions.Magis) {
            switchAction(actions.Magis);
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
//Espinosa Gabriela
function animate() {
    requestAnimationFrame(animate);

    const delta = clock.getDelta();
    const moveDistance = moveSpeed * delta;
    const cameraMoveDistance = cameraMoveSpeed * delta;

    if (mixer) mixer.update(delta);

    let moveX = 0;
    let moveZ = 0;
    //Teclas para el movimiento
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
//Espinosa Gabriela
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
//Espinosa Gabriela
    if (cameraMoveX !== 0 || cameraMoveZ !== 0) {
        const cameraMoveVector = new THREE.Vector3(cameraMoveX, 0, cameraMoveZ);
        const cameraDirection = cameraMoveVector.clone().applyQuaternion(camera.quaternion);
        camera.position.add(cameraDirection);
    }

    renderer.render(scene, camera);
    stats.update();
}
//Espinosa Gabriela
function checkInitialCollision(object) {
    const objectBoundingBox = new THREE.Box3().setFromObject(object);

    // Verificar colisión con el modelo principal
    const modelBoundingBox = new THREE.Box3().setFromObject(model);
    if (objectBoundingBox.intersectsBox(modelBoundingBox)) {
        return true;
    }

    // Verificar colisión con otros objetos Monokuma
    for (let i = 0; i < collidableObjects.length; i++) {
        const otherObjectBoundingBox = new THREE.Box3().setFromObject(collidableObjects[i]);
        if (objectBoundingBox.intersectsBox(otherObjectBoundingBox)) {
            return true;
        }
    }
    return false;
}
//Espinosa Gabriela
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