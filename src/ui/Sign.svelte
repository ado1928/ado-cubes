<script>
	import { onMount } from 'svelte';

	onMount(() => {
		sign.style.display = "none";
		new ResizeObserver(() => {
			signContent.style.width = Math.round(signContent.style.width)
			signContent.style.height = Math.round(signContent.style.width)
		}).observe(signContent)
	})
</script>

<div id="sign" class="box center">
<textarea id="signContent" style="max-height: 450px; white-space: pre">
This is a sign! or a cubic sign?
─────────────────────────────────────────────────────
the quick brown fox jumps over the lazy dog
The quick brown fox jumps over the lazy dog.
THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG
THE QUICK BROWN FOX JUMPS OVER THE LAZY DOG!!!
                 .-˙-.
              .-˙ ˙.˙ ˙-.        adobe photoshop
           .-˙ .˙.˙.˙.˙. ˙-.          1999
        .-˙.˙.˙.˙.˙.˙.˙.˙.˙.˙-.
        |-. ˙.˙.˙.˙.˙.˙.˙.˙ .-|    𝗺cdonalds はいー 
        |  ˙-.˙.˙.˙.˙.˙.˙.-˙  |           ( ◕͡  ͜ʖ◕͡ )
        |     ˙-. ˙.˙ .-˙     |       🥚    🥚egg🥚🥚
        |       adocubes      |         🥚🥚  🥚 🥚
    made in Three.js & Svelte with ❤    🥚 🥚 🥚
        |          |          |               🐔
        ˙-.        |        .-˙        𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆𛲆
           ˙-.     |     .-˙             ─  ─  ─  ─
              ˙-.  |  .-˙     md2      𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖𛲖
                 ˙-|-˙
</textarea>
</div>