<script>
	import { onMount } from 'svelte';

	export let id;
	export let type = 'text';
	export let icon = '';
	export let label = '';
	export let value = false;
	export let step = 1;
	export let max = 100;
	export let min = 0;
	if (icon) icon = `<img src=${icon}> `

	onMount(() => {
		let setting = document.getElementById(id);
		if (type == 'checkbox') return;

		let keybind = localStorage.getItem(id);
		if (keybind) id.value = keybind;

		setting.onkeydown = event => {
			event.preventDefault();
			setting.value = event.key
		}
	})

	/*function test() {
		if (type !== 'checkbox') return;
		this.children[0].checked = !this.children[0].checked
	}*/

	$: dvalue = value;

	function displayValue() {
		dvalue = (this.value)
	}

	let style;
	switch (type) {
		case 'text': style = 'gap:12px'; break;
		case 'range': style = 'margin-bottom:6px;flex-direction:column;align-items:flex-start'
	}
</script>

{#if id}
<div class="set" {style}>
	{#if type == 'select'}
		<select {id}></select>
	{:else}
		{#if type == 'range'}
			<p>{label} <v>{dvalue}</v> {@html icon}</p>
			<input {id} {type} {step} {max} {min} {value} on:click={() => event => event.preventDefault()} on:input={displayValue}>
		{:else}
			<input {id} {type} {value} on:click={() => event => event.preventDefault()}>
			<p>{label} {@html icon}</p>
		{/if}
	{/if}
</div>
{/if}