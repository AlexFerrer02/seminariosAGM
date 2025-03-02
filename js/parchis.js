// Módulos necesarios
import * as THREE from "../lib/three.module.js";
import { OrbitControls } from "../lib/OrbitControls.module.js";
import { TWEEN } from "../lib/tween.module.min.js";
import { GUI } from "../lib/lil-gui.module.min.js";

// Variables de consenso
let renderer, scene, camera, cameraControls;

// Otras globales
let tablero;
let fichasRojas = [], fichasAmarillas = [], fichasAzules = [], fichasVerdes = [];
let effectController;
let dado;
let valorDado = 1;
let fichaSeleccionada = null;
let raycaster = new THREE.Raycaster();
let mouse = new THREE.Vector2();
let dadoEstatico = false;
let tiempoEstatico = 0;

// Acciones
init();
loadScene();
loadGUI();
render();

function init() {
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.getElementById('container').appendChild(renderer.domElement);
    renderer.antialias = true;
    renderer.shadowMap.enabled = true;
    renderer.setClearColor(0x8FBCD4); // Color de fondo azul claro

    // Escena
    scene = new THREE.Scene();
    
    // Cámara
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 20, 20);
    
    // Controles de cámara
    cameraControls = new OrbitControls(camera, renderer.domElement);
    cameraControls.target.set(0, 0, 0);
    cameraControls.minDistance = 10;
    cameraControls.maxDistance = 50;
    cameraControls.maxPolarAngle = Math.PI/2 - 0.1; // Limitar rotación para no ver por debajo del tablero
    camera.lookAt(new THREE.Vector3(0, 0, 0));

    // Luces
    setupLights();

    // Eventos
    window.addEventListener('resize', updateAspectRatio);
    renderer.domElement.addEventListener('click', onClick);
}

function setupLights() {
    // Luz ambiental
    const ambiental = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambiental);
    
    // Luz direccional (como el sol)
    const direccional = new THREE.DirectionalLight(0xFFFFFF, 0.5);
    direccional.position.set(-10, 15, -10);
    direccional.castShadow = true;
    direccional.shadow.camera.near = 1;
    direccional.shadow.camera.far = 50;
    direccional.shadow.camera.left = -15;
    direccional.shadow.camera.right = 15;
    direccional.shadow.camera.top = 15;
    direccional.shadow.camera.bottom = -15;
    direccional.shadow.mapSize.width = 1024;
    direccional.shadow.mapSize.height = 1024;
    scene.add(direccional);
    
    // Luz focal (spotlight)
    const focal = new THREE.SpotLight(0xFFFFFF, 0.8);
    focal.position.set(0, 25, 0);
    focal.target.position.set(0, 0, 0);
    focal.angle = Math.PI / 6;
    focal.penumbra = 0.3;
    focal.castShadow = true;
    focal.shadow.camera.near = 1;
    focal.shadow.camera.far = 50;
    focal.shadow.mapSize.width = 1024;
    focal.shadow.mapSize.height = 1024;
    scene.add(focal);
    scene.add(focal.target);
}

