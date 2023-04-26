<script>
	import Button from "lib/Button.svelte";
	import { setHide, coloride } from "public/game/utils.js";

	import { marked } from 'marked';
	import changelogs from "public/changelog/index.json";

	let index = 0;
	let promise = getChangelog(changelogs[0]);

	function updateIndex(num) {
		index = Math.min(Math.max(index - num, 0), changelogs.length - 1);
		promise = getChangelog(changelogs[index]);
	}

	async function getChangelog(version) {
		let data = await fetch(`./changelog/${version}.md`);
		let text = await data.text();
		return text;
	}

	let renderer = {
		strong(text) { return `<b>${text}</b>` },
		em(text) { return `<i>${text}</i>` }
	};

	marked.setOptions({ headerIds: false })
	marked.use({renderer});

	document.addEventListener('readystatechange', () => {
		if (document.readyState == 'complete' && localStorage.lastPlayedVersion !== changelogs[0]) {
			setHide(changelog, false);
			localStorage.lastPlayedVersion = changelogs[0];
		}
	})
</script>

<header>
	<div>
		<Button on:click={() => updateIndex(1)} disabled={changelogs[index - 1] == undefined}>←</Button>
		<h1>{changelogs[index - 1] ?? ''}</h1>
	</div>
	<span>
		<h1>{changelogs[index]}</h1>
	</span>
	<div>
		<h1>{changelogs[index + 1] ?? ''}</h1>
		<Button on:click={() => updateIndex(-1)} disabled={changelogs[index + 1] == undefined}>→</Button>
	</div>
</header>
<main class="changelog">
	<article>
		{#await promise}
			Loading...
		{:then changelog}
			{@html coloride(marked.parse(changelog), true)}
		{/await}
	</article>
</main>