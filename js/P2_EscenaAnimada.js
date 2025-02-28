/**
 * EscenaAnimada.js
 * 
 * Practica AGM #2. Escena basica con interfaz y animacion
 * Se trata de añadir un interfaz de usuario que permita 
 * disparar animaciones sobre los objetos de la escena con Tween
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
    * TO DO: Completar el motor de render y el canvas
    *******************/
    document.getElementById('container').appendChild( renderer.domElement );
    

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

    // Eventos
    renderer.domElement.addEventListener('dblclick', animate );
}

function loadScene()
{
    const material = new THREE.MeshBasicMaterial({color:'yellow',wireframe:true});

    /*******************
    * TO DO: Misma escena que en la practica anterior
    *******************/
    suelo = new THREE.Mesh( new THREE.PlaneGeometry(10,10, 10,10), material );
    suelo.rotation.x = -Math.PI / 2;
    scene.add(suelo);
       
    grupoPentagono = new THREE.Group();
    scene.add(grupoPentagono);
       
    /*******************
    * TO DO: Construir una escena con 5 figuras diferentes posicionadas
    * en los cinco vertices de un pentagono regular alredor del origen
    *******************/
    const radio = 5;
    const numLados = 5;
    const anguloBase = (2 * Math.PI) / numLados;
       
    const geoCubo = new THREE.BoxGeometry( 2,2,2 );
       
    for (let i = 0; i < numLados; i++) {
        const x = radio * Math.cos(i * anguloBase);
        const z = radio * Math.sin(i * anguloBase);
           
        const cubo = new THREE.Mesh(geoCubo, material);
        cubo.position.set(x, 1, z);
        scene.add(cubo);
        grupoPentagono.add(cubo);
    }
       
    /*******************
    * TO DO: Añadir a la escena un modelo importado en el centro del pentagono
    *******************/
    const loader = new THREE.ObjectLoader();
    loader.load('models/soldado/soldado.json', 
    function (objeto)
    {
        const soldado = new THREE.Object3D();
        soldado.add(objeto);
        geoCubo.add(soldado);
        soldado.position.y = 1;
        soldado.name = 'soldado';
    });
       
    /*******************
    * TO DO: Añadir a la escena unos ejes
    *******************/
    const ejes = new THREE.AxesHelper(5);
    scene.add(ejes);

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
    *******************/

    // Definicion de los controles
    effectController = {
        mensaje: 'Pentágono Animado',
        giroY: 0.0,
        separacion: 0,
        radio: 5,
        alambrico: false,
        colorsuelo: "rgb(150,150,150)",
        animar: function() { animarPentagono(); }
    };
    
    // Creacion interfaz
    const gui = new GUI();
    
    // Construccion del menu
    const h = gui.addFolder("Control esferaCubo");
    h.add(effectController, "mensaje").name("Aplicacion");
    h.add(effectController, "giroY", -180.0, 180.0, 0.025).name("Giro en Y");
    h.add(effectController, "separacion", { 'Ninguna': 0, 'Media': 2, 'Total': 5 }).name("Separacion");
    h.add(effectController, "radio", 3, 10, 0.1).name("Radio del Pentágono");
    h.add(effectController, "alambrico").name("Modo Alámbrico").onChange(toggleWireframe);
    h.addColor(effectController, "colorsuelo").name("Color alambres");
    h.add(effectController, "animar").name("Animar Pentágono");
}

function animate(event)
{
    // Capturar y normalizar
    let x= event.clientX;
    let y = event.clientY;
    x = ( x / window.innerWidth ) * 2 - 1;
    y = -( y / window.innerHeight ) * 2 + 1;

    // Construir el rayo y detectar la interseccion
    const rayo = new THREE.Raycaster();
    rayo.setFromCamera(new THREE.Vector2(x,y), camera);
    const soldado = scene.getObjectByName('soldado');
    let intersecciones = rayo.intersectObjects(soldado.children,true);

    if( intersecciones.length > 0 ){
        new TWEEN.Tween( soldado.position ).
        to( {x:[0,0],y:[3,1],z:[0,0]}, 2000 ).
        interpolation( TWEEN.Interpolation.Bezier ).
        easing( TWEEN.Easing.Bounce.Out ).
        start();
    }
}

function update(delta)
{
    /*******************
    * TO DO: Actualizar tween
    *******************/
    angulo += 0.01;
    
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

    suelo.material.color.set(effectController.colorsuelo);
    grupoPentagono.rotation.y = effectController.giroY * Math.PI / 180;
    TWEEN.update();
}

function animarPentagono() {
    grupoPentagono.children.forEach((cubo, index) => {
        new TWEEN.Tween(cubo.position)
            .to({ y: 3 }, 1000)
            .easing(TWEEN.Easing.Quadratic.Out)
            .chain(
                new TWEEN.Tween(cubo.position)
                    .to({ y: 1 }, 1000)
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

function render(delta)
{
    requestAnimationFrame( render );
    update(delta);
    renderer.render( scene, camera );
}