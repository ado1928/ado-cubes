<script>
	document.onkeydown = function(e) {
		if(e.key === "Escape" && document.activeElement.tagName !== "INPUT") {
			esc.style.display = "flex";
			winSettings.style.display = "none";
			winControls.style.display = "none";

			escReturn.onclick = function escReturn() {
				esc.style.display = "none";
			}
			escControls.onclick = function escControls() {
				esc.style.display = "none";
				winControls.style.display = "block";
			}
			escSettings.onclick = function escSettings() {
				esc.style.display = "none";
				winSettings.style.display = "block";
			}
			escExitServer.onclick = function escExitServer() {
				//code for exiting server
				esc.style.display = "none";
			}
		}
	}
</script>

<div id="esc" class="box center">
	<button id="escReturn" onclick="escReturn()">Return</button>
	<button id="escControls" onclick="escControls()">Controls</button>
	<button id="escSettings" onclick="escSettings()">Settings</button>
	<button id="escExitServer" onclick="escExitServer()">Exit server</button>
</div>