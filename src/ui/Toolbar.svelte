<script>
	function escOpen() { esc.style.display = (esc.style.display == "block") ? "none" : "block" };
</script>

<div id="toolbar" class="box">
	<button class="button-icon" id="escOpen" on:click={escOpen}><img src="./img/icon/nav/esc.png"></button>
	<div style="background:#666;width:2px;height:auto"></div>
	<button class="button-icon" id="placeCubeBasic"><img src="./img/icon/cube type/basic.png"></button>
	<button class="button-icon" id="placeCubeLight"><img src="./img/icon/cube type/light.png"></button>
	<div style="background:#666;width:2px;height:auto"></div>
	<button class="button-icon" id="placeAtRaycast"><img src="./img/icon/placement/on raycast.png" alt="place at raycast"></button>
	<button class="button-icon" id="placeInCamera"><img src="./img/icon/placement/in camera.png" alt="place in camera"></button>
</div>