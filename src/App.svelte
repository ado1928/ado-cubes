<script>
	import Palette from './ui/Palette.svelte';
	import SwitchPlacement from './ui/SwitchPlacement.svelte';
	import Coordinates from './ui/Coordinates.svelte';
	import Sign from './ui/Sign.svelte';
	import Chat from './ui/Chat.svelte';
	import Playerlist from './ui/Playerlist.svelte';

	import Esc from './ui/misc/Esc.svelte';
	import Window from './ui/misc/Window.svelte';

	import Welcome from './ui/win/Welcome.svelte';
	import Settings from './ui/win/Settings.svelte';
	import Credits from './ui/win/Credits.svelte';
</script>

<Welcome/>

<main>
	<div id="uiCanvas">
		<Palette/>
		<SwitchPlacement/>
		<!--<Sign/>-->
		<Coordinates/>
		<Chat/>
		<img id="crosshair" class="center" src="./images/svgs/crosshair.svg" alt="+">
	</div>

	<div id="mobileControls">
		<div id="joyMovementYDiv" style="position:absolute;bottom:140px;left:6px;width:160px;height:160px"/>
		<div id="joyMovementXZDiv" style="position:absolute;bottom:6px;left:6px;width:160px;height:160px"/>
		<div id="joyCameraDiv" style="position:absolute;bottom:6px;right:6px;width:200px;height:200px"/>
	</div>

	<Esc/>
	<Window id="settings" title="settings"><Settings/></Window>
	<Window id="credits" title="credits"><Credits/></Window>
</main>