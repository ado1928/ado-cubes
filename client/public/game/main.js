import * as THREE from 'three';
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import * as BufferGeometryUtils from "three/addons/utils/BufferGeometryUtils.js";
import JoystickController from 'joystick-controller';
import { playAudio, escapeHTML, coloride, setHide, usingMobile } from "./utils.js";
import { config } from "./config.js";
import { commands } from "./commands.js";

let socket = window.socket;
let game = window.game;

const clock = new THREE.Clock();
const velocity = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const scene = new THREE.Scene();
const renderer = new THREE.WebGLRenderer();
const loader = new THREE.CubeTextureLoader();
export const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 10000);
export const controls = new PointerLockControls(camera, renderer.domElement);
const skybox = loader.load([
	'/game/sky/skybox_right.png',
	'/game/sky/skybox_left.png',
	'/game/sky/skybox_top.png',
	'/game/sky/skybox_bottom.png',
	'/game/sky/skybox_front.png',
	'/game/sky/skybox_back.png'
]);
scene.background = skybox;

let vert = `
varying vec2 vUv;

void main() {
	vUv = uv;
	vec4 mvPosition = modelViewMatrix * vec4(position, 1);
	gl_Position = projectionMatrix * mvPosition;
}`

let frag = `
uniform sampler2D colorTexture;
varying vec2 vUv;

void main(void) {
	vec4 color = vec4(0, 0, 0, 0.1);
	if (mod(vUv.x + 0.005 / 2.0, 1.0/2.0) * 2.0 < 0.01) { color = vec4(0.1, 0.25, 1.0, 0.5); } else
	if (mod(vUv.y + 0.005 / 2.0, 1.0/2.0) * 2.0 < 0.01) { color = vec4(0.1, 0.25, 1.0, 0.5); } else
	if (mod(vUv.x + 0.02 / 16.0, 1.0/16.0) * 16.0 < 0.04) { color = vec4(0.1, 0.25, 1.0, 0.5); } else
	if (mod(vUv.y + 0.02 / 16.0, 1.0/16.0) * 16.0 < 0.04) { color = vec4(0.1, 0.25, 1.0, 0.5); } else
	if (mod(vUv.x + 0.025 / 64.0, 1.0/64.0) * 64.0 < 0.05) { color = vec4(0.1, 0.25, 1.0, 0.5); } else
	if (mod(vUv.y + 0.025 / 64.0, 1.0/64.0) * 64.0 < 0.05) { color = vec4(0.1, 0.25, 1.0, 0.5); }
	gl_FragColor = vec4(color);
}`

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = true;
document.body.appendChild(renderer.domElement);

camera.position.set(-16, 96, -16);
camera.rotation.order = 'YXZ';
camera.lookAt(48, 0, 48);

let world = [];
let geometry, material, pos;
export let grid;

material = new THREE.ShaderMaterial({
	uniforms: { time: { value: 1.0 }, resolution: { value: new THREE.Vector2() } },
	vertexShader: vert,
	fragmentShader: frag,
	side: THREE.BackSide
});
material.transparent = true;
geometry = new THREE.BoxGeometry(64, 64, 64);
grid = new THREE.Mesh(geometry, material);
grid.position.set(31.5, 31.5, 31.5);
scene.add(grid);

geometry = new THREE.PlaneGeometry(2000, 2000);
material = new THREE.MeshPhongMaterial({ color: 0xffffff });

let ground = new THREE.Mesh(geometry, material);
ground.position.set(0, -0.5, 0);
ground.rotateX(-Math.PI / 2);
ground.receiveShadow = true;
ground.renderOrder = -1;
ground.material.depthTest = false;
ground.material.depthWrite = false;
scene.add(ground);

scene.add(controls.getObject());

export var sun = new THREE.DirectionalLight(0xffffff, 0.35);
sun.position.set(20, 90, 50);
sun.castShadow = true;
scene.add(sun);

sun.shadow.bias = 0;
sun.shadow.normalBias = 0.1;
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 1000;
sun.shadow.camera.right = 60;
sun.shadow.camera.left = -30;
sun.shadow.camera.top = 35;
sun.shadow.camera.bottom = -71;
sun.shadow.autoUpdate = false;

const light = new THREE.AmbientLight(0x606070);
scene.add(light);

