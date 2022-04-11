import * as THREE from 'three';


import { PointerLockControls } from "/static/jsm/controls/PointerLockControls.js";

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 1, 500 );
camera.position.set( 0, 0, 100 );
camera.lookAt( 0, 0, 0 );
const clock = new THREE.Clock();
const scene = new THREE.Scene();
const controls = new PointerLockControls(camera, renderer.domElement)

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

const onKeyDown = function ( event ) {
    switch ( event.code ) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = true;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = true;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = true;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = true;
            break;
        case 'Space':
            moveUp = true;
            break;
        case 'ShiftLeft':
            moveDown = true;
            break;
        case "KeyX":
            placeCube(controls.getObject().position);
            break;
    }
};

const onKeyUp = function ( event ) {
    switch ( event.code ) {
        case 'ArrowUp':
        case 'KeyW':
            moveForward = false;
            break;
        case 'ArrowLeft':
        case 'KeyA':
            moveLeft = false;
            break;
        case 'ArrowDown':
        case 'KeyS':
            moveBackward = false;
            break;
        case 'ArrowRight':
        case 'KeyD':
            moveRight = false;
            break;
        case 'Space':
            moveUp = false;
            break;
        case 'ShiftLeft':
            moveDown = false;
            break;
    }
};

document.addEventListener('keydown', onKeyDown );
document.addEventListener('keyup', onKeyUp );

renderer.domElement.addEventListener( 'click', function () {controls.lock();});
//controls.addEventListener( 'lock', function () {menu.style.display = 'none';});
//controls.addEventListener( 'unlock', function () {menu.style.display = 'block';});
scene.add( controls.getObject() );

const direction = new THREE.Vector3();
const velocity = new THREE.Vector3();

window.addEventListener( 'resize', onWindowResize );
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize( window.innerWidth, window.innerHeight );
}

const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
  '/static/sky/Daylight Box_Right.bmp',
  '/static/sky/Daylight Box_Left.bmp',
  '/static/sky/Daylight Box_Top.bmp',
  '/static/sky/Daylight Box_Bottom.bmp',
  '/static/sky/Daylight Box_Front.bmp',
  '/static/sky/Daylight Box_Back.bmp',
]);
scene.background = texture

const directionalLight = new THREE.DirectionalLight( 0xffffff, 0.5 );
directionalLight.castShadow = true;
directionalLight.position.set(0.5, 1, 0.3).normalize();
scene.add( directionalLight );

const light = new THREE.AmbientLight( 0x505060 );
scene.add( light );

let geometry, material, cube

var socket = io();

function placeCube(pos) {
    socket.emit("place", pos)
}

function addCube(pos) {
    geometry = new THREE.BoxGeometry( 5, 5, 5 );
    material = new THREE.MeshLambertMaterial( {color: 0xffffff} );
    cube = new THREE.Mesh( geometry, material );
    cube.position.set(pos.x, pos.y, pos.z);
    scene.add(cube);
}

socket.on('place', function(pos) {
    console.log(pos);
    addCube(pos);
});

socket.on('connected', function(cubes) {
    cubes.forEach(pos => {addCube(pos)})
});

  //placeCube(new THREE.Vector3(0, 0, 0))

function render() {
    requestAnimationFrame( render )
	const delta = clock.getDelta();

    velocity.x -= velocity.x * 10.0 * delta;
    velocity.z -= velocity.z * 10.0 * delta;
    velocity.y -= velocity.y * 10.0 * delta;

    if (moveForward) velocity.z += 400.0 * delta;
    if (moveBackward) velocity.z -= 400.0 * delta;
    if (moveRight) velocity.x += 400.0 * delta;
    if (moveLeft) velocity.x -= 400.0 * delta;
    if (moveUp) velocity.y += 400.0 * delta;
    if (moveDown) velocity.y -= 400.0 * delta;

    controls.moveRight(velocity.x * delta );
    controls.moveForward(velocity.z * delta );
    controls.getObject().position.y += velocity.y * delta;
    //camera.translateY(1);
    //controls.update(delta);
    renderer.render( scene, camera );

}
render();