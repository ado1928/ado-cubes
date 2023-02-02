<script>
	import { onMount } from 'svelte';
	import Box from "lib/Box.svelte";
	import Button from "lib/Button.svelte";
	import splashTexts from "public/game/splash texts.json";

	onMount(() => {
		inputUsername.value = localStorage.getItem('lastUsedUsername');
	})
</script>

<div id="welcome">
	<Box class="login-box" style="flex-direction:column;width:400px;top:50%;left:50%;padding:16px;translate:-50% 0;">
		<h2>LOGIN</h2>
		<div>
			Nickname: <input id="inputUsername" type="text" onkeypress="localStorage.setItem('lastUsedUsername', inputUsername.value)">
		</div>

		<div>
			World: <select id="selectWorld"></select>
			<Button id="joinWorld">Join</Button>
		</div>

		<br>

		<p><strong>IMPORTANT:</strong> Check controls by pressing Escape, click on Settings, and look at Input category.</p>
	</Box>

	<img src="./img/logo/adocubes.svg" class="floaty-adocubes">
	<p class="splash-text">{splashTexts['default'][Math.floor(Math.random() * splashTexts['default'].length)]}</p>

	<Box style="gap:6px;bottom:6px;left:50%;transform:translateX(-50%)">
		<a href="https://discord.gg/rNMTeADfnc">discord server</a>
		•
		<a href="https://github.com/ado1928/ado-cubes">source code</a>
	</Box>
</div>