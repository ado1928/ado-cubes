class Config {
	constructor(defaults) {
		this.defaults = defaults;
		Object.entries(defaults).forEach(([key, value]) => {
			Object.defineProperty(this, key, {
				get() {
					return JSON.parse(localStorage.getItem(key)) ?? this.defaults[key];
				},
				set(val) {
					localStorage.setItem(key, JSON.stringify(val));
				}
			});
			if (!this[key] === undefined) this[key] = value;
		})
	}

	reset(key) {
		if (this.defaults[key] === undefined) return console.error(`config "${key}" does not exist`);
		return localStorage.removeItem(key);
	}
}

window.config = new Config({
	// General
	language: 'among-us',
	uiScale: 1,
	rendererPixelRatio: 1,
	chatWidth: 480,
	chatMaxLines: 24,
	enableRandomAndSpecialLogos: true,

	// Input
	placeCubes: 'KeyX',
	breakCubes: 'KeyC',
	highlightCube: 'KeyV',
	increaseCameraSpeed: 'BracketRight',
	decreaseCameraSpeed: 'BracketLeft',
	resetCameraSpeed: 'Backslash',
	increaseCameraZoom: 'Equal',
	decreaseCameraZoom: 'Minus',
	resetCameraZoom: 'Quote',
	toggleUi: 'F1',
	toggleGrid: 'KeyG',
	settingsShortcut: 'KeyL',
	keyModifier: (navigator.userAgent.match(/Firefox/i)) ? 'KeyZ' : 'AltLeft',
	invertMouseControlsForCubePlacement: false,

	// Audio
	musicVolume: 50,
	sfxVolume: 50,
	uiVolume: 50,
	coughingCubePlacementSounds: false,
	disableCubePlacementSounds: false,
	disablePaletteScrollSound: false,
	disableColorPickerSound: false,
	disableButtonSounds: false,
	disableMessageSounds: false,

	// Debug
	forceMobileAgent: false
});

console.log("config")