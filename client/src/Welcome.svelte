<script>
	import Button from "lib/Button.svelte";
	import Input from "lib/Input.svelte";
	import tooltip from "lib/tooltip.js";
	import splashTexts from "public/game/splash texts.json";
	import { setHide, coloride } from "public/game/utils.js";

	let logo = "./img/logo/adocubes.svg";
	let splashTextPosition;
	let nickname = (['', undefined].includes(localStorage.lastUsedNickname))
		? `player${Math.floor(Math.random() * 65536)}`
		: localStorage.lastUsedNickname;

	if (config.enableRandomAndSpecialLogos) {
		switch (Math.floor(Math.random() * 1928)) {
			case 727: logo = "./img/logo/ado!.svg"; splashTextPosition = "bottom:52%"; break
			case 900: logo = "./img/logo/aaaaaaaa.svg"; break
			case 1928: logo = "./img/logo/odacebus.svg"
		}
	}

	function saveUsername() {
		localStorage.lastUsedNickname = nickname
	}

	let worlds = [];
	socket.on('worldslist', data => {
		worlds = data;
		console.log(worlds);
	});
</script>

<div id="welcome">
	<div class="blur-background"/>

	<div class="box login center">
		<h2>LOGIN</h2>
		<div style="display:flex;align-items:center;gap:6px">
			<p>
				Nickname:<br>
				<b>{nickname.length}</b>/30
			</p>
			<input id="inputUsername" type="text" maxlength="30" on:change={saveUsername} bind:value={nickname}/>
		</div>

		<div style="display:flex;align-items:center;gap:6px">
			World:
			<select id="selectWorld">
				{#each worlds as world}
					<option>{world}</option>
				{/each}
			</select>
		</div>

		<div>
			<Button id="joinWorldButton">Join</Button> as <b data-tooltip="it's you!" use:tooltip>{@html coloride(nickname)}</b>
		</div>

		<br>

		<p><strong>IMPORTANT:</strong> Check controls by pressing Escape, click on Settings, and look at Input category.</p>
	</div>

	<div class="box links">
		<a href="https://discord.gg/rNMTeADfnc" data-tooltip="Discord server" use:tooltip><img src="./img/icon/social/discord.png"></a>
		<a href="https://github.com/ado1928/ado-cubes" data-tooltip="Source code" use:tooltip><img src="./img/icon/social/github.png"></a>
	</div>

	<img src={logo} class="floaty-adocubes center">

	<p class="splash-text center" style={splashTextPosition}>
		{splashTexts['default'][Math.floor(Math.random() * splashTexts['default'].length)]}
	</p>
</div>