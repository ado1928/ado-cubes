<script>
	function escBack() {
		escExit();
		esc.style.display = "flex";
	}
	function escExit() {
		winSettings.style.display = "none";
		winControls.style.display = "none";
		winCredits.style.display = "none";
	}
</script>

<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 4px;margin-bottom:12px;">
	<button class="iconav" on:click={escBack}><img src="./images/icons/left arrow.svg" alt="<="></button>
	<strong><slot/></strong>
	<button class="iconav" on:click={escExit}><img src="./images/icons/exit.svg" alt="X"></button>
</div>