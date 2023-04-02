<script>
	import { setHide } from 'public/game/utils.js';

	import Box from "lib/Box.svelte";
	import Button from 'lib/Button.svelte';
	import Window from 'lib/Window.svelte';

	import Settings from './Settings.svelte';
	import Changelog from './Changelog.svelte';
	import Credits from './Credits.svelte';

	document.addEventListener('keydown', event => {
		if (event.key !== "Escape" && document.activeElement.tagName !== "input") return;
		let windows = document.getElementsByClassName("window");
		for (let i = 0; i < windows.length; i++) setHide(windows[i], true);
		changeEsc(true);
	});

	function changeEsc(toggle, win) {
		let windows = document.getElementsByClassName("window");
		if (toggle) setHide(esc);
		if (win) {
			setHide(document.getElementById(win));
			setHide(esc, true);
		}
	}
</script>

<div>
	<Box id="esc" classes="center esc-menu">
		<Button type="esc" on:click={() => changeEsc(true)}>
			<img src="/img/icon/esc/return.png"> Return
		</Button>
		<Button id="leaveWorldButton" type="esc">
			<img src="/img/icon/esc/return.png"> Leave world
		</Button>
		<p><br></p>
		<Button type="esc" on:click={() => changeEsc(false, 'settings')}>
			<img src="/img/icon/esc/settings.png"> Settings
		</Button>
		<Button type="esc" on:click={() => changeEsc(false, 'changelog')}>
			<img src="/img/icon/esc/changelog.png"> Changelog
		</Button>
		<Button type="esc" on:click={() => changeEsc(false, 'credits')}>
			<img src="/img/icon/esc/credits.png"> Credits
		</Button>
	</Box>
</div>

<Window id="settings" title="SETTINGS" on:back={() => changeEsc(false, 'settings')} on:exit={() => changeEsc(true, 'settings')}>
	<Settings/>
</Window>
<Window id="changelog" title="CHANGELOG" on:back={() => changeEsc(false, 'changelog')} on:exit={() => changeEsc(true, 'changelog')}>
	<Changelog/>
</Window>
<Window id="credits" title="CREDITS" on:back={() => changeEsc(false, 'credits')} on:exit={() => changeEsc(true, 'credits')}>
	<Credits/>
</Window>