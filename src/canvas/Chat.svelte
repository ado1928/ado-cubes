<script>
	import Box from "lib/Box.svelte";
	import { scrollToBottom } from "public/game/utils.js";

	document.addEventListener('pointerlockchange', () => {
		if (document.pointerLockElement) {
			chat.classList.add("compact");
			inputChat.style.display = 'none';
		} else {
			chat.classList.remove("compact");
			inputChat.style.display = 'flex';
		};
	}) 
</script>

<Box id="chat" classes="chat">
	<div id="messages">
	</div>
	<input id="inputChat" type="text">
</Box>