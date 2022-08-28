<script>
	document.onkeydown = (event) => {
		if (event.key === "Escape" && document.activeElement.tagName !== "INPUT") {
			esc.style.display = (esc.style.display == "block") ? "none" : "block";
			credits.style.display = "none";
			settings.style.display = "none"
		}
	}

	// should probably be switch case?
	function escReturn() {
		esc.style.display = "none"
	}
	function escSettings() {
		esc.style.display = "none";
		settings.style.display = "block"
	}
	function escCredits() {
		esc.style.display = "none";
		credits.style.display = "block"
	}

</script>

<div id="esc">
	<div id="escMenu" class="box center">
		<button id="escReturn" class="escButton" on:click={escReturn}>Return</button>
		<button id="escSettings" class="escButton" on:click={escSettings}>Settings</button>
		<button id="escCredits" class="escButton" on:click={escCredits}>Credits</button>
		<br>
		<div style="display:flex;flex-direction:row;width:auto">
			<a href="https://github.com/ado1928/ado-cubes" target="_blank" rel="noopener noreferrer">Source code</a>&nbsp•&nbsp<a href="https://discord.gg/rNMTeADfnc" target="_blank" rel="noopener noreferrer">Discord server</a>
		</div>
	</div>
</div>