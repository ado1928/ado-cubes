<script>	
	import Palette from './ui/canvas/Palette.svelte'
	import Coordinates from './ui/canvas/Coordinates.svelte';
	import SwitchPlacement from './ui/canvas/SwitchPlacement.svelte'
	import Chat from './ui/canvas/Chat.svelte';

	import Esc from './ui/esc/Esc.svelte';
	import EscWinNavs from './ui/esc/EscWinNavs.svelte';

	import Welcome from './ui/misc/Welcome.svelte';
	import Settings from './ui/misc/Settings.svelte';
	import Credits from './ui/misc/Credits.svelte'
</script>

<Welcome/>

<main>
	<div id="uiCanvas">
		<Palette/>
		<SwitchPlacement/>
		<Coordinates/>
		<Chat/>
		<img id="crosshair" class="center" src="./images/svgs/crosshair.svg" alt="+">
	</div>

	<div id="mobileControls">
		<div id="joyMovementDiv" style="position:absolute;bottom:6px;left:6px;width:200px;height:200px"/>
		<div id="joyCameraDiv" style="position:absolute;bottom:6px;right:6px;width:200px;height:200px"/>
	</div>

	<Esc/>
	<Settings><EscWinNavs>settings</EscWinNavs></Settings>
	<Credits><EscWinNavs>credits</EscWinNavs></Credits>
</main>