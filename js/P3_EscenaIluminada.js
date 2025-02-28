/**
 * EscenaIluminada.js
 * 
 * Practica AGM #3. Escena basica con interfaz, animacion e iluminacion
 * Se trata de añadir luces a la escena y diferentes materiales
 * 
 * @author 
 * 
 */

// Modulos necesarios
/*******************
 * TO DO: Cargar los modulos necesarios
 *******************/
import * as THREE from "../lib/three.module.js";
import {GLTFLoader} from "../lib/GLTFLoader.module.js";
import {OrbitControls} from "../lib/OrbitControls.module.js";
import {TWEEN} from "../lib/tween.module.min.js";
import {GUI} from "../lib/lil-gui.module.min.js";

// Variables de consenso
let renderer, scene, camera, loader, grupoPentagono;

// Otras globales
/*******************
 * TO DO: Variables globales de la aplicacion
 *******************/
let cameraControls, effectController;
let suelo,cubo,esfera;
let angulo = 0;
let video;

// Acciones
init();
loadScene();
loadGUI();
render();

function init()
{
    // Motor de render
    renderer = new THREE.WebGLRenderer();
    renderer.setSize( window.innerWidth, window.innerHeight );
    /*******************
    * TO DO: Completar el motor de render, el canvas y habilitar
    * el buffer de sombras
    *******************/
    document.getElementById('container').appendChild( renderer.domElement );
    renderer.antialias = true;
    renderer.shadowMap.enabled = true;

    // Escena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0.5,0.5,0.5);
    
    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1,1000);
    camera.position.set( 0.5, 2, 7 );
    /*******************
    * TO DO: Añadir manejador de camara (OrbitControls)
    *******************/
    cameraControls = new OrbitControls( camera, renderer.domElement );
    cameraControls.target.set(0,1,0);
    camera.lookAt( new THREE.Vector3(0,1,0) );

    // Luces
    /*******************
     * TO DO: Añadir luces y habilitar sombras
     * - Una ambiental
     * - Una direccional
     * - Una focal
     *******************/
    const ambiental = new THREE.AmbientLight(0x222222);
    scene.add(ambiental);
    const direccional = new THREE.DirectionalLight(0xFFFFFF,0.3);
    direccional.position.set(-1,1,-1);
    direccional.castShadow = true;
    scene.add(direccional);
    const focal = new THREE.SpotLight(0xFFFFFF,0.3);
    focal.position.set(-2,7,4);
    focal.target.position.set(0,0,0);
    focal.angle= Math.PI/7;
    focal.penumbra = 0.3;
    focal.castShadow= true;
    focal.shadow.camera.far = 20;
    focal.shadow.camera.fov = 80;
    scene.add(focal);
    scene.add(new THREE.CameraHelper(focal.shadow.camera));

    // Eventos
    window.addEventListener('resize', updateAspectRatio );
    renderer.domElement.addEventListener('dblclick', animate );
}

