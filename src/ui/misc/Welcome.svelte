<script>
	let src = "./images/logo/adocubes-full.svg";
	let style = "position:absolute;transform:translate(-50%, -174px);left:50%;z-index:-1;";
	//  when you see it
	if (Math.floor(Math.random() * 727) == 1) {
		src = "./images/logo/ado.svg";
		style = "position:absolute;transform:translate(-50%, -164px);left:50%;z-index:-1;";
	}
</script>

<div id="winWelcome" class="box win center" style="top:62%">
	<img id="welcomeLogo" {src} {style}>
	<br><br>
	Username: <input id="inputUsername" type="text"><br>
	Password: <input id="inputPassword" type="text" value="this input does nothing for now. pls ignore"><br>
	<p id="noNeedToVerify" style="display:none;">It's seems you have disabled verification.<br>Please note that you won't be able to connect to the server.<br></p><br>

	<strong>IMPORTANT: </strong>You can check controls by pressing Escape, and then selecting Controls.<br><br>

	<strong>NOTE: </strong>iocaptcha at this time is a bit iffy.<br>If a captcha is a too hard for you, either refresh page or report it.<br>Not entirely sure if reporting even works.

	<p id="captchaPlease" style="display:none;"><br>Please take the captcha! If you can't see it, please refresh page.</p>
	<div class="io-captcha" data-pubkey="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADO" data-theme="dark" data-scale="1.0" data-font="mono" data-callback-solve="solve" data-widgetid="iocaptcha"/>
</div>