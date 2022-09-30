<script>
	export let title;
	export let id;

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
	<div id="winHeader" style="display:flex;justify-content:space-between;align-items:center;padding:4px 4px;margin-bottom:12px">
		<button class="icoButton icoNav" on:click={escBack}><img src="./img/icon/nav/back.png" alt="<="></button>
		<h2 style="margin:0;">{title}</h2>
		<button class="icoButton icoNav" on:click={escExit}><img src="./img/icon/nav/exit.png" alt="X"></button>
	</div>
	<slot/>
</div>