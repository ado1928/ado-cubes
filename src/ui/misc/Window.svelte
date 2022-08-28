<script>
	export let id;
	export let title;

	function escBack() {
		escExit();
		esc.style.display = "flex"
	}
	function escExit() {
		settings.style.display = "none";
		credits.style.display = "none"
	}
</script>

<div {id} class="box win center">
	<div style="display:flex;justify-content:space-between;align-items:center;padding:4px 4px;margin-bottom:12px">
		<button class="icoButton icoNav" on:click={escBack}><img src="./images/icons/back.svg" alt="<="></button>
		<h2 style="margin:0;">{title}</h2>
		<button class="icoButton icoNav" on:click={escExit}><img src="./images/icons/exit.svg" alt="X"></button>
	</div>
	<slot/>
</div>