import { config } from "./config.js";

const paletteColors = [
	'FFFFFF', 'AAAAAA', '777777', '484848', '000000',
	'991609', 'F3280C', 'FF5610', 'FF832A', 'FFB885',
	'936100', 'E29705', 'FFD223', 'FFF280', '47561E',
	'71892B', '94BE1A', 'DCFF77', '124B36', '0F8158',
	'03C07C', '90FFCA', '024851', '0D7A89', '01A6BD',
	'34E7FF', '013462', '0D569A', '066ECE', '4CA9FF',
	'181691', '2A25F5', '4E55FF', '9DB8FF', '58196B',
	'AC01E0', 'C82EF7', 'DC91FF', '650036', 'B0114B',
	'EA3477', 'FF95BC', '62071D', '9B0834', 'CB003D',
	'FF7384', '49230A', '814A17', 'D17A2B', 'FF9D59'
];

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

export function coloride(text, useDefault) {
	let colors = (useDefault) ? paletteColors : window.worldPalette;
    return text
        .replace(/:#([0-9]+):/g, (_, color) => `</span><span style="color:#${colors[color] ?? "f00"}">`)
        .replaceAll(":#:", `</span>`)
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