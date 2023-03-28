window.socket = io().disconnect();

let vars = {
	cubeType: 'basic',
	buildingMethod: 'raycast',
	movementMethod: 'fly',
	showGrid: true
}

window.game = new Proxy(vars, {
	set(target, key, value) {
		target[key] = value;
		document.dispatchEvent(new Event('game'));
		console.log(`${key} set to ${value}`);
		return true;
	}
})

console.log("%ci did the init", 'font-size:16px');