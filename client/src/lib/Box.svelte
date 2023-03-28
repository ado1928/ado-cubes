<script>
	export let style = null;
	export let classes = null;
	export let show = false
	export let id = null;
</script>

<div {id} {style} class={`box ${(show) ? '' : 'hide'} ${classes}`}>
	<slot/>
</div>