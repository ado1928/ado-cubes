export function playAudio(url, vol, cond) {
	if (cond || cond == undefined) {
		let i = new Audio('./audio/'+url+'.ogg');
		i.volume = vol;
		i.play()
	}
};

export function randomInt(max) {
	return Math.floor(Math.random() * max)
}