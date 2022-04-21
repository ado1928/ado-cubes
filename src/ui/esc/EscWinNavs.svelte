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

<div style="display:flex;justify-content:space-between;align-items:center;">
	<button on:click={escBack}><img src="./images/icons/menu back.svg" alt="<="></button>
	<strong><slot/></strong>
	<button on:click={escExit}><img src="./images/icons/exit.svg" alt="X"></button>
</div>