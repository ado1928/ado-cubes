<script>
	import { onMount } from 'svelte';

	let nonFunctional = "./images/icons/non-functional.svg";
	let refresh = "./images/icons/refresh.svg";

	onMount(() => {
		/*function loadSettings() {
			let pref = JSON.parse(localStorage.getItem('settings'));
			for (let i = 0; i < Object.keys(pref).length; i++) {
				console.log(Object.keys(pref)[i] + " = " + Object.values(pref)[i]);
				if (Object.values(pref)[i] == (true || false)) {
					document.getElementById(Object.keys(pref)[i]).checked = Object.values(pref)[i]
				} else {
					document.getElementById(Object.keys(pref)[i]).value = Object.values(pref)[i]
				}
			}
		}
		loadSettings()*/
	});

	let audioMusicVolume = "100";
	let audioSfxVolume = "100";
	let audioUiVolume = "100";

	function defaultSettings() { localStorage.clear(); history.go(0) };

	const onKeyDown = (event) => { surenot.value = event.key; event.preventDefault() };
	window.onload = () => notsure.addEventListener('keydown', onKeyDown);
</script>

<div style="overflow-y:scroll;height:400px">
	<strong>note: </strong>Saving settings has been entirely removed for the time being.

	<br><br><br>

	<h2 style="margin:0">legend</h2>
	<div class="settingsSection">
		<img src={nonFunctional}> - Not functional<br>
		<img src={refresh}> - Requires refresh<br>
		<button id="notsure">Click this button, and press any key</button>
		<input id="surenot" type="text">
	</div>

	

	<h2>general</h2>
	<div class="settingsSection"><img src={nonFunctional}> Language
		<select id="generalLanguage">
			<option value="english">English</option>
			<option value="onlyEnglish">Only English.</option>
		</select>
	</div>

	<details>
		<summary><strong>input</strong></summary>
		<div id="inputDesktop" class="settingsSection">
			<details>
				<summary><strong>movement</strong></summary>
				<img src={nonFunctional}> Movement method
				<select id="inputMovement" value="both">
					<option value="wasd">WASD</option>
					<option value="arrow">Arrows</option>
					<option value="both">Both</option>
					<option value="custom">Custom</option>
					<option value="customsecondary">Custom with secondary</option>
				</select>
				<!--<div id="customMovement">
					<input id="inputMoveForward" type="text" value="KeyW">
					<input id="inputMoveLeft" type="text" value="KeyA">
					<input id="inputMoveBackward" type="text" value="KeyS">
					<input id="inputMoveRight" type="text" value="KeyD">
				</div>
				<div id="customSecondaryMovement">
					<input id="inputSecondaryMoveForward" type="text" value="ArrowUp">
					<input id="inputSecondaryMoveLeft" type="text" value="ArrowLeft">
					<input id="inputSecondaryMoveBackward" type="text" value="ArrowDown">
					<input id="inputSecondaryMoveRight" type="text" value="ArrowRight">
				</div>-->
				<div>Move up <input id="inputMoveUp" type="text" value="Space"></div>
				<div>Move down <input id="inputMoveDown" type="text" value="ShiftLeft"></div>
			</details>
			<details>
				<summary><strong>cube placing</strong></summary>
				<div>Place cubes <input id="inputPlaceCubes" type="text" value="KeyX"></div>
				<div>Remove cubes <input id="inputRemoveCubes" type="text" value="KeyC"></div>
			</details>
			<details>
				<summary><strong>camera</strong></summary>
				<div>Increase camera speed <input id="inputIncreaseCameraSpeed" type="text" value="BracketRight"></div>
				<div>decrease camera speed <input id="inputDecreaseCameraSpeed" type="text" value="BracketLeft"></div>
				<div>Reset camera speed <input id="inputResetCameraSpeed" type="text" value="Backslash"></div>
				<div>Increase camera zoom <input id="inputIncreaseCameraZoom" type="text" value="Equal"></div>
				<div>Decrease camera zoom <input id="inputDecreaseCameraZoom" type="text" value="Minus"></div>
				<div>Reset camera zoom <input id="inputResetCameraZoom" type="text" value="Quote"></div>
			</details>
			<details>
				<summary><strong>other</strong></summary>
				<div>Toggle grid <input id="inputToggleGrid" type="text" value="KeyG"></div>
				<div>Palette row scroll <input id="inputPaletteRowScroll" type="text" value="AltLeft"></div>
				<div>Settings shortcut <input id="inputSettingsShortcut" type="text" value="KeyL"></div>
				<div>Disable mouse place and remove <input id="inputDisablePR" type="checkbox"></div>
			</details>
		<div id="inputMobile" class="settingsSection">Not entirely sure what to put here for mobile rn.</div>
	</details>

	<details>
		<summary><strong>audio</strong></summary>
		<div><img src={nonFunctional}> Music {audioMusicVolume} <input id="audioMusicVolume" class="slider" type="range" bind:value={audioMusicVolume}></div>
		<div><img src={nonFunctional}> SFX {audioSfxVolume} <input id="audioSfxVolume" class="slider" type="range" bind:value={audioSfxVolume}></div>
		<div><img src={nonFunctional}> UI {audioUiVolume} <input id="audioUiVolume" class="slider" type="range" bind:value={audioUiVolume}></div>
		<div><img src={refresh}> Enable music <input id="audioEnableMusic" type="checkbox"></div>
		<div>Disable place and remove sounds <input id="audioDisablePR" type="checkbox"></div>
		<div>Disable UI sounds <input id="audioDisableUI" type="checkbox"></div>
	</details>

	<details>
		<summary><strong>appearance</strong></summary>
		<div><img src={refresh}> Enable random logos in welcome <input id="miscEnableRandomLogos" type="checkbox"></div>
		<div>Chat width <input id="themeChatWidth" type="text" value="440px"></div>
		<div>Chat max height <input id="themeChatMaxHeight" type="text" value="480px"></div>
		<div><img src={nonFunctional}> Disable background blur <input id="themeDisableBgBlur" type="checkbox"></div>
		<div><img src={nonFunctional}> Disable text shadows <input id="themeDisableTextShadows" type="checkbox"></div>
	</details>
</div>
<button id="applySettings" on:click={applySettings}>Apply</button> <button on:click={defaultSettings}>Default settings</button>