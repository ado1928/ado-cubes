import * as THREE from 'three';
import { PointerLockControls } from "/game/jsm/controls/PointerLockControls.js";
import * as BufferGeometryUtils from '/game/jsm/utils/BufferGeometryUtils.js';
let socket = io();

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

document.body.appendChild(renderer.domElement);

const camera = new THREE.PerspectiveCamera(70, window.innerWidth / window.innerHeight, 0.1, 500);
camera.position.set(2, 2, 2);
camera.lookAt(64, 32, 64);
const clock = new THREE.Clock();
const scene = new THREE.Scene();
const controls = new PointerLockControls(camera, renderer.domElement);

let worlds = [];

let vert = `
varying vec2 vUv;

void main() {
	vUv = uv;
	vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
	gl_Position = projectionMatrix * mvPosition;
}`

let frag = `
uniform sampler2D colorTexture;

varying vec2 vUv;

void main(void) {
	vec4 color = vec4(0.0, 0.0, 0.0, 0.1);

	if(mod(vUv.x + 0.005 / 2.0, 1.0/2.0) * 2.0 < 0.01) {
		color = vec4(0.1, 0.25, 1.0, 0.5);
	}

	else if(mod(vUv.y + 0.005 / 2.0, 1.0/2.0) * 2.0 < 0.01) {
		color = vec4(0.1, 0.25, 1.0, 0.5);
	}

	else if(mod(vUv.x + 0.02 / 16.0, 1.0/16.0) * 16.0 < 0.04) {
		color = vec4(0.1, 0.25, 1.0, 0.5);
	}

	else if(mod(vUv.y + 0.02 / 16.0, 1.0/16.0) * 16.0 < 0.04) {
		color = vec4(0.1, 0.25, 1.0, 0.5);
	}

	else if(mod(vUv.x + 0.025 / 64.0, 1.0/64.0) * 64.0 < 0.05) {
		color = vec4(0.1, 0.25, 1.0, 0.5);
	}

	else if(mod(vUv.y + 0.025 / 64.0, 1.0/64.0) * 64.0 < 0.05) {
		color = vec4(0.1, 0.25, 1.0, 0.5);
	}

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

// should be togglable in settings
let ground = new THREE.Mesh(geometry, material);
ground.position.set(0, -0.51, 0)
ground.rotateX(- Math.PI / 2);
ground.receiveShadow = true;
ground.renderOrder = -1
ground.material.depthTest = false;
ground.material.depthWrite = false;
scene.add(ground);

let raycaster = new THREE.Raycaster();

renderer.domElement.addEventListener('click', function () {
	if (nick !== "") {
		controls.lock();
		esc.style.display = "none";
		winSettings.style.display = "none";
		winCredits.style.display = "none";

	}
})

scene.add(controls.getObject());

const direction = new THREE.Vector3();
const velocity = new THREE.Vector3();

window.addEventListener('resize', onWindowResize);

function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
	document.documentElement.style.setProperty("--innerHeight", window.innerHeight + "px")
}
document.documentElement.style.setProperty("--innerHeight", window.innerHeight + "px")

const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
	'/game/sky/Daylight Box_Right.png',
	'/game/sky/Daylight Box_Left.png',
	'/game/sky/Daylight Box_Top.png',
	'/game/sky/Daylight Box_Bottom.png',
	'/game/sky/Daylight Box_Front.png',
	'/game/sky/Daylight Box_Back.png'
])
scene.background = texture;

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

const dlight = new THREE.DirectionalLight(0xffffff, 0.2);
dlight.position.set(0.3, 0.6, 0.5);
dlight.castShadow = false;
scene.add(dlight);

const dlight2 = new THREE.DirectionalLight(0xffffff, 0.15);
dlight2.position.set(-0.3, 0.6, -0.2);
dlight2.castShadow = false;
scene.add(dlight2);

const light = new THREE.AmbientLight(0x606070);
scene.add(light);

function playAudio(url) {
	let playit = new Audio(url);
	playit.play();
}

let raycastPlacement = true
placeAtRaycast.onclick = function () {
	raycastPlacement = true;
	crosshair.style.display = "block"
}
placeInCamera.onclick = function () {
	raycastPlacement = false;
	crosshair.style.display = "none"
}

function placeCube(pos) {
	if (raycastPlacement) {
		raycaster.setFromCamera({ "x": 0.0, "y": 0.0 }, camera);
		const intersects = raycaster.intersectObjects(scene.children);
		if (intersects.length > 0) {
			const intersect = intersects[0];
			let pos = new THREE.Vector3();
			if (intersect.object == grid) {
				pos.sub(intersect.face.normal);
			} else {
				pos.add(intersect.face.normal)
			};
			pos.multiplyScalar(0.5);
			pos.add(intersect.point)
			//console.log(pos)
			socket.emit("place", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)], "color": color });
		}
	} else {
		socket.emit("place", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)], "color": color })
	}
	if (!audioDisablePR.checked) { playAudio('./audio/sfx/place.ogg'); }
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
	} else {
		socket.emit("break", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)] })
	};
	if (!audioDisablePR.checked) { playAudio('./audio/sfx/remove.ogg') }
}

let cubes = [];

let colors = document.getElementById("palette").children;
let color = 0;

function updateColor() {
	color = (color % colors.length + colors.length) % colors.length;
	for (let i = 0; i < colors.length; i++) { colors[i].className = "" };
	colors[color].className = "selectedbox"
}
updateColor();

for (let i = 0; i < colors.length; i++) {
	// console.log(colors[i]);
	colors[i].onclick = function () {
		color = i;
		updateColor()
	}
}

let colorSkip = 1;

window.onwheel = function (event) {
	if (controls.isLocked) {
		if (event.deltaY > 0) { color -= colorSkip }
		else if (event.deltaY < 0) { color += colorSkip };
		playAudio('./audio/ui/palette scroll.ogg');
		updateColor()
	}
}

let materials = []
for (var i = 0; i < colors.length; i++) {
	materials[i] = new THREE.MeshStandardMaterial({ color: colors[i].style.backgroundColor })
}

geometry = new THREE.BoxGeometry(1, 1, 1);

let geometries = []
for(var i = 0; i < colors.length; i++) {
	geometries[i] = [];
}

function addCube(pos, col) {
	let cube = new THREE.Mesh(geometry, materials[col], 100);
	cube.position.set(pos.x, pos.y, pos.z);
	cube.receiveShadow = true;
	cube.castShadow = true;
	cube.col = col;
	cubes.push(cube);

	const matrix = new THREE.Matrix4();
	matrix.compose(pos, new THREE.Quaternion(1, 0, 0, 0), new THREE.Vector3(1, 1, 1));
	const instanceGeometry = geometry.clone();
	instanceGeometry.applyMatrix4(matrix);
	cube.igeometry = instanceGeometry;
	geometries[col].push(instanceGeometry)
}

function removeCube(pos) {
	// console.log(pos);
	for (var i = 0; i < cubes.length; i++) {
		let e = cubes[i];
		if (~~e.position.x == ~~(pos.x + 0.5) && ~~e.position.y == ~~(pos.y + 0.5) && ~~e.position.z == ~~(pos.z + 0.5)) {
			let c = cubes.splice(i, 1)[0];
			for (var j = 0; j < geometries[e.col].length; j++) {
				if (c.igeometry.id == geometries[e.col][j].id) {
					geometries[e.col].splice(j, 1);
					updateWorld(e.col);
					sun.shadow.needsUpdate = true;
					return
				}
			}
		}
	}
}

function escapeHTML(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;")
		.replace(/`/g, "&#96;")
}

