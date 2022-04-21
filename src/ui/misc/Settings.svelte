<script>
	function HexToRGB(hex) {
		let r = parseInt(hex.slice(1, 3), 16);
		let g = parseInt(hex.slice(3, 5), 16);
		let b = parseInt(hex.slice(5, 7), 16);

		return `${r} ${g} ${b}`;
	}

	function loadSettings() {
		document.documentElement.style.setProperty("--box-foreground", localStorage.getItem("boxfg"));
		document.documentElement.style.setProperty("--box-background", localStorage.getItem("boxbg"));
		document.documentElement.style.setProperty("--box-background-blur", localStorage.getItem("boxbgblur"));
		document.documentElement.style.setProperty("--box-padding", localStorage.getItem("boxpadding"));
		document.documentElement.style.setProperty("--chat-width", localStorage.getItem("chatwidth"));
		document.documentElement.style.setProperty("--chat-maxheight", localStorage.getItem("chatmaxheight"));
	};


	function defaultSettings() {
		localStorage.clear()
		loadSettings();
	};

	function applySettings() {
		// will need to put them all into one item, but for now i am too lazy to get into that
		localStorage.setItem("boxfg", boxfg.value);
		localStorage.setItem("boxbg", "rgb(" + HexToRGB(boxbg.value) + " / " + boxopacity.value + "%)");
		localStorage.setItem("boxbgblur", boxbgblur.value + "px");
		localStorage.setItem("boxpadding", boxpadding.value + "px");
		localStorage.setItem("chatwidth", chatwidth.value + "px");
		localStorage.setItem("chatmaxheight", chatmaxheight.value + "px");
		loadSettings();
	};

	window.onload = function() {
		loadSettings();
	};
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
	<button on:click={applySettings}>Apply</button><button on:click={defaultSettings}>Default</button>
</div>