function loadScene()
{
    // Texturas
    /*******************
     * TO DO: Cargar texturas
     * - De superposición
     * - De entorno
     *******************/
    const path = "./images/";
    const texCubo = new THREE.TextureLoader().load(path + "wood512.jpg");
    const texSuelo = new THREE.TextureLoader().load(path + "r_256.jpg");
    texSuelo.repeat.set(4, 3);
    texSuelo.wrapS = texSuelo.wrapT = THREE.MirroredRepeatWrapping;

    const entorno = [
        path + "posx.jpg", path + "negx.jpg",
        path + "posy.jpg", path + "negy.jpg",
        path + "posz.jpg", path + "negz.jpg"
    ];
    const texEsfera = new THREE.CubeTextureLoader().load(entorno);

    // Materiales
    /*******************
     * TO DO: Crear materiales y aplicar texturas
     * - Uno basado en Lambert
     * - Uno basado en Phong
     * - Uno basado en Basic
     *******************/

    const matCubo = new THREE.MeshLambertMaterial({
        color: 'yellow',
        map: texCubo
    });
    
    const matEsfera = new THREE.MeshPhongMaterial({
        color: 'white',
        specular: 'gray',
        shininess: 30,
        envMap: texEsfera
    });
    
    const matSuelo = new THREE.MeshStandardMaterial({
        color: "rgb(150,150,150)",
        map: texSuelo
    });

    /*******************
    * TO DO: Misma escena que en la practica anterior
    * cambiando los materiales y activando las sombras
    *******************/

    suelo = new THREE.Mesh(new THREE.PlaneGeometry(10, 10, 100, 100), matSuelo);
    suelo.rotation.x = -Math.PI / 2;
    suelo.position.y = -0.2;
    suelo.receiveShadow = true;
    scene.add(suelo);
    
    // Crear grupo pentágono
    grupoPentagono = new THREE.Group();
    scene.add(grupoPentagono);
    
    // Construir pentágono
    const radio = 5;
    const numLados = 5;
    const anguloBase = (2 * Math.PI) / numLados;
    
    const geoCubo = new THREE.BoxGeometry(2, 2, 2);
    
    for (let i = 0; i < numLados; i++) {
        const x = radio * Math.cos(i * anguloBase);
        const z = radio * Math.sin(i * anguloBase);
        
        const cubo = new THREE.Mesh(geoCubo, matCubo);
        cubo.position.set(x, 1, z);
        cubo.castShadow = true;
        cubo.receiveShadow = true;
        grupoPentagono.add(cubo);
    }
    
    // Añadir modelo importado
    const loaderObj = new THREE.ObjectLoader();
    loaderObj.load('models/soldado/soldado.json', 
    function (objeto)
    {
        const soldado = new THREE.Object3D();
        soldado.add(objeto);
        scene.add(soldado);
        soldado.position.y = 1;
        soldado.name = 'soldado';
        soldado.traverse(ob => {
            if (ob.isObject3D) ob.castShadow = true;
        });
        objeto.material.setValues({
            map: new THREE.TextureLoader().load("models/soldado/soldado.png")
        });
    });
    
    // Añadir ejes
    const ejes = new THREE.AxesHelper(5);
    scene.add(ejes);

    /******************
     * TO DO: Crear una habitacion de entorno
     ******************/

    const paredes = [];
    paredes.push(new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path + "posx.jpg")
    }));
    paredes.push(new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path + "negx.jpg")
    }));
    paredes.push(new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path + "posy.jpg")
    }));
    paredes.push(new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path + "negy.jpg")
    }));
    paredes.push(new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path + "posz.jpg")
    }));
    paredes.push(new THREE.MeshBasicMaterial({
        side: THREE.BackSide,
        map: new THREE.TextureLoader().load(path + "negz.jpg")
    }));
    
    const habitacion = new THREE.Mesh(new THREE.BoxGeometry(40, 40, 40), paredes);
    scene.add(habitacion);

    /******************
     * TO DO: Asociar una textura de vídeo al suelo
     ******************/

    video = document.createElement('video');
    video.src = "./videos/Pixar.mp4";
    video.load();
    video.muted = true;
    video.play();
    
    const texVideo = new THREE.VideoTexture(video);
    const pantalla = new THREE.Mesh(
        new THREE.PlaneGeometry(20, 6, 4, 4),
        new THREE.MeshBasicMaterial({map: texVideo})
    );
    pantalla.position.set(0, 4.5, -5);
    scene.add(pantalla);

}

