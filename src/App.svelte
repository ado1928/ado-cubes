<script>
	import Welcome from './ui/win/Welcome.svelte';

	import Toolbar from './ui/Toolbar.svelte';
	import Coords from './ui/Coords.svelte'
	import Chat from './ui/Chat.svelte';

	import Sign from './ui/misc/Sign.svelte';
	import Playerlist from './ui/misc/Playerlist.svelte';

	import Esc from './ui/Esc.svelte'
	import Win from './ui/win/Win.svelte';
	import Settings from './ui/win/Settings.svelte';
	import Changelog from './ui/win/Changelog.svelte';
	import Credits from './ui/win/Credits.svelte'


</script>

<main>
	<Welcome/>
	<div id="uiCanvas">
		<img id="crosshair" class="center" src="./img/crosshair.svg" alt="+">
		<div id="palette" class="box"></div> <Toolbar/> <Coords/> <Chat/>
		<Sign/>
	</div>

	<div>
		<!--<div class="background-blur"></div>-->
		<Esc/>
		<Win id="settings" title="SETTINGS"><Settings/></Win>
		<Win id="credits" title="CREDITS"><Credits/></Win>
		<Win id="changelog" title="CHANGELOG"><Changelog/></Win>
	</div>

	<Playerlist/>

	<div id="mobileControls" style="visibility:hidden">
		<div id="joyMovementXZDiv" style="position:absolute;bottom:6px;left:6px;width:160px;height:160px"/>
		<div id="joyMovementYDiv" style="position:absolute;bottom:140px;right:6px;width:160px;height:160px"/>
		<div id="joyCameraDiv" style="position:absolute;bottom:6px;right:6px;width:160px;height:160px"/>
	</div>
</main>