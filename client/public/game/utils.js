import { config } from "./config.js";

export function playAudio(name, volume, condition) {
	if (!condition && condition !== undefined) return;
	if (!name) return console.warn("No URL!");
	if (!volume) volume = 50;

	let i = new Audio(`./audio/${name}.ogg`);
	i.volume = volume / 100;
	i.play()
}

export function toggleShow(elements, force) {
	function changeClass(element) {
		element = (typeof element == 'string')
			? document.querySelector(`#${element}`).classList
			: element.classList;
		if (force !== undefined) {
			(force)
				? element.add('show')
				: element.remove('show')
		} else {
			element.toggle('show');
		}
	}

	if (typeof elements == 'string' || elements.length === undefined) return changeClass(elements);
	for (let i = 0; i < elements.length; i++) changeClass(elements[i]);
}

export function coloride(text) {
	return text
    /*return text
        .replace(/:#([0-9]+):/g, (_, color) => `<span style="color:#${paletteColors[color] ?? "f00"}">`)
        .replaceAll(":#:", `</span>`)*/
}

export function coordsValid(coords) {
	if (coords.length !== 3) return false;
	for (let i = 0; i < 3; i++) if (isNaN(coords[i])) return false;
	return true
}

export function usingMobile() {
	return (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i) !== null || config.forceMobileAgent) ? true : false
}

export function escapeHTML(unsafe) {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
		.replace(/`/g, '&#96;')
};