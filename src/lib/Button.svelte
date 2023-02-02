<script>
	import { config } from 'public/game/config.js';
	import { playAudio } from 'public/game/utils.js';

	export let type = null;
	export let id = null;
</script>

<!-- this looks wrong -->
<button
	on:click
	on:mouseover={() => playAudio('ui/hover', config.uiVolume)}
	on:mousedown={() => playAudio('ui/mousedown', config.uiVolume)}
	on:mouseup={() => playAudio('ui/mouseup', config.uiVolume)}
	{id}
	class={type}
	>
	<slot/>
</button>