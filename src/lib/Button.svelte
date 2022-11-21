<script>
	import { playAudio } from 'public/game/utils.js'

	export let type = null
	export let id = null
</script>

<!-- this looks wrong -->
<button
	on:click
	on:mouseover={() => playAudio('ui/hover')}
	on:mousedown={() => playAudio('ui/mousedown')}
	on:mouseup={() => playAudio('ui/mouseup')}
	{id}
	class={type}
	>
	<slot/>
</button>