<script>
	import { onMount } from 'svelte';
	import Button from 'lib/Button.svelte'

	let src = "./img/logo/adocubes.svg";

	onMount(() => {
		inputUsername.value = localStorage.getItem('lastUsedUsername');
	})

	/*window.onload = () => {
		if (miscEnableRandomLogos.checked) {
			if (Math.floor(Math.random(70) * 70) == 1) src = "./img/logo/odacebus.svg";
			if (Math.floor(Math.random(900) * 900) == 1) src = "./img/logo/aaaaaaaa.svg";
			if (Math.floor(Math.random() * 727) == 1) {
				src = "./img/logo/ado!.svg";
				style = "position:absolute;transform:translate(-50%, -164px);left:50%;pointer-events:none"
			}
		}
	}*/
</script>

<div id="welcome">
	<img id="welcomeLogo" {src} class="floaty-adocubes">
	
	<b-x style="flex-direction:column;width:400px;top:48%;right:62%;padding:16px">
		<h2>LOGIN</h2>
		<div class="central">
			Nickname: <input id="inputUsername" type="text" onkeypress="localStorage.setItem('lastUsedUsername', inputUsername.value)">
		</div>

		<div class="central">
			World: <select id="selectWorld"></select>
			<Button id="joinWorld">Join</Button>
		</div>
	</b-x>

	<b-x style="gap:6px;bottom:6px;left:50%;transform:translateX(-50%)">
		<a href="https://discord.gg/rNMTeADfnc"><img src="./img/icon/socials/discord.png"></a>
		<a href="https://github.com/ado1928/ado-cubes"><img src="./img/icon/socials/github.png"></a>
	</b-x>

	<b-x style="flex-direction:column;width:400px;top:48%;left:62%;padding:16px">
		<p><strong>IMPORTANT:</strong> Check controls by pressing Escape, click on Settings, and look at Input category.</p>
	</b-x>
</div>