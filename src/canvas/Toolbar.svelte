<script>
	import Box from "lib/Box.svelte";
	import Button from 'lib/Button.svelte';
	import { toggleDisplay } from 'public/game/utils.js';
</script>

<Box id="cubeTypes" classes="center" style="display:none;top:revert;bottom:76px">
	<Button type="icon"><img src="./img/icon/cube type/basic.png"></Button>
	<Button type="icon"><img src="./img/icon/cube type/light.png"></Button>
	<Button type="icon"><img src="./img/icon/cube type/sign.png"></Button>
</Box>

<Box id="toolbar">
	<Button type="icon" on:click={() => toggleDisplay(esc)}>
		<img src="./img/icon/esc/esc.png">
	</Button>

	<line-vertical/>

	<Button type="icon" on:click={() => toggleDisplay(cubeTypes)}>
		<img src="./img/icon/cube type/basic.png">
	</Button>
	<Button type="icon">
		<img src="./img/icon/placement/raycast.png" alt="place at raycast">
		<img src="./img/icon/placement/camera.png" alt="place in camera">
	</Button>

	<line-vertical/>

	<Button type="icon">
		<img src="./img/icon/movement/fly.png" alt="fly">
		<img src="./img/icon/movement/walk.png" alt="walk">
	</Button>
</Box>