<script>
	import Button from 'lib/Button.svelte';
	import { toggleDisplay } from 'public/game/utils.js';

	function changePlacementMethod() {
	}

	function changeMovementMethod() {
	}
</script>

<b-x id="cubeTypes" class="center" style="display:none;top:revert;bottom:76px">
	<Button type="button-toolbar"><img src="./img/icon/cube type/basic.png"></Button>
	<Button type="button-toolbar"><img src="./img/icon/cube type/light.png"></Button>
	<Button type="button-toolbar"><img src="./img/icon/cube type/sign.png"></Button>
</b-x>

<b-x id="toolbar">
	<Button type="button-toolbar" on:click={() => toggleDisplay(esc)}>
		<img src="./img/icon/nav/esc.png">
	</Button>

	<line-vertical/>

	<Button type="button-toolbar" on:click={() => toggleDisplay(cubeTypes)}>
		<img src="./img/icon/cube type/basic.png">
	</Button>
	<Button type="button-toolbar" on:click={changePlacementMethod}>
		{#if true}
			<img src="./img/icon/placement/on raycast.png" alt="place at raycast">
		{:else}
			<img src="./img/icon/placement/in camera.png" alt="place in camera">
		{/if}
	</Button>

	<line-vertical/>

	<Button type="button-toolbar" on:click={changeMovementMethod}>
		{#if true}
			🕊️
		{:else}
			🚶
		{/if}
	</Button>
</b-x>