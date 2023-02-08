<script>
	import Box from "lib/Box.svelte";
	import Button from "lib/Button.svelte";
	import { toggleShow, usingMobile } from "public/game/utils.js";
	import { config } from "public/game/config.js";

	let fullscreen = false;
	let update = [];

	config.reset('buildingMethod');
	config.reset('movementMethod');

	function switchFullscreen() { // h
		if (document.fullscreen) {
			document.exitFullscreen();
			fullscreen = false;
		} else {
			document.body.requestFullscreen();
			fullscreen = true;
		}

	}

	function switchBuildingMethod() {
		config.buildingMethod = (config.buildingMethod == 'raycast') ? 'camera' : 'raycast';
		(config.buildingMethod == 'raycast')
			? crosshair.classList.remove('no-raycast')
			: crosshair.classList.add('no-raycast')
	}

	function switchMovementMethod() {
		config.movementMethod = (config.movementMethod == 'fly') ? 'walk' : 'fly';
	}
</script>

<Box id="cubeTypes" classes="center" style="display:none;top:revert;bottom:76px">
	<p>this doesn't work yet :P</p>
	<Button type="icon"><img src="./img/icon/cube type/basic.png"></Button>
	<Button type="icon"><img src="./img/icon/cube type/light.png"></Button>
	<Button type="icon"><img src="./img/icon/cube type/sign.png"></Button>
</Box>

<Box id="toolbar">
	<Button type="icon" on:click={() => toggleShow('esc')}>
		<img src="./img/icon/esc/esc.png">
	</Button>
	{#if usingMobile()}
		<Button type="icon" on:click={switchFullscreen}>
			<img src={`./img/icon/fullscreen/${(fullscreen) ? "toggle off" : "toggle on"}.png`}>
		</Button>
	{/if}

	<div class="line-x"/>

	<!--<Button type="icon" on:click={() => toggleDisplay(cubeTypes)}>
		<img src="./img/icon/cube type/basic.png">
	</Button>-->
	<Button type="icon" on:click={switchBuildingMethod}>
		<img src={`./img/icon/placement/${config.buildingMethod}.png`}>
	</Button>

	<Button type="icon" on:click>
		{#key update}<img src={`./img/icon/grid/on.png`}>{/key}
	</Button>

	<!--<div class="line-x"/>

	<Button type="icon" on:click={switchMovementMethod}>
		<img src={`/img/icon/movement/${config.movementMethod}.png`}>
	</Button>-->
</Box>