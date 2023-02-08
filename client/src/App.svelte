<script>
	import Box from "lib/Box.svelte";
	import Window from "lib/Window.svelte";

	import Welcome from "./Welcome.svelte";
	import Esc from "./esc/Esc.svelte"

	import Toolbar from "./canvas/Toolbar.svelte";
	import Chat from "./canvas/Chat.svelte";
	import Playerlist from "./canvas/Playerlist.svelte";

	import { toggleShow } from "public/game/utils.js";
	import { config } from "public/game/config.js";
</script>

<main>
	<Welcome/>
	<div id="uiCanvas">
		<img id="crosshair" class="center hide" src="./img/crosshair.svg" alt="+">
		<div id="coordinates" class="hide"/>
		<Box id="palette" style="gap:0"/>
		<Toolbar/> <Chat/> <Playerlist/>
	</div>

	<Esc/>
</main>