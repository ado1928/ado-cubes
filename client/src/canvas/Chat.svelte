<script>
	import Box from "lib/Box.svelte";
	import { createMessage, coloride } from "public/game/utils.js";
	let input = '';

	document.addEventListener('pointerlockchange', () => {
		if (document.pointerLockElement) {
			chat.classList.add("compact")
		} else {
			chat.classList.remove("compact")
		}
	})

	socket.on('joinMessage', data => {
		createMessage(`<b>${coloride(data.player, true)}</b> joined the world`, "ui/msg/player join");
	});

	socket.on('leaveMessage', data => {
		createMessage(`<b>${coloride(data.player, true)}</b> left the world`, "ui/msg/player left");
	});

	socket.on('message', data => {
		console.log(data);
		createMessage(`<b title="session id ${data.sender.id}" style="cursor:help">${coloride(data.sender.name, true)}:</b> ${coloride(data.content)}`);
	});

	socket.on('serverMessage', data => { // this is unused, but will keep it here
		createMessage(`SERVER MESSAGE: ${data.content}`);
	});
</script>

<Box id="chat" classes="chat">
	<div class="chatbox">
		<input class="width-fill-available" id="inputChat" type="text" maxlength="1600" bind:value={input}>
		<!--<p>{input.length}/1600</p>-->
	</div>
	<div id="messages"/>
</Box>