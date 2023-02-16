<script>
	export let label = "the labelo";
	export let type = 'text'
	export let classes = undefined;
	export let id = undefined;

	export let value = '';
	export let checked = false;
	export let maxlength = 1600;
	export let oninput = undefined;
</script>

{#if type == 'text'}
	<div>
		{label}
		<div>
			<input class={classes} {id} type="text" {maxlength} {oninput} {value}>
			<slot/>
		</div>
	</div>
{/if}

{#if type == 'select'}
	<div>
	</div>
{/if}