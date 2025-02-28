/**
 * Escena.js
 * 
 * Practica AGM #1. Escena basica en three.js
 * Seis objetos organizados en un grafo de escena con
 * transformaciones, animacion basica y modelos importados
 * 
 * @author 
 * 
 */

// Modulos necesarios
/*******************
 * TO DO: Cargar los modulos necesarios
 *******************/
import * as THREE from "../lib/three.module.js";

// Variables de consenso
let renderer, scene, camera, loader, grupoPentagono;

// Otras globales
/*******************
 * TO DO: Variables globales de la aplicacion
 *******************/
let angulo = 0;

// Acciones
init();
loadScene();
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
    
    // Camara
    camera = new THREE.PerspectiveCamera( 75, window.innerWidth/window.innerHeight, 0.1,1000);
    camera.position.set( 0.5, 2, 7 );
    camera.lookAt( new THREE.Vector3(0,1,0) );

    // Cargador de modelos
    loader = new THREE.ObjectLoader();
}

function loadScene()
{
    const material = new THREE.MeshNormalMaterial( );

    /*******************
    * TO DO: Construir un suelo en el plano XZ
    *******************/
    const suelo = new THREE.Mesh( new THREE.PlaneGeometry(10,10, 10,10), material );
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
    loader.load( 'models/soldado/soldado.json', 
        function(objeto){
            scene.add(objeto);
            objeto.position.set(0,0,0);
        }
    )

    /*******************
    * TO DO: Añadir a la escena unos ejes
    *******************/
    const ejes = new THREE.AxesHelper(5);
    scene.add(ejes);
}

function update()
{
    /*******************
    * TO DO: Modificar el angulo de giro de cada objeto sobre si mismo
    * y del conjunto pentagonal sobre el objeto importado
    *******************/
    angulo += 0.01;
    grupoPentagono.rotation.y = angulo;
    grupoPentagono.children.forEach(objeto => {
        objeto.rotation.y += 0.02;
    });
}

function render()
{
    requestAnimationFrame( render );
    update();
    renderer.render( scene, camera );
}