function loadScene() {
    // Carga de texturas
    const path = "./images/";
    
    // Textura del tablero
    const texTablero = new THREE.TextureLoader().load(path + "parchis.png");
    texTablero.wrapS = texTablero.wrapT = THREE.RepeatWrapping;
    
    // Texturas para las fichas
    const texRojo = new THREE.TextureLoader().load(path + "red.jpg");
    const texAmarillo = new THREE.TextureLoader().load(path + "yellow.jpg");
    const texAzul = new THREE.TextureLoader().load(path + "blue.jpg");
    const texVerde = new THREE.TextureLoader().load(path + "green.jpg");
    
    // Textura de entorno para el reflejo en las fichas
    const entorno = [
        path + "posx.jpg", path + "negx.jpg",
        path + "posy.jpg", path + "negy.jpg",
        path + "posz.jpg", path + "negz.jpg"
    ];
    const texEntorno = new THREE.CubeTextureLoader().load(entorno);
    
    // Materiales
    const matTablero = new THREE.MeshStandardMaterial({
        map: texTablero,
        side: THREE.DoubleSide,
        roughness: 0.8
    });
    
    const matRojo = new THREE.MeshPhongMaterial({
        color: 0xFF0000,
        map: texRojo,
        specular: 0x111111,
        shininess: 30,
        envMap: texEntorno,
        reflectivity: 0.25
    });
    
    const matAmarillo = new THREE.MeshPhongMaterial({
        color: 0xFFFF00,
        map: texAmarillo,
        specular: 0x111111,
        shininess: 30,
        envMap: texEntorno,
        reflectivity: 0.25
    });
    
    const matAzul = new THREE.MeshPhongMaterial({
        color: 0x4DA6FF,
        map: texAzul,
        specular: 0x111111,
        shininess: 30,
        envMap: texEntorno,
        reflectivity: 0.25
    });
    
    const matVerde = new THREE.MeshPhongMaterial({
        color: 0x00FF00,
        map: texVerde,
        specular: 0x111111,
        shininess: 30,
        envMap: texEntorno,
        reflectivity: 0.25
    });
    
    // Geometrías
    const geoTablero = new THREE.BoxGeometry(20, 0.5, 20);
    const geoFicha = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 32);
    
    // Creación del tablero
    tablero = new THREE.Mesh(geoTablero, matTablero);
    tablero.receiveShadow = true;
    scene.add(tablero);
    
    // Crear las fichas
    crearFichas(geoFicha, matRojo, matAmarillo, matAzul, matVerde);
    
    // Crear el dado
    crearDado();
    
    // Añadir ejes de referencia
    const ejes = new THREE.AxesHelper(5);
    scene.add(ejes);
    
    // Crear entorno
    crearEntorno();
}

function crearFichas(geometria, matRojo, matAmarillo, matAzul, matVerde) {
    // Crear 4 fichas para cada color
    const colores = [
        { material: matRojo, array: fichasRojas, posX: -7, posZ: -7, colorHex: 0xFF0000 },
        { material: matAmarillo, array: fichasAmarillas, posX: 6, posZ: 6, colorHex: 0xFFFF00 },
        { material: matAzul, array: fichasAzules, posX: 6, posZ: -7, colorHex: 0x4DA6FF },         
        { material: matVerde, array: fichasVerdes, posX: -7, posZ: 6, colorHex: 0x00FF00 }
    ];
    
    colores.forEach(color => {
        for (let i = 0; i < 4; i++) {
            // Crear una nueva instancia del material para cada ficha
            const material = color.material.clone();
            material.color.setHex(color.colorHex);
            
            material.opacity = 1;
            material.transparent = false;
            
            const ficha = new THREE.Mesh(geometria, material);
            ficha.position.set(
                color.posX + (i % 2) * 1.2,
                0.6,
                color.posZ + Math.floor(i / 2) * 1.2
            );
            ficha.castShadow = true;
            ficha.receiveShadow = true;
            
            ficha.userData = {
                tipo: 'ficha',
                color: color.colorHex,
                indice: i,
                draggable: true
            };
            color.array.push(ficha);
            scene.add(ficha);
        }
    });
}

