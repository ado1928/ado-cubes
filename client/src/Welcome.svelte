<script>
	import Box from "lib/Box.svelte";
	import Button from "lib/Button.svelte";
	import splashTexts from "public/game/splash texts.json";
	import { toggleShow, usingMobile } from "public/game/utils.js";
	import { config } from "public/game/config.js";

	let logo = "./img/logo/adocubes.svg";
	let splashTextPosition;
	let nickname = (['', undefined].includes(localStorage.lastUsedNickname))
		? `player${Math.floor(Math.random() * 9999)}`
		: localStorage.lastUsedNickname;

	if (config.enableRandomAndSpecialLogos) {
		switch (Math.floor(Math.random() * 1928)) {
			case 727: logo = "./img/logo/ado!.svg"; splashTextPosition = "top:38.5%"; break
			case 900: logo = "./img/logo/aaaaaaaa.svg"; break
			case 1928: logo = "./img/logo/odacebus.svg"
		}
	}

	if (usingMobile()) alert("mobile is very buggy.");
</script>

<div id="welcome">
	<div class="blur-background hide show"/>

	<Box classes="login hide show">
		<h2>LOGIN</h2>
		<div>
			Nickname (<b>{nickname.length}</b>/30)
			<input id="inputUsername" type="text" maxlength="30" oninput="localStorage.setItem('lastUsedNickname', inputUsername.value)" bind:value={nickname}>
		</div>

		<div>
			World: <select id="selectWorld"></select>
			<Button id="joinWorldButton">Join</Button>
		</div>

		<br>

		<p><strong>IMPORTANT:</strong> Check controls by pressing Escape, click on Settings, and look at Input category.</p>
	</Box>

	<img src={logo} class="floaty-adocubes hide show">
	<p class="splash-text hide show" style={splashTextPosition}>{splashTexts['default'][Math.floor(Math.random() * splashTexts['default'].length)]}</p>
</div>