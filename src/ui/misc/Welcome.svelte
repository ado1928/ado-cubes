<script>
	let src = "./images/logo/adocubes-full.svg";
	let style = "position:absolute;transform:translate(-50%, -174px);left:50%;pointer-events:none";

	window.onload = function() {

		// this is terrible.

		if (miscEnableRandomLogos.checked) {
			if (Math.floor(Math.random() * 70) == 1) {
				odacebus()
			} else if (Math.floor(Math.random() * 900) == 1) {
				aaaaaaaa()
			} else if (Math.floor(Math.random() * 727) == 1) {
				ado()
			} else if (audioEnableMusic.checked) {
				let music = new Audio('./audio/music/The Moon.ogg');
				music.play()
			}
		} else if (audioEnableMusic.checked) {
			let music = new Audio('./audio/music/The Moon.ogg');
			music.play()
		}

		function odacebus() { src = "./images/logo/odacebus.svg"; }
		function aaaaaaaa() {
			src = "./images/logo/aaaaaaaa.svg"
			if (audioEnableMusic.checked) {
				let aaaaaaaa = new Audio('./audio/screaming.ogg')
				aaaaaaaa.play()
			}
		}
		function ado() {
			src = "./images/logo/ado!.svg";
			style = "position:absolute;transform:translate(-50%, -164px);left:50%;pointer-events:none";
			if (audioEnableMusic.checked) {
				let ado = new Audio('./audio/welcome to ado.ogg');
				ado.play()
			}
		}
	}
</script>

<div id="winWelcome" class="box win center" style="top:62%">
	<div>
		<img id="welcomeLogo" {src} {style}>
	</div>
	<br><br>
	Username: <input id="inputUsername" type="text"><br>
	Password: <input id="inputPassword" type="text" value="this input does nothing for now. pls ignore"><br>
	<p id="noNeedToVerify" style="display:none;">It's seems you have disabled verification.<br>Please note that you won't be able to connect to the server.<br></p><br>

	<strong>IMPORTANT: </strong>Check controls by pressing Escape, click on Settings, and look at Input category.<br><br>

	<strong>NOTE: </strong>iocaptcha at this time is a bit iffy.<br>If a captcha is a too hard for you, either refresh page or report it.<br>Not entirely sure if reporting even works.

	<p id="captchaPlease" style="display:none;"><br>Please take the captcha! If you can't see it, please refresh page.</p>
	<div class="io-captcha" data-pubkey="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADO" data-theme="dark" data-scale="1.0" data-font="mono" data-callback-solve="solve" data-widgetid="iocaptcha"/>
</div>