function crearDado() {
    // Geometría del dado
    const geoDado = new THREE.BoxGeometry(1, 1, 1);
    
    // Cargar texturas para cada cara del dado
    const loader = new THREE.TextureLoader();
    const path = "./images/";
    
    // Crear material para cada cara (normalmente serían imágenes de puntos 1-6)
    const materiales = [
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), // Derecha
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), // Izquierda
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), // Arriba
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), // Abajo
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF }), // Frente
        new THREE.MeshLambertMaterial({ color: 0xFFFFFF })  // Atrás
    ];
    
    // Agregar números al dado
    for (let i = 0; i < 6; i++) {
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const context = canvas.getContext('2d');
        
        // Fondo blanco
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, 128, 128);
        
        // Dibujar los puntos
        context.fillStyle = '#000000';
        const valor = i + 1;
        
        // Posiciones de los puntos según el valor
        if (valor === 1 || valor === 3 || valor === 5) {
            // Punto central
            context.beginPath();
            context.arc(64, 64, 12, 0, Math.PI * 2);
            context.fill();
        }
        
        if (valor > 1) {
            // Punto superior izquierdo
            context.beginPath();
            context.arc(32, 32, 12, 0, Math.PI * 2);
            context.fill();
            
            // Punto inferior derecho
            context.beginPath();
            context.arc(96, 96, 12, 0, Math.PI * 2);
            context.fill();
        }
        
        if (valor > 3) {
            // Punto superior derecho
            context.beginPath();
            context.arc(96, 32, 12, 0, Math.PI * 2);
            context.fill();
            
            // Punto inferior izquierdo
            context.beginPath();
            context.arc(32, 96, 12, 0, Math.PI * 2);
            context.fill();
        }
        
        if (valor === 6) {
            // Punto central izquierdo
            context.beginPath();
            context.arc(32, 64, 12, 0, Math.PI * 2);
            context.fill();
            
            // Punto central derecho
            context.beginPath();
            context.arc(96, 64, 12, 0, Math.PI * 2);
            context.fill();
        }
        
        const textura = new THREE.CanvasTexture(canvas);
        materiales[i].map = textura;
    }
    
    // Crear el dado con los materiales
    dado = new THREE.Mesh(geoDado, materiales);
    dado.position.set(12, 3, 0);
    dado.castShadow = true;
    dado.receiveShadow = true;
    dado.userData = { tipo: 'dado' };
    scene.add(dado);
}

function crearEntorno() {
    // Crear un entorno alrededor del tablero
    const path = "./images/";
    const entorno = [
        path + "posx.jpg", path + "negx.jpg",
        path + "posy.jpg", path + "negy.jpg",
        path + "posz.jpg", path + "negz.jpg"
    ];
    
    // Crear material con texturas de entorno
    const paredes = [];
    for (let i = 0; i < 6; i++) {
        paredes.push(new THREE.MeshBasicMaterial({
            side: THREE.BackSide,
            map: new THREE.TextureLoader().load(entorno[i])
        }));
    }
    
    // Crear una caja grande como habitación
    const habitacion = new THREE.Mesh(new THREE.BoxGeometry(100, 100, 100), paredes);
    scene.add(habitacion);
}

function loadGUI() {
    // Interfaz de usuario
    effectController = {
        mensaje: 'Parchís 3D',
        lanzarDado: function() { lanzarDado(); },
        reiniciarJuego: function() { reiniciarJuego(); },
        mostrarEjes: true,
        wireframe: false,
        sombras: true,
        velocidadAnimacion: 500 // ms
    };
    
    // Creación de la interfaz
    const gui = new GUI();
    
    // Construcción del menú
    const h = gui.addFolder("Control de juego");
    h.add(effectController, "mensaje").name("Juego");
    h.add(effectController, "lanzarDado").name("Lanzar Dado");
    h.add(effectController, "reiniciarJuego").name("Reiniciar Fichas");
    
    const opciones = gui.addFolder("Opciones");
    opciones.add(effectController, "mostrarEjes").name("Mostrar ejes").onChange(toggleEjes);
    opciones.add(effectController, "wireframe").name("Modo Wireframe").onChange(toggleWireframe);
    opciones.add(effectController, "sombras").name("Activar sombras").onChange(toggleShadows);
    opciones.add(effectController, "velocidadAnimacion", 100, 2000, 100).name("Velocidad anim. (ms)");
}

function toggleEjes() {
    // Mostrar/ocultar ejes según el estado del checkbox
    const ejes = scene.getObjectByProperty('type', 'AxesHelper');
    if (ejes) ejes.visible = effectController.mostrarEjes;
}

