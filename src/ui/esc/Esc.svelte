<script>
	document.onkeydown = function(e) {
		if(e.key === "Escape" && document.activeElement.tagName !== "INPUT") {
			esc.style.display = "flex";
			winControls.style.display = "none";
			winCredits.style.display = "none";
			winSettings.style.display = "none";
		}
	}

	function escReturn() {
		esc.style.display = "none";
	}
	function escControls() {
		esc.style.display = "none";
		winControls.style.display = "block";
	}
	function escCredits() {
		esc.style.display = "none";
		winCredits.style.display = "block";
	}
	function escSettings() {
		esc.style.display = "none";
		winSettings.style.display = "block";
	}

</script>

<div id="esc" class="box center">
	<button id="escReturn" on:click={escReturn}>Return</button>
	<button id="escControls" on:click={escControls}>Controls</button>
	<button id="escCredits" on:click={escCredits}>Credits</button>
	<button id="escSettings" on:click={escSettings}>Settings</button>
</div>