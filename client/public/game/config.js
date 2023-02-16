class Config {
	constructor(defaults) {
		this.defaults = defaults;
		Object.entries(defaults).forEach(([key, value]) => {
			Object.defineProperty(this, key, {
				get() {
					return JSON.parse(localStorage.getItem(key)) ?? undefined
				},
				set(val) {
					localStorage.setItem(key, JSON.stringify(val))
				}
			});
			if (this[key] === undefined) this[key] = value;
		})
	}

	reset(key) {
		if (this.defaults[key] === undefined) return console.error(`config "${key}" does not exist`);
		return localStorage.setItem(key, JSON.stringify(this.defaults[key]));
	}
}

export const config = new Config({
	cubeType: 'basic',
	buildingMethod: 'raycast',
	movementMethod: 'fly',

	// General
	language: 'among-us',
	uiScale: 1,
	rendererPixelRatio: 1,
	chatWidth: 440,
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
	keyModifier: (navigator.userAgent.match(/Firefox/i)) ? 'KeyZ' : 'LeftAlt',
	keyModifierFirefox: 'KeyZ',
	invertMouseControlsForCubePlacement: false,

	// Audio
	musicVolume: 50,
	sfxVolume: 50,
	uiVolume: 50,
	disableCubePlacementSounds: false,
	disablePaletteScrollSound: false,
	disableColorPickerSound: false,
	disableButtonSounds: false,
	disableMessageSounds: false,

	// Debug
	forceMobileAgent: false
})