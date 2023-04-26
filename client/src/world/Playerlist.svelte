<script>
	import Box from "lib/Box.svelte";
	import tooltip from "lib/tooltip.js";

	let players = [];

	socket.on('playerlist', data => {
		players = data;
		console.log(players)
	});
</script>

<Box id="playerlist" classes="center hide">
	<strong>PLAYERLIST</strong>
	{#each players as player}
		<b data-tooltip={`<b>session id:</b> ${player.id}`} use:tooltip>{player.name}</b>
	{/each}
</Box>