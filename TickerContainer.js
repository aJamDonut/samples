class TickerContainer extends UIContainer {

	//Time:
	//Pass a number as seconds
	//OR
	//Pass a function that when false, will redraw

	constructor(ref, ticker, time) {
		super();

		if(typeof time !== 'function') {
			//normal time
			if(!time) {
				time = 5;
			}
			//Caps out to 0.250
			if(time < 0.250) {
				time = 0.250;
			}
			if(time > 1000) {
				//Probably not what we wanted
				time = 0.250;
				console.error("[ABE-ERROR] Using ABE-Ticker with high time, maybe incorrect")
			}
			this.time = time*1000;
			this.type = 'time';
		} else if(typeof time == 'function') {
			this.time = time;
			this.type = 'func';
		} else {
			this.type = 'brokeaf';
			throw '[ABE] Passed incorrect timer to TickerContainer';
		}
		
		this.offsetter = game.rng(0, 1000); //Creates an offset so those created at the same time are still rendered on different ticks

		this.ticker = ticker;
		this.ref = ref;
		this.lastRun = 0;
		game.index.addToIndex('ticker', this);
		this.content = new UIContainer();
		this.addChild(this.content, true);
	}

	addChild(child, me) { //Overwriting the default to send to container
		if(me) {
			super.addChild(child);
		} else {
			this.content.addChild(child);
		}
	}


	tick() {
		if(this.type == 'time') {
			if(this.lastRun < (game.now+this.offsetter) - this.time) {
				this.content.destroy();
				this.content = new UIContainer();
				this.addChild(this.content, true);
				this.ticker.call(this, this.ref);
				this.lastRun = (game.now+this.offsetter);
			}
			return;
		}

		if(this.type == 'func') {
			if(typeof this.lastPage == 'undefined') {
				this.lastPage = -1;
			}
			let page = -1;
			if(this.pager && this.pager.pages) {
					page = this.pager.pages.page;
			}
			if(!this.time.apply(this) || this.lastPage !== page) {
				console.log("last", this.lastPage, page);
				this.content.destroy();
				this.content = new UIContainer();
				this.addChild(this.content, true);
				this.ticker.call(this, this.ref);
				this.lastRun = (game.now+this.offsetter);
			}
			this.lastPage = page;
		}
	}
}

class PersistentTickerContainer extends UIContainer {
	constructor(ref, ticker, time) {
		super();
		if(!time) {
			time = 5;
		}
		this.offsetter = game.rng(0, 1000); //Creates an offset so those created at the same time are still rendered on different ticks
		this.time = time*1000
		this.ticker = ticker;
		this.ref = ref;
		this.lastRun = 0;
		game.index.addToIndex('ticker', this);

	}

	tick() {
		if(this.lastRun < (game.now+this.offsetter) - this.time) {
			this.ticker(this.ref);
			this.lastRun = (game.now+this.offsetter);
		}
	}
}