import * as THREE from 'three';
import { PointerLockControls } from "/game/jsm/controls/PointerLockControls.js";

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
const controls = new PointerLockControls(camera, renderer.domElement)

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

let geometry, material, grid, pos

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

// should be togglable
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
		winControls.style.display = "none";
		winCredits.style.display = "none";
	}
});

//controls.addEventListener('lock', function () {menu.style.display = 'none';});
//controls.addEventListener('unlock', function () {menu.style.display = 'block';});
scene.add(controls.getObject());

const direction = new THREE.Vector3();
const velocity = new THREE.Vector3();

window.addEventListener('resize', onWindowResize);
function onWindowResize() {
	camera.aspect = window.innerWidth / window.innerHeight;
	camera.updateProjectionMatrix();
	renderer.setSize(window.innerWidth, window.innerHeight);
};

const loader = new THREE.CubeTextureLoader();
const texture = loader.load([
	'/game/sky/Daylight Box_Right.bmp',
	'/game/sky/Daylight Box_Left.bmp',
	'/game/sky/Daylight Box_Top.bmp',
	'/game/sky/Daylight Box_Bottom.bmp',
	'/game/sky/Daylight Box_Front.bmp',
	'/game/sky/Daylight Box_Back.bmp',
]);
scene.background = texture

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

let socket = io();

let raycastPlacement = true
placeAtRaycast.onclick = function () {
	raycastPlacement = true;
	crosshair.style.display = "block";
}
placeInCamera.onclick = function () {
	raycastPlacement = false;
	crosshair.style.display = "none";
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
				pos.multiplyScalar(0.5);
				pos.add(intersect.point);
				socket.emit("place", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)], "color" : color});
			} else {
				pos.add(intersect.object.position)
				pos.add(intersect.face.normal)
				console.log(pos)
				socket.emit("place", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)] , "color" : color});
			}
		}
	} else {
		socket.emit("place", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)] , "color" : color});
	}
}

function breakCube(pos) {
	if (raycastPlacement) {
		raycaster.setFromCamera({ "x": 0.0, "y": 0.0 }, camera);

		const intersects = raycaster.intersectObjects(scene.children);

		if (intersects.length > 0) {
			const intersect = intersects[0];
			let pos = new THREE.Vector3();
			pos.add(intersect.object.position)
			console.log(pos)
			socket.emit("break", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)] });
		}
	} else {
		socket.emit("break", { "pos": [~~(pos.x + 0.5), ~~(pos.y + 0.5), ~~(pos.z + 0.5)] });
	}
}

let cubes = [];


let colors = document.getElementById("palette").children;
let color = 0

function updateColor() {
	color = (color % colors.length + colors.length) % colors.length;
	for (let i = 0; i < colors.length; i++) {
		colors[i].className = "";
	}
	colors[color].className = "selectedbox"
}
updateColor();

for (let i = 0; i < colors.length; i++) {
	console.log(colors[i]);
	colors[i].onclick = function () {
		color = i;
		updateColor();
	}
}

window.onwheel = function (event) {
	if (event.deltaY > 0) { color -= 1 }
	else if (event.deltaY < 0) { color += 1 }
	updateColor();
}

let materials = []
for(var i = 0; i < colors.length; i++) {
	materials[i] = new THREE.MeshStandardMaterial({ color: colors[i].style.backgroundColor })
}

geometry = new THREE.BoxGeometry(1, 1, 1);


function addCube(pos, col) {
	let cube = new THREE.Mesh(geometry, materials[col], 100);
	cube.position.set(pos.x, pos.y, pos.z);
	cube.receiveShadow = true;
	cube.castShadow = true;
	cubes.push(cube)
	scene.add(cube);
	sun.shadow.needsUpdate = true;
}

function removeCube(pos) {
	cubes.forEach(e => {
		if (~~e.position.x == ~~pos.x && ~~e.position.y == ~~pos.y && ~~e.position.z == ~~pos.z) {
			scene.remove(e)
		}
	});
	sun.shadow.needsUpdate = true;
}

