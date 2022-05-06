<script>
	function escBack() {
		escExit();
		esc.style.display = "flex"
	}
	function escExit() {
		winSettings.style.display = "none";
		winCredits.style.display = "none"
	}
</script>

<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 4px;margin-bottom:12px">
	<button class="icoButton icoNav" on:click={escBack}><img src="./images/icons/left arrow.svg" alt="<="></button>
	<h2 style="margin:0;"><slot/></h2>
	<button class="icoButton icoNav" on:click={escExit}><img src="./images/icons/exit.svg" alt="X"></button>
</div>