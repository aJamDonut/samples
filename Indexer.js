class Indexer {

    constructor() {
        this.index = {};
		this.index['all'] = {};
	}

	find(id) {
		return this.index['all'][id] || false;
	}

	getAll() {
		return this.index;
	}

	getIndexes(indexes) {
		let hash = {};
		for(let i = 0; i < indexes.length; i++) {
			Object.assign(hash, this.getIndex(indexes[i]))
		}
		return hash;
	}

	
	getIndex(name) {
		if(this.index[name] == undefined) {
			return {};
		}
		return this.index[name];
	}

	getIndexAsArray(index) {
		return Object.values(this.getIndex(index));
	}

	getIndexesAsArray(indexes) {
		let results = [];
		for(let i = 0; i < indexes.length; i++) {
			console.log(indexes[i]);
			results = results.concat(this.getIndexAsArray(indexes[i]));
		}
		return results;
	}

	quickFilterAsArray(objectList, filter, attributes) {
		var list = this.filterObjectsAsArray(objectList, filter);

		var newList = [];

		for(var i=0; i < list.length; i++) {
			if(typeof attributes === 'function') {
				newList.push(attributes(list[i]));
			} else {
				newList.push(list[i]);
			}
		}

		return newList;

	}
	quickFilterAsList(objectList, filter, attributes) {
		var list = this.filterObjectsAsList(objectList, filter);

		var keys = Object.keys(list);

		var newList = {};

		for(var i=0; i < keys.length; i++) {
			if(typeof attributes === 'function') {
				newList[keys[i]] = attributes(list[keys[i]]);
			} else {
				newList[keys[i]] = list[keys[i]];
			}
		}

		return newList;
	}
	

	//Returns object
	filterObjectsAsList(objectList, filter) {

		var keys = Object.keys(objectList);

		var list = {};

		for(var i = 0; i < keys.length; i++) {
			if(filter(objectList[keys[i]])) {
				list[keys[i]] = objectList[keys[i]];
			}
		}

		return list;

	}

	//Returns array
	filterObjectsAsArray(objectList, filter) {

		var keys = Object.keys(objectList);

		var list = [];

		for(var i = 0; i < keys.length; i++) {
			if(filter(objectList[keys[i]])) {
				list.push(objectList[keys[i]]);
			}
		}

		return list;

	}
	

	//Returns array of object keys
	filterKeys(objectList, filter) {

		return Object.keys(this.filterObjectsAsList(objectList, filter));

	}
	
	addToIndexes(indexes, objectToAdd, id) {
		for(var i = 0; i < indexes.length; i++) {
			this.addToIndex(indexes[i], objectToAdd, id);
		}
	}

	getFromIndex(id, name) {
		if(!name) {
			return this.index['all'][id];
		} else {
			return this.index[name][id];
		}
	}

    addToIndex(indexName, objectToAdd, id) {

		if(indexName == 'undefined' || typeof indexName == 'undefined') {
			return; //Won't add to this.
		}

		if(typeof objectToAdd === 'undefined') {
			//We don't allow undefined I guess
			console.error("[ABE] Tried to pass undefined to index: "+indexName+" with ID: "+id);
			return false;
		}

		if(this.index[indexName] == undefined) {
			this.index[indexName] = {};
		}

		
        
        if(id == undefined) {
            //Add it to the index with its ID as the property name
			if(!objectToAdd.id) {
				objectToAdd.id = game.randID();
			}
            this.index[indexName][objectToAdd.id] = objectToAdd;
        } else {
            this.index[indexName][id] = objectToAdd;
        }
		
		//Add a reference internally to the object, to let it know which indexes
		//it belongs to
		if(objectToAdd.indexes == undefined) {
			objectToAdd.indexes = {};
		}
		objectToAdd.indexes[indexName] = true;
		return objectToAdd;
	}

    isInIndex(indexName, check) {
		if(this.index[indexName] === undefined) {
			//Index doesnt exist so obviously doesn't exist inside it
			return false;
		} else {
            if(check.id == undefined) {
                var checkObject = {id:check}; //Use check as key rather than object
            } else {
                var checkObject = check;
            }
			if(this.index[indexName][checkObject.id] === undefined) {
				//Cant be seen so not in the index
				return false;
			} else {
				//Exists in the index as some form of data
				return true;
			}
		}
	}

	indexCount(index) {
		if(this.index[index] == undefined) {
			return 0;
		} else {
			return Object.keys(this.index[index]).length;
		}
    }
	
	removeFromIndex(indexName, check, destroy) {
		if(destroy===undefined) {
			destroy= false;
		}
		if (this.index[indexName] !== undefined) { //Sometimes the index doesn't exist
            if(check.id == undefined) {
                var checkObject = {id:check}; //Use check as key rather than object
            } else {
                var checkObject = check;
            }
			if(this.index[indexName][checkObject.id] !== undefined) { //Sometimes the item doesn't exist in the index
                delete this.index[indexName][checkObject.id].indexes[indexName]; //Remove self ref to index.
				if(destroy) {
					this.index[indexName][checkObject.id].destroy();
				}
				delete this.index[indexName][checkObject.id];
			}
        }
        
    }
    removeFromAllIndexes(check, destroy) {
		if(!check) {
			//Nothing real passed so return
			return;
		}
		if(check.indexes !==undefined) {
			if(Object.keys(check.indexes).length === 0) {
				//No indexes, return 1
				return 1;
			} else {
                for(var index in check.indexes) {
                    this.removeFromIndex(index, check, false);
                } 
			}
        }
        if(destroy === true) {
			if(typeof check.destroy == 'function') {
				check.destroy();
			}
		}
	}

	isIndex(name) {
		return typeof this.index[name] !== 'undefined';
	}

	//Note! Does not destroy objects in the index.
	emptyIndex(name) {
		this.index[name] = {};
	}
}
module.exports = Indexer;