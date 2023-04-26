<script>
	import tooltip from "./tooltip.js";
	import { coloride } from "public/game/utils.js";

	export let data;
</script>

<!-- this feels ungodly wrong -->
<p>
	<b data-tooltip={`
		<b>session id:</b> ${data.sender.id}<br>
		<b>time sent:</b> ${new Date(data.timestamp).toLocaleTimeString(navigator.language, { hour12: false })}
	`} use:tooltip>{@html coloride(data.sender.name)}</b><b>:</b>
	{@html coloride(data.content, false)}
</p>