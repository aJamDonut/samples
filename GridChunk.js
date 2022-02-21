class GridChunkHolder extends PIXI.Container { }
class AbeStage extends PIXI.Container {

    constructor(name) {
        super();
        if (name) {
            this.name = name
        }
    }

}

class GridChunk extends PIXI.Graphics {
    constructor(drawMatrix, tileSize, textures, worldX, worldY) {
        super();
        this.treesList = {};
        this.worldX = worldX * game.grid.chunkSize;
        this.worldY = worldY * game.grid.chunkSize;
        this.textures = textures;
        this.tileSize = tileSize;
        this.shouldRedraw = false;
        this.trees = ['sprite_tree_redfern', 'sprite_tree_redfernsmalld', 'sprite_lots_o_grass', 'sprite_tree_yellowfern', 'sprite_tree_yellowfern']
        this.drawMatrix = drawMatrix;
        this.blocked = {};
        this.redraw();

    }
    render(e, r, t) {
        try {
            super.render(e, r, t);
        } catch (e) {
            if (!this.redrawAttempts) {
                this.redrawAttempts = 0;
            }
            this.redrawAttempts++;
            console.error("Failed to render");
            console.error(e);
            console.error(this.drawMatrix);
            if (this.redrawAttempts < 5) {
                this.redraw();
            }
        }

    }

    getTexture(x, y, i, j, localX, localY) {
        let sx = Math.floor((x - 1) * 64);
        let sy = Math.floor((y - 1) * 64);
        if(game.grid.zones.isSnow(i+localX, j+localY)) {
            if(game.grid.zones.isAsh(i+localX, j+localY)) {
                return game.render.newTexture(game.render.tilesets.sheet_tileset_ash, sx, sy, 64, 64);
            }
            return game.render.newTexture(game.render.tilesets.sheet_tileset_ice, sx, sy, 64, 64);
        }
        return game.render.newTexture(game.render.tilesets.background, sx, sy, 64, 64);

    }