function toggleWireframe() {
    // Cambiar entre modo wireframe y sólido
    scene.traverse(objeto => {
        if (objeto.isMesh) {
            if (objeto.material.length) {
                // Si es un array de materiales (como el dado)
                for (let i = 0; i < objeto.material.length; i++) {
                    objeto.material[i].wireframe = effectController.wireframe;
                }
            } else {
                objeto.material.wireframe = effectController.wireframe;
            }
        }
    });
}

function toggleShadows() {
    // Activar/desactivar sombras
    scene.traverse(objeto => {
        if (objeto.isMesh) {
            objeto.castShadow = effectController.sombras;
            objeto.receiveShadow = effectController.sombras;
        }
    });
    
    // Actualizar renderer
    renderer.shadowMap.enabled = effectController.sombras;
}

function lanzarDado() {
    // Detener cualquier animación previa
    TWEEN.removeAll();

    // Animación de salto del dado
    new TWEEN.Tween(dado.position)
        .to({ y: 6 }, 400) // Saltar hacia arriba
        .easing(TWEEN.Easing.Cubic.Out)
        .start()
        .chain(
            new TWEEN.Tween(dado.position)
                .to({ y: 3 }, 600) // Caer de nuevo
                .easing(TWEEN.Easing.Bounce.Out)
        );
    
    // Determinar el valor del dado (1-6)
    valorDado = Math.floor(Math.random() * 6) + 1;
    
    // Calcular la rotación final para que quede con el valor correcto hacia arriba
    let rotacionFinal = {x: 0, y: 0, z: 0};
    
    // Definir rotaciones para cada valor del dado (esto es aproximado y puedes ajustarlo)
    switch(valorDado) {
        case 1:
            rotacionFinal.x = Math.PI; // 1 arriba
            break;
        case 2:
            rotacionFinal.x = Math.PI / 2; // 2 arriba
            break;
        case 3:
            rotacionFinal.y = Math.PI / 2; // 3 arriba
            break;
        case 4:
            rotacionFinal.y = -Math.PI / 2; // 4 arriba
            break;
        case 5:
            rotacionFinal.x = -Math.PI / 2; // 5 arriba
            break;
        case 6:
            rotacionFinal.x = 0; // 6 arriba
            break;
    }
    
    // Añadir aleatoriedad a la rotación para que parezca que está girando
    const rotacionesAdicionales = Math.floor(Math.random() * 3) + 2; // 2-4 rotaciones completas
    rotacionFinal.x += Math.PI * 2 * rotacionesAdicionales;
    rotacionFinal.y += Math.PI * 2 * rotacionesAdicionales;
    
    // Animar el dado girando
    new TWEEN.Tween(dado.rotation)
        .to(rotacionFinal, 1000)
        .easing(TWEEN.Easing.Cubic.Out)
        .start()
        .onComplete(() => {
            // Establecer el dado como estático durante 5 segundos
            dadoEstatico = true;
            tiempoEstatico = Date.now();
        });
}

function reiniciarJuego() {
    // Volver a colocar todas las fichas en su posición inicial
    const colores = [
        { array: fichasRojas, posX: -7, posZ: -7 },
        { array: fichasAmarillas, posX: 6, posZ: 6 },
        { array: fichasAzules, posX: 6, posZ: -7 },
        { array: fichasVerdes, posX: -7, posZ: 6 }
    ];
    
    colores.forEach(color => {
        color.array.forEach((ficha, i) => {
            // Animar el movimiento de regreso
            new TWEEN.Tween(ficha.position)
                .to({
                    x: color.posX + (i % 2) * 1.2,
                    y: 0.6,
                    z: color.posZ + Math.floor(i / 2) * 1.2
                }, effectController.velocidadAnimacion)
                .easing(TWEEN.Easing.Cubic.Out)
                .start();
        });
    });
}

