<script>
	export let placeAtRaycast;
	export let placeInCamera
</script>

<div id="switchPlacement" class="box">
	<button id="placeAtRaycast" on:click={placeAtRaycast}><img src="./images/icons/placeAtRaycast.svg" alt="place at raycast"></button>
	<button id="placeInCamera" on:click={placeInCamera}><img src="./images/icons/placeInCamera.svg" alt="place in camera"></button>
</div>