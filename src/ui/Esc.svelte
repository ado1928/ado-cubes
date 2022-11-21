<script>
	import Button from 'lib/Button.svelte';
	import Window from 'lib/Window.svelte';

	import Changelog from './Esc/Changelog.svelte';
	import Settings from './Esc/Settings.svelte';
	import Credits from './Esc/Credits.svelte';

	let selection = null;

	document.addEventListener('keydown', event => {
		if (event.key == "Escape" && document.activeElement.tagName !== "INPUT") {
			escChange(true)
		}
	});

	function escChange(escToggle, win) {
		selection = (win) ? win : null;
		if (escToggle) esc.style.display = (esc.style.display == 'none') ? 'flex' : 'none';
	}
</script>

<div id="esc">
	<!--<esc-background/>-->
	<img src="./img/logo/adocubes.svg" class="floaty-adocubes">

	{#if !selection}
		<b-x class="center" style="top:72%">
			<esc-menu>
				<Button type="button-esc" on:click={() => escChange(true)}>
					<span class="button-esc-icon">⬅️</span> Return
				</Button>
				<Button type="button-esc" on:click={() => escChange(false, 'changelog')}>
					<span class="button-esc-icon">📰</span> Changelog
				</Button>
				<Button type="button-esc" on:click={() => escChange(false, 'settings')}>
					<span class="button-esc-icon">⚙️</span> Settings
				</Button>
				<Button type="button-esc" on:click={() => escChange(false, 'credits')}>
					<span class="button-esc-icon">👥</span> Credits
				</Button>
			</esc-menu>
		</b-x>
	{:else if selection == 'changelog'}
		<Window nav="back exit" title="CHANGELOG" on:back={() => escChange()} on:exit={() => escChange(true)}>
			<Changelog/>
		</Window>
	{:else if selection == 'settings'}
		<Window nav="back exit" title="SETTINGS" on:back={() => escChange()} on:exit={() => escChange(true)}>
			<Settings/>
		</Window>
	{:else if selection == 'credits'}
		<Window nav="back exit" title="CREDITS" on:back={() => escChange()} on:exit={() => escChange(true)}>
			<Credits/>
		</Window>
	{/if}
</div>