function onClick(event) {
    // Calcular posición del ratón normalizada
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    // Lanzar rayo desde la cámara
    raycaster.setFromCamera(mouse, camera);
    
    // Comprobar intersecciones con objetos
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    if (intersects.length > 0) {
        const object = intersects[0].object;
        
        // Si hacemos clic en el dado
        if (object === dado) {
            lanzarDado();
            return;
        }
        
        // Si hacemos clic en una ficha
        if (object.userData && object.userData.tipo === 'ficha') {
            // Si no hay ficha seleccionada, seleccionamos esta
            if (!fichaSeleccionada) {
                fichaSeleccionada = object;
                // Destacar la ficha seleccionada
                animarSeleccionFicha(fichaSeleccionada);
                console.log("Ficha seleccionada. Haz clic en cualquier lugar para moverla.");
                
                // Desactivar temporalmente los controles de cámara mientras se selecciona una ficha
                cameraControls.enabled = false;
            } else {
                // Si ya hay una ficha seleccionada y hacemos clic en otra, cambiamos la selección
                animarDeseleccionFicha(fichaSeleccionada);
                fichaSeleccionada = object;
                animarSeleccionFicha(fichaSeleccionada);
                console.log("Nueva ficha seleccionada. Haz clic en cualquier lugar para moverla.");
            }
            return;
        }
        
        // Si tenemos una ficha seleccionada y hacemos clic en el tablero
        if (fichaSeleccionada && object === tablero) {
            // Obtener el punto exacto donde se hizo clic
            const puntoDestino = intersects[0].point;
            
            // Mover la ficha directamente a ese punto
            moverFichaAPunto(fichaSeleccionada, puntoDestino);
            
            // Reactivar los controles de cámara
            cameraControls.enabled = true;
            
            // Deseleccionar la ficha
            animarDeseleccionFicha(fichaSeleccionada);
            fichaSeleccionada = null;
        }
    } else {
        // Si hacemos clic en el vacío y hay una ficha seleccionada, la deseleccionamos
        if (fichaSeleccionada) {
            animarDeseleccionFicha(fichaSeleccionada);
            fichaSeleccionada = null;
            
            // Reactivar los controles de cámara
            cameraControls.enabled = true;
        }
    }
}

// Función para animar la selección de una ficha
function animarSeleccionFicha(ficha) {
    // Elevar la ficha y añadir un efecto para mostrar que está seleccionada
    new TWEEN.Tween(ficha.position)
        .to({ y: 1.2 }, 200)  // Elevamos la ficha más para que sea más visible
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
        
    // Aumentar el tamaño para hacerla más visible
    new TWEEN.Tween(ficha.scale)
        .to({ x: 1.3, y: 1.3, z: 1.3 }, 200)
        .easing(TWEEN.Easing.Back.Out)
        .start();
}

// Función para animar la deselección de una ficha
function animarDeseleccionFicha(ficha) {
    // Devolver la ficha a su altura normal
    new TWEEN.Tween(ficha.position)
        .to({ y: 0.6 }, 200)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
        
    // Restaurar la escala normal
    new TWEEN.Tween(ficha.scale)
        .to({ x: 1.0, y: 1.0, z: 1.0 }, 200)
        .easing(TWEEN.Easing.Cubic.Out)
        .start();
}

function moverFichaAPunto(ficha, punto) {
    // Guardar la posición antes de mover la ficha
    const posicionAnterior = ficha.position.clone();
    
    // Animar el movimiento al punto exacto (manteniendo la altura y)
    new TWEEN.Tween(ficha.position)
        .to({
            x: punto.x,
            y: 0.6, // Mantener altura constante sobre el tablero
            z: punto.z
        }, effectController.velocidadAnimacion)
        .easing(TWEEN.Easing.Cubic.Out)
        .start()
        .onComplete(() => {
            // Después de mover la ficha, verificar si hay otras fichas en ese punto
            verificarColisionesDirectas(ficha, punto);
        });
}

