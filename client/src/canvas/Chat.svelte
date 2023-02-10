<script>
	import Box from "lib/Box.svelte";
	let input = '';

	document.addEventListener('pointerlockchange', () => {
		if (document.pointerLockElement) {
			chat.classList.add("compact")
		} else {
			chat.classList.remove("compact")
		}
	}) 
</script>

<Box id="chat" classes="chat">
	<div id="messages">
	</div>
	<input id="inputChat" type="text" maxlength="1600" bind:value={input}>
	<p>{input.length}/1600</p>
</Box>