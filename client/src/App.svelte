<script>
	import { onMount } from 'svelte';

	import Box from "lib/Box.svelte";
	import Window from "lib/Window.svelte";

	import Welcome from "./Welcome.svelte";
	import Esc from "./esc/Esc.svelte"

	import LoadingWorld from "./world/LoadingWorld.svelte";
	import Toolbar from "./world/Toolbar.svelte";
	import Chat from "./world/Chat.svelte";
	import Sign from "./world/Sign.svelte";
	import Playerlist from "./world/Playerlist.svelte";

	import { setHide } from "public/game/utils.js";
</script>

<main>
	<Welcome/>

	<LoadingWorld/>

	<div id="uiWorld">
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