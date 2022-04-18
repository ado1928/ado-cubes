<script>
	import Welcome from './ui/ingame/Welcome.svelte';
	import Chat from './ui/ingame/Chat.svelte';
	import Coordinates from './ui/ingame/Coordinates.svelte';
	import Palette from './ui/ingame/Palette.svelte'
	//menu
	import Esc from './ui/ingame/Esc.svelte';
	import EscMenuNavs from './ui/ingame/EscMenuNavs.svelte';
	import Settings from './ui/menu/Settings.svelte';
	import Controls from './ui/menu/Controls.svelte';
</script>

<Welcome/>
<Chat/>
<Coordinates/>
<Palette/>
<Esc/>
<Settings><EscMenuNavs>Settings</EscMenuNavs></Settings>
<Controls><EscMenuNavs>Controls</EscMenuNavs></Controls>

