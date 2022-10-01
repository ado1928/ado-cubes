export function playAudio(url, vol, cond) {
	if (cond || cond == undefined) {
		let i = new Audio('./audio/'+url+'.ogg');
		i.volume = vol;
		i.play()
	}
};

export function coordsValid(coords) {
	if (coords.length < 3) return false;
	for (let i = 0; i < coords.length; i++) if (isNaN(coords[i])) return false;
	return true
}