function escapeHTML(unsafe) {
	return unsafe
		.replace(/&/g, "&amp;")
		.replace(/</g, "&lt;")
		.replace(/>/g, "&gt;")
		.replace(/"/g, "&quot;")
		.replace(/'/g, "&#039;");
}

let nick = "";
let verified = false;
if (verified) {
	noNeedToVerify.style.display = "block"
}

inputUsername.onkeydown = function (input) {
	if (input.key == "Enter" && inputUsername.value !== "") {
		if (!verified) {
			captchaPlease.style.display = "block";
		} else {
			nick = inputUsername.value;
			winWelcome.style.display = "none";
			uiCanvas.style.display = "block";
			socket.emit("message", { "message": "has joined the game!", "sender": nick });
		}
	}
};

inputChat.onkeydown = function (chanter) {
	if (chanter.key == "Enter" && nick !== "" && inputChat.value !== "") {
		socket.emit("message", { "message": inputChat.value, "sender": "<" + nick + "> " });
		inputChat.value = "";
	}
};

function scrollToBottom(element) {
	element.scroll({ top: element.scrollHeight, behavior: 'smooth' });
}

export function verify(uuid) {
	socket = io({ extraHeaders: { "uuid": uuid } });
	verified = true;
	socket.on('message', function (data) {
		messages.insertAdjacentHTML('beforeend', "<b>" + escapeHTML(data["sender"]) + "</b> " + escapeHTML(data["message"]) + "<br>")
		scrollToBottom(messages);
	});

	socket.on('connected', function (arr) {
		console.log(arr);
		window.arr = arr;
		cubes.forEach(e => {scene.remove(e)});
		for (let x = 0; x < 64; x++) {
			for (let y = 0; y < 64; y++) {
				for (let z = 0; z < 64; z++) {
					if (arr[x][y][z] > 0) {
						addCube({ "x": x, "y": y, "z": z }, arr[x][y][z] - 1);
					}
				}
			}
		};
	});

	socket.on('place', function (data) {
		let pos = data.pos;
		addCube(new THREE.Vector3(pos[0], pos[1], pos[2]), data.color);

		//fancy block illumination, do not uncomment unless you want framerate to die
		/*const bl = new THREE.PointLight( colors[data.color].style.backgroundColor, 0.4, 1.5 );
		bl.position.set(pos[0], pos[1], pos[2]);
		bl.castShadow = false;
		console.log(bl);
		scene.add( bl );*/
	});

	socket.on('break', function (data) {
		let pos = data.pos;
		removeCube(new THREE.Vector3(pos[0], pos[1], pos[2]));
	});
};

window.verify = verify;

// bypass captcha in debug
// verify()

let cameraSpeed = 64.0;

let moveForward = false;
let moveBackward = false;
let moveLeft = false;
let moveRight = false;
let moveUp = false;
let moveDown = false;

const onKeyDown = function (event) {
	if (document.activeElement.tagName !== "INPUT" && nick !== "") {
		switch (event.code) {
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
			case "KeyG":
				grid.visible = !grid.visible;
				break;
			case "KeyX":
				placeCube(controls.getObject().position);
				break;
			case "KeyC":
				breakCube(controls.getObject().position);
				break;
			case "Enter":
				controls.unlock();
				inputChat.focus();
				break;
			case "KeyL":
				winSettings.style.display = "block";
				break;
			case "BracketLeft":
				cameraSpeed = cameraSpeed - 8;
				break;
			case "BracketRight":
				cameraSpeed = cameraSpeed + 8;
				break;
			case "Backslash":
				cameraSpeed = 64.0;
				break;
			case "KeyO":
				uiCanvas.style.display = (uiCanvas.style.display=="block") ? "none" :"block";
				break;
		}
	}
};

const onKeyUp = function (event) {
	switch (event.code) {
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
const onMouseDown = (event) => {
    switch (event.which){
        case 1:
            breakCube(controls.getObject().position);
            break;
        case 3:
            placeCube(controls.getObject().position);
            break;
    }
}

document.addEventListener("mousedown", onMouseDown);
document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

function render() {
	requestAnimationFrame(render)
	const delta = clock.getDelta();

	velocity.x *= 0.9;
	velocity.z *= 0.9;
	velocity.y *= 0.9;

	if (verified) {
		if (moveForward) velocity.z += cameraSpeed * delta;
		if (moveBackward) velocity.z -= cameraSpeed * delta;
		if (moveRight) velocity.x += cameraSpeed * delta;
		if (moveLeft) velocity.x -= cameraSpeed * delta;
		if (moveUp) velocity.y += cameraSpeed * delta;
		if (moveDown) velocity.y -= cameraSpeed * delta;
	};

	controls.moveRight(velocity.x * delta);
	controls.moveForward(velocity.z * delta);
	controls.getObject().position.y += velocity.y * delta;

	let pos = controls.getObject().position;

	document.getElementById("coords").innerText = "x: " + ~~(pos.x + 0.5) + ", y: " + ~~(pos.y + 0.5) + ", z: " + ~~(pos.z + 0.5);

	renderer.render(scene, camera);
}
render();