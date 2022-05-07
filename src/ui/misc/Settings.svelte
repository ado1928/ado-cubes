<script>
	import { onMount } from 'svelte';

	let notfunctional = "./images/icons/not functional.svg";
	let requiresrefresh = "./images/icons/requires refresh.svg";

	function HexToRGB(hex) {
		let r = parseInt(hex.slice(1, 3), 16);
		let g = parseInt(hex.slice(3, 5), 16);
		let b = parseInt(hex.slice(5, 7), 16);

		return `${r} ${g} ${b}`
	};

	onMount(async () => {
		function loadSettings() {
			let pref = JSON.parse(localStorage.getItem('settings'));
			let foo;
			for (let i = 0; i < Object.keys(pref).length; i++) {
				if (Object.values(pref)[i] == true || Object.values(pref)[i] == false) { foo = ".checked" } else { foo = ".value" };
				let input = Object.keys(pref)[i] + foo;
				let value = "pref." + Object.keys(pref)[i];
				eval(input = value)
			}
		}
		loadSettings()
	});

	let audioMusicVolume = "100";
	let audioSfxVolume = "100";
	let audioUiVolume = "100";

	function applySettings() {
		const storeSettings = {
			inputPlaceCubes: inputPlaceCubes.value,
			inputRemoveCubes: inputRemoveCubes.value,
			inputToggleGrid: inputToggleGrid.value,
			inputPaletteRowScroll: inputPaletteRowScroll.value,
			inputIncreaseCameraSpeed: inputIncreaseCameraSpeed.value,
			inputDecreaseCameraSpeed: inputDecreaseCameraSpeed.value,
			inputIncreaseCameraZoom: inputIncreaseCameraZoom.value,
			inputDecreaseCameraZoom: inputDecreaseCameraZoom.value,
			inputSettingsShortcut: inputSettingsShortcut.value,
			inputDisablePR: inputDisablePR.checked,

			audioMusicVolume: audioMusicVolume,
			audioSfxVolume: audioSfxVolume,
			audioUiVolume: audioUiVolume,
			audioEnableMusic: audioEnableMusic.checked,
			audioDisablePR: audioDisablePR.checked,

			miscEnableRandomLogos: miscEnableRandomLogos.checked,

			themeDisableBgBlur: themeDisableBgBlur.checked,
			themeDisableTextShadows: themeDisableTextShadows.checked
		};
		localStorage.setItem('settings', JSON.stringify(storeSettings));
		window.onload = function() { loadSettings() }
	};

	const onKeyDown = function(event) {
		surenot.value = event.code
	};

	window.onload = function() {
		notsure.addEventListener('keydown', onKeyDown);
	}
</script>

