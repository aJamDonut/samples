class ServerPath {

    regions = 110;
    regionSize = 1100; //Seems to need padding coz of 100 region (101-110)

    constructor() {
        this.tileSize = 64;
        this.mapDimension = this.regions * this.regionSize;

        this.finders = {};

        var pf = new PathFinder(this.tileSize, this.mapDimension);
        this.pf = pf;
        this.createBlankGrid()
        this.pathLog = {}; //An object for tracking searches and failures
        this.loop();
        this.tick = 0;
    }

    loop() {
        this.pf.calculate()
        setTimeout(() => {
            this.tick++;
            this.loop();
        }, 1)
    }
    
    createBlankGrid() {


        var grid = [];
        for (var i = 0; i <= this.regionSize; i++) {
            grid[i] = [];
            for (var j = 0; j <= this.regionSize; j++) {
                grid[i].push(0);
            }
        }

        this.setGrid({
            data: {
                grid: grid
            }
        });
    }

    setGrid(data) {
        var grid = data.data.grid;
        this.grid = grid;

        this.pf.setGrid(grid);
    }

    getGrid() {
        return this.pf.getGrid(); //If this fails, its a custom function added to easystar basically return collisionGrid;
    }

    updateGrid(data) {
        var grid = data.data.grid;
        this.grid = grid;
    }

    addBlockers(data) {
        var item = data.data;
        var blockWidth = Math.ceil(item.width / this.tileSize);
        var blockHeight = Math.ceil(item.height / this.tileSize);



        if (blockWidth == 1 && blockHeight == 1) {
            this.addBlocker({ data: item });
            return true;
        }

        var gridX = Math.floor(item.x / this.tileSize);
        var gridY = Math.floor(item.y / this.tileSize);

        for (var row = 0; row < blockWidth; row++) {
            for (var col = 0; col < blockHeight; col++) {
                this.block(gridX + row, gridY + col);
            }
        }
    }

    removeBlockers(data) {
        var item = data.data;
        var blockWidth = Math.ceil(item.width / this.tileSize);
        var blockHeight = Math.ceil(item.height / this.tileSize);



        if (blockWidth == 1 && blockHeight == 1) {
            this.removeBlocker({ data: item });
            return true;
        }

        var gridX = Math.floor(item.x / this.tileSize);
        var gridY = Math.floor(item.y / this.tileSize);

        for (var row = 0; row < blockWidth; row++) {
            for (var col = 0; col < blockHeight; col++) {
                this.unBlock(gridX + row, gridY + col);
            }
        }
    }

    addObject(data) {

        var item = data.data;

        if (item.data.block !== false) {
            this.addBlockers(data);
            return;
        } else {
            this.removeBlockers(data); //TODO: if an item removes a block.. i guess we need this - but it causes a crash
            return
        }

    }

    addBlocker(data) {
        var blockData = data.data;

        this.block(Math.floor(blockData.x / this.tileSize), Math.floor(blockData.y / this.tileSize));
        //console.error(this.grid);
    }

    block(row, column) {
        if (!this.grid[column]) {
            console.error("[ABE-PathServer] Can't block grid at C:" + column + " R:" + row)
            return false;
        }
        this.grid[column][row] = 1;
        this.pf.avoidAdditionalPoint(column, row);
    }

    removeBlocker(data) {
        var blockData = data.data;

        this.unBlock(Math.floor(blockData.x / this.tileSize), Math.floor(blockData.y / this.tileSize));
        //console.error(this.grid);
    }

    unBlock(row, column) {
        if (!this.grid[column]) {
            console.error("[ABE-PathServer] Can't block grid at C:" + column + " R:" + row)
            return false;
        }
        this.grid[column][row] = 0;
        this.pf.stopAvoidingAdditionalPoint(column, row);
    }

    bulkPathUpdate(data) {


        var paths = data.data;
        for (var i = 0; i < paths.length; i++) {
            this.asyncPathFind({ data: paths[i] });
        }
    }

    cancelFinder(objectId) {
        if (!this.finders[objectId]) {
            return false;
        }
        this.pf.cancel(this.finders[objectId]); //Safe to run even if undefined/null/non-existing/existing etc
        delete this.finders[objectId];
    }

    addFinder(objectId, instanceId) {
        if (this.finders[objectId] !== undefined && this.finders[objectId] !== instanceId) {
            this.cancelFinder(objectId);
        }
        this.finders[objectId] = instanceId; //Doesn't really need cleaning up its tiny footprint.

    }

    trimPathLog() {
        let keys = Object.keys(this.pathLog);
        if (keys.length > 100) { //100 Kind of assumed at most 100 path finders at once
            delete this.pathLog[keys[0]]; //Delete oldest
        }
    }

    addPathLog(targetId) {
        this.trimPathLog(); //Reduce size of log to avoid memory leak.
        this.pathLog[targetId] = { ended: false, status: 'in-progress' };
    }

    pathFailed(targetId) {
        this.pathLog[targetId].ended = true;
        this.pathLog[targetId].status = 'failed';
        this.pathLog[targetId].retryTime = this.ticks + 100; //Retry in 100 ticks
    }

    pathSuccess(targetId) {
        if(!this.pathLog[targetId]) {
            //TODO: No pathlog... not sure why this happens
            return;
        }
        this.pathLog[targetId].ended = true;
        this.pathLog[targetId].status = 'success';
    }

    removePathLog(targetId) {
        console.log("[ABE] Removing path log for: " + targetId);
        delete this.pathLog[targetId];
    }

    shouldPath(targetId) {
        if (this.pathLog[targetId]) {
            if (this.pathLog[targetId].status == 'failed') {
                if (this.pathLog[targetId].retryTime < this.ticks) {
                    this.removePathLog(targetId);
                }
                return false; //It failed last time, so we will not search this time round.
            }
        }
        //Doesn't exist in the path, so it should path and add log.
        this.addPathLog(targetId);
        return true;
    }

    outsideGrid(startX, startY, endX, endY) {
        return (
            startX < 0
            || startX > this.grid.length
            || startY < 0
            || startY > this.grid.length

            || endX < 0
            || endX > this.grid.length
            || endY < 0
            || endY > this.grid.length
        );

    }

    asyncPathFind(data) {
        var options = data.data;
        //console.error(options)




        
        servers.physics.helper.physicsUpdate('receivePath', { id: options.id, path: [], reason: 'emptying'});
        servers.physics.helper.worldUpdate('receivePath', { id: options.id, path: [], reason: 'emptying' });
        

        options.x += 32; //Add padding to make more accurate to current cell.
        options.y += 32; //Add padding to make more accurate to current cell.

        let startX = Math.floor(options.x / this.tileSize);
        let startY = Math.floor(options.y / this.tileSize);

        let endX = Math.floor(options.endX / this.tileSize);
        let endY = Math.floor(options.endY / this.tileSize);

        let targetId = options.targetId || endX + '_' + endY; //We would prefer to track an items id, if not existing, track the x-y loc

        let distance = servers.physics.helper.dist(
            { x: startX, y: startY },
            { x: endX, y: endY }
        )

        if (distance > 60) {
            //Too far so dont search
            servers.physics.helper.physicsUpdate('receivePath', { id: options.id, path: [], failed: true, reason: 'toofar:'+distance }); //OOB so just send back none.
            servers.physics.helper.worldUpdate('receivePath', { id: options.id, path: [], failed: true, reason: 'toofar:'+distance });
            return;
        }

        if
            (
            !this.shouldPath(targetId)  //If it cant add a pathlog
            || this.outsideGrid(startX, startY, endX, endY) //It it isn't inside the grid
        ) {
            //Outside of grid so don't search
            servers.physics.helper.physicsUpdate('receivePath', { id: options.id, path: [], failed: true , reason: 'oob' }); //OOB so just send back none.
            servers.physics.helper.worldUpdate('receivePath', { id: options.id, path: [], failed: true, reason: 'oob' });
            return;
        }

        try {
            this.cancelFinder(options.id); //Cancel any existing path for this instance

            var instanceId = this.pf.findPath(startX, startY, endX, endY, (path) => {

                if (path == null) {
                    servers.physics.helper.physicsUpdate('receivePath', { id: options.id, path: [], failed: true, reason: 'noresult' }); //TODO: is this needed?
                    servers.physics.helper.worldUpdate('receivePath', { id: options.id, path: [], failed: true, reason: 'noresult' });
                    this.pathFailed(targetId);
                } else {
                    path.shift(); //Remove first -- This is because it's normally the block the NPC is stood on
                    //path.push([options.endX, options.endY]); //Goto the absolute x,y (in most cases for user click paths)
                    servers.physics.helper.physicsUpdate('receivePath', { id: options.id, path: path, failed: false });  //TODO: is this needed?
                    servers.physics.helper.worldUpdate('receivePath', { id: options.id, path: path, failed: false });
                    this.pathSuccess(targetId);
                }
            });

            this.addFinder(options.id, instanceId);

        } catch (e) {
            console.error("[ABE] Fatal, failed path: ",options)
            console.error(e);
        }
    }
}

module.exports = ServerPath;

