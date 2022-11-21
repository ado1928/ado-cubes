<script>
	import Button from 'lib/Button.svelte';
	import Checkbox from 'lib/Checkbox.svelte'
	//import toml from 'toml'

	let promise = getSettingsStructure();

	async function getSettingsStructure() {
		let local = await localStorage.settings;
		let sets = await fetch('./settings.json');
		let text = await sets.text();

		if (local) return await JSON.parse(text);
		return await JSON.parse(text);
	};

	async function switchTab(tab) {
		let tabs = await promise
		let tonker = (tab == 'all') ? 'flex' : 'none';
		await tabs.forEach(tab => {
			tab = document.getElementById(tab.id + 'TabContent');
			tab.style.display = tonker;
		});
		if (tab !== 'all') document.getElementById(`${tab}TabContent`).style.display = 'flex'
	}

	async function saveSettings() {
		let settings = await promise;
		let aaa = {};
		await settings.forEach(tab => {
			let sets = document.getElementById(`${tab.id}TabContent`).children;
			for (let i = 0; i < sets.length; i++) {
				if (sets[i].tagName == 'GAME-SETTING') {
					let set = sets[i].children[0]
					aaa[tab.id] = Object.assign(
						{}, aaa[tab.id],
						JSON.parse(`{"${[sets[i].getAttribute('alt')]}": ${(set.type !== 'checkbox') ? ((isNaN(set.value)) ? `"${set.value}"` : set.value) : set.checked}}`)
					)
				}
			}
		});
		console.log(localStorage.settings = JSON.stringify(aaa))
	}

	async function loadSettings() {
		let settings = localStorage.settings
	}

	function changeKeybind(event) {
		event.preventDefault();
		event.path[0].value = event.code;
	}

	// this looks very wrong
	function changeSlider(event) {
		event.path[1].children[0].children[0].innerHTML = event.path[0].value
	}
</script>

<game-settings>
	<settings-tab>
		{#await promise}
			Loading...
		{:then tabs}
			<Button on:click={() => switchTab('all')}>All</Button>
			{#each tabs as tab}
				<Button on:click={() => switchTab(tab.id)}>{tab.label}</Button>
			{/each}
		{/await}
	</settings-tab>

	<settings-status>
		<div>
			<Button on:click={saveSettings}>Save</Button>
			<Button on:click={() => promise = getSettingsStructure()}>Reload</Button>
			<Button>Set to default</Button>
		</div>
		<p>Unsaved changes!</p>
	</settings-status>
	
	<settings-content>
		{#await promise}
			<div style="display:flex;flex-direction:column;align-items:center;margin-top:16px">
				<img src="./img/loading.gif">
				Loading...
			</div>
		{:then settings}
			{#each settings as tab}
				<tab-content id={tab.id + 'TabContent'} style="display:flex;flex-direction:column;padding:16px">
					<h3 style="margin:0">{tab.label}</h3>
					{#each tab.structure as set}
						{#if set.type == 'line'}
							<line-horizontal/>
						{:else}
							{#if set.type !== 'slider'}
								<game-setting alt={set.id}>
									{#if set.type !== 'line'}{set.label}{/if}

									{#if set.type == 'keybind'} <input type='text' value={set.value} on:keydown={e => changeKeybind(e)}>
									{:else if set.type == 'toggle'} <input type="checkbox" checked={set.value}>
									{:else if set.type == 'dropdown'} <select>{#each set.options as option}<option>{option}</option>{/each}</select>
									{:else} unknown type `{set.type}` {/if}
								</game-setting>
							{:else}
								<game-setting class="setting-slider" alt={set.id} style="display:flex;flex-direction:column-reverse;margin-top:6px;gap:6px">
									<input type='range'
										min={(set.min) ? set.min : null}
										max={(set.max) ? set.max : null}
										step={(set.step) ? set.step : null}
										value={set.value}
										on:input={e => changeSlider(e)}
									>

									<p>{set.label} <b>{set.value}</b></p>
								</game-setting>
							{/if}
						{/if}
					{/each}
				</tab-content>
			{/each}
		{/await}
	</settings-content>
</game-settings>