    draw(drawMatrix) {

        
        this.cacheAsBitmap = false;
        
        this.clear();
        
        this.drawMatrix = drawMatrix;


        for (let i = 0; i < drawMatrix.length; i++) {
            for (let j = 0; j < drawMatrix[i].length; j++) {

                let x = (this.worldX * 64) + (i * 64);
                let y = (this.worldY * 64) + (j * 64);

                if (this.errorCheck(drawMatrix, i, j)) {
                    let genTree = false;
                    if (typeof drawMatrix[i][j][0] == 'number') {
                        //Old system (1 layer)
                        if (game.genGrass && drawMatrix[i][j][0] == 1 && drawMatrix[i][j][1] == 1) {
                            drawMatrix[i][j][0] = game.rng(1, 2);
                            drawMatrix[i][j][1] = game.rng(1, 4);
                        }
                        if (drawMatrix[i][j][0] < 3 && drawMatrix[i][j][1] < 5) {
                            genTree = true;
                        }
                        this.checkPathing(drawMatrix[i][j][0], drawMatrix[i][j][1], i, j);
                        this.drawTileRaw(this.getTexture(drawMatrix[i][j][0], drawMatrix[i][j][1], this.worldX, this.worldY, i, j), i, j, x, y);
                    } else {
                        //New system, (multi layer therefore its an array)

                        if (drawMatrix[i][j].length == 1) {
                            if (drawMatrix[i][j][0][0] < 3 && drawMatrix[i][j][0][1] < 5) {
                                genTree = true;
                            }
                        }

                        for (let k = 0; k < drawMatrix[i][j].length; k++) {
                            if (drawMatrix[i][j][k][0] === 0) { continue; } //Skip 0's
                            if (game.genGrass && drawMatrix[i][j][k][0] == 1 && drawMatrix[i][j][k][1] == 1) {
                                drawMatrix[i][j][k][0] = game.rng(1, 2);
                                drawMatrix[i][j][k][1] = game.rng(1, 4);
                            }


                            this.checkPathing(drawMatrix[i][j][k][0], drawMatrix[i][j][k][1], i, j);

                            this.drawTileRaw(this.getTexture(drawMatrix[i][j][k][0], drawMatrix[i][j][k][1], this.worldX, this.worldY, i, j), i, j, x, y);
                        }
                    }

                    try {
                        if (genTree && game.genTrees && !this.treesList[x + "-" + y]) {

                            let noise = game.grid.treeNoise.noise2D(this.worldX + i + 0.023, this.worldY + j + 0.033);

                            let spawnItem = this.trees[game.rng(0, this.trees.length - 1)]

                            if (noise > 0.90) {
                                spawnItem = 'sprite_boulder_1';
                            }

                            if (noise > 0.92) {
                                spawnItem = 'sprite_deviltongue_a';
                            }


                            
                            if (noise > 0.5) {
                                let tree = new SimpleItem(spawnItem);
                                tree.x = (this.worldX * 64) + (i * 64);
                                tree.y = (this.worldY * 64) + (j * 64);
                                this.treesList[x + "-" + y] = tree;

                                tree.meta.dontSave = true;
                                game.world.addObject(tree);
                                tree.onCreate();
                                tree.meta.sort = true;
                                

                                tree.scaleToGame();
                                tree.lX = x;
                                tree.lY = y;
                                tree.chunk = this;
                                game.render.lifeLayer.addChild(tree);
                                
                                
                                tree.events.onDestroy = function () {
                                    console.log("Destroy treeos");
                                    delete this.chunk.treesList[this.lX + "-" + this.lY];
                                }
                            }
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }

            }
        }


        //if (!game.editMode) {
            game.queue.add(() => {
                this.cacheAsBitmap = true;
                
                /*let texture = game.render.draw.generateTexture(this);
                console.log(texture);
                texture.baseTexture.scaleMode = PIXI.SCALE_MODES.NEAREST
                this.clear();
                this.beginTextureFill({
                    texture: texture
                });
                //Adding +1 to tilesize to avoid half pixel issue? dunno? shows lines anyways
                //console.log("x, y", x * this.tileSize, y * this.tileSize);
                this.rect(0, 0, 64, 64);
                this.endFill();*/
            });
        //}
        this.shouldRedraw = false;
        //game.render.draw.roundPixels = false;
        //PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.LINEAR; //Set scaling mode back to default
    }

    //TODO: turned off in production return true
    errorCheck(matrix, x, y) {
        if (!matrix[x]) {
            console.error("Matrix X: " + x + " not found")
            return false;
        }
        if (!matrix[x][y]) {
            console.error("Matrix X-Y: " + x + "-" + y + " not found", matrix[x][y], matrix[x]);
            return false;
        }
        return true;
    }

    redraw() {
        this.draw(this.drawMatrix);
    }

    addBlocker(x, y) {
        let atX = this.worldX + x;
        let atY = this.worldY + y;
        atX = atX * 64;
        atY = atY * 64;
        game.offloader.helper.pathUpdate('addBlocker', { x: atX, y: atY });
        game.offloader.helper.physicsUpdate('addBlocker', { x: atX, y: atY });
        this.blocked[x + "-" + y] = true;
        return true;
    }

    checkPathing(across, down, x, y) {
        //TODO: potentially rewrite this to send updates as chunks

        //De-dupes itself here
        if (this.blocked[x + "-" + y]) {
            return true; //Already blocked;
        }

        //Mtn
        if (across >= 3 && down >= 14) {
            return this.addBlocker(x, y)
        }

        //Walls
        if (across >= 3 && down <= 6) {
            return this.addBlocker(x, y)
        }

        return false;
    }

    drawTileRaw(texture, x, y) {
        if (!texture) {
            throw "[ABE] Can't find texture! " + texture;
        }

        this.beginTextureFill({
            texture: texture,
            
            
        });
        //Adding +1 to tilesize to avoid half pixel issue? dunno? shows lines anyways
        //console.log("x, y", x * this.tileSize, y * this.tileSize);
        this.rect(x * 64, y * 64, 64, 64);
        this.endFill();

    }

    rect(x, y, w, h) {
        return this.drawRect(x, y, w + 0.5, h + 0.5)
    }

    needRedraw() {
        if (this.shouldRedraw) {
            return false; //Already going to redraw
        }
        this.shouldRedraw = true;
        game.queue.add(() => {
            this.redraw()
        });
    }

    drawTile(x, y, across, down, layer) {


        //Check if it uses old style grid and convert it
        if (typeof this.drawMatrix[x][y][0] == 'number') {
            //It currently uses old type, so it will need converting.
            let copy = this.drawMatrix[x][y];
            this.drawMatrix[x][y] = [];
            this.drawMatrix[x][y].push(copy);
        }


        if (layer == 1 || typeof layer == 'undefined') {
            //Bottom layer + destroy others
            this.drawMatrix[x][y] = [];
            this.drawMatrix[x][y].push([across, down]);
        } else {
            if (this.drawMatrix[x][y][layer]) {
                this.drawMatrix[x][y][layer] = [across, down];
            } else {
                while (layer > this.drawMatrix[x][y].length) {
                    this.drawMatrix[x][y].push([0, 0])
                }
                this.drawMatrix[x][y].push([across, down]);
            }
        }
        this.needRedraw();
    }

    getTile(x, y, layer) {
        if (typeof this.drawMatrix[x][y][0] == 'number') {
            if (layer > 0) {
                return [1, 1]; //TODO: add toggle to factor in if colliding or not?
            } else {
                return this.drawMatrix[x][y];
            }

        } else {
            if (typeof layer == 'undefined') {
                //Return bottom layer if no layer set
                return this.drawMatrix[x][y][0] || [1, 1];
            } else {
                return this.drawMatrix[x][y][layer] || [1, 1]; //If no tile is there, tell it to calculate as a default tile
            }
        }
    }

}