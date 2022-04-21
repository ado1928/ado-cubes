<script>
	function HexToRGB(hex) {
		let r = parseInt(hex.slice(1, 3), 16);
		let g = parseInt(hex.slice(3, 5), 16);
		let b = parseInt(hex.slice(5, 7), 16);

		return `${r} ${g} ${b}`;
	}

	function apply() {
		// would be nice if i could just let document.documentElement.style = root;
		document.documentElement.style.setProperty("--box-foreground", boxfg.value )
		document.documentElement.style.setProperty("--box-background", "rgb(" + HexToRGB(boxbg.value) + " / " + boxopacity.value + "%)")
		document.documentElement.style.setProperty("--box-background-blur", boxbgblur.value + "px")
		document.documentElement.style.setProperty("--box-padding", boxpadding.value + "px")
		document.documentElement.style.setProperty("--chat-width", chatwidth.value + "px")
		document.documentElement.style.setProperty("--chat-maxheight", chatmaxheight.value + "px")
	}
</script>

<div id="winSettings" class="box win center">
	<slot/>
	<strong>UI</strong><br>
	<div><strong>NOTE:</strong> Blur does not properly work in Firefox</div>
	<div>Foreground color <input id="boxfg" type="color" value="#ffffff"></div>
	<div>Background color <input id="boxbg" type="color" value="#000000"></div>
	<div>Background opacity <input id="boxopacity" type="range" min="0" max="100" value="64"></div>
	<div>Background blur <input id="boxbgblur" type="range" min="0" max="16" value="6"/></div>
	<div>Padding <input id="boxpadding" type="range" min="4" max="8" value="6"></div>
	<div>Chat width<input id="chatwidth" type="range" min="160" max="1600" value="420"></div>
	<div>Chat max height<input id="chatmaxheight" type="range" min="160" max="1600" value="420"></div>
	<button on:click={apply}>Apply</button>
</div>