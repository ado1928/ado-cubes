<script>
	document.onkeydown = event => {
		if (event.key === "Escape" && document.activeElement.tagName !== "INPUT") {
			esc.style.display = (esc.style.display == "block") ? 'none' : 'block';
			credits.style.display = 'none';
			settings.style.display = 'none';
			changelog.style.display = "none";
		}
	}

	function escHide() {
		esc.style.display = 'none'
	}
	function escOpen(win) {
		win.style.display = 'block'; escHide()
	}
</script>

<div id="esc">
	<img src="./img/logo/adocubes.svg" class="floaty-adocubes">
	<div id="escMenu" class="box center">
		<button id="escReturn" on:click={escHide}>⬅️ Return</button>
		<button id="escChangelog" on:click={() => escOpen(changelog)}>📰 Changelog</button>
		<button id="escSettings" on:click={() => escOpen(settings)}>⚙️ Settings</button>
		<button id="escCredits" on:click={() => escOpen(credits)}>👥 Credits</button>
	</div>
</div>