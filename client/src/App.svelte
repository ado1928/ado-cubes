<script>
	import { onMount } from 'svelte';

	import Box from "lib/Box.svelte";
	import Window from "lib/Window.svelte";

	import Welcome from "./Welcome.svelte";
	import Esc from "./esc/Esc.svelte"

	import Toolbar from "./canvas/Toolbar.svelte";
	import Chat from "./canvas/Chat.svelte";
	import Sign from "./canvas/Sign.svelte";
	import Playerlist from "./canvas/Playerlist.svelte";

	import { setHide } from "public/game/utils.js";
	import { config } from "public/game/config.js";
</script>

<main>
	<Welcome/>
	
	<div id="uiCanvas">
		<img id="crosshair" class="hide center" src="./img/crosshair.svg" alt="+">
		<div id="coordinates" class="hide"/>
		<Box id="palette" style="gap:0"/>
		<Toolbar/> <Chat/>
	</div>

	<Window id="sign" title="SIGN" nav="exit" on:exit={() => setHide(sign)}>
		<Sign/>
	</Window>

	<Playerlist/>

	<Esc/>
</main>