<script>
	function HexToRGB(hex) {
		let r = parseInt(hex.slice(1, 3), 16);
		let g = parseInt(hex.slice(3, 5), 16);
		let b = parseInt(hex.slice(5, 7), 16);

		return `${r} ${g} ${b}`;
	}

	let masterVolume = 100;
	let musicVolume = 100;
	let sfxVolume = 100;
	let uiVolume = 100;
</script>

<div id="winSettings" class="box win center">
	<slot/>
	<div>
		<h1>General</h1>
		<div>Language
			<select id="generalLanguage">
				<option value="english">English</option>
				<option value="onlyEnglish">Only English.</option>
			</select>
		</div>

		<h1>Input</h1>
		<div>Movement
			<select id="inputMovement" value="wasd">
				<option value="wasd">WASD</option>
				<option value="arrow">Arrow keys</option>
				<option value="custom">Custom</option>
			</select>
			<div id="customMovement">
				<input type="text" value="KeyW">
				<input type="text" value="KeyA">
				<input type="text" value="KeyS">
				<input type="text" value="KeyD">
			</div>
		</div>
		<div>Place blocks <input id="inputPlaceBlocks" type="text" value="KeyX"></div>
		<div>Secondary <input id="inputSecondaryPlaceBlocks" type="text" value="MouseRight"></div>
		<div>Remove blocks <input id="inputRemoveBlocks" type="text" value="KeyC"></div>
		<div>Secondary <input id="inputSecondaryRemoveBlocks" type="text" value="MouseLeft"></div>
		<div>Faster palette scroll <input id="inputFasterPaletteScroll" type="text" value="AltLeft"></div>

		<h1>Audio</h1>
		<div>Master {masterVolume} <input id="masterVolume" class="slider" type="range" bind:value={masterVolume}></div>
		<div>Music {musicVolume} <input id="musicVolume" class="slider" type="range" bind:value={musicVolume}></div>
		<div>SFX {sfxVolume} <input id="sfxVolume" class="slider" type="range" bind:value={sfxVolume}></div>
		<div>UI {uiVolume} <input id="uiVolume" class="slider" type="range" bind:value={uiVolume}></div>

		<div>Disable place and remove sounds <input type="checkbox"></div>

		<h1>Performance</h1>
		<div>idk what to put here</div>

		<h1>Miscellaneous</h1>
		<div>Disable text shadows <input type="checkbox"></div>
		<div>Disable ground <input type="checkbox"></div>

		<h1>Theme</h1>
		<div><strong>NOTE:</strong> Blur does not properly work in Firefox</div>
		<div style="background:#000;height:130px;width:-moz-available;width:-webkit-fill-available"></div>
		<input type="file">
		<!-- <button on:click={applySettings}>Apply</button><button on:click={defaultSettings}>Default</button> -->
	</div>
</div>