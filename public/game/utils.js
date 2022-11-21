export function playAudio(url, volume, condition) {
	if (!condition && condition !== undefined) return;
	if (!url) return console.warn("No URL!");
	if (!volume) volume = 50;

	let i = new Audio(`./audio/${url}.ogg`);
	i.volume = volume / 100;
	i.play()
};

// is this a good idea?
export function removeElement(element) {
	element = document.getElementById(element)
	element.parentNode.removeChild(element)
}

export function toggleDisplay(element, animation) {
	element.style.display = (element.style.display == 'flex') ? 'none' : 'flex'
	if (animation) {
		// there is no animation >:(
	}
}

export function escapeHTML(string) {
	return string
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
		.replace(/`/g, '&#96;')
};

export function coordsValid(coords) {
	if (coords.length > 3) return false;
	for (let i = 0; i < 3; i++) if (isNaN(coords[i])) return false;
	return true
}

// this does not work.
export function hideWins() {
	let wins = document.getElementsByClassName('win');
	for (let i = 0; i < wins.length; i++) wins[i].style.display = 'none'
}

export function usingMobile() {
	(navigator.userAgent.match(/Android|iPhone|iPad|iPod/i) !== null) ? true : false
}