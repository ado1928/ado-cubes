<script>
	import Box from "lib/Box.svelte";

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
	<input id="inputChat" type="text">
</Box>