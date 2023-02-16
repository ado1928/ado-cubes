<script>
	import Box from "lib/Box.svelte";
	import Button from "lib/Button.svelte";
	import { toggleShow, coloride } from "public/game/utils.js";

	let tab = 'display';

	let signContent = [
		"This is a sign! or a cubic sign?",
		"─────────────────────────────────────────────────────",
		"the quick brown fox jumps over the lazy dog",
		"The quick brown fox jumps over the lazy dog.",
		"THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG",
		":#7:THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG!!!:#:",
		"                 .-˙-.",
		"              .-˙ ˙.˙ ˙-.        adobe photoshop",
		"           .-˙ .˙.˙.˙.˙. ˙-.          1999",
		"        .-˙.˙.˙.˙.˙.˙.˙.˙.˙.˙-.",
		"        |-. ˙.˙.˙.˙.˙.˙.˙.˙ .-|    𝗺cdonalds はいー ",
		"        |  ˙-.˙.˙.˙.˙.˙.˙.-˙  |           ( ◕͡  ͜ʖ◕͡ )",
		"        |     ˙-. ˙.˙ .-˙     |       🥚    🥚egg🥚🥚",
		"        |       adocubes      |         🥚🥚  🥚 🥚",
		"    made in Three.js & Svelte with :#6:❤:#:    🥚 🥚 🥚",
		"        |          |          |               🐔",
		"        ˙-.        |        .-˙        𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆",
		"           ˙-.     |     .-˙             ─  ─  ─  ─",
		"              ˙-.  |  .-˙              𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖",
		"                 ˙-|-˙",
		"",
		"    :#12:Ado1928:#:   ifritdiezel   :#28:ma:#0:ci:#6:mas"
	];

	let value = '';

	signContent.forEach(text => {
		value += `${text}\n`
	})

	function moderate(event) {
		console.log(value.split(/\r\n|\r|\n/).length);
		if (value.split(/\r\n|\r|\n/).length >= 30) event.preventDefault()
	}
</script>

<header>
	<div>
		<Button on:click={() => tab = 'display'}>Display</Button>
		<Button on:click={() => tab = 'edit'}>Edit</Button>
		<Button on:click={() => tab = 'info'}>Info</Button>
	</div>
</header>
<main class="sign">
	{#if tab == 'display'}
		<div>
			<p class="sign-content" id="signDisplayContent">{@html coloride(value, true)}</p>
		</div>
		<textarea class="sign-content" id="signEditContent" bind:value={value} on:keypress={e => moderate(e)} wrap="hard" rows="30" cols="15"/>
	{:else}
		<div class="sign-info">
			<div id="signCreated" style="display:flex;gap:6px">
				<img src="https://github.com/macimas.png" height="32px">
				<div>
					<p>Created by <a href="https://www.youtube.com/watch?v=7jaskTtJCio">macimas</a></p>
					<p>on <time id="signCreationDate">August 10, 2009</time></p>
				</div>
			</div>
			<div id="signLastModified" style="display:flex;gap:6px">
				<img src="https://github.com/ifritdiezel.png" height="32px">
				<div>
					<p>Last modified by <a href="https://www.youtube.com/watch?v=sGNOLLOfFwM">ifritdiezel</a></p>
					<p id="signLastModifiedDate">on <time id="signLastModifiedOnTime">August 17, 2009</time></p>
				</div>
			</div>
		</div>
	{/if}
</main>