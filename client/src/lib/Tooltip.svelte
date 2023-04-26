<script>
	import { coloride } from "public/game/utils.js";

	export let title;
	export let x;
	export let y;

	let element;
</script>

<div bind:this={element} class="tooltip" style={`top: ${y + 24}px; left: ${x + 24}px`}>{@html coloride(title)}</div>