module.exports = class Ratelimit {
	constructor([socket, ratelimits]) {
		this.caps = ratelimits;
		this.count = {};
		this.lastChecked = {};
		Object.entries(ratelimits).forEach(([key, value]) => {
			this.count[key] = 0;
			this.lastChecked[key] = Date.now();
			Object.defineProperty(this, key, {
				get() {
					if (Date.now() - this.lastChecked[key] > 1000) {
						this.count[key] = 1;
						this.lastChecked[key] = Date.now();
					} else {
						this.count[key]++;
					}

					if (this.count[key] > this.caps[key]) {
						return true;
					}
					
					return false;
				}
			})
		})
	}
}