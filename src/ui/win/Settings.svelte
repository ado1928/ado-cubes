<script>
	import { onMount } from 'svelte';
	import Set from './Setting.svelte';

	let nonFunctional = "./img/icon/non-functional.png";
	let refresh = "./img/icon/refresh.png";

	onMount(async () => {
		function loadSettings() {
			let sets = JSON.parse(localStorage.getItem('settings'));
			let logsets = {};
			if (!sets) { console.log('No settings saved'); return }
			for (let i = 0; i < Object.keys(sets).length; i++) {
				if ([true, false].includes(Object.values(sets)[i]))
				{ document.getElementById(Object.keys(sets)[i]).checked = Object.values(sets)[i] } else
				{ document.getElementById(Object.keys(sets)[i]).value = Object.values(sets)[i] };
				logsets[Object.keys(sets)[i]] = Object.values(sets)[i];
			}; console.table(logsets)
		}; loadSettings();

		for (let e = 0; e < settingsContent.children.length; e++) settingsContent.children[e].style.display = 'none';
		general.style.display = 'flex'
	});

	function saveSettings() {
		let settings = {};
		let sets = document.getElementsByClassName('set');
		for (let i = 0; i < sets.length; i++) {
			let set = sets[i].children[sets[i].children.length - 1];
			console.log(set.type)
			switch (set.type) {
				case 'checkbox':	settings[set.id] = set.checked; break
				default: 			settings[set.id] = set.value
			};
			localStorage.setItem('settings', JSON.stringify(settings));
		}
	}

	function defaultSettings() { localStorage.clear(); history.go(0) };

	let page;
	function switchPage(i) {
		for (let e = 0; e < settingsContent.children.length; e++) settingsContent.children[e].style.display = 'none';
		document.getElementById(i).style.display = 'flex'
	};
</script>

<div style="height:400px;overflow-y:scroll">
	<img src={nonFunctional}> - Not functional     <img src={refresh}> - Requires refresh

	<br>

	<div style="display:flex">
		<button on:click={() => switchPage('general')}>🗺️ General</button>
		<button on:click={() => switchPage('input')}>🎹 Input</button>
		<button on:click={() => switchPage('audio')}>🔊 Audio</button>
		<button on:click={() => switchPage('appearance')}>🎨 Appearance</button>
		<button on:click={() => switchPage('debug')}>🐛 Debug</button>
	</div>

	<div id="settingsContent">
		<section id="general">
			<h2>🗺️ General</h2>
			<Set id="generalLanguage" type="text" label="Language" value="English"/>
		</section>


		<section id="input">
			<h2>🎹 Input</h2>
			<details>
				<summary>🕹️ Movement</summary>
				<div id="primaryMovement" style="display:flex;gap:24px">
					<Set id="inputMoveForward" value="KeyW"/>
					<Set id="inputMoveLeft" value="KeyA"/>
					<Set id="inputMoveBackward" value="KeyS"/>
					<Set id="inputMoveRight" value="KeyD"/>
				</div>
				<div id="secondaryMovement" style="display:flex;gap:24px">
					<Set id="inputSecondaryMoveForward" value="ArrowUp"/>
					<Set id="inputSecondaryMoveLeft" value="ArrowLeft"/>
					<Set id="inputSecondaryMoveBackward" value="ArrowDown"/>
					<Set id="inputSecondaryMoveRight" value="ArrowRight"/>
				</div>
				<Set id="inputMoveUp" label="Fly up" value="Space"/>
				<Set id="inputMoveDown" label="Fly down" value="Shift"/>
			</details>
			<details>
				<summary>🧊 Cube placing</summary>
				<Set id="inputPlaceCubes" label="Place cubes" value="KeyX"/>
				<Set id="inputRemoveCubes" label="Remove cubes" value="KeyC"/>
			</details>
			<details>
				<summary>📹 Camera</summary>
				<Set id="inputIncreaseCameraSpeed" label="Increase camera speed" value="BracketLeft"/>
				<Set id="inputDecreaseCameraSpeed" label="Decrease camera speed" value="BracketRight"/>
				<Set id="inputResetCameraSpeed" label="Reset camera speed" value="Backslash"/>
				<Set id="inputIncreaseCameraZoom" label="Increase camera zoom" value="Equal"/>
				<Set id="inputDecreaseCameraZoom" label="Decrease camera zoom" value="Minus"/>
				<Set id="inputResetCameraZoom" label="Reset camera zoom" value="Quote"/>
			</details>
			<details>
				<summary>❓ Other</summary>
				<Set id="inputToggleGrid" label="Toggle grid" value="KeyG"/>
				<Set id="inputPaletteRowScroll" label="Palette row scroll" value="AltLeft"/>
				<Set id="inputSettingsShortcut" label="Settings shortcut" value="KeyL"/>
				<Set id="inputDisablePR" type="checkbox" label="Disable mouse place and remove"/>
			</details>
		</section>


		<section id="audio">
			<h2>🔊 Audio</h2>
			<Set id="volumeMusic" type="range" label="Music" value="50"/>
			<Set id="volumeSfx" type="range" label="SFX" value="50"/>
			<Set id="volumeUi" type="range" label="UI" value="50"/>
			<Set icon={nonFunctional} id="audioEnableMusic" type="checkbox" label="Enable music"/>
			<Set id="audioDisablePR" type="checkbox" label="Disable cube placement sounds"/>
			<Set id="audioDisablePalette" type="checkbox" label="Disable palette sounds"/>
			<Set id="audioDisableColorPicker" type="checkbox" label="Disable color picker sounds"/>
			<Set id="audioDisableButton" type="checkbox" label="Disable button sounds"/>
			<Set id="audioDisableMessage" type="checkbox" label="Disable message sounds"/>
		</section>


		<section id="appearance">
			<h2>🎨 Appearance</h2>
			<Set icon={refresh} id="miscEnableRandomLogos" type="checkbox" label="Enable random logos in welcome"/>
			<Set id="themeChatWidth" type="range" label="Chat width" max="1000" step="10" value="440"/>
			<Set id="themeChatMaxHeight" type="range" label="Chat max height" max="1000" step="10" value="480"/>
			<button onclick="document.documentElement.style.setProperty('--backdrop-blur', '0px')">👓</button>
		</section>


		<section id="debug">
			<h2>🐛 Debug</h2>
			<Set icon={refresh} id="debugForceMobileControls" type="checkbox" label="Force mobile controls"/>
			<button class="button-icon" onclick="mobileControls.style.visibility = (mobileControls.style.visibility == 'hidden') ? 'visible' : 'hidden'">Toggle mobile controls</button>
			<Set id="slidertest" type="range" label="slider test"/>
		</section>
	</div>
</div>
<button id="applySettings" on:click={saveSettings}>Save</button> <button on:click={defaultSettings}>Default settings</button>