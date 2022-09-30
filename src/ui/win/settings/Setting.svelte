<script>
	import { onMount } from 'svelte';

	export let id;
	export let type = 'text';
	export let icon = '';
	export let label = '';
	export let value = false;
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
</script>

{#if id}
<div class="set"><input {id} {type} {value} on:click={() => event => event.preventDefault()}> {label} {@html icon}</div>
{/if}