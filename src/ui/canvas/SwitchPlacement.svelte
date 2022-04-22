<script>
	export let placeAtRaycast;
	export let placeInCamera
</script>

<div id="switchPlacement" class="box">
	<button id="placeAtRaycast" class="icon" on:click={placeAtRaycast}><img src="./images/icons/place at raycast.svg" alt="place at raycast"></button>
	<button id="placeInCamera" class="icon" on:click={placeInCamera}><img src="./images/icons/place in camera.svg" alt="place in camera"></button>
</div>