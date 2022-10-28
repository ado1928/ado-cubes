<script>
	import { onMount } from 'svelte';

	export let id;
	export let type = 'text';
	export let icon = '';
	export let label = '';
	export let value = false;
	export let keybind = false;
	export let step = 1;
	export let max = 100;
	export let min = 0;
	if (icon) icon = `<img src=${icon}> `

	onMount(() => {
		let setting = document.getElementById(id);
		if (type == 'checkbox') return;

		let value = localStorage.getItem(id);
		if (value) id.value = value;

		if (keybind) {
			setting.onkeydown = event => {
				event.preventDefault();
				setting.value = event.code
			}			
		}
	})

	$: dvalue = value;

	function displayValue() {
		dvalue = (this.value)
	}

	let clank;
	switch (type) {
		case 'range': clank = 'set set-range'; break
		default: clank = 'set'
	}
</script>

{#if id}
<div class={clank}>
	{#if type == 'select'}
		<select {id}></select>
		<p class="central">{label} {@html icon}</p>
	{:else if type == 'range'}
		<input {id} {type} {step} {max} {min} {value} on:input={displayValue}>
		<p class="central">{label} <v>{dvalue}</v> {@html icon}</p>
	{:else}
		<input {id} {type} {value}>
		<p class="central">{label} {@html icon}</p>
	{/if}
</div>
{/if}