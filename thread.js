
var emitter = function (data){
    //console.log(data);
    try {
        postMessage(data);
    } catch(e) {
        console.error(e);
    }
}

game.factions = new Factions();

var servers = {
    path: new ServerPath(),
    physics: new ServerPhysics(emitter),
    world: new ServerWorld(emitter),
    disk: new ServerWorld(emitter)
};
game.servers = servers;
game.rng = game.servers.world.rng;
onmessage = function(request) {
    var data = request.data;


    if(data.action == 'startPhysics') {
        servers.physics.doUpdate = function(delta) {
            
            servers.physics.tick(function(data){
                postMessage({time: Date.now(), tick: true, action: data.action, response: data.response, creatorId: data.creatorId, data: data});
            }, delta);
            
        }
        servers.physics.Events.on(servers.physics.runner, "afterTick", servers.physics.doUpdate)
        return true;
    }

    if(data.action == 'startWorld') {
        servers.world.doUpdate = function(delta) {
            servers.world.tick(function(data){
                try {
                    postMessage({time: Date.now(), tick: true, action: data.action, response: data.response, creatorId: data.creatorId, data: data});
                } catch(e) {
                    console.error("[ABE] Failed to parse object in server world");
                    console.error(data);
                    console.error(e);
                }
            }, delta);
        }
        servers.physics.Events.on(servers.physics.runner, "afterTick", servers.world.doUpdate)
        return true;
    }

    if(data.async == true) {
        if(typeof servers[data.server][data.action] !== 'function') {
            console.error("Attempted to execute: "+data.server+"->"+data.action+" but not exist ");
        } else {
            try {
                servers[data.server][data.action](data, function(response){
                        postMessage({time: Date.now(), action: data.action, server: data.server, response: response, id: data.creatorId, data: data.data});
                });
            } catch (e) {
                console.error(e);
            }
        }
    } else {
        if(typeof servers[data.server][data.action] !== 'function') {
            console.error("Attempted to execute: "+data.server+"->"+data.action+" but not exist ");
        } else {
            try {
                var response = {time: Date.now(), action: data.action, server: data.server, response: servers[data.server][data.action](data), id: data.creatorId, data: data.data};
                //postMessage(response); //if you want to reply
            } catch (e) {
                console.error(e);
            }
        }
    }
}