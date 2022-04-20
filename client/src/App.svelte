<script>

	import Palette from './ui/canvas/Palette.svelte'
	import Coordinates from './ui/canvas/Coordinates.svelte';
	import Chat from './ui/canvas/Chat.svelte';
	//menu
	import Esc from './ui/esc/Esc.svelte';
	import EscMenuNavs from './ui/esc/EscMenuNavs.svelte';

	import Welcome from './ui/misc/Welcome.svelte';
	import Settings from './ui/misc/Settings.svelte';
	import Controls from './ui/misc/Controls.svelte';
</script>

<p id="crosshair" class="center" style="text-align:center;font-size:31px;">＋</p>

<Welcome/>
<Chat/>
<Coordinates/>
<Palette/>
<Esc/>
<Settings><EscMenuNavs>Settings</EscMenuNavs></Settings>
<Controls><EscMenuNavs>Controls</EscMenuNavs></Controls>

