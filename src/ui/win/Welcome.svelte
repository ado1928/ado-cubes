<script>
	let src = "./images/logo/adocubes.svg";
	let style = "position:absolute;transform:translate(-50%, -174px);left:50%;pointer-events:none";

	/*window.onload = () => {
		if (miscEnableRandomLogos.checked) {
			if (Math.floor(Math.random(70) * 70) == 1) src = "./images/logo/odacebus.svg";
			if (Math.floor(Math.random(900) * 900) == 1) src = "./images/logo/aaaaaaaa.svg";
			if (Math.floor(Math.random() * 727) == 1) {
				src = "./images/logo/ado!.svg";
				style = "position:absolute;transform:translate(-50%, -164px);left:50%;pointer-events:none"
			}
		}
	}*/
</script>

<div id="welcome" class="box center" style="top:62%">
	<div>
		<img id="welcomeLogo" {src} {style}>
	</div>
	<br><br><br>
	Nickname: <input id="inputUsername" type="text"><br>
	<p id="noNeedToVerify" style="display:none;">It's seems you have disabled verification.<br>Please note that you won't be able to connect to the server.<br></p><br>

	<strong>important: </strong>Check controls by pressing Escape, click on Settings, and look at Input category.<br><br>

	<strong>note: </strong>iocaptcha at this time is a bit iffy.<br>
	If a captcha is a too hard for you, refresh the page.<br>

	<p id="captchaPlease" style="display:none;"><br>Please take the captcha! If you can't see it, please refresh page.</p>
	<div class="io-captcha" data-pubkey="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADO" data-theme="dark" data-scale="1.0" data-font="mono" data-callback-solve="solve" data-widgetid="iocaptcha"/>
</div>