function loadGUI()
{
    // Interfaz de usuario
    /*******************
    * TO DO: Crear la interfaz de usuario con la libreria lil-gui.js
    * - Funcion de disparo de animaciones. Las animaciones deben ir
    *   encadenadas
    * - Slider de control de radio del pentagono
    * - Checkbox para alambrico/solido
    * - Checkbox de sombras
    * - Selector de color para cambio de algun material
    * - Boton de play/pause y checkbox de mute
    *******************/

    effectController = {
        mensaje: 'Pentágono Iluminado',
        giroY: 0.0,
        separacion: 0,
        radio: 5,
        alambrico: false,
        sombras: true,
        colorsuelo: "rgb(150,150,150)",
        animar: function() { animarPentagono(); },
        play: function() { video.play(); },
        pause: function() { video.pause(); },
        mute: true
    };
    
    // Creación interfaz
    const gui = new GUI();
    
    // Construcción del menú
    const h = gui.addFolder("Control Pentágono");
    h.add(effectController, "mensaje").name("Aplicación");
    h.add(effectController, "giroY", -180.0, 180.0, 0.025).name("Giro en Y");
    h.add(effectController, "separacion", { 'Ninguna': 0, 'Media': 2, 'Total': 5 }).name("Separación");
    h.add(effectController, "radio", 3, 10, 0.1).name("Radio del Pentágono");
    h.add(effectController, "alambrico").name("Modo Alámbrico").onChange(toggleWireframe);
    h.add(effectController, "sombras").name("Activar Sombras").onChange(toggleShadows);
    h.addColor(effectController, "colorsuelo").name("Color del suelo").onChange(updateFloorColor);
    h.add(effectController, "animar").name("Animar Pentágono");
    
    const videoFolder = gui.addFolder("Control Video");
    videoFolder.add(effectController, "mute").name("Silenciar").onChange(toggleMute);
    videoFolder.add(effectController, "play").name("Reproducir");
    videoFolder.add(effectController, "pause").name("Pausar");
}

function updateAspectRatio() {
    const ar = window.innerWidth / window.innerHeight;
    renderer.setSize(window.innerWidth, window.innerHeight);
    camera.aspect = ar;
    camera.updateProjectionMatrix();
}

function animate(event) {
    // Capturar y normalizar
    let x = event.clientX;
    let y = event.clientY;
    x = (x / window.innerWidth) * 2 - 1;
    y = -(y / window.innerHeight) * 2 + 1;

    // Construir el rayo y detectar la intersección
    const rayo = new THREE.Raycaster();
    rayo.setFromCamera(new THREE.Vector2(x, y), camera);
    const soldado = scene.getObjectByName('soldado');
    
    if (soldado) {
        let intersecciones = rayo.intersectObjects(soldado.children, true);

        if (intersecciones.length > 0) {
            new TWEEN.Tween(soldado.position)
                .to({x: [0, 0], y: [3, 1], z: [0, 0]}, 2000)
                .interpolation(TWEEN.Interpolation.Bezier)
                .easing(TWEEN.Easing.Bounce.Out)
                .start();
        }
    }
}

function animarPentagono() {
    grupoPentagono.children.forEach((cubo, index) => {
        new TWEEN.Tween(cubo.position)
            .to({y: 3}, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .chain(
                new TWEEN.Tween(cubo.position)
                    .to({y: 1}, 1000)
                    .easing(TWEEN.Easing.Bounce.Out)
            )
            .delay(index * 300)
            .start();
    });
}

function toggleWireframe() {
    grupoPentagono.children.forEach(objeto => {
        objeto.material.wireframe = effectController.alambrico;
    });
}

function toggleShadows() {
    grupoPentagono.children.forEach(objeto => {
        objeto.castShadow = effectController.sombras;
        objeto.receiveShadow = effectController.sombras;
    });
    
    const soldado = scene.getObjectByName('soldado');
    if (soldado) {
        soldado.traverse(ob => {
            if (ob.isObject3D) ob.castShadow = effectController.sombras;
        });
    }
}

function toggleMute() {
    video.muted = effectController.mute;
}

function updateFloorColor() {
    suelo.material.color.set(effectController.colorsuelo);
}

function update(delta)
{
    /*******************
    * TO DO: Actualizar tween
    *******************/

    const numLados = 5;
    const anguloBase = (2 * Math.PI) / numLados;

    grupoPentagono.children.forEach((objeto, i) => {
        const radioModificado = effectController.radio + effectController.separacion;

        objeto.position.set(
            radioModificado * Math.cos(i * anguloBase),
            1,
            radioModificado * Math.sin(i * anguloBase)
        );
    });

    // Actualización de la rotación
    grupoPentagono.rotation.y = effectController.giroY * Math.PI / 180;
    
    // Actualizar animaciones
    TWEEN.update();
}

function render(delta)
{
    requestAnimationFrame( render );
    update(delta);
    renderer.render( scene, camera );
}