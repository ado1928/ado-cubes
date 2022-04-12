import * as THREE from 'three';


import { PointerLockControls } from "/static/jsm/controls/PointerLockControls.js";

const renderer = new THREE.WebGLRenderer();
renderer.setSize( window.innerWidth, window.innerHeight );
document.body.appendChild( renderer.domElement );

const camera = new THREE.PerspectiveCamera( 70, window.innerWidth / window.innerHeight, 0.1, 500 );
camera.position.set( 0, 0, 10 );
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

let vert = `
varying vec2 vUv;

void main()
{
    vUv = uv;
    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_Position = projectionMatrix * mvPosition;
}`


let frag = `
uniform sampler2D colorTexture;

varying vec2 vUv;

void main( void ) {
    vec4 color = vec4(0.0, 0.0, 0.0, 0.1);

    if(mod(vUv.x + 0.005 / 2.0, 1.0/2.0) * 2.0 < 0.01) {
        color = vec4(1.0, 1.0, 0.0, 0.5);
    }

    else if(mod(vUv.y + 0.005 / 2.0, 1.0/2.0) * 2.0 < 0.01) {
        color = vec4(1.0, 1.0, 0.0, 0.5);
    }

    else if(mod(vUv.x + 0.02 / 16.0, 1.0/16.0) * 16.0 < 0.04) {
        color = vec4(1.0, 1.0, 0.0, 0.5);
    }

    else if(mod(vUv.y + 0.02 / 16.0, 1.0/16.0) * 16.0 < 0.04) {
        color = vec4(1.0, 1.0, 0.0, 0.5);
    }

    else if(mod(vUv.x + 0.025 / 64.0, 1.0/64.0) * 64.0 < 0.05) {
        color = vec4(1.0, 1.0, 0.0, 0.5);
    }

    else if(mod(vUv.y + 0.025 / 64.0, 1.0/64.0) * 64.0 < 0.05) {
        color = vec4(1.0, 1.0, 0.0, 0.5);
    }



    gl_FragColor = vec4( color);

}`

let geometry, material, cube, pos

material = new THREE.ShaderMaterial( {

	uniforms: {

		time: { value: 1.0 },
		resolution: { value: new THREE.Vector2() }

	},
    vertexShader: vert,
	fragmentShader: frag,
    
    side: THREE.BackSide 
} );
material.transparent = true;
geometry = new THREE.BoxGeometry( 64, 64, 64 );
cube = new THREE.Mesh( geometry, material );
cube.position.set(31.5, 31.5, 31.5);
scene.add(cube);

var socket = io();

function placeCube(pos) {
    socket.emit("place", {"pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5),  ~~(pos.z + 0.5)]});
}

function addCube(pos) {
    geometry = new THREE.BoxGeometry( 1, 1, 1 );
    material = new THREE.MeshLambertMaterial( {color: 0xffffff} );
    cube = new THREE.Mesh( geometry, material );
    cube.position.set(pos.x, pos.y, pos.z);
    scene.add(cube);
}

socket.on('place', function(data) {
    console.log(data);
    let pos = data.pos;
    addCube(new THREE.Vector3(pos[0], pos[1], pos[2]));
});


socket.on('connected', function(arr) {
    console.log(arr);
    window.arr = arr;
    for(let x = 0; x < 64; x++) {
        for(let y = 0; y < 64; y++) {
            for(let z = 0; z < 64; z++) {
                if(arr[x][y][z] == 1) {
                    addCube({"x": x, "y": y, "z": z});
                }
            }
        }
    }
})
  //placeCube(new THREE.Vector3(0, 0, 0))

function render() {
    requestAnimationFrame( render )
	const delta = clock.getDelta();

    velocity.x *= 0.9;
    velocity.z *= 0.9;
    velocity.y *= 0.9;

    if (moveForward) velocity.z += 50.0 * delta;
    if (moveBackward) velocity.z -= 50.0 * delta;
    if (moveRight) velocity.x += 50.0 * delta;
    if (moveLeft) velocity.x -= 50.0 * delta;
    if (moveUp) velocity.y += 50.0 * delta;
    if (moveDown) velocity.y -= 50.0 * delta;

    controls.moveRight(velocity.x * delta );
    controls.moveForward(velocity.z * delta );
    controls.getObject().position.y += velocity.y * delta;

    pos = controls.getObject().position;
    document.getElementById("coords").innerText = "x: " + ~~(pos.x + 0.5) + ", y: " + ~~(pos.y + 0.5) + ", z: " + ~~(pos.z + 0.5);

    renderer.render( scene, camera );

}
render();