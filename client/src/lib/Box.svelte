<script>
	export let style = null;
	export let classes = null;
	export let id = null;

	let cliche = (classes) ? `box hide ${classes}` : "box hide"
</script>

<div {id} {style} class={cliche}>
	<slot/>
</div>