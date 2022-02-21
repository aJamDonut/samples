class ItemIcon extends PIXI.Container {
	constructor(item, displayOptions, quality) {
		super();

		if(!displayOptions) {
			displayOptions = {w: 64, h:64}
		}
		
		this.sprite = _BLUEPRINTS.INV_ITEMS[item].sprite;

		if(this.sprite == "blank" || !this.sprite) {
			//Dummy object
			return this;
		}

		this.quality = quality || 1;
		if(!displayOptions.noBg) {
				this.qualitySprite = new Sprite('uicolor_'+this.quality);
				this.qualitySprite.x = 5;
				this.qualitySprite.y = 5;
				this.qualitySprite.alpha = 0.5;
				this.qualitySprite.width = displayOptions.w-5;
				this.qualitySprite.height = displayOptions.h-5;
				this.addChild(this.qualitySprite);
		}
		var sprite = new Sprite(this.sprite);
		let maxW = Math.min(displayOptions.w, sprite.width);
		let maxH = Math.min(displayOptions.h, sprite.height);
		let scale = 1;

		if(maxH > maxW) {
			//H
			let oneP = maxH/100;
			scale = 1 / ((sprite.height/oneP) / 100);
		} else {
			//H
			let oneP = maxW/100;
			scale = 1 / ((sprite.width/oneP) / 100);
		}

		sprite.anchor.set(0.5);
		sprite.scale.x = scale;
		sprite.scale.y = scale;
		sprite.x = displayOptions.w / 2;
		sprite.y = displayOptions.h / 2;
		this.addChild(sprite);
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
	

}	