const dlight = new THREE.DirectionalLight(0xffffff, 0.2);
dlight.position.set(0.3, 0.6, 0.5);
dlight.castShadow = false;
scene.add(dlight);

const dlight2 = new THREE.DirectionalLight(0xffffff, 0.15);
dlight2.position.set(-0.3, 0.6, -0.2);
dlight2.castShadow = false;
scene.add(dlight2);



function resize() {
	renderer.setPixelRatio(window.devicePixelRatio / config.rendererPixelRatio);
	renderer.setSize(window.innerWidth, window.innerHeight);
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
};

window.addEventListener("resize", (resize(), resize));

renderer.domElement.addEventListener('click', () => {
	if (nickname) controls.lock();
	setHide([document.querySelectorAll('.window'), esc], true);
});







let color = 0;
let colorSkip = 1;
let colors;
let colorMaterials = [];
let cubes = [];
let geometries = [];

function updateColor() {
	color = (color % colors.length + colors.length) % colors.length;
	for (let i = 0; i < colors.length; i++) colors[i].className = '';
	colors[color].className = "selected-color"
}

function colorPicker() {
	raycaster.setFromCamera({ "x": 0, "y": 0 }, camera);
	const intersects = raycaster.intersectObjects(scene.children);
	if (intersects[0].object.material.type == 'ShaderMaterial') return;
	if (intersects.length > 0) { color = world.indexOf(intersects[0].object); updateColor() };
	//console.log(intersects[0].object.material)
	playAudio('ui/color picker', config.uiVolume, !config.disableColorPickerSound)
}

function initPalette(worldPalette) {
	palette.innerHTML = ''

	for (let i = 0; i < worldPalette.length; i++) {
		let paletteColor = document.createElement('div');
		paletteColor.style.background = `#${worldPalette[i]}`;
		paletteColor.title = i;
		palette.appendChild(paletteColor)
	}

	colors = palette.children;

	for (var i = 0; i < colors.length; i++) {
		colorMaterials[i] = new THREE.MeshPhongMaterial({ color: colors[i].style.backgroundColor })
	} 

	for (let i = 0; i < colors.length; i++) colors[i].onclick = () => { color = i; updateColor() };

	updateColor();

	window.onwheel = event => {
		if (controls.isLocked) {
			color += (event.deltaY < 0) ? colorSkip : colorSkip * -1
			updateColor();
			playAudio('ui/palette scroll', config.uiVolume, !config.disablePaletteScrollSound);
		}
	};

	geometry = new THREE.BoxGeometry(1, 1, 1);
	for (var i = 0; i < colors.length; i++) geometries[i] = [];
}



inputChat.onkeydown = event => {
	if (event.key !== 'Enter' || !nickname) return;
	if (inputChat.value.startsWith('/')) {
		let args = inputChat.value.slice(1).split(' ');
		let command = escapeHTML(args[0]); args.shift();

		if (commands[command] == undefined) return createMessage(`command <b>${command}</b> does not exist`);

		for (let i = 0; i < args.length; i++) {
			args[i] = escapeHTML(args[i]);
			if (!isNaN(args[i])) args[i] = Number(args[i])
		}

		if (args.length <= 1) args = args[0];

		commands[command].args(args);
	} else if (inputChat.value) {
		socket.emit('message', inputChat.value)
	} else {
		inputChat.blur();
		controls.lock();
	}
	inputChat.value = ''
};



let moveForward, moveBackward, moveLeft, moveRight, moveUp, moveDown;
let cameraSpeed = 72;

