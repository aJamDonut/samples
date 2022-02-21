class AbeFS {

    constructor(root, readOnly) {
        this.fs = require('fs');
        this.folder = this.root = root;
        this.readOnly = readOnly;
        this.ready = true;
        this.folderCache = {}; //Remember about already created folders
        this.keyCache = {}; //Remember about keys
        if(!this.ready) {
            console.error("[ABE] Broken fs dependency");
            return;
        }

        this.keyFile = 'keys.json';

        this.createRoot(root);
        this.keyTimer = false;
    }

    addKey(name) {
        if(this.keyCache[name]) {
            return; //We already know about this one
        }
        this.keyCache[name] = true;
        if(this.keyTimer) {
            clearTimeout(this.keyTimer);
        }
        //Reduce writing to file to avoid overwriting
        this.keyTimer = setTimeout(()=>{
            this.writeFileSync(this.keyFile, this.keyCache);
        }, 1000);
        
    }

    writeFileSync(filename, data, callback) {
        if(!callback) {
            callback = this.defaultCallback;
        }
        this.fs.writeFileSync(this.folder+"/"+filename, JSON.stringify(data), callback);
        
        this.addKey(filename);
        if(typeof callback == 'function') {
            callback();
        }
        
    }

    writeFile(filename, data, callback) {
        if(!callback) {
            callback = this.defaultCallback;
        }
        this.fs.writeFile(this.folder+"/"+filename, JSON.stringify(data), callback);
        this.addKey(filename);
    }

    setFolder(folder, create) {
        if(this.folder == this.root + "/" +folder) {
            return; //Already this folder
        }
        if(create) {
            this.createFolder(folder);
        }
        
        this.folder = this.root + "/" +folder;

        if(this.exists(this.folder+"/"+this.keyFile, true)) {
            this.keyCache = this.readFileSync(this.keyFile);
        } else {
            this.keyCache = {}; //No keeeeeyz
        }

    }

    readFileRaw(filename, callback) {
        if(!callback) {
            callback = this.defaultCallback();
        }
        
        this.fs.readFile(filename, 'utf8' , (err, data) => {
            if (err) {
                console.error(err)
                callback(false);
                return false;
            }
            callback(JSON.parse(data));
        })
    }

    readFile(filename, callback) {
        if(!callback) {
            callback = this.defaultCallback();
        }
        this.fs.readFile(this.folder + "/" + filename, 'utf8' , (err, data) => {
        if (err) {
            callback(false);
            return false;
        }
            callback(JSON.parse(data));
        })
    }

    exists(file, ignoreCache) {
        if(this.keyCache[file]) {
            return true;
        }

        if(ignoreCache) {
            return this.fs.existsSync(file)    
        }

        return false;
        
    }

    createRoot(root) {
        if(this.fs.existsSync(root)) {
            return true;
        }
        return this.fs.mkdirSync(this.root);
    }

    createFolder(folder) {
        if(this.folderExists(folder)) {
            return true;
        }
        return this.fs.mkdirSync(this.root + "/" +folder);
    }
    
    keyExists(key) {
        if(!this.keyCache[key]) {
            return false;
        }
        return true;
    }

    folderExists(folder) {
        if(!this.folderCache[folder]) {
            this.folderCache[folder] = this.exists(this.root + "/" + folder, true);    
        }
        return this.folderCache[folder];
    }

    defaultCallback() {
        
    }

    readFileSync(filename) {
        return JSON.parse(this.fs.readFileSync(this.folder + "/" + filename, {encoding:'utf8', flag:'r'}));
    }


    loadSync(key) {
        return this.readFileSync(key);
    }

    save(key, value, callback) {
        this.writeFile(key, value, callback);
    }

    saveSync(key, value, callback) {
        this.writeFileSync(key, value, callback);
    }

    load(key, callback) {
        this.readFile(key, callback);
    }

}