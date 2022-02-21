class InventoryItem extends PIXI.Container {
	constructor(name, data, disabled, displayOptions) {
		super();

		
		if(!displayOptions) {
			displayOptions = {w: 64, h:64}
		}

		this.displayOptions = displayOptions;

		this.loaded = (!data) ? false : true;
		
		this.data = data || {};
		this.extensions ={};
		this.cloneFrom(_BLUEPRINTS.INV_ITEMS, name);
		
		this.stats={};
		if(this.sprite == "blank") {
			//Dummy object
			return this;
		}

		var sprite = new ItemIcon(name, displayOptions, this.data.quality)
		this.addChild(sprite);
		

		this.id = game.randID();
		this.name = name;
		this.codename = name;
		if(!this.data.stance) {
			this.data.stance='none';
		}
		this.spriteName = this.sprite;
		this.class = 'InventoryItem';
		
		if(this.data.description) {
			this.description = this.data.description;
		}
		if(this.data.readName) {
			this.readName = this.data.readName;
		}
		this.data.stats = {};
		
		if(!this.data.quality) {
			this.data.quality = 1;
		}
		if(this.data.value == undefined) {
			if(this.meta.value == undefined) {
				this.data.value = 6;
			} else {
				this.data.value = this.meta.value; //TODO: maybe not required
			}
			this.data.value = Math.ceil(this.data.value * (1+(this.data.quality/10)));
		}

		this.data.sellPrice = Math.ceil(this.data.value * 0.60); //TODO: maybe in future factor in different shop keepers
		this.data.buyPrice = Math.ceil(this.data.value * 1.5);


		/*
		
		If you find this randomly not working,
		it may be PHP error where the DB item isnt showing its events
		It happens when a new item type is added missing these events

		*/
		if(typeof this.events.onCreate == 'function') {
			this.events.onCreate.call(this, this);
			game.queue.add(()=>{	
				this.loadExtensions();
			});
			game.queue.add(()=>{
				if(!this.data.sellPrice) {
					this.data.sellPrice = 5;
				}
				if(!this.data.buyPrice) {
					this.data.buyPrice = 5;
				}
			});
	
		}

		
		game.inventories.attachInventoryFuncs(this, disabled);

	}

	
	addExtension(name, options) {
		var key = name+'-'+game.randID();

		this.extensions[key] = {key: key, name:name, options:options};
		game.index.addToIndex(name, this.extensions[key]);
	}

	loadExtensions() {
		var extensions = Object.keys(this.extensions);
		if(extensions.length == 0) {
			return false;
		}
		for(var i = 0; i < extensions.length; i++) {
			this.loadExtension(this.extensions[extensions[i]]);
		}
	}

	loadExtension(extensionData) {
		if(!_BLUEPRINTS.EXTENSIONS) {
			console.error("[ABE] No extensions in system");
			return false;
		}

		if(!_BLUEPRINTS.EXTENSIONS[extensionData.name]) {
			console.error("[ABE] Can't find extension: "+extensionData.name);
			return false;
		}

		var extensionMeta = _BLUEPRINTS.EXTENSIONS[extensionData.name];

		if(typeof extensionMeta.events.onCreate === 'function') {
			extensionMeta.events.onCreate.call(this, this, extensionData.options);
		}

	}
	

	cloneFrom(src, name) {
		if(!src[name]) {
			console.error("[ABE] Reference has no source to clone from "+name);
		}
		if(src[name].events) {
			this.events = game.clone(src[name].events);
		} else {
			this.events = {};
		}
		
		if(src[name].data) {
			this.data = Object.assign(this.data,game.clone(src[name].data));
		}

		if(src[name].meta) {
			this.meta = game.clone(src[name].meta);
		} else {
			this.meta = {};
		}
		
		this.sprite = src[name].sprite;

		this.readName = src[name].name;
		this.description = src[name].meta.description;

		/*if(src[name].spriteData) {
			this.width = src[name].spriteData.w / 0.5;
			this.height = src[name].spriteData.h / 0.5;
		}*/
	}

	//Todo move up in classes
	scaleToGame() {
		
		this.scale.x = 0.5;
		this.scale.y = 0.5;

		//If it's interactive, it appears to need the rectangle setting back up at twice width/height
		if(this.interactive == true) {
			this.isInteractive();
		}

	}

	isInteractive() {
		this.interactive = true;
		this.buttonMode = true;
		//When item is rescaled it appears to make incorrect hit area, so factor this in
		var scaleX = 1 / this.scale.x;
		var scaleY = 1 / this.scale.y;
		//When setting hit area back up, u must take into account the anchor, seems like a bug i guess.
		this.hitArea = new PIXI.Rectangle(0, 0, this.width*scaleX, this.height*scaleY); //Setup hit area
	}
	
	toJSON() {

		return {
			name: this.name,
			spriteName: this.spriteName,
			data: this.data
		};

	}

}
