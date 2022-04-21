<script>
	function escBack() {
		escExit();
		esc.style.display = "flex";
	}
	function escExit() {
		winSettings.style.display = "none";
		winControls.style.display = "none";
	}
</script>

<div>
	<button on:click={escBack}><img src="./images/svgs/menu back.svg"/></button>
	<strong><slot/></strong>
	<button on:click={escExit}><img src="./images/svgs/exit.svg"/></button><br><br>
</div>