<div id="winSettings" class="box win">
	<slot/>
	<div style="overflow-y:scroll;height:calc(var(--innerHeight) - 128px)">
		<h2 style="margin:0">legend</h2>
		<div class="settingsSection">
			<img src={notfunctional}> - Not functional<br>
			<img src={requiresrefresh}> - Requires refresh<br>
			<button id="notsure">Click this button, and press any key</button>
			<input id="surenot" type="text">
		</div>

		<h2>general</h2>
		<div class="settingsSection"><img src={notfunctional}> Language
			<select id="generalLanguage">
				<option value="english">English</option>
				<option value="onlyEnglish">Only English.</option>
			</select>
		</div>

		<h2>input</h2>
		<div class="settingsSection">	
			<h3>movement</h3>
				<div><img src={notfunctional}> Movement method
					<select id="inputMovement" value="wasd">
						<option value="wasd">WASD</option>
						<option value="arrow">Arrows</option>
						<option value="both">Both</option>
						<option value="custom">Custom</option>
						<option value="customsecondary">Custom with secondary</option>
					</select>
					<div id="customMovement">
						<input id="inputMoveForward" type="text" value="KeyW">
						<input id="inputMoveLeft" type="text" value="KeyA">
						<input id="inputMoveDown" type="text" value="KeyS">
						<input id="inputMoveBackward" type="text" value="KeyD">
					</div>
					<div id="customSecondaryMovement">
						<input id="inputSecondaryMove" type="text" value="ArrowUp">
						<input id="inputSecondaryMove" type="text" value="ArrowLeft">
						<input id="inputSecondaryMove" type="text" value="ArrowDown">
						<input id="inputSecondaryMove" type="text" value="ArrowRight">
					</div>
				</div>
				<div>Move up <input id="inputMoveUp" type="text" value="Space"></div>
				<div>Move down <input id="inputMoveDown" type="text" value="ShiftLeft"></div>
			<h3>cube placing</h3>
				<div>Place cubes <input id="inputPlaceCubes" type="text" value="KeyX"></div>
				<div>Remove cubes <input id="inputRemoveCubes" type="text" value="KeyC"></div>
			<h3>camera</h3>
				<div>Increase camera speed <input id="inputIncreaseCameraSpeed" type="text" value="BracketRight"></div>
				<div>decrease camera speed <input id="inputDecreaseCameraSpeed" type="text" value="BracketLeft"></div>
				<div>Reset camera speed <input id="inputResetCameraSpeed" type="text" value="Backslash"></div>
				<div>Increase camera zoom <input id="inputIncreaseCameraZoom" type="text" value="Equal"></div>
				<div>Decrease camera zoom <input id="inputDecreaseCameraZoom" type="text" value="Minus"></div>
				<div>Reset camera zoom <input id="inputResetCameraZoom" type="text" value="Quote"></div>
			<h3>other</h3>
				<div>Toggle grid <input id="inputToggleGrid" type="text" value="KeyG"></div>
				<div>Palette row scroll <input id="inputPaletteRowScroll" type="text" value="AltLeft"></div>
				<div>Settings shortcut <input id="inputSettingsShortcut" type="text" value="KeyL"></div>
				<div>Disable mouse place and remove <input id="inputDisablePR" type="checkbox"></div>
		</div>

		<h2>audio</h2>
		<div class="settingsSection">
			<div><img src={notfunctional}> Music {audioMusicVolume} <input id="musicVolume" class="slider" type="range" bind:value={audioMusicVolume}></div>
			<div><img src={notfunctional}> SFX {audioSfxVolume} <input id="sfxVolume" class="slider" type="range" bind:value={audioSfxVolume}></div>
			<div><img src={notfunctional}> UI {audioUiVolume} <input id="uiVolume" class="slider" type="range" bind:value={audioUiVolume}></div>

			<div><img src={requiresrefresh}> Enable music <input id="audioEnableMusic" type="checkbox"></div>
			<div>Disable place and remove sounds <input id="audioDisablePR" type="checkbox"></div>
			<div>Disable UI sounds <input id="audioDisableUI" type="checkbox"></div>
		</div>

		<h2>performance</h2>
		<div class="settingsSection">
			<div><img src={notfunctional}> Enable clouds <input id="prfmEnableClouds" type="checkbox"></div>
		</div>

		<h2>miscellaneous</h2>
		<div class="settingsSection">
			<div><img src={requiresrefresh}> Enable random logos in welcome <input id="miscEnableRandomLogos" type="checkbox"></div>
		</div>

		<h2>appearance</h2>
		<div class="settingsSection">
			<div><strong>note: </strong>Blur does not properly work in Firefox</div>
			<div><img src={notfunctional}> Disable background blur <input id="themeDisableBgBlur" type="checkbox"></div>
			<div><img src={notfunctional}> Disable text shadows <input id="themeDisableTextShadows" type="checkbox"></div>
		</div>
	</div>
	<button>Button</button> <button id="applySettings" on:click={applySettings}>Apply</button> <button onclick="history.go(0)">Refresh</button> <button>Button</button>
</div>