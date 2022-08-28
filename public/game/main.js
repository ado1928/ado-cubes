import * as THREE from 'three';
import { PointerLockControls } from "/game/jsm/controls/PointerLockControls.js";
import * as BufferGeometryUtils from '/game/jsm/utils/BufferGeometryUtils.js';
let socket = io();
import * as commands from './commands.js';

function playAudio(url, condition) { if (condition || condition == undefined) { let i = new Audio('./audio/'+url+'.ogg'); i.play() } };
function randomInt(max) { return Math.floor(Math.random() * max) };

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.autoClear = true;
document.body.appendChild(renderer.domElement);

export const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(-16, 96, -16);
camera.rotation.order = 'YXZ';
camera.lookAt(48, 0, 48);
const clock = new THREE.Clock();
const scene = new THREE.Scene();
export const controls = new PointerLockControls(camera, renderer.domElement);

let worlds = [];

let vert = `
varying vec2 vUv;

void main() {
	vUv = uv;
	vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
	gl_Position = projectionMatrix * mvPosition;
}`

let frag = `
uniform sampler2D colorTexture;
varying vec2 vUv;

void main(void) {
	vec4 color = vec4(0.0, 0.0, 0.0, 0.1);
	if (mod(vUv.x + 0.005 / 2.0, 1.0/2.0) * 2.0 < 0.01) { color = vec4(0.1, 0.25, 1.0, 0.5); } else
	if (mod(vUv.y + 0.005 / 2.0, 1.0/2.0) * 2.0 < 0.01) { color = vec4(0.1, 0.25, 1.0, 0.5); } else
	if (mod(vUv.x + 0.02 / 16.0, 1.0/16.0) * 16.0 < 0.04) { color = vec4(0.1, 0.25, 1.0, 0.5); } else
	if (mod(vUv.y + 0.02 / 16.0, 1.0/16.0) * 16.0 < 0.04) { color = vec4(0.1, 0.25, 1.0, 0.5); } else
	if (mod(vUv.x + 0.025 / 64.0, 1.0/64.0) * 64.0 < 0.05) { color = vec4(0.1, 0.25, 1.0, 0.5); } else
	if (mod(vUv.y + 0.025 / 64.0, 1.0/64.0) * 64.0 < 0.05) { color = vec4(0.1, 0.25, 1.0, 0.5); }
	gl_FragColor = vec4(color);

}`

let geometry, material, grid, pos;

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
grid.visible = true;

geometry = new THREE.PlaneBufferGeometry(2000, 2000);
material = new THREE.MeshStandardMaterial({ color: 0xffffff });

let ground = new THREE.Mesh(geometry, material);
ground.position.set(0, -0.5, 0);
ground.rotateX(- Math.PI / 2);
ground.receiveShadow = true;
ground.renderOrder = -1;
ground.material.depthTest = false;
ground.material.depthWrite = false;
scene.add(ground);


scene.add(controls.getObject());

const direction = new THREE.Vector3();
const velocity = new THREE.Vector3();

window.addEventListener('resize', () => {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.documentElement.style.setProperty("--innerHeight", window.innerHeight + "px")
});
document.documentElement.style.setProperty("--innerHeight", window.innerHeight + "px")

const loader = new THREE.CubeTextureLoader();
const skybox = loader.load([
	'/game/sky/Daylight Box_Right.png',
	'/game/sky/Daylight Box_Left.png',
	'/game/sky/Daylight Box_Top.png',
	'/game/sky/Daylight Box_Bottom.png',
	'/game/sky/Daylight Box_Front.png',
	'/game/sky/Daylight Box_Back.png'
]);
scene.background = skybox;

const sun = new THREE.DirectionalLight(0xffffff, 0.35);
sun.position.set(20, 90, 50);
sun.castShadow = true;
scene.add(sun);

sun.shadow.bias = 0;
sun.shadow.normalBias = 0.1;
sun.shadow.mapSize.width = 4096;
sun.shadow.mapSize.height = 4096;
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 130;
sun.shadow.camera.right = 60;
sun.shadow.camera.left = - 30;
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

