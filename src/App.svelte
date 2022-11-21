<script>
	import Window from 'lib/Window.svelte';

	import Welcome from './ui/Welcome.svelte';

	import Toolbar from './ui/Toolbar.svelte';
	import Chat from './ui/Chat.svelte';

	import Esc from './ui/Esc.svelte'
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
		<b-x id="coordinates"/>
		<b-x id="palette" style="gap:0"/>
		<Toolbar/> <Chat/>
	</div>

	<Esc/>
</main>