<script>
	import { createEventDispatcher } from 'svelte';
	import { removeElement } from 'public/game/utils.js';
	import Box from "lib/Box.svelte";
	import Button from 'lib/Button.svelte';

	const dispatch = new createEventDispatcher();

	export let id = null
	export let title = 'Window';
	export let nav = 'back exit';

	function back() { dispatch('back') }
	function exit() { dispatch('exit') }
</script>

<Box classes="window center" {id}>
	<header>
		{#if nav.includes('back')}
			<Button type="nav" on:click={back}><img src="./img/icon/esc/back.png" alt="<="></Button>
		{/if}
		<h2>{title}</h2>
		{#if nav.includes('exit')}
			<Button type="nav" on:click={exit}><img src="./img/icon/esc/exit.png" alt="X"></Button>
		{/if}
	</header>
	<section>
		<slot/>
	</section>
</Box>