<script>
	import Button from "lib/Button.svelte";
	import { setHide, coloride } from "public/game/utils.js";
	import { marked } from 'marked';

	let baseUrl = "https://raw.githubusercontent.com/adocubes/changelogs/main/"; 
	let index = 0;

	let changelogs = fetch(`${baseUrl}index.json`)
		.then(res => res.json())
		.then(json => { return json });

	let promise = getChangelog(getVersion(0));

	async function getChangelog(version) {
		let ver = await version.then(array => { return array });
		let changelog = await fetch(`${baseUrl}${ver}.md`);
		let text = await changelog.text();
		return text;
	}

	async function getVersion(index) {
		return changelogs.then(json => { return json[index] ?? '' });
	}

	async function updateIndex(num) {
		let list = await changelogs.then(array => { return array });
		index = Math.min(Math.max(index - num, 0), list.length - 1);
		promise = getChangelog(getVersion(index));
	}

	document.addEventListener('readystatechange', async () => {
		let list = await changelogs.then(json => { return json });
		if (document.readyState == 'complete' && localStorage.lastPlayedVersion !== list[0]) {
			setHide(changelog, false);
			localStorage.lastPlayedVersion = list[0];
		}
	})



	let renderer = {
		strong(text) { return `<b>${text}</b>` },
		em(text) { return `<i>${text}</i>` }
	};

	marked.setOptions({ headerIds: false })
	marked.use({renderer});
</script>

<header>
	<div>
		<Button on:click={() => updateIndex(1)}>←</Button>
		<h1>{#await getVersion(index - 1)}{:then ver}{ver}{/await}</h1>
	</div>
	<span>
		<h1>{#await getVersion(index)}{:then ver}{ver}{/await}</h1>
	</span>
	<div>
		<h1>{#await getVersion(index + 1)}{:then ver}{ver}{/await}</h1>
		<Button on:click={() => updateIndex(-1)}>→</Button>
	</div>
</header>
<main class="changelog">
	<article>
		{#if promise}
			{#await promise}
				Loading...
			{:then changelog}
				{@html coloride(marked.parse(changelog), true)}
			{/await}
		{/if}
	</article>
</main>