let nick = "";
let verified = false;

inputUsername.onkeydown = function (input) {
	if (input.key == "Enter" && inputUsername.value !== "") {
		if (!verified) {
			captchaPlease.style.display = "block"
		} else {
			nick = inputUsername.value;
			winWelcome.style.display = "none";
			uiCanvas.style.display = "block";
			socket.emit("serverMessage", { "message":  nick + " has joined the server!" })
		}
	}
}

inputChat.onkeydown = function (chanter) {
	if (chanter.key == "Enter" && nick !== "" && inputChat.value !== "") {
		socket.emit("message", { "message": inputChat.value, "sender": nick });
		inputChat.value = ""
	}
}

function scrollToBottom(element) {
	element.scroll({ top: element.scrollHeight, behavior: 'smooth' })
}

function initWorld(col) {
	if (worlds[col] instanceof THREE.Mesh) {
		scene.remove(worlds[col])
		worlds[col].geometry.dispose()
		worlds[col].material.dispose()
		worlds[col] = undefined;
	}

	let mergedGeometry;

	if (geometries[col].length > 0) {
		mergedGeometry = BufferGeometryUtils.mergeBufferGeometries(geometries[col]);
	}
		
	worlds[col] = new THREE.Mesh(mergedGeometry, materials[col])
	worlds[col].castShadow = true;
	worlds[col].receiveShadow = true;
	scene.add(worlds[col]);
	sun.shadow.needsUpdate = true;
}

