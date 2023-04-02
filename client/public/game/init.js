window.socket = io().disconnect();

let vars = {
	world: {},

	cubeType: 'basic',
	buildingMethod: 'raycast',
	movementMethod: 'fly',
	showGrid: true,
}

window.game = new Proxy(vars, {
	set(target, key, value) {
		target[key] = value;
		document.dispatchEvent(new Event('game'));
		return true;
	}
});

console.log("%ci did the init", 'font-size:16px');