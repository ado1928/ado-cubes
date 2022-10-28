<script>
	export let title;
	export let id;

	function escBack() {
		escExit();
		esc.style.display = 'flex'
	}
	function escExit() {
		settings.style.display = 'none';
		credits.style.display = 'none';
		changelog.style.display = 'none'
	}
</script>

<div {id} class="box win center">
	<div style="margin:12px">
		<div id="winHeader" style="display:flex;justify-content:space-between;align-items:center;padding:4px 4px">
			<button class="button-icon" on:click={escBack}><img src="./img/icon/nav/back.png" alt="<="></button>
			<h2 style="margin:0;">{title}</h2>
			<button class="button-icon" on:click={escExit}><img src="./img/icon/nav/exit.png" alt="X"></button>
		</div>
		<slot/>
	</div>
</div>