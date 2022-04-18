<main id="winWelcome" class="box center" style="text-align:center">
	<img src="./images/svgs/adocubes.svg"><br><br>

	Login<br>
	Username: <input id="inputUsername"><br>
	Password: <input id="inputPassword" value="this input does nothing for now. pls ignore">
	
	<div class="io-captcha" data-pubkey="AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADO" data-theme="dark" data-scale="1.0" data-font="mono" data-callback-solve="solve" data-widgetid="iocaptcha"></div>
	<p id="captchaPlease" style="display:none;"><br>Please take the captcha!</p>
	<script>function solve(uuid) {verify(uuid)}</script>
</main>