function updateWorld(col) {
	if(geometries[col].length > 0) {
		worlds[col].geometry.dispose();
		worlds[col].geometry = BufferGeometryUtils.mergeBufferGeometries(geometries[col]);
	} else {
		worlds[col].geometry = new THREE.BufferGeometry();
	}
}

export function verify(uuid) {
	socket = io({ extraHeaders: { "uuid": uuid } });
	verified = true;
	socket.on('message', function (data) {
		messages.insertAdjacentHTML('beforeend', "<b>" + escapeHTML(data["sender"]) + ":</b> " + escapeHTML(data["message"]) + "<br>")
		scrollToBottom(messages);
		playAudio('./audio/ui/message.ogg')
	});

	socket.on('serverMessage', function (data) {
		messages.insertAdjacentHTML('beforeend', escapeHTML(data["message"]) + "<br>");
		scrollToBottom(messages);
		playAudio('./audio/ui/server message.ogg');
	});

	socket.on('connected', function (arr) {
		const view = new Uint8Array(arr);
		// console.log(view);
		window.arr = view;
		cubes.forEach(e => { scene.remove(e) });
		for (let x = 0; x < 64; x++) {
			for (let y = 0; y < 64; y++) {
				for (let z = 0; z < 64; z++) {
					if (view[x*4096+y*64+z] > 0) {
						addCube({ "x": x, "y": y, "z": z }, view[x*4096+y*64+z] - 1);
					}
				}
			}
		};
		for (var i = 0; i < colors.length; i++) {
			initWorld(i)
		}
	});

	socket.on('place', function (data) {
		let pos = data.pos;

		addCube(new THREE.Vector3(pos[0], pos[1], pos[2]), data.color);

		updateWorld(data.color)
		// fancy block illumination, do not uncomment unless you want framerate to die
		/*
		const bl = new THREE.PointLight( colors[data.color].style.backgroundColor, 0.4, 1.5 );
		bl.position.set(pos[0], pos[1], pos[2]);
		bl.castShadow = false;
		scene.add(bl);
		*/
		
	});

	socket.on('break', function (data) {
		let pos = data.pos;
		removeCube(new THREE.Vector3(pos[0], pos[1], pos[2]))
	})
}

window.verify = verify;

// bypass captcha in debug
verify()

let cameraSpeed = 64.0;
let cameraZoom = 70;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

function updateCameraZoom() {
	if (cameraZoom < 10) { cameraZoom = 10 }
	else if (cameraZoom > 70) { cameraZoom = 70 };
	camera.fov = cameraZoom;
	camera.updateProjectionMatrix()
};