document.addEventListener('keydown', event => {
	if (!nickname || !controls.isLocked) return;
	if (event.code !== 'F5') event.preventDefault();
	switch (event.code) {
	// Movement
		case 'KeyW': case 'ArrowUp':	moveForward = true; break
		case 'KeyA': case 'ArrowLeft':	moveLeft = true; break
		case 'KeyS': case 'ArrowDown':	moveBackward = true; break
		case 'KeyD': case 'ArrowRight':	moveRight = true; break
		case 'Space':					moveUp = true; break
		case 'ShiftLeft':				moveDown = true; break

	// Camera
		/*
		case 'ArrowUp':			camera.rotation.x += 0.1; camera.updateProjectionMatrix(); break
		case 'ArrowLeft':		camera.rotation.y += 0.1; camera.updateProjectionMatrix(); break
		case 'ArrowDown':		camera.rotation.x -= 0.1; camera.updateProjectionMatrix(); break
		case 'ArrowRight':		camera.rotation.y -= 0.1; camera.updateProjectionMatrix(); break
		//*/
		case config.decreaseCameraSpeed:	cameraSpeed -= (event.altKey) ? 32 : 8; break
		case config.increaseCameraSpeed:	cameraSpeed += (event.altKey) ? 32 : 8; break
		case config.resetCameraZoom:		cameraSpeed = 64.0; break
		case config.decreaseCameraZoom:		cameraZoom((event.altKey) ? -.3 : -.1); break
		case config.increaseCameraZoom:		cameraZoom((event.altKey) ? .3 : .1); break
		case config.resetCameraZoom:		cameraZoom(); break

	// Placement
		case config.placeCubes:	placeCube(controls.getObject().position); break
		case config.breakCubes:	breakCube(controls.getObject().position); break
		case config.toggleGrid:	grid.visible = !grid.visible; break

	// Other
		case 'Enter':	controls.unlock(); inputChat.style.display = "flex"; inputChat.focus(); break
		case 'Tab':		setHide(playerlist, true); break
		case config.settingsShortcut: controls.unlock(); setHide(settings); break
		case config.toggleUi: setHide(uiCanvas.children); break
		case config.highlightCube: highlightCube(); break

		case config.keyModifier: colorSkip = Number(getComputedStyle(document.documentElement).getPropertyValue("--palette-rows")) * -1;
	}
});

document.addEventListener('keyup', event => {
	switch (event.code) {
		case 'KeyW': moveForward = false; break
		case 'KeyA': moveLeft = false; break
		case 'KeyS': moveBackward = false; break
		case 'KeyD': moveRight = false; break
		case 'Space': moveUp = false; break
		case 'ShiftLeft': moveDown = false; break
		case 'Tab': setHide(playerlist, false); break

		case config.keyModifier: colorSkip = 1;

	}
});

document.querySelector('canvas').addEventListener('mousedown', event => {
	if (!nickname || !controls.isLocked) return;
	switch (event.which) {
		case (config.invertMouseControlsForCubePlacement) ? 3 : 1:
			breakCube(controls.getObject().position);
			break
		case 2:
			colorPicker();
			break
		case (config.invertMouseControlsForCubePlacement) ? 1 : 3:
			placeCube(controls.getObject().position);
	}
});

export function cameraZoom(zoom) {
	camera.zoom = Math.min(Math.max(camera.zoom + zoom, 1), 8);
	camera.updateProjectionMatrix()
}



let hcube, hcube2;

function highlightCube() {
	scene.remove(hcube);
	scene.remove(hcube2);
	raycaster.setFromCamera({ "x": 0, "y": 0 }, camera);
	const intersects = raycaster.intersectObjects(scene.children);
	if (intersects[0].object.material.type == 'ShaderMaterial') {
		return;
	} else {
		controls.unlock();
		setHide(sign, false);
	}
	let hgeometry = new THREE.BoxGeometry(1.125, 1.125, 1.125);
	if (intersects.length > 0) {
		let pos = new THREE.Vector3();
		pos.sub(intersects[0].face.normal);
		pos.multiplyScalar(0.5);
		pos.add(intersects[0].point);
		pos = new THREE.Vector3(~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5));

		hcube = new THREE.Mesh(hgeometry, new THREE.MeshToonMaterial({ color: intersects[0].object.material.color.r + intersects[0].object.material.color.g + intersects[0].object.material.color.b < 0.1 ? 0xffffffff : 0x000000, depthTest: false }));
		hcube2 = new THREE.Mesh(geometry, new THREE.MeshPhongMaterial({ color: intersects[0].object.material.color, depthTest: false }));
		hcube.position.set(pos.x, pos.y, pos.z);
		hcube2.position.set(pos.x, pos.y, pos.z);
		scene.add(hcube);
		scene.add(hcube2)
	}
};

function placeCube(pos) {
	if (game.buildingMethod == 'raycast') {
		raycaster.setFromCamera({ "x": 0.0, "y": 0.0 }, camera);
		const intersects = raycaster.intersectObjects(scene.children);
		if (intersects.length > 0) {
			pos = new THREE.Vector3();
			(intersects[0].object == grid) ? pos.sub(intersects[0].face.normal) : pos.add(intersects[0].face.normal);
			pos.multiplyScalar(0.5);
			pos.add(intersects[0].point);
		}
	}
	socket.emit("place", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)], "color": color });
	playAudio('sfx/place', config.sfxVolume, !config.disableCubePlacementSounds)
}