export function escapeHTML(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&apos;")
		.replace(/`/g, "&#96;")
}

renderer.domElement.addEventListener('click', () => {
	if (nick) {
		controls.lock();
		esc.style.display = "none";
		settings.style.display = "none";
		credits.style.display = "none"
	}
});

inputUsername.onkeydown = event => {
	if (event.key == "Enter" && inputUsername.value) {
		if (verified) {
			if (inputUsername.value.length > 30) { alert("Your name is too long!"); return };
			nick = inputUsername.value;
			welcome.style.display = "none";
			uiCanvas.style.display = "flex";
			if (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i) || true) {
				mobileControls.style.visibility = "visible";
				inputDesktop.style.display = "none";
				inputMobile.style.display = "flex"
			}
			socket.emit("playerJoin", { "name": nick, "id": Math.random() }) // id is placeholder
		} else captchaPlease.style.display = "flex"
	}
};

inputChat.onkeydown = event => {
	if (event.key == "Enter" && nick) {
		if (inputChat.value.startsWith("/")) { commands.execute() } else
		if (inputChat.value) {
			socket.emit("message", { "sender": nick, "msg": inputChat.value });
			inputChat.value = ""
		} else controls.lock()
	}
};

export function createMessage(msg, audio) {
	if (!audio) audio = 'ui/message';
	messages.insertAdjacentHTML('beforeend', msg + "<br>")
	scrollToBottom(messages);
	playAudio(audio)
}

let nick, verified;

export function verify(uuid) {
	if (!verified) {
		socket = io({ extraHeaders: { "uuid": uuid } });

		socket.on('message', data => createMessage(`<b>${escapeHTML(data["sender"])}:</b> ${escapeHTML(data["msg"])}`));
		socket.on('serverMessage', data => createMessage(`<b>${escapeHTML(data["message"])}</b>`, 'ui/server message'));

		socket.on('connected', arr => {
			const view = new Uint8Array(arr);
			// console.log(view);
			window.arr = view;
			cubes.forEach(e => { scene.remove(e) }); // if for some reason connecting again, remove all cubes from scene,
			for (let x = 0; x < 64; x++) { // loop through all recieved cubes and add them
				for (let y = 0; y < 64; y++) {
					for (let z = 0; z < 64; z++) {
						if (view[x*4096+y*64+z] > 0) {
							addCube({ "x": x, "y": y, "z": z }, view[x*4096+y*64+z] - 1);
						}
					}
				}
			};
			for (var i = 0; i < colors.length; i++) initWorld(i)
		});

		socket.on('place', data => {
			let pos = data.pos;
			addCube(new THREE.Vector3(pos[0], pos[1], pos[2]), data.color);
			updateWorld(data.color)

			// fancy block illumination, do not uncomment unless you want framerate to die
			/*const bl = new THREE.PointLight( colors[data.color].style.backgroundColor, 0.4, 5 );
			bl.position.set(pos[0], pos[1], pos[2]);
			bl.castShadow = false;
			scene.add(bl)*/
		});
		socket.on('break', data => { let pos = data.pos; removeCube(new THREE.Vector3(pos[0], pos[1], pos[2])) })
	};
	verified = true;
};

// (1) so that the world updates correctly if initialized twice, (2) merge geometries of color
function initWorld(col) { // 1
	if (worlds[col] instanceof THREE.Mesh) {
		scene.remove(worlds[col]);
		worlds[col].geometry.dispose();
		worlds[col].material.dispose();
		worlds[col] = undefined
	};

	let mergedGeometry;
	if (geometries[col].length > 0) mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries[col]); // 2
	worlds[col] = new THREE.Mesh(mergedGeometry, materials[col]);
	worlds[col].castShadow = true;
	worlds[col].receiveShadow = true;
	sun.shadow.needsUpdate = true;
	scene.add(worlds[col])
};

function updateWorld(col) {
	if (geometries[col].length > 0) {
		worlds[col].geometry.dispose();
		worlds[col].geometry = BufferGeometryUtils.mergeBufferGeometries(geometries[col])
	} else worlds[col].geometry = new THREE.BufferGeometry()
};

let raycaster = new THREE.Raycaster();

// Showing or hiding crosshair depending on what placement method/mode(?) the player is using
let raycastPlacement = true;
placeAtRaycast.onclick = () => { raycastPlacement = true; crosshair.style.display = "block" };
placeInCamera.onclick = () => { raycastPlacement = false; crosshair.style.display = "none" };

function placeCube(pos) {
	if (raycastPlacement) {
		raycaster.setFromCamera({ "x": 0.0, "y": 0.0 }, camera);
		const intersects = raycaster.intersectObjects(scene.children);
		if (intersects.length > 0) {
			const intersect = intersects[0];
			let pos = new THREE.Vector3();
			if (intersect.object == grid) { pos.sub(intersect.face.normal) } else { pos.add(intersect.face.normal) };
			pos.multiplyScalar(0.5);
			pos.add(intersect.point);
			//console.log(pos);
			socket.emit("place", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)], "color": color })
		}
	} else { socket.emit("place", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)], "color": color }) }
	playAudio('sfx/place', !audioDisablePR.checked)
}

function breakCube(pos) {
	if (raycastPlacement) {
		raycaster.setFromCamera({ "x": 0.0, "y": 0.0 }, camera);
		const intersects = raycaster.intersectObjects(scene.children);
		if (intersects.length > 0) {
			const intersect = intersects[0];
			let pos = new THREE.Vector3();
			pos.sub(intersect.face.normal);
			pos.multiplyScalar(0.5);
			pos.add(intersect.point);
			// console.log(pos);
			socket.emit("break", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)] })
		}
	} else { socket.emit("break", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)] }) };
	playAudio('sfx/remove', !audioDisablePR.checked)
};

let hcube = new THREE.Mesh();
let hcube2 = new THREE.Mesh();
function highlightCube() {
	scene.remove(hcube); scene.remove(hcube2);
	raycaster.setFromCamera({ "x": 0.0, "y": 0.0 }, camera);
	const intersects = raycaster.intersectObjects(scene.children);
	if (intersects[0].object.material.type == 'ShaderMaterial') { messages.clildren.remove(); return };

	let hgeometry = new THREE.BoxGeometry(1.1, 1.1, 1.1);
	if (intersects.length > 0) {
		let pos = new THREE.Vector3();
		pos.sub(intersects[0].face.normal);
		pos.multiplyScalar(0.5);
		pos.add(intersects[0].point);
		pos = new THREE.Vector3(~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5));

		hcube = new THREE.Mesh(hgeometry, new THREE.MeshBasicMaterial({ color: intersects[0].object.material.color.r + intersects[0].object.material.color.g + intersects[0].object.material.color.b < 0.1 ? 0xffffffff : 0x000000, depthTest: false }));
		hcube.position.set(pos.x, pos.y, pos.z);
		scene.add(hcube);
		hcube2 = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color: intersects[0].object.material.color, depthTest: false }));
		hcube2.position.set(pos.x, pos.y, pos.z);
		scene.add(hcube2)
	}
};

let colors = palette.children;
let color = 0;
let colorSkip = 1;

function colorPicker() {
	raycaster.setFromCamera({ "x": 0.0, "y": 0.0 }, camera);
	const intersects = raycaster.intersectObjects(scene.children);
	if (intersects.length > 0) {
		color = worlds.indexOf(intersects[0].object);
		updateColor();
	}
}

function updateColor() {
	color = (color % colors.length + colors.length) % colors.length;
	for (let i = 0; i < colors.length; i++) colors[i].className = "";
	colors[color].className = "selectedbox"
};
for (let i = 0; i < colors.length; i++) colors[i].onclick = () => { color = i; updateColor() };
updateColor();

window.onwheel = event => {
	if (controls.isLocked) {
		if (event.deltaY > 0) color -= colorSkip;
		if (event.deltaY < 0) color += colorSkip;
		updateColor();
		playAudio('ui/palette scroll', !audioDisableUI.checked)
	}
};

let materials = []
for (var i = 0; i < colors.length; i++) materials[i] = new THREE.MeshStandardMaterial({ color: colors[i].style.backgroundColor }) // create materials for colors in palette

geometry = new THREE.BoxGeometry(1, 1, 1);
let geometries = []
let cubes = [];
for (var i = 0; i < colors.length; i++) geometries[i] = [];

function addCube(pos, col) {
	let cube = new THREE.Mesh(geometry, materials[col], 100);
	const matrix = new THREE.Matrix4();
	const instanceGeometry = geometry.clone();

	cube.position.set(pos.x, pos.y, pos.z);
	cube.receiveShadow = true;
	cube.castShadow = true;
	cube.col = col;
	cubes.push(cube);

	matrix.compose(pos, new THREE.Quaternion(1, 0, 0, 0), new THREE.Vector3(1, 1, 1));
	instanceGeometry.applyMatrix4(matrix);
	cube.igeometry = instanceGeometry;
	geometries[col].push(instanceGeometry);
	sun.shadow.needsUpdate = true
};

function removeCube(pos) {
	for (var i = 0; i < cubes.length; i++) {
		let e = cubes[i];
		if (~~e.position.x == ~~(pos.x + 0.5) && ~~e.position.y == ~~(pos.y + 0.5) && ~~e.position.z == ~~(pos.z + 0.5)) {
			let c = cubes.splice(i, 1)[0];
			for (var j = 0; j < geometries[e.col].length; j++) {
				if (c.igeometry.id == geometries[e.col][j].id) {
					geometries[e.col].splice(j, 1);
					sun.shadow.needsUpdate = true;
					updateWorld(e.col);
					return
				}
			}
		}
	}
};

window.verify = verify;

verify(); // bypass captcha in debug

let moveForward, moveBackward, moveLeft, moveRight, moveUp, moveDown;
let cameraSpeed = 64.0;

const onKeyDown = event => {
	if (nick && controls.isLocked) {
		event.preventDefault();
		switch (event.code) {
		// Movement
			case 'KeyW': /*case 'ArrowUp':*/ moveForward = true; break
			case 'KeyA': /*case 'ArrowLeft':*/ moveLeft = true; break
			case 'KeyS': /*case 'ArrowDown':*/ moveBackward = true; break
			case 'KeyD': /*case 'ArrowRight':*/ moveRight = true; break
			case 'Space': moveUp = true; break
			case 'ShiftLeft': moveDown = true; break

		// Camera
			/*
			case 'ArrowUp': camera.rotation.x += 0.1; camera.updateProjectionMatrix(); break
			case 'ArrowLeft': camera.rotation.y += 0.1; camera.updateProjectionMatrix(); break
			case 'ArrowDown': camera.rotation.x -= 0.1; camera.updateProjectionMatrix(); break
			case 'ArrowRight': camera.rotation.y -= 0.1; camera.updateProjectionMatrix(); break
			*/
			case inputDecreaseCameraSpeed.value: cameraSpeed -= 8; break
			case inputIncreaseCameraSpeed.value: cameraSpeed += 8; break
			case inputResetCameraSpeed.value: cameraSpeed = 64.0; break
			case inputDecreaseCameraZoom.value: (event.altKey) ? cameraZoom(-.3) : cameraZoom(-.1); break
			case inputIncreaseCameraZoom.value: (event.altKey) ? cameraZoom(+.3) : cameraZoom(+.1); break
			case inputResetCameraZoom.value: cameraZoom(); break

		// Placement
			case inputPlaceCubes.value: placeCube(controls.getObject().position); break
			case inputRemoveCubes.value: breakCube(controls.getObject().position); break
			case inputToggleGrid.value: grid.visible = !grid.visible; break

		// Other
			case "Enter": controls.unlock(); inputChat.style.display = "flex"; inputChat.focus(); break
			case inputSettingsShortcut.value: controls.unlock(); settings.style.display = (settings.style.display == "flex") ? "none" : "flex"; break
			case inputPaletteRowScroll.value: colorSkip = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--palette-colors-in-row")) * -1; break
			case 'F1': uiCanvas.style.display = (uiCanvas.style.display=="flex") ? "none" : "flex"; break
			case 'F5': history.go(); break
			case 'KeyV': highlightCube(); break
		}
	}
};

const onKeyUp = event => {
	switch (event.code) {
		case 'KeyW': moveForward = false; break
		case 'KeyA': moveLeft = false; break
		case 'KeyS': moveBackward = false; break
		case 'KeyD': moveRight = false; break
		case 'Space': moveUp = false; break
		case 'ShiftLeft': moveDown = false; break
		case 'AltLeft': colorSkip = 1; break
	}
};

const onMouseDown = event => {
	if (nick && !inputDisablePR.checked && controls.isLocked) {
		switch (event.which) {
			case 1: breakCube(controls.getObject().position); break
			case 2: colorPicker(); break
			case 3: placeCube(controls.getObject().position); break
		}
	}
};

function cameraZoom(zoom) {
	camera.zoom += zoom;
	if (!zoom) camera.zoom = 0;
	if (camera.zoom < 1) camera.zoom = 1;
	if (camera.zoom > 8) camera.zoom = 8;
	camera.updateProjectionMatrix()
};

const canvas = document.getElementsByTagName("canvas")[0];
canvas.addEventListener('mousedown', onMouseDown);
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

function scrollToBottom(element) { element.scroll({ top: element.scrollHeight, behavior: 'smooth' }) };

// buttons make clicky sounds
const buttons = document.getElementsByTagName('button');
for (let i = 0; i < buttons.length; i++) {
	buttons[i].onmouseover = () => playAudio('ui/hover', !audioDisableUI.checked);
	buttons[i].onmousedown = () => playAudio('ui/click', !audioDisableUI.checked)
};

/* what is this supposed to be for? it's not used as far as i see */
// function regExp(str) { return /[a-zA-Z]/.test(str) };

let joyMovementXZ = new JoyStick('joyMovementXZDiv');
let joyMovementY = new JoyStick('joyMovementYDiv');
let joyCamera = new JoyStick('joyCameraDiv');

function render() {
	requestAnimationFrame(render);

	const delta = clock.getDelta();

	let joyMoveXZ = joyMovementXZ.GetDir();
	let joyMoveY = joyMovementY.GetDir();
	let joyCam = joyCamera.GetDir();
	let joyCamX = joyCamera.GetX();
	let joyCamY = joyCamera.GetY();

	if (verified) {
		if (joyMoveXZ.includes("N")) moveForward = true;
		if (joyMoveXZ.includes("W")) moveLeft = true;
		if (joyMoveXZ.includes("S")) moveBackward = true;
		if (joyMoveXZ.includes("E")) moveRight = true;
		if (joyMoveY.includes("N")) moveUp = true;
		if (joyMoveY.includes("S")) moveDown = true;

		if (joyCamY > 0) camera.rotation.x += (joyCamY / 48) * delta;
		if (joyCamX < 0) camera.rotation.y -= (joyCamX / 48) * delta;
		if (joyCamY < 0) camera.rotation.x += (joyCamY / 48) * delta;
		if (joyCamX > 0) camera.rotation.y -= (joyCamX / 48) * delta;

		camera.rotation.x = Math.max(-Math.PI/2, Math.min(Math.PI/2, camera.rotation.x)); // Enfore limit with mobile controls
		
		if (moveForward) velocity.z += cameraSpeed * delta;
		if (moveLeft) velocity.x -= cameraSpeed * delta;
		if (moveBackward) velocity.z -= cameraSpeed * delta;
		if (moveRight) velocity.x += cameraSpeed * delta;
		if (moveUp) velocity.y += cameraSpeed * delta;
		if (moveDown) velocity.y -= cameraSpeed * delta

		if (!controls.isLocked) {
			moveForward = false;
			moveLeft = false;
			moveBackward = false;
			moveRight = false;
			moveUp = false;
			moveDown = false
		}
	};

	if (controls.isLocked) {
		inputChat.style.display = "none";
		document.querySelector(":root").style.setProperty("--chat-maxheight", "200px")
	} else {
		inputChat.style.display = "flex";
		document.querySelector(":root").style.setProperty("--chat-maxheight", themeChatMaxHeight.value)
	};

	velocity.multiplyScalar(Math.pow(0.02, delta));

	controls.moveRight(velocity.x * delta);
	controls.moveForward(velocity.z * delta);
	controls.getObject().position.y += velocity.y * delta;

	let pos = controls.getObject().position;
	coords.innerText = "x: " + ~~(pos.x + 0.5) + " ╱ y: " + ~~(pos.y + 0.5) + " ╱ z: " + ~~(pos.z + 0.5);

	renderer.render(scene, camera)
};

render()