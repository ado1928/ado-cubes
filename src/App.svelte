<script>
	import Box from "lib/Box.svelte";
	import Window from 'lib/Window.svelte';

	import Welcome from './Welcome.svelte';

	import Toolbar from './canvas/Toolbar.svelte';
	import Chat from './canvas/Chat.svelte';

	import Esc from './esc/Esc.svelte'
</script>

<main>
	<div id="mobileControls" style="visibility:hidden">
		<div id="joyMovementXZDiv" style="position:absolute;bottom:6px;left:6px;width:160px;height:160px"/>
		<div id="joyMovementYDiv" style="position:absolute;bottom:140px;right:6px;width:160px;height:160px"/>
		<div id="joyCameraDiv" style="position:absolute;bottom:6px;right:6px;width:160px;height:160px"/>
	</div>

	<Welcome/>
	<div id="uiCanvas">
		<img id="crosshair" class="center" src="./img/crosshair.svg" alt="+">
		<div id="coordinates" class="coordinates"/>
		<Box id="palette" style="gap:0"/>
		<Toolbar/> <Chat/>
	</div>

	<Esc/>
</main>