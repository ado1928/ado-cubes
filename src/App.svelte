<script>	
	import Palette from './ui/canvas/Palette.svelte'
	import Coordinates from './ui/canvas/Coordinates.svelte';
	import SwitchPlacement from './ui/canvas/SwitchPlacement.svelte'
	import Chat from './ui/canvas/Chat.svelte';

	import Esc from './ui/esc/Esc.svelte';
	import EscWinNavs from './ui/esc/EscWinNavs.svelte';

	import Welcome from './ui/misc/Welcome.svelte';
	import Settings from './ui/misc/Settings.svelte';
	import Credits from './ui/misc/Credits.svelte';
</script>

<Welcome/>

<main>
	<div id="uiCanvas">
		<!-- maybe -->
		<div id="itsEditTime">
			<SwitchPlacement/>
			<Palette/>
		</div>
		<Coordinates/>
		<Chat/>
		<img id="crosshair" class="center" src="./images/svgs/crosshair.svg" alt="+">
	</div>

	<Esc/>
	<Settings><EscWinNavs>Settings</EscWinNavs></Settings>
	<Credits><EscWinNavs>Credits</EscWinNavs></Credits>
</main>