<script>
	import Box from "lib/Box.svelte";
	import ChatMessage from "lib/ChatMessage.svelte";
	import { createMessage, coloride, playAudio } from "public/game/utils.js";
	let input = '';

	document.addEventListener('pointerlockchange', () => {
		(document.pointerLockElement)
			? chat.classList.add("compact")
			: chat.classList.remove("compact")
	})

	socket.on('joinMessage', data => {
		createMessage(`<b>${coloride(data.player)}</b> joined the world`, "ui/msg/player join");
	});

	socket.on('leaveMessage', data => {
		createMessage(`<b>${coloride(data.player)}</b> left the world`, "ui/msg/player left");
	});

	socket.on('message', data => {
		messages.prepend(chatMessagesAnchor);
		let message = new ChatMessage({
			props: { data: data },
			target: messages,
			anchor: chatMessagesAnchor,
		});
		playAudio("ui/msg/default", config.uiVolume, !config.disableMessageSounds);
	});

	socket.on('serverMessage', data => { // this is unused, but will keep it here
		createMessage(`SERVER MESSAGE: ${data.content}`);
	});
</script>

<Box id="chat" classes="chat">
	<div class="chatbox">
		<input id="inputChat" type="text" maxlength="1600" bind:value={input}>
	</div>
	<div id="messages">
		<div id="chatMessagesAnchor"/>
	</div>
</Box>