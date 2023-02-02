export function playAudio(name, volume, condition) {
	if (!condition && condition !== undefined) return;
	if (!name) return console.warn("No URL!");
	if (!volume) volume = 50;

	let i = new Audio(`./audio/${name}.ogg`);
	i.volume = volume / 100;
	i.play()
};

// is this a good idea?
export function removeElement(element) {
	element = document.getElementById(element)
	element.parentNode.removeChild(element)
}

export function toggleDisplay(element) {
	element.style.display = (element.style.display == 'flex') ? 'none' : 'flex'
}

export function coordsValid(coords) {
	if (coords.length !== 3) return false;
	for (let i = 0; i < 3; i++) if (isNaN(coords[i])) return false;
	return true
}

export function usingMobile() {
	return (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i) !== null) ? true : false
}

export function scrollToBottom(element) {
	element.scroll({ top: element.scrollHeight, behavior: 'smooth' })
}