const onKeyDown = function (event) {
	if (document.activeElement.tagName !== "INPUT" && nick !== "" && controls.isLocked) {
		switch (event.code) {
			case 'ArrowUp':
			case 'KeyW':
				moveForward = true;
				break
			case 'ArrowLeft':
			case 'KeyA':
				moveLeft = true;
				break
			case 'ArrowDown':
			case 'KeyS':
				moveBackward = true;
				break
			case 'ArrowRight':
			case 'KeyD':
				moveRight = true;
				break
			case 'Space':
				moveUp = true;
				break
			case 'ShiftLeft':
				moveDown = true;
				break
			case inputPlaceCubes.value:
				placeCube(controls.getObject().position);
				break
			case inputRemoveCubes.value:
				breakCube(controls.getObject().position);
				break
			case inputToggleGrid.value:
				grid.visible = !grid.visible;
				break
			case "Enter":
				controls.unlock();
				inputChat.focus();
				break
			case inputSettingsShortcut.value:
				winSettings.style.display = (winSettings.style.display=="block") ? "none":"block";
				break
			case inputDecreaseCameraSpeed.value:
				cameraSpeed = cameraSpeed - 8;
				break
			case inputIncreaseCameraSpeed.value:
				cameraSpeed = cameraSpeed + 8;
				break
			case inputResetCameraSpeed.value:
				cameraSpeed = 64.0;
				break
			case inputDecreaseCameraZoom.value:
				cameraZoom = cameraZoom + 1;
				updateCameraZoom()
				break
			case inputIncreaseCameraZoom.value:
				cameraZoom = cameraZoom - 1;
				updateCameraZoom();
				break
			case inputResetCameraZoom.value:
				cameraZoom = 70;
				updateCameraZoom();
				break
			case 'KeyO':
				uiCanvas.style.display = (uiCanvas.style.display=="block") ? "none":"block";
				break
			case inputPaletteRowScroll.value:
				colorSkip = -5;
				// colorSkip = getComputedStyle(document.documentElement).getPropertyValue("--palette-colors-in-row");
				break
		}
	}
};

const onKeyUp = function (event) {
	switch (event.code) {
		case 'ArrowUp':
		case 'KeyW':
			moveForward = false;
			break
		case 'ArrowLeft':
		case 'KeyA':
			moveLeft = false;
			break
		case 'ArrowDown':
		case 'KeyS':
			moveBackward = false;
			break
		case 'ArrowRight':
		case 'KeyD':
			moveRight = false;
			break
		case 'Space':
			moveUp = false;
			break
		case 'ShiftLeft':
			moveDown = false;
			break
		case 'AltLeft':
			colorSkip = 1;
			break;
	}
};

const onMouseDown = (event) => {
	if (nick !== "" && !inputDisablePR.checked && controls.isLocked) {
	   	switch (event.which) {
			case 1:
				breakCube(controls.getObject().position);
				break
			case 3:
				placeCube(controls.getObject().position);
				break
		}
	}
};


const canvas = document.getElementsByTagName("canvas")[0];

canvas.addEventListener('mousedown', onMouseDown);
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

const buttons = document.getElementsByTagName('button');

for (let i = 0; i < buttons.length; i++) {
	buttons[i].onmouseover = function() { if (!audioDisableUI.checked) { playAudio('./audio/ui/hover.ogg') } };
	buttons[i].onmousedown = function() { if (!audioDisableUI.checked) { playAudio('./audio/ui/click.ogg') } };
};

function render() {
	requestAnimationFrame(render);

	const delta = clock.getDelta();

	if (verified) {
		if (moveForward) velocity.z += cameraSpeed * delta;
		if (moveBackward) velocity.z -= cameraSpeed * delta;
		if (moveRight) velocity.x += cameraSpeed * delta;
		if (moveLeft) velocity.x -= cameraSpeed * delta;
		if (moveUp) velocity.y += cameraSpeed * delta;
		if (moveDown) velocity.y -= cameraSpeed * delta
	};
	
	// this is probably not a good way to do it
	if (verified && !controls.isLocked) {
		moveForward = false;
		moveLeft = false;
		moveBackward = false
		moveRight = false;
		moveUp = false;
		moveDown = false
	};

	velocity.multiplyScalar(Math.pow(0.02, delta));

	controls.moveRight(velocity.x * delta);
	controls.moveForward(velocity.z * delta);
	controls.getObject().position.y += velocity.y * delta;

	let pos = controls.getObject().position;

	// this should be updated when pos is changed, not always
	document.getElementById("coords").innerText = "x: " + ~~(pos.x + 0.5) + " ╱ y: " + ~~(pos.y + 0.5) + " ╱ z: " + ~~(pos.z + 0.5);

	renderer.render(scene, camera)
};

render()