function breakCube(pos) {
	if (game.buildingMethod == 'raycast') {
		raycaster.setFromCamera({ "x": 0, "y": 0 }, camera);
		const intersects = raycaster.intersectObjects(scene.children);
		if (intersects.length > 0) {
			pos = new THREE.Vector3();
			pos.sub(intersects[0].face.normal);
			pos.multiplyScalar(0.5);
			pos.add(intersects[0].point);
		}
	}
	socket.emit("break", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)] });
	playAudio('sfx/remove', config.sfxVolume, !config.disableCubePlacementSounds)
};

function createCube(pos, color) {
	let cube = new THREE.Mesh(geometry, colorMaterials[color], 100);
	const matrix = new THREE.Matrix4();
	const instanceGeometry = geometry.clone();

	if ((color + 1) > colors.length) { color = 6; console.warn(`Illegal color at ${pos.x} ${pos.y} ${pos.z})`) };

	cube.position.set(pos.x, pos.y, pos.z);
	cube.receiveShadow = true;
	cube.castShadow = true;
	cube.color = color;
	cubes.push(cube);

	matrix.compose(pos, new THREE.Quaternion(1, 0, 0, 0), new THREE.Vector3(1, 1, 1));
	instanceGeometry.applyMatrix4(matrix);
	cube.igeometry = instanceGeometry;
	geometries[color].push(instanceGeometry);
	sun.shadow.needsUpdate = true
};

function destroyCube(pos) {
	for (let i = 0; i < cubes.length; i++) {
		let e = cubes[i];
		if (~~e.position.x == ~~(pos.x + 0.5) && ~~e.position.y == ~~(pos.y + 0.5) && ~~e.position.z == ~~(pos.z + 0.5)) {
			let c = cubes.splice(i, 1)[0];
			for (let j = 0; j < geometries[e.color].length; j++) {
				if (c.igeometry.id == geometries[e.color][j].id) {
					geometries[e.color].splice(j, 1);
					sun.shadow.needsUpdate = true;
					updateWorld(e.color);
					return
				}
			}
		}
	}
};

// (1) so that the world updates correctly if initialized twice, (2) merge geometries of color
function initWorld(color) { // 1
	if (world[color] instanceof THREE.Mesh) {
		scene.remove(world[color]);
		world[color].geometry.dispose();
		world[color].material.dispose();
		world[color] = undefined
	};

	let mergedGeometry;
	if (geometries[color].length > 0) mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries[color]); // 2
	world[color] = new THREE.Mesh(mergedGeometry, colorMaterials[color]);
	world[color].castShadow = true;
	world[color].receiveShadow = true;
	sun.shadow.needsUpdate = true;
	scene.add(world[color])
};

function updateWorld(color) {
	if (geometries[color].length > 0) {
		world[color].geometry.dispose();
		world[color].geometry = BufferGeometryUtils.mergeBufferGeometries(geometries[color])
	} else world[color].geometry = new THREE.BufferGeometry()
};

let joystickMoveX, joystickMoveY, joystickRotate, lastPos;

if (usingMobile()) {
	joystickMoveX = new JoystickController({
		leftToRight: true,
		x: "80px",
		y: "80px",
		containerClass: "joystick hide"
	});
	joystickMoveY = new JoystickController({
		leftToRight: false,
		x: "80px",
		y: "192px",
		containerClass: "joystick hide"
	});
	joystickRotate = new JoystickController({
		leftToRight: false,
		x: "80px",
		y: "80px",
		containerClass: "joystick hide"
	});
}



// is there a better way to do this?
document.addEventListener('game', () => { 
	grid.visible = game.showGrid;
	console.log(game.world);
	leaveWorldButton.style.display = (Object.entries(game.world).length == 0) ? 'none' : 'block';
});




let nickname, worldslist;

function joinWorld(event) {
	if (event.key !== 'Enter' && event.which !== 1 || !inputUsername.value || !selectWorld.value || nickname) return;
	nickname = inputUsername.value;
	setHide(welcome.children);
	setHide(uiCanvas.children);
	if (usingMobile()) setHide(document.querySelectorAll('.joystick'));
	socket.emit('joinWorld', { "name": nickname, "id": socket.id, "world": selectWorld.value });
}

