<script>
	function HexToRGB(hex) {
		let r = parseInt(hex.slice(1, 3), 16);
		let g = parseInt(hex.slice(3, 5), 16);
		let b = parseInt(hex.slice(5, 7), 16);

		return `${r} ${g} ${b}`;
	}
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
			<select id="inputMovement">
				<option value="wasd">WASD</option>
				<option value="arrow">Arrow keys</option>
				<option value="custom">Custom</option>
			</select>
			<div id="customMovement">
				<input value="KeyW">
				<input value="KeyA">
				<input value="KeyS">
				<input value="KeyD">
			</div>
		</div>
		<div>Place blocks <input id="inputPlaceBlocks" value="KeyX"></div>
		<div>Secondary <input id="inputSecondaryPlaceBlocks" value="MouseRight"></div>
		<div>Remove blocks <input id="inputRemoveBlocks" value="KeyC"></div>
		<div>Secondary <input id="inputSecondaryRemoveBlocks" value="MouseLeft"></div>
		<div>Palette skip <input id="inputPaletteSkip" value="AltLeft"></div>

		<h1>Audio</h1>
		<div>Master <input id="volumeMaster" type="range"></div>
		<div>Music <input id="volumeMusic" type="range"></div>
		<div>SFX <input id="volumeSFX" type="range"></div>
		<div>UI <input id="volumeUI" type="range"></div>

		<h1>Performance</h1>
		<div>idk what to put here</div>

		<h1>Miscellaneous</h1>
		<div>Disable shadows (why?) <input type="checkbox"></div>
		<div>Disable ground <input type="checkbox"></div>

		<h1>Theme</h1>
		<div><strong>NOTE:</strong> Blur does not properly work in Firefox</div>
		<div style="background:#000;height:130px;width:-moz-available;width:-webkit-fill-available"></div>
		<input type="file">
		<!-- <button on:click={applySettings}>Apply</button><button on:click={defaultSettings}>Default</button> -->
	</div>
</div>