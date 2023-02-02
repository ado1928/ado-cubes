<script>
	import { toggleDisplay } from 'public/game/utils.js';

	import Box from "lib/Box.svelte";
	import Button from 'lib/Button.svelte';
	import Window from 'lib/Window.svelte';

	import Settings from './Settings.svelte';
	import Changelog from './Changelog.svelte';
	import Credits from './Credits.svelte';

	document.addEventListener('keydown', event => {
		if (event.key !== "Escape" && document.activeElement.tagName !== "input") return;
		let windows = document.getElementsByClassName("window");
		for (let i = 0; i < windows.length; i++) windows[i].style.display = "none";
		escChange(true);
	});

	function escChange(toggle, win) {
		let windows = document.getElementsByClassName("window");
		if (toggle) esc.style.display = (esc.style.display == 'none') ? 'flex' : 'none';
		if (win) {
			toggleDisplay(document.getElementById(win));
			toggleDisplay(esc);
		}
	}
</script>

<div id="esc" style="display:none">
	<Box classes="center esc-menu">
		<Button type="esc" on:click={() => escChange(true)}>
			<img src="/img/icon/esc/return.png"> Return
		</Button>
		<Button type="esc" on:click={() => document.body.innerHTML = "consequences."}>
			<img src="/img/icon/esc/return.png"> Leave world<br>(do not click)
		</Button>
		<br>
		<Button type="esc" on:click={() => escChange(false, 'settings')}>
			<img src="/img/icon/esc/settings.png"> Settings
		</Button>
		<Button type="esc" on:click={() => escChange(false, 'changelog')}>
			<img src="/img/icon/esc/changelog.png"> Changelog
		</Button>
		<Button type="esc" on:click={() => escChange(false, 'credits')}>
			<img src="/img/icon/esc/credits.png"> Credits
		</Button>
	</Box>
</div>

<Window id="settings" title="SETTINGS" on:back={() => escChange(false, 'settings')} on:exit={() => escChange(true, 'settings')}>
	<Settings/>
</Window>
<Window id="changelog" title="CHANGELOG" on:back={() => escChange(false, 'changelog')} on:exit={() => escChange(true, 'changelog')}>
	<Changelog/>
</Window>
<Window id="credits" title="CREDITS" on:back={() => escChange(false, 'credits')} on:exit={() => escChange(true, 'credits')}>
	<Credits/>
</Window>