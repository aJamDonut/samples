class Grid {
    drawWalls() {
        if (!game.editMode) {
            //return false;
        }
        
        
        this.resolve = []; //Empty resolver
        for (var chunks in this.loadedChunks) {
            var chunk = this.loadedChunks[chunks];
            this.resolve.push(chunk);
        }
        
    }

    resolver() {
        return;
        if(this.resolve.length == 0) {
            return;
        }
        for(let i = 0; i < Math.min(1, this.resolve.length); i++) {
            let chunk = this.resolve.pop();
            if(chunk && chunk.loaded) {
                new TileResolver(chunk.x, chunk.y, chunk.tiles);
            }
        }

    }

    constructor() {

        //Move viewport for some reason. Maybe we can remove
        //TODO: remove?
        game.render.viewport.x = -((64 * this.chunkSize) * 100)
        game.render.viewport.y = -((64 * this.chunkSize) * 100)
        game.render.viewport.alpha = 1;
        
        game.genTrees = true;
        
        if(game.editMode) {
           game.genTrees = false; 
        }
        game.genTrees = false;

        this.treeNoise = new SimplexNoise(0.7954690730653167);

        this.viewRange = 8;
        //this.viewRange = 2;

        this.loadedChunks = {};
        this.resolve = [];
        game.setTicker('resolveTiles', ()=>{this.resolver()});
        this.tileSize = 64;
        this.zones = new GridZones();
        this.index = game.index;

        
        

        this.lastX = -1;
        this.lastY = -1;

        this.offsetX = 0;
        this.offsetY = 0;
        this.saveGames = game.globalfs.loadSync('loadfiles');

        this.loadingData = true;
        this.loadingCount = 0;
        this.loadedOnce = false;
        this.timer = false;

        let saveFile = 'savefile.json';

        this.map = game.urlVar('map') || 'live';

        if(game.fs.keyExists(saveFile)) {
            this.chunkTree = game.fs.loadSync(saveFile);
        } else {
            this.chunkTree = game.fs.loadSync('../../'+game.gameName+'/maps/'+this.map+'/'+saveFile);
        } 

        //ORIG

        this.chunkSize = this.chunkTree[Object.keys(this.chunkTree)[0]].drawMatrix.length; //Lol
        this.regions = Math.sqrt(Object.keys(this.chunkTree).length);

        //ORIG
        

    }

    getSize() {
        return (this.chunkSize * this.tileSize) * this.regions;
    }

    //TODO: old func needs renamed and refactoring
    updateTile(x, y, across, down, layer) {
        var chunkX = Math.floor(x / this.chunkSize);
        var chunkY = Math.floor(y / this.chunkSize);
        if (chunkX < 0) {
            chunkX = 0;
        }
        if (chunkY < 0) {
            chunkY = 0;
        }

        x = x - (chunkX * this.chunkSize);
        y = y - (chunkY * this.chunkSize);


        this.loadedChunks[chunkX + '-' + chunkY].tiles.drawTile(x, y, across, down, layer);
        //this.loadedChunks[chunkX + '-' + chunkY].changed = true;
    }

    getBlockAt(x, y) {
        return this.getBlock(Math.floor(x / 64), Math.floor(y / 64), x, y);
    }


    getBlock(x, y, realX, realY) {

        return {
            items: this.index.getIndex('block-' + x + '-' + y),
            info: this.getBlockInfo(x, y),
            isWall: this.isWall(x, y, realX, realY)
        }
    }


    getTile(x, y, layer) {
        var chunkX = Math.floor(x / this.chunkSize);
        var chunkY = Math.floor(y / this.chunkSize);
        if (chunkX < 0) {
            return [0, 0];
        }
        if (chunkY < 0) {
            return [0, 0];
        }

        x = x - (chunkX * this.chunkSize);
        y = y - (chunkY * this.chunkSize);
        if (1==2&&this.loadedChunks[chunkX + '-' + chunkY] && this.loadedChunks[chunkX + '-' + chunkY].loaded) {
            return this.loadedChunks[chunkX + '-' + chunkY].tiles.getTile(x, y, layer);
        } else {
            //Search trunk tree
            
            let tree = game.grid.chunkTree['region_'+chunkX+"_"+chunkY+".json"];

            if(!tree) {
                return [1, 1];
            }

            let ref = tree.drawMatrix[x][y];
            
            if(!ref) {
                return [1, 1];
            }

            if(typeof ref[0] == 'number') {
                //old system
                if(layer > 0) {
                    return [1,1];
                } else {
                    return ref;
                }
            }


            if (typeof layer == 'undefined') {
                return ref[0] || [1,1];
            }

            return ref[layer] || [1,1];
        }
    }

    //Assumes x and y are grid refs
    isBlocked(x, y) {
        return this.isTileWall(x, y) || this.isTileMtn(x, y);
    }

    //Assumes x and y are grid refs
    isWall(x, y) {
        return this.isTileWall(x, y);
    }

    //Assumes x and y are grid refs
    isTileWall(x, y) {
        for (let i = 0; i < 6; i++) {
            if (this.wallCheck(this.getTile(x, y, i))) { //Check every layer for wall
                return true;
            }
        }
        return false;
    }

    //Assumes x and y are grid refs
    isTileMtn(x, y) {
        for (let i = 0; i < 6; i++) {
            if (this.mtnCheck(this.getTile(x, y, i))) { //Check every layer for wall
                return true;
            }
        }
        return false;
    }


    wallCheck(tile) {
        //Walls
        if (tile[0] >= 3 && tile[1] <= 6) {
            return true;
        }
        return false;
    }

    mtnCheck(tile) {
        //Mtn
        if (tile[0] >= 3 && tile[1] >= 14) {
            return true;
        }
        return false;
    }



    getBlockInfo(x, y) {
        return {}
    }

    loadFirstChunk(x, y) {
        if (!this.loadedOnce) {
            game.ee.emit('grid-loading');
        }
        if (this.lastX == x && this.lastY == y) {
            return false;
        }
        this.lastX = x;
        this.lastY = y;
        this.getChunks(x, y);
    }

    reset() {
        for (let chunk in this.loadedChunks) {
            this.unloadChunk(this.loadedChunks[chunk]);
        }
        this.loadedChunks = {};
        this.lastX = -1; //Force reload
        this.lastY = -1;
    }


    getChunks(x, y) {
        var offsetX = x - this.viewRange / 2;
        var offsetY = y - this.viewRange / 2;
        if (offsetX < 0) {
            offsetX = 0;
        }
        if (offsetY < 0) {
            offsetY = 0;
        }
        this.offsetX = offsetX;
        this.offsetY = offsetY;

        for (var i = offsetX; i <= offsetX + this.viewRange; i++) {
            for (var j = offsetY; j <= offsetY + this.viewRange; j++) {
                if (this.loadedChunks[i + '-' + j] !== undefined && this.loadedChunks[i + '-' + j].destroyed != true) {
                    continue;
                }

                this.getChunk(i, j, i - offsetX, j - offsetY);
            }
        }
    }

    saveChunk(chunk, destroy) {

        

        if (!chunk.loaded) {
            return false; //Not loaded
        }

        if (chunk.saving) {
            return false; //Already saving
        }

        chunk.saving = true;

        let key = 'region_' + chunk.x + '_' + chunk.y+".json";
        var save = {
            drawMatrix: chunk.tiles.drawMatrix,
            objects: JSON.parse(JSON.stringify(this.index.getIndex('region-' + chunk.x + '-' + chunk.y)))
        }
        this.chunkTree[key] = save;

        console.log(JSON.stringify(this.chunkTree[key].objects));
        chunk.saving = false;

        if(destroy) {
            this.destroyChunk(chunk);
        }
        
    }

    updateSave() {
        if (this.saveTimer) {
            clearTimeout(this.saveTimer);
        }
        this.saveTimer = setTimeout(() => {
            if (game.slot) {
                this.saveGames[game.slot].date = Date.now();
                this.saveGames[game.slot].player = game.p;
                this.saveGames[game.slot].viewport = { x: game.render.viewport.x, y: game.render.viewport.y };
                game.globalfs.save('loadfiles', this.saveGames);
            }
        }, 1000);

    }

    unloadChunk(chunk) {
        if (!chunk) {
            return false;
        }

        if(!chunk.loaded) {
            return;
        }

        this.saveChunk(chunk, true);

        chunk.loaded = false; //Make sure it can save while unloading

        
    }

    destroyChunk(chunk) {
        var items = this.index.getIndexes(['nosave-region-' + chunk.x + '-' + chunk.y, 'region-' + chunk.x + '-' + chunk.y]);
        for (var item in items) {
            if (typeof items[item].markDelete == 'function') {
                items[item].markDelete();
            } else {
                items[item].destroy();
            }

        }

        chunk.chunkContainer.destroy({texture: true, baseTexture: true});
        delete this.loadedChunks[chunk.x + '-' + chunk.y];
    }

    getChunk(x, y) {
        var limit = this.regions-1;
        if (x < 0 || y < 0 || isNaN(x) || isNaN(y) || y > limit || x > limit) {
            return false;
        }

        if (!this.loadedChunks[x + '-' + y]) {
            this.loadedChunks[x + '-' + y] = { loading: true }

            var map = game.urlVar('map') ? game.urlVar('map') : 'testmap';

            this.loadingCount++;
            let key = 'region_' + x + '_' + y + '.json';
            //use savefile or default
            game.trickle.add(() => {

                /*
                Old (files)
                let chunkFile = (game.fs.keyExists('region_' + x + '_' + y + '.json')) ? game.fs.folder + '/region_' + x + '_' + y + '.json' : 'deaddesert/maps/' + map + '/region_' + x + '_' + y + '.json';
                console.log("Count", this.loadingCount, 'region_' + x + '_' + y + '.json')
                game.fs.readFileRaw(chunkFile, (data) => {
                    this.chunkLoader(data, x, y);
                });
                */
               console.log("Load", key)
                this.chunkLoader(this.chunkTree[key], x, y);
            });
        }
    }

    loadFailed(x, y) {
        //TODO: show error to user
        console.error("Failed to load chunk " + x + "-" + y);
    }

    chunkLoader(chunk, x, y, i, j) {
        this.loadingCount--;
        try {
            var chunkTiles = new GridChunk(chunk.drawMatrix, 64, game.render.tilemapTexture, x, y)

            
            new TileResolver(x, y, chunkTiles);

            var chunkContainer = new GridChunkHolder();

            if (this.loadedChunks[x + '-' + y].chunkContainer) {
                this.loadedChunks[x + '-' + y].chunkContainer.destroy();
            }
            this.loadedChunks[x + '-' + y] = { destroyed: false, x: x, y: y, chunkContainer: chunkContainer, chunk: chunk, tiles: chunkTiles };
            chunkContainer.addChild(chunkTiles);
            game.render.background.addChild(chunkContainer);
            chunkContainer.x = (x * (64 * this.chunkSize))-0.5;
            chunkContainer.y = (y * (64 * this.chunkSize))-0.5;
            chunkContainer.width = chunkContainer.width+1;
            chunkContainer.height = chunkContainer.height+1;
            chunkContainer.addChild(game.render.text(x + '-' + y, 'dialog-main'));
            game.saves.loadAllObjects(chunk.objects, this.loadedChunks[x + '-' + y]);
            this.addToPathFinder(chunk.drawMatrix, i, j);
            this.wallsDrawn = false;
            if (this.loadingCount == 0) {

                if (!this.loadedOnce) {
                    this.loadedOnce = true;
                    setTimeout(function(){
                        game.ee.emit('grid-loaded');
                    }, 2000);
                    
                    game.render.viewport.x = -((64 * this.chunkSize) * game.urlVar('x'));
                    game.render.viewport.y = -((64 * this.chunkSize) * game.urlVar('y'));
                }

                game.ready = true;
                this.drawWalls();
                this.loadingData = false;
            } else {
                this.loadingData = true;
            }
        } catch(e) {
            console.error("The chunk failed?");
            console.error(e);
        }
    }

    addToPathFinder(drawMatrix, i, j) {
        //game.offloader.helper.pathUpdate('updateGrid', {grid: drawMatrix, regionX: i, regionY: j});
    }


    cull(centerX, centerY) {

        if (!this.lastCull) {
            this.lastCull = Date.now();
        }

        if (this.lastCull > Date.now() - 100) {
            return false;
        }

        this.lastCull = Date.now();

        if (this.loadingData) {
            return false; //Don't do anything when loading data
        }

        let culled = false;

        
        for (var chunks in this.loadedChunks) {
            if (this.loadedChunks[chunks]) {


                if (this.loadedChunks[chunks].loading && !this.loadedChunks[chunks].loaded) {
                    continue;
                }
                if (this.loadedChunks[chunks].destroyed && this.loadedChunks[chunks].chunkContainer) {
                    this.loadedChunks[chunks].chunkContainer.destroy();
                    this.loadedChunks[chunks].chunkContainer = false;
                    continue;
                }
                if (this.loadedChunks[chunks].destroyed && this.loadedChunks[chunks].chunkContainer === false) {
                    delete this.loadedChunks[chunks];
                    continue;
                }
                var destroy = true;
                let pawns = game.session.getPlayerPawns();
                let ids = Object.keys(pawns);
                //var chunk = this.loadedChunks[chunks];
                //console.log()
                if (game.editMode || ids.length == 0) { //If in edit mode, cull from screen center
                    destroy = false;
                    if ((this.loadedChunks[chunks].x) <= (centerX - (this.viewRange))) {
                        destroy = true;
                    }
                    if ((this.loadedChunks[chunks].x) >= (centerX + (this.viewRange))) {
                        destroy = true;
                    }

                    if ((this.loadedChunks[chunks].y) <= (centerY - (this.viewRange))) {
                        destroy = true;
                    }
                    if ((this.loadedChunks[chunks].y) >= (centerY + (this.viewRange))) {
                        destroy = true;
                    }
                } else { //If in game mode, cull from all pawn positions.
                    let gridX = 64 * (this.loadedChunks[chunks].x - 1) * this.chunkSize;
                    let gridY = 64 * (this.loadedChunks[chunks].y - 1) * this.chunkSize;

                    for (let i = 0; i < ids.length; i++) {
                        let pawn = pawns[ids[i]];
                        let dist = game.world.dist(pawn, { x: gridX, y: gridY });

                        if (dist < 6000) {
                            destroy = false;
                            break;
                        }
                    }
                }

                if (destroy && !this.loadedChunks[chunks].destroying) {
                    this.loadedChunks[chunks].chunk.visible = false;
                    this.loadedChunks[chunks].chunk.renderable = false;
                    this.unloadChunk(this.loadedChunks[chunks]);
                    
                    
                }

            }
        }

        

    }

    addBlocker(x, y) {
        game.offloader.helper.physicsUpdate('addBlocker', { id: bricks.id, x: bricks.x, y: bricks.y - 16, width: bricks.width - 5, height: bricks.height - 12, data: bricks.data })
        game.offloader.helper.pathUpdate('addBlocker', { id: bricks.id, x: bricks.x - 16, y: bricks.y - 16, width: bricks.width - 5, height: bricks.height - 12, data: bricks.data })
    }

    addToChunk(item) {

        try {
            let region = this.getRegion(item);

            //Already in region
            if (region.x + '-' + region.y == item.region) {
                return false;
            }

            if (item.region) { //Remove if already in region.
                this.index.removeFromIndex('region-' + item.region, item, false);
            }

            if(item.meta && item.meta.dontSave) {
                this.index.addToIndex('nosave-region-' + region.x + '-' + region.y, item);
            } else {
                this.index.addToIndex('region-' + region.x + '-' + region.y, item);
            }
            
            item.region = region.x + '-' + region.y;

            item.blockX = game.gridPos(item.x);
            item.blockY = game.gridPos(item.y);
            this.index.addToIndex('block-' + item.blockX + '-' + item.blockY, item);
        } catch (e) {
            //Loading/Unloading too fast. It's safe to catch this but we could maybe catch just .x, .y (pixi.position)
            //Another side effect, the grid may be loaded and unloaded before loaded make sure this is caught
            console.error("[ABE] Player is fort!")
        }
    }

    updateChunk(item) {
        //TODO: reduce frequency or optimise?... tbh on review (after some time) it seems fine..
        this.addToChunk(item);
    }

    getRegion(item) {
        return {
            x: Math.floor(item.x / (this.chunkSize * this.tileSize)),
            y: Math.floor(item.y / (this.chunkSize * this.tileSize))
        };
    }

    //Notes:
    //If this doesn't work in dev, the apache/php post limit may be to blame!
    saveOpenChunks() {
        for (var chunks in this.loadedChunks) {
            var chunk = this.loadedChunks[chunks];
            if (!chunk.destroying && chunk.destroyed == false && chunk.loaded == true && chunk.loading !== true) {
                this.saveChunk(chunk);
            }
        }
        try {
            console.error("SAVE THIS")
            console.log(this.chunkTree);
            console.log(JSON.stringify(this.chunkTree))
            console.error("SAVE THIS")
            game.fs.writeFile('savefile.json', this.chunkTree);
        } catch(e) {
            console.error(e);
        }
    }

    render() {

        if (game.loading) {
            return false;
        }




        //TODO: move this out of grid classo
        if (!game.editMode) {
            game.render.viewport.clamp({
                left: game.p.x - 2500,
                right: game.p.x + 2500,
                top: game.p.y - 2500,
                bottom: game.p.y + 2500
            });
        }

        if (!game.ready) {
            return;
        }

        game.render.viewport.toward();

        this.load();
        

    }

    load() {
        var centerTo = game.render.viewport.toWorld(game.ui._VIEWPORT_RIGHT / 2, game.ui._VIEWPORT_BOTTOM / 2);
        var region = this.getRegion(centerTo);
        this.loadFirstChunk(region.x, region.y);
        this.cull(region.x, region.y);
    }

}
