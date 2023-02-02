<script>
	export let style = null;
	export let classes = null;
	export let id = null;

	let cliche = (classes) ? `box ${classes}` : "box"
</script>

<div {id} {style} class={cliche}>
	<slot/>
</div>