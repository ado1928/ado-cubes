<script context="module">
	import Button from "lib/Button.svelte";
	import Checkbox from "lib/Checkbox.svelte";
	import Setting from "lib/Setting.svelte";
	import { usingMobile } from "public/game/utils.js";
</script>

<header>
	Your changes are automatically saved and applied.
	<Checkbox>test</Checkbox>
</header>
<main class="settings">
	<section>
		<h2>General</h2>
		<Setting label="Renderer pixel ratio" set="rendererPixelRatio" type="range" min="1" max="4" step="0.25"/>
		<Setting label="Chat width" set="chatWidth" type="range" min="100" max="1280" step="10"/>
		<Setting label="Chat max lines visible" set="chatMaxLines" type="range" min="12" max="32"/>
		<Setting label="Enable random and special logos" set="enableRandomAndSpecialLogos" type="checkbox"/>
	</section>
	<section>
		<h2>Input</h2>
		{#if !usingMobile()}
			<h3>Cubes</h3>
			<Setting label="Place cubes" set="placeCubes" type="keybind"/>
			<Setting label="Break cubes" set="breakCubes" type="keybind"/>
			<Setting label="Invert mouse controls for cube placement" set="invertMouseControlsForCubePlacement" type="checkbox"/>
			<h3>Camera</h3>
			<Setting label="Increase camera speed" set="increaseCameraSpeed" type="keybind"/>
			<Setting label="Decrease camera speed" set="decreaseCameraSpeed" type="keybind"/>
			<Setting label="Reset camera speed" set="resetCameraSpeed" type="keybind"/>
			<Setting label="Increase camera zoom" set="increaseCameraZoom" type="keybind"/>
			<Setting label="Decrease camera zoom" set="decreaseCameraZoom" type="keybind"/>
			<Setting label="Reset camera zoom" set="resetCameraZoom" type="keybind"/>
			<h3>Other</h3>
			<Setting label="Toggle UI" set="toggleUi" type="keybind"/>
			<Setting label="Toggle grid" set="toggleGrid" type="keybind"/>
			<Setting label="Key modifier" set="keyModifier" type="keybind"/>
			<Setting label="Settings shortcut" set="settingsShortcut" type="keybind"/>
		{:else}
			sorry, no settings for mobile rn
		{/if}
	</section>
	<section>
		<h2>Audio</h2>
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
		<h2>Debug</h2>
		<Setting label="Force mobile agent (needs page refresh)" set="forceMobileAgent" type="checkbox"/>
	</section>
</main>