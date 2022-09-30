<script>
	function escOpen() { esc.style.display = (esc.style.display == "block") ? "none" : "block" };
</script>

<div id="toolbar" class="box">
	<button id="escOpen" on:click={escOpen}><img src="./img/icon/nav/esc.png"></button>
	<div style="background:#666;width:2px;height:auto"></div>
	<button id="placeCubeBasic"><img src="./img/icon/cube type/basic.png"></button>
	<button id="placeCubeLight"><img src="./img/icon/cube type/light.png"></button>
	<div style="background:#666;width:2px;height:auto"></div>
	<button id="placeAtRaycast"><img src="./img/icon/placement/on raycast.png" alt="place at raycast"></button>
	<button id="placeInCamera"><img src="./img/icon/placement/in camera.png" alt="place in camera"></button>
</div>