function leaveWorld() {
	nickname = null;
	messages.innerHTML = null;
	game.world = {};
	setHide([uiCanvas.children, esc], true);
	setHide(welcome.children, false);
}

inputUsername.onkeydown = event => joinWorld(event);
joinWorldButton.onclick = event => joinWorld(event);
leaveWorldButton.onclick = () => socket.emit('leaveWorld');

socket.on('ohno', reason => {
	document.body.innerHTML = `<p class="socket-error">${reason ?? "oh no, something has gone wrong! please refresh page!"}</p>`
})

socket.on('connected', data => {
	const view = new Uint8Array(data.world);
	game.world = {
		palette: data.palette
	};
	initPalette(data.palette);
	cubes.forEach(e => scene.remove(e)); // if for some reason connecting again, remove all cubes from scene,
	for (let x = 0; x < 64; x++) { // loop through all recieved cubes and add them
		for (let y = 0; y < 64; y++) {
			for (let z = 0; z < 64; z++) {
				if (view[x*4096+y*64+z] > 0) {
					createCube({ 'x': x, 'y': y, 'z': z }, view[x*4096+y*64+z] - 1);
				}
			}
		}
	};
	for (var i = 0; i < colors.length; i++) initWorld(i)
});

socket.on('worldslist', arr => {
	selectWorld.innerHTML = '';
	worldslist = arr;
	for (let i = 0; i < arr.length; i++) {
		let option = document.createElement("option");
		option.text = arr[i];
		selectWorld.add(option);
	}
});

socket.on('playerlist', arr => {
	playerlist.innerHTML = `<strong>playerlist</strong>`;
	arr.forEach(player => {
		playerlist.insertAdjacentHTML('beforeend', `<b title="${player.id}">${player.name}</b>`);
	});
});

socket.on('leaveWorld', () => leaveWorld());

socket.on('place', data => {
	let pos = data.pos;
	createCube(new THREE.Vector3(pos[0], pos[1], pos[2]), data.color);
	updateWorld(data.color);

	/*if (cubeType == 'light') {
		const bl = new THREE.PointLight( colors[data.color].style.backgroundColor, 0.4, 5 );
		bl.position.set(pos[0], pos[1], pos[2]);
		bl.castShadow = false;
		scene.add(bl)
	}*/
});
socket.on('break', data => {
	let pos = data.pos;
	destroyCube(new THREE.Vector3(pos[0], pos[1], pos[2]));
});



function render() {
	requestAnimationFrame(render);

	const delta = clock.getDelta();

	if (usingMobile()) {
		if (joystickMoveX.y > 16) moveForward = true;
		if (joystickMoveX.x < -16) moveLeft = true;
		if (joystickMoveX.y < -16) moveBackward = true;
		if (joystickMoveX.x > 16) moveRight = true;

		if (joystickMoveY.y > 16) moveUp = true;
		if (joystickMoveY.y < -16) moveDown = true;

		camera.rotation.x += joystickRotate.y / 48 * delta;
		camera.rotation.y -= joystickRotate.x / 48 * delta;
	}

	camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x)); // Enfore limit for mobile controls
	
	if (moveForward) velocity.z += cameraSpeed * delta;
	if (moveLeft) velocity.x -= cameraSpeed * delta;
	if (moveBackward) velocity.z -= cameraSpeed * delta;
	if (moveRight) velocity.x += cameraSpeed * delta;
	if (moveUp) velocity.y += cameraSpeed * delta;
	if (moveDown) velocity.y -= cameraSpeed * delta;

	if (!controls.isLocked) {
		moveForward = false;
		moveLeft = false;
		moveBackward = false;
		moveRight = false;
		moveUp = false;
		moveDown = false;
	}

	velocity.multiplyScalar(Math.pow(0.001, delta));

	controls.moveRight(velocity.x * delta);
	controls.moveForward(velocity.z * delta);
	controls.getObject().position.y += velocity.y * delta;

	let pos = controls.getObject().position;
	let ponk = `x ${Math.round(pos.x)} / y ${Math.round(pos.y )} / z ${Math.round(pos.z)}`

	if (ponk !== lastPos && nickname) {
		coordinates.innerText = ponk;
		lastPos = ponk;
	};

	renderer.render(scene, camera)
};

render();
socket.connect();