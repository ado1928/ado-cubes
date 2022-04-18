<script>
	window.onload = function() {
		escBack.onclick = function escBack() {
			winSettings.style.display = "none";
			esc.style.display = "flex";
		}
		escExit.onclick = function escExit() {
			winSettings.style.display = "none";
			winControls.style.display = "none";
		}
	}
</script>

<div>
	<button id="escBack" onclick="escBack()"><img src="./images/svgs/menu back.svg"/></button>
	<strong><slot/></strong>
	<button id="escExit" onclick="escExit()"><img src="./images/svgs/exit.svg"/></button><br><br>
</div>