// Función para verificar colisiones con otras fichas
function verificarColisionesDirectas(ficha, punto) {
    // Color de la ficha que se está moviendo
    const colorFicha = ficha.userData.color;
    
    // Umbral de distancia para considerar que dos fichas están en el mismo lugar
    const umbralColision = 0.8;
    
    // Verificar cada ficha del juego
    const todasLasFichas = [...fichasRojas, ...fichasAmarillas, ...fichasAzules, ...fichasVerdes];
    
    todasLasFichas.forEach(otraFicha => {
        // No consideramos la ficha que estamos moviendo
        if (otraFicha !== ficha) {
            // Calcular distancia entre las fichas
            const distancia = ficha.position.distanceTo(otraFicha.position);
            
            // Si están muy cerca y son de diferente color, enviar la otra ficha a su inicio
            if (distancia < umbralColision && otraFicha.userData.color !== colorFicha) {
                console.log("¡Ficha comida!");
                enviarFichaAInicio(otraFicha);
            }
        }
    });
}

// Función para enviar una ficha a su posición inicial
function enviarFichaAInicio(ficha) {
    // Determinar el color y el índice de la ficha
    const colorFicha = ficha.userData.color;
    const indiceFicha = ficha.userData.indice;
    
    // Encontrar las posiciones iniciales según el color
    let posInicioX, posInicioZ;
    
    if (colorFicha === 0xFF0000) { // Rojo
        posInicioX = -7 + (indiceFicha % 2) * 1.2;
        posInicioZ = -7 + Math.floor(indiceFicha / 2) * 1.2;
    } else if (colorFicha === 0xFFFF00) { // Amarillo
        posInicioX = 6 + (indiceFicha % 2) * 1.2;
        posInicioZ = 6 + Math.floor(indiceFicha / 2) * 1.2;
    } else if (colorFicha === 0x4DA6FF) { // Azul
        posInicioX = 6 + (indiceFicha % 2) * 1.2;
        posInicioZ = -7 + Math.floor(indiceFicha / 2) * 1.2;
    } else if (colorFicha === 0x00FF00) { // Verde
        posInicioX = -7 + (indiceFicha % 2) * 1.2;
        posInicioZ = 6 + Math.floor(indiceFicha / 2) * 1.2;
    }
    
    // Animar el movimiento de regreso con un efecto de rebote
    new TWEEN.Tween(ficha.position)
        .to({
            x: posInicioX,
            y: 2, // Primero elevamos la ficha
            z: posInicioZ
        }, effectController.velocidadAnimacion / 2)
        .easing(TWEEN.Easing.Cubic.Out)
        .start()
        .onComplete(() => {
            // Después la dejamos caer con efecto de rebote
            new TWEEN.Tween(ficha.position)
                .to({
                    y: 0.6  // Altura final
                }, effectController.velocidadAnimacion / 2)
                .easing(TWEEN.Easing.Bounce.Out)
                .start();
        });
}

function updateAspectRatio() {
    const ar = window.innerWidth / window.innerHeight;
    
    // Actualizar dimensiones del renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Actualizar cámara
    camera.aspect = ar;
    camera.updateProjectionMatrix();
}

function update() {
    // Actualizar animaciones
    TWEEN.update();
    
    // Manejo del dado
    const tiempoActual = Date.now();
    
    if (dadoEstatico) {
        // Verificar si han pasado 5 segundos
        if (tiempoActual - tiempoEstatico > 5000) {
            dadoEstatico = false;
        }
    } else {
        // Rotar continuamente el dado cuando no está estático
        if (!TWEEN.getAll().some(tween => tween._object === dado.rotation)) {
            dado.rotation.x += 0.01;
            dado.rotation.y += 0.01;
        }
    }
}

function render() {
    requestAnimationFrame(render);
    update();
    renderer.render(scene, camera);
}