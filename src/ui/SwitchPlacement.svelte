<script>
	function escOpen() {
		esc.style.display = (esc.style.display == "flex") ? "none" : "flex"
	}
</script>

<div id="switchPlacement" class="box">
	<button id="escOpen" class="icoButton ico" on:click={escOpen}><img src="./images/icons/exit.svg" alt="esc"></button>
	<button id="placeAtRaycast" class="icoButton ico"><img src="./images/icons/on raycast.svg" alt="place at raycast"></button>
	<button id="placeInCamera" class="icoButton ico"><img src="./images/icons/in camera.svg" alt="place in camera"></button>
</div>