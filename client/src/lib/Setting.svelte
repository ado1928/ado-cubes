<script>
	import { onMount, afterUpdate } from 'svelte';
	import Button from "lib/Button.svelte";
	import tooltip from "lib/tooltip.js";
	import { setHide } from "public/game/utils.js";

	export let set;
	if (config[set] == undefined) throw `setting ${set} does not exist`

	export let type = null;
	export let label = "the labelo";
	export let value = "the valueo";
	export let checked = false;
	export let max = 100;
	export let min = 0;
	export let step = 1;

	let docEl = document.documentElement;
	let element, resetter;

	function init() {
		displayValue();
		syncSetting();
	}

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
		setHide(resetter, !localStorage[set]);
		if (config[set] == config.defaults[set]) return resetSetting();
	}

	function changeSetting(event) {
		let input = event.target
		switch (type) {
			case 'checkbox':	config[set] = input.checked; break;
			case 'range':		config[set] = Number(input.value); break;
			default:			config[set] = input.value
		};
		setHide(resetter, !localStorage[set]);
		if (config[set] == config.defaults[set]) return resetSetting();
		syncSetting();
	}

	function syncSetting() {
		switch (set) {
			case 'chatWidth': docEl.style.setProperty('--chat-width', `${value}px`); break;
			case 'chatMaxLines': docEl.style.setProperty('--chat-maxheight', `${16 * value}px`); break;
			case 'rendererPixelRatio': window.dispatchEvent(new Event('resize'));
		}
	}

	function resetSetting() {
		config.reset(set);
		setHide(resetter, true);
		init();
	}

	onMount(() => {
		resetter = element.querySelector('.reset-to-default');
		setHide(resetter, !localStorage[set])
	});

	init();
</script>


<div bind:this={element} class="setting" on:input={changeSetting}>
	<div
		role="button"
		class="reset-to-default"
		data-tooltip="Reset to default"
		use:tooltip
		on:click={resetSetting}
	/>
	{#if type == 'range'}
		<div class="range">
			<p>{@html label}</p>
			<input type="range" {max} {min} {step} bind:value={value} data-tooltip={value} use:tooltip>
		</div>
	{:else if type == 'checkbox'}
		<input type="checkbox" bind:checked={checked}>
		<p>{@html label}</p>
	{:else if type == 'keybind'}
		<input type="text" on:keydown={e => changeKeybind(e)} bind:value={value}>
		<p>{@html label}</p>
	{:else}
		invalid type {type}
	{/if}
</div>