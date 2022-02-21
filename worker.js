//Silencer
//consoleblog = //console.error;
//console.log = function() {}
//console.debug = function() {}
//console.error = function(){}

var module = {} //Polyfill
module.exports = {};

var game = {};
game.ts = 0;

importScripts('pathfinder.easy.js');
importScripts('serverpath.js');
importScripts('serverphysics.js');
importScripts('serverworld.js');
importScripts('serverhelper.js');
importScripts('serverlife.js');
importScripts('serveritem.js');
importScripts('../classes/Indexer.js');
importScripts('../classes/AbeFSAjax.js');
importScripts('../../../lib/matterjs/matter.js');
importScripts('../classes/Factions.js');


Matter.Common.now = function() { //Polyfill (it looks for window.performance)
    return (new Date()) - Matter.Common._nowStartTime;
}
importScripts('/gd_cp/http/modules/gd_mod_2d/dev_stubs/ext_ez_load.php?source=deaddesert&export=phys_&join=_PHYSICS&bootstrap=false&createKey=collisions&createRoot=true');
importScripts('/gd_cp/http/modules/gd_mod_2d/dev_stubs/ext_ez_load.php?source=deaddesert&export=ai_states_collections&join=_AISTATECOLLECTIONS&bootstrap=false&createRoot=true');
importScripts('/gd_cp/http/modules/gd_mod_2d/dev_stubs/ext_ez_load.php?source=deaddesert&export=ai_states&join=_AISTATES&bootstrap=false&createRoot=true');
importScripts('/gd_cp/http/modules/gd_mod_2d/dev_stubs/ext_ez_load.php?source=deaddesert&export=status_effects_server&join=_STATUSES&bootstrap=false&createRoot=true');
importScripts('/gd_cp/http/modules/gd_mod_2d/dev_stubs/ext_ez_load.php?source=deaddesert&export=build_persistent_items&join=_BLUEPRINTS&bootstrap=false&createKey=persistent&createRoot=true');

//Add to liveworker
importScripts('/gd_cp/http/modules/gd_mod_2d/dev_stubs/ext_ez_load.php?source=deaddesert&export=blueprint_recipe&join=_BLUEPRINTS&bootstrap=false&createKey=RECIPES');

game.fs = new AbeFSAjax('gamedata', false); //Per save file
game.globalfs = new AbeFSAjax('gamedata', false); //Consistent everywhere
game.fs.setFolder('current', true);
game.globalfs.setFolder('global', true);

importScripts('thread.js');