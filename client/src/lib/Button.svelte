<script>
	import { config } from 'public/game/config.js';
	import { playAudio } from 'public/game/utils.js';

	export let type = null;
	export let id = null;
	export let disabled = false;
</script>

<!-- this looks wrong -->
<button
	{disabled}
	on:click
	on:mouseover={() => playAudio('ui/hover', config.uiVolume, !config.disableButtonSounds)}
	on:mousedown={() => playAudio('ui/mousedown', config.uiVolume, !config.disableButtonSounds)}
	on:mouseup={() => playAudio('ui/mouseup', config.uiVolume, !config.disableButtonSounds)}
	{id}
	class={type}
	>
	<slot/>
</button>