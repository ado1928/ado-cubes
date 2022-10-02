<script>
	import { onMount } from 'svelte';

	let src = "./img/logo/adocubes.svg";
	let style = "position:absolute;transform:translate(-50%, -256px);top:50%;left:50%;pointer-events:none";

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
	<img id="welcomeLogo" {src} {style}>
	
	<div class="box" style="flex-direction:column;width:400px;top:48%;right:62%;padding:16px">
		Nickname: <input id="inputUsername" type="text" onkeypress="localStorage.setItem('lastUsedUsername', inputUsername.value)">
		<p><img src="./cursor/wait.gif"> ignore this gif</p><br>

		World:<select id="selectWorld"></select><br>

		<p id="captchaPlease" style="display:none;"><br>Please take the captcha! If you can't see it, please refresh page.</p>
		<div class="io-captcha" data-pubkey="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADO" data-theme="dark" data-scale="1.0" data-font="mono" data-callback-solve="solve" data-widgetid="iocaptcha"></div>
	</div>

	<div class="box" style="flex-direction:column;width:400px;top:48%;left:62%;padding:16px">
		<p><strong>IMPORTANT:</strong> Check controls by pressing Escape, click on Settings, and look at Input category.</p><br><br>

		<p><strong>NOTE:</strong> iocaptcha at this time is a bit iffy.<br>
	If a captcha is a too hard for you, refresh the page.</p><br>
	</div>

	<p class="no-text-shadow" style="position:absolute;color:#000;bottom:6px">adocubes 2022</p>


</div>