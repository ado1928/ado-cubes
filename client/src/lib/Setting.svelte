<script>
	import Button from "lib/Button.svelte";
	import { config } from "public/game/config.js";

	export let set;
	if (config[set] == undefined) throw console.error(`setting ${set} does not exist`);

	export let type = null;
	export let label = "the labelo";
	export let value = "the valueo";
	export let checked = false;
	export let max = 100;
	export let min = 0;
	export let step = 1;

	let classes = (type == 'range') ? "setting range" :  "setting";

	let docEl = document.documentElement;

	function displayValue() {
		switch (type) {
			case 'checkbox':	checked = config[set]; break
			default:			value = config[set]
		}
	}

	function changeKeybind(event) {
		event.preventDefault();
		value = event.code;
		config[set] = event.code;
	}

	function changeSetting() {
		let input = this.children[1];
		switch (type) {
			case 'checkbox':	config[set] = input.checked; break
			case 'range':		config[set] = Number(input.value); break
			default:			config[set] = input.value
		};
		applySetting();
	}

	function applySetting() {
		switch (set) {
			case 'chatWidth': docEl.style.setProperty('--chat-width', `${value}px`);
			case 'chatMaxLines': docEl.style.setProperty('--chat-maxheight', `${16 * value}px`);
			case 'rendererPixelRatio': { window.dispatchEvent(new Event('resize')) }
		}
	}

	function resetSetting() {
		config.reset(set);
		init();
	}

	function init() {
		displayValue();
		applySetting();
	}

	init();
</script>


<div class={classes} on:change={changeSetting}>
	{#if type == 'range'}
		<p><b>{value}</b> {label}</p>
		<input type="range" {max} {min} {step} bind:value={value}>
	{:else if type == 'checkbox'} <p>{label}</p> <input type="checkbox" bind:checked={checked}>
	{:else if type == 'dropdown'} <p>{label}</p> <select bind:value={value}><slot/></select>
	{:else if type == 'keybind'} <p>{label}</p> <input type="text" on:keydown={e => changeKeybind(e)} bind:value={value}>
	{:else} invalid type {type}
	{/if}
	<Button on:click={resetSetting}>Reset</Button>
</div>