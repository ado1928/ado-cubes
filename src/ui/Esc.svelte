<script>
	document.onkeydown = event => {
		if (event.key === "Escape" && document.activeElement.tagName !== "INPUT") {
			esc.style.display = (esc.style.display == "block") ? 'none' : 'block';
			credits.style.display = 'none';
			settings.style.display = 'none';
			//changelog.style.display = "none";
		}
	}

	function escHide() {
		esc.style.display = "none"
	}
	function escOpen(win) {
		win.style.display = "block"; escHide()
	}

</script>

<div id="esc">
	<img src="./img/logo/adocubes.svg" style="position:absolute;transform:translate(-50%, -256px);top:50%;left:50%;pointer-events:none">
	<div id="escMenu" class="box center">
		<button id="escReturn" on:click={escHide}>⬅️ Return</button>
		<button id="escChangelog" on:click={escHide}>📰 Changelog</button>
		<button id="escSettings" on:click={() => escOpen(settings)}>⚙️ Settings</button>
		<button id="escCredits" on:click={() => escOpen(credits)}>👥 Credits</button>
		<br>
		<div style="display:flex;flex-direction:row;width:auto">
			<a href="https://github.com/ado1928/ado-cubes" target="_blank" rel="noopener noreferrer">Source code</a>&nbsp•&nbsp<a href="https://discord.gg/rNMTeADfnc" target="_blank" rel="noopener noreferrer">Discord server</a>
		</div>
	</div>
</div>