export function playAudio(url, vol, cond) {
	if (cond || cond == undefined) {
		let i = new Audio('./audio/'+url+'.ogg');
		i.volume = vol / 100;
		i.play()
	}
};

export function escapeHTML(unsafe) {
	return unsafe
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;')
		.replace(/`/g, '&#96;')
};

export function coordsValid(coords) {
	if (coords.length < 3) return false;
	for (let i = 0; i < coords.length; i++) if (isNaN(coords[i])) return false;
	return true
}

export function hideWins() {
	let wins = document.getElementsByClassName('win');
	for (let i = 0; i < wins.length; i++) wins[i].style.display = 'none'
}

export function usingMobile() {
	if (navigator.userAgent.match(/Android|iPhone|iPad|iPod/i) !== null) return true;
	return false
}