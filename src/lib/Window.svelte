<script>
	import { createEventDispatcher } from 'svelte';
	import { removeElement } from 'public/game/utils.js';
	import Button from 'lib/Button.svelte';

	const dispatch = new createEventDispatcher();

	export let id = Math.random();
	export let title = 'Window';
	export let nav = 'exit';

	if (id) id = 'win_' + id;

	function back() { dispatch('back') }
	function exit() { dispatch('exit') }
</script>

<b-x class="center" {id} style="padding:0">
	<wind-w>
		<win-heading>
			{#if nav.includes('back')}
				<Button type="button-icon" on:click={back}><img src="./img/icon/nav/back.png" alt="<="></Button>
			{/if}
			<h2 style="margin:0">{title}</h2>
			{#if nav.includes('exit')}
				<Button type="button-icon" on:click={exit}><img src="./img/icon/nav/exit.png" alt="X"></Button>
			{/if}
		</win-heading>
		<win-content>
			<slot/>
		</win-content>
	</wind-w>
</b-x>