<script>
	import Box from "lib/Box.svelte";
	import Button from "lib/Button.svelte";
	import { setHide, usingMobile } from "public/game/utils.js";

	let update = {};

	function switchBuildingMethod() {
		game.buildingMethod = (game.buildingMethod == 'raycast') ? 'camera' : 'raycast';
		(game.buildingMethod == 'raycast')
			? crosshair.classList.remove('no-raycast')
			: crosshair.classList.add('no-raycast')
	}

	function switchMovementMethod() {
		game.movementMethod = (game.movementMethod == 'fly') ? 'walk' : 'fly';
	}

	function toggleGrid() {
		game.showGrid = !game.showGrid
	}

	document.addEventListener('game', () => {
		update = {};
	})
</script>

<Box id="cubeTypes" classes="center" style="display:none;top:revert;bottom:76px">
	<p>this doesn't work yet :P</p>
	<Button type="icon"><img src="./img/icon/cube type/basic.png"></Button>
	<Button type="icon"><img src="./img/icon/cube type/light.png"></Button>
	<Button type="icon"><img src="./img/icon/cube type/sign.png"></Button>
</Box>

<Box id="toolbar">
	<Button type="icon" on:click={() => setHide(escMenu)}>
		<img src="./img/icon/esc/esc.png">
	</Button>

	<div class="separator"/>

	<!--<Button type="icon" on:click={() => toggleDisplay(cubeTypes)}>
		<img src="./img/icon/cube type/basic.png">
	</Button>-->
	<Button type="icon" on:click={switchBuildingMethod}>
		{#key update}<img src={`./img/icon/placement/${game.buildingMethod}.png`}>{/key}
	</Button>

	<Button type="icon" on:click={toggleGrid}>
		{#key update}<img src={`./img/icon/grid/${game.showGrid}.png`}>{/key}
	</Button>

	<!--<div class="separator"/>

	<Button type="icon" on:click={switchMovementMethod}>
		<img src={`/img/icon/movement/${config.movementMethod}.png`}>
	</Button>-->
</Box>