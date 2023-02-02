<script context="module">
	import Button from 'lib/Button.svelte';
	import Setting from 'lib/Setting.svelte';
</script>

<main class="settings">
	<header>
		Your changes are automatically saved and applied.
	</header>
	
	<div>
		<section>
			<h3>General</h3>
			<Setting label="Language" set="language" type="dropdown">
				<option>English</option>
			</Setting>
			<Setting label="UI Scale" set="uiScale" type="range" min="1" max="5"/>
			<Setting label="Chat width" set="chatWidth" type="range" min="100" max="1280" step="10"/>
			<Setting label="Chat max height" set="chatMaxHeight" type="range" min="160" max="720" step="10"/>
			<Setting label="Randomize logos in welcome page" set="randomizeLogosInWelcome" type="checkbox"/>
		</section>
		<section>
			<h3>Input</h3>
			<Setting label="Place cubes" set="placeCubes" type="keybind"/>
			<Setting label="Break cubes" set="breakCubes" type="keybind"/>
			<Setting label="Increase camera speed" set="increaseCameraSpeed" type="keybind"/>
			<Setting label="Decrease camera speed" set="decreaseCameraSpeed" type="keybind"/>
			<Setting label="Reset camera speed" set="resetCameraSpeed" type="keybind"/>
			<Setting label="Increase camera zoom" set="increaseCameraZoom" type="keybind"/>
			<Setting label="Decrease camera zoom" set="decreaseCameraZoom" type="keybind"/>
			<Setting label="Reset camera zoom" set="resetCameraZoom" type="keybind"/>
			<Setting label="Toggle grid" set="toggleGrid" type="keybind"/>
			<Setting label="Settings shortcut" set="settingsShortcut" type="keybind"/>
		</section>
		<section>
			<h3>Audio</h3>
			<Setting label="Music" set="musicVolume" type="range" min="0" max="100"/>
			<Setting label="SFX" set="sfxVolume" type="range" min="0" max="100"/>
			<Setting label="UI" set="uiVolume" type="range" min="0" max="100"/>
			<Setting label="Disable cube placement sounds" set="disableCubePlacementSounds" type="checkbox"/>
			<Setting label="Disable palette scroll sound" set="disablePaletteScrollSound" type="checkbox"/>
			<Setting label="Disable color picker sound" set="disableColorPickerSound" type="checkbox"/>
			<Setting label="Disable button sounds" set="disableButtonSounds" type="checkbox"/>
			<Setting label="Disable message sounds" set="disableMessageSounds" type="checkbox"/>
		</section>
		<section>
			<h3>Debug</h3>
			<Setting label="Force mobile controls" set="forceMobileControls" type="checkbox"/>
		</section>
	</div>
</main>