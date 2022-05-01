<script>
	import { onMount } from 'svelte';

	function HexToRGB(hex) {
		let r = parseInt(hex.slice(1, 3), 16);
		let g = parseInt(hex.slice(3, 5), 16);
		let b = parseInt(hex.slice(5, 7), 16);

		return `${r} ${g} ${b}`
	}

	// haha i suck at this.

	onMount(async () => {
		function loadSettings() {
			let pref = JSON.parse(localStorage.getItem('settings'));

			inputPlaceCubes = pref.inputPlaceCubes;
			inputRemoveCubes = pref.inputRemoveCubes;
			inputToggleGrid = pref.inputToggleGrid;
			inputPaletteRowScroll = pref.inputPaletteRowScroll;
			inputSettingsShortcut = pref.inputSettingsShortcut;
			inputDisablePR.checked = pref.inputDisablePR;

			audioMasterVolume = pref.audioMasterVolume;
			audioMusicVolume = pref.audioMusicVolume;
			audioSfxVolume = pref.audioSfxVolume;
			audioUiVolume = pref.audioUiVolume;
			audioEnableMusic.checked = pref.audioEnableMusic;
			audioDisablePR.checked = pref.audioDisablePR;

			miscEnableRandomLogos.checked = pref.miscEnableRandomLogos;

			themeDisableTextShadows.checked = pref.themeDisableTextShadows;
		};
		loadSettings();
	});

	let inputPlaceCubes = "KeyX";
	let inputRemoveCubes = "KeyC";
	let inputToggleGrid = "KeyG";
	let inputPaletteRowScroll = "AltLeft";
	let inputSettingsShortcut = "KeyL";

	let audioMasterVolume = 100;
	let audioMusicVolume = 100;
	let audioSfxVolume = 100;
	let audioUiVolume = 100;

	function applySettings() {
		const storeSettings = {
			inputPlaceCubes: inputPlaceCubes,
			inputRemoveCubes: inputRemoveCubes,
			inputToggleGrid: inputToggleGrid,
			inputPaletteRowScroll: inputPaletteRowScroll,
			inputSettingsShortcut: inputSettingsShortcut,
			inputDisablePR: inputDisablePR.checked,

			audioMasterVolume: audioMasterVolume,
			audioMusicVolume: audioMusicVolume,
			audioSfxVolume: audioSfxVolume,
			audioUiVolume: audioUiVolume,
			audioEnableMusic: audioEnableMusic.checked,
			audioDisablePR: audioDisablePR.checked,

			miscEnableRandomLogos: miscEnableRandomLogos.checked,

			themeDisableTextShadows: themeDisableTextShadows.checked
		};
		localStorage.setItem('settings', JSON.stringify(storeSettings));
		window.onload = function() { loadSettings() }
	}


</script>

<div id="winSettings" class="box win center">
	<slot/>
	<div style="overflow-y:scroll;height:80%;">
		<h2 style="margin:0">Legend</h2>
		<img src="./images/icons/not functional.svg"> - Not functional<br>
		<img src="./images/icons/requires refresh.svg"> - Requires refresh

		<h2>General</h2>
		<div><img src="./images/icons/not functional.svg"> Language
			<select id="generalLanguage">
				<option value="english">English</option>
				<option value="onlyEnglish">Only English.</option>
			</select>
		</div>

		<h2>Input</h2>
		<div><img src="./images/icons/not functional.svg"> Movement
			<select id="inputMovement" value="wasd">
				<option value="wasd">WASD</option>
				<option value="arrow">Arrow keys</option>
				<option value="custom">Custom</option>
			</select>
			<!-- <div id="customMovement">
				<input type="text" value="KeyW">
				<input type="text" value="KeyA">
				<input type="text" value="KeyS">
				<input type="text" value="KeyD">
			</div> -->
		</div>
		<div>Place cubes <input id="inputPlaceCubes" type="text" bind:value={inputPlaceCubes}></div>
		<div>Remove cubes <input id="inputRemoveCubes" type="text" bind:value={inputRemoveCubes}></div>
		<div>Toggle grid <input id="inputToggleGrid" type="text" bind:value={inputToggleGrid}></div>
		<div>Palette row scroll <input id="inputPaletteRowScroll" type="text" bind:value={inputPaletteRowScroll}></div>
		<div>Settings shortcut <input id="inputSettingsShortcut" type="text" bind:value={inputSettingsShortcut}></div>
		<div>Disable mouse place and remove <input id="inputDisablePR" type="checkbox"></div>

		<h2>Audio</h2>
		<div><img src="./images/icons/not functional.svg"> Master {audioMasterVolume} <input id="masterVolume" class="slider" type="range" bind:value={audioMasterVolume}></div>
		<div><img src="./images/icons/not functional.svg"> Music {audioMusicVolume} <input id="musicVolume" class="slider" type="range" bind:value={audioMusicVolume}></div>
		<div><img src="./images/icons/not functional.svg"> SFX {audioSfxVolume} <input id="sfxVolume" class="slider" type="range" bind:value={audioSfxVolume}></div>
		<div><img src="./images/icons/not functional.svg"> UI {audioUiVolume} <input id="uiVolume" class="slider" type="range" bind:value={audioUiVolume}></div>

		<div><img src="./images/icons/requires refresh.svg"> Enable music <input id="audioEnableMusic" type="checkbox"></div>
		<div>Disable place and remove sounds <input id="audioDisablePR" type="checkbox"></div>
		<div>Disable UI sounds <input id="audioDisableUI" type="checkbox"></div>

		<h2>Performance</h2>
		<div><img src="./images/icons/not functional.svg"> Enable clouds <input id="prfmEnableClouds" type="checkbox"></div>

		<h2>Miscellaneous</h2>
		<div><img src="./images/icons/requires refresh.svg"> Enable random logos in welcome <input id="miscEnableRandomLogos" type="checkbox"></div>

		<h2>Theme</h2>
		<div><strong>NOTE:</strong> Blur does not properly work in Firefox</div>
		<div style="background:#000;height:130px;width:-moz-available;width:-webkit-fill-available"></div>
		<input type="file">
		<div>Disable text shadows <input id="themeDisableTextShadows" type="checkbox"></div>
	</div>
	<button id="applySettings" on:click={applySettings}>Apply</button>
</div>