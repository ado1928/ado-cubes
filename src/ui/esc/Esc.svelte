<script>
	document.onkeydown = function(e) {
		if(e.key === "Escape" && document.activeElement.tagName !== "INPUT") {
			esc.style.display = (esc.style.display=="block") ? "none":"block";
			winCredits.style.display = "none";
			winSettings.style.display = "none"
		}
	}

	// should probably be switch case?
	function escReturn() {
		esc.style.display = "none"
	}
	function escCredits() {
		esc.style.display = "none";
		winCredits.style.display = "block"
	}
	function escSettings() {
		esc.style.display = "none";
		winSettings.style.display = "block"
	}

</script>

<div id="esc">
	<div id="escMenu" class="box center">
		<button id="escReturn" on:click={escReturn}>Return</button>
		<button id="escCredits" on:click={escCredits}>Credits</button>
		<button id="escSettings" on:click={escSettings}>Settings</button>

		<br>

		<div style="display:flex;flex-direction:row;width:auto">
			<a href="https://github.com/ado1928/ado-cubes" target="_blank" rel="noopener noreferrer">Source code</a>&nbsp•&nbsp<a href="https://discord.gg/rNMTeADfnc" target="_blank" rel="noopener noreferrer">Discord server</a>
		</div>
	</div>
</div>