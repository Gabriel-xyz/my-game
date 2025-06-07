// i noticed this game on github chose to use one array to store the entire map's tiles instead of two arrays and it looks pretty intelligently coded, the person uses bitwise operations after all, so maybe using one array is faster? if a tile was at position 51 149 and the map size was 500 he would access it like [51 * 500 + 149]

// this is for the server side tilemap representation only and has nothing to do with the client representation which would be handled by pixi-tilemap or something. grok said this is efficient and scalable and that tilemaps dont need a broadphase because theyre stored in an o(1) grid which already serves as a broadphase. there is some possibly good stuff in here. it stores only dense tile or modified tiles in the Map, nondense tiles have no presence on the server until modified to either be dense or they need some other metadata like appearance. i dont like how the hashkey is a string but im sure something can be done about that. i told the ai our game only has aabb collisions so it made the getcollidabletilesinaab only take an aabb to check if it is colliding with the tiles around it. it also easily expands to add other tile data using the tileData property such as health or icon or type etc. it calls this a "sparse tilemap"

class Tilemap {
	constructor(width, height) {
	  this.width = width; // 500
	  this.height = height; // 500
	  this.tiles = new Map(); // Sparse storage: key = "x:y", value = { collidable: true }
	}
    
	// Get tile state at (x, y)
	getTile(x, y) {
	  if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
	    return { collidable: false }; // Out-of-bounds tiles are non-collidable
	  }
	  const key = `${x}:${y}`;
	  return this.tiles.has(key) ? this.tiles.get(key) : { collidable: false };
	}
    
	// Set tile state at (x, y)
	setTile(x, y, tileData) {
	  if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
	  const key = `${x}:${y}`;
	  if (tileData.collidable) {
	    this.tiles.set(key, { collidable: true });
	  } else {
	    this.tiles.delete(key); // Revert to default (non-collidable)
	  }
	}
    
	// Get all collidable tiles in an AABB (for collision checks)
	getCollidableTilesInAABB(aabb) {
	  const collidableTiles = [];
	  const minX = Math.floor(aabb.x);
	  const maxX = Math.floor(aabb.x + aabb.width);
	  const minY = Math.floor(aabb.y);
	  const maxY = Math.floor(aabb.y + aabb.height);
    
	  for (let x = minX; x <= maxX; x++) {
	    for (let y = minY; y <= maxY; y++) {
		const tile = this.getTile(x, y);
		if (tile.collidable) {
		  collidableTiles.push({ x, y, tile });
		}
	    }
	  }
	  return collidableTiles;
	}
    }


// it also gave me this alternate version with a broadphase just in the profile does show it is more efficient, because the ai cant be certain. this divides the map into 16x16 tile cells, but it believes a broadphase like this is not necessary
class Tilemap {
	constructor(width, height, cellSize = 16) {
	  this.width = width;
	  this.height = height;
	  this.cellSize = cellSize;
	  this.tiles = new Map(); // "x:y" -> { collidable: true }
	  this.spatialHash = new Map(); // "cellX:cellY" -> Set of tile keys
	}
    
	setTile(x, y, tileData) {
	  if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
	  const key = `${x}:${y}`;
	  const cellX = Math.floor(x / this.cellSize);
	  const cellY = Math.floor(y / this.cellSize);
	  const cellKey = `${cellX}:${cellY}`;
    
	  if (tileData.collidable) {
	    this.tiles.set(key, { collidable: true });
	    if (!this.spatialHash.has(cellKey)) {
		this.spatialHash.set(cellKey, new Set());
	    }
	    this.spatialHash.get(cellKey).add(key);
	  } else {
	    this.tiles.delete(key);
	    if (this.spatialHash.has(cellKey)) {
		this.spatialHash.get(cellKey).delete(key);
		if (this.spatialHash.get(cellKey).size === 0) {
		  this.spatialHash.delete(cellKey);
		}
	    }
	  }
	}
    
	getCollidableTilesInAABB(aabb) {
	  const collidableTiles = [];
	  const minCellX = Math.floor(aabb.x / this.cellSize);
	  const maxCellX = Math.floor((aabb.x + aabb.width) / this.cellSize);
	  const minCellY = Math.floor(aabb.y / this.cellSize);
	  const maxCellY = Math.floor((aabb.y + aabb.height) / this.cellSize);
    
	  for (let cx = minCellX; cx <= maxCellX; cx++) {
	    for (let cy = minCellY; cy <= maxCellY; cy++) {
		const cellKey = `${cx}:${cy}`;
		if (this.spatialHash.has(cellKey)) {
		  for (const tileKey of this.spatialHash.get(cellKey)) {
		    const [x, y] = tileKey.split(':').map(Number);
		    if (
			x >= aabb.x &&
			x < aabb.x + aabb.width &&
			y >= aabb.y &&
			y < aabb.y + aabb.height
		    ) {
			collidableTiles.push({ x, y, tile: this.tiles.get(tileKey) });
		    }
		  }
		}
	    }
	  }
	  return collidableTiles;
	}
    
	getTile(x, y) {
	  if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
	    return { collidable: false };
	  }
	  const key = `${x}:${y}`;
	  return this.tiles.has(key) ? this.tiles.get(key) : { collidable: false };
	}
    }


// when i asked for a version where the hashkey is not a string it said use bitpacking like this, i dont really get it but supposedly it is 10x faster than a string. this is the version out of all versions is recommends using the most, for efficiency. it says this can support a 65000x65000 map because of the 16 bit number
class Tilemap {
	constructor(width, height) {
	  this.width = width; // 500
	  this.height = height; // 500
	  this.tiles = new Map(); // key = number, value = { collidable: true }
	}
    
	// Create numeric key
	getKey(x, y) {
	  return (x << 16) | y; // Pack x and y into a 32-bit integer
	}
    
	// Get tile state at (x, y)
	getTile(x, y) {
	  if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
	    return { collidable: false };
	  }
	  const key = this.getKey(x, y);
	  return this.tiles.has(key) ? this.tiles.get(key) : { collidable: false };
	}
    
	// Set tile state at (x, y)
	setTile(x, y, tileData) {
	  if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
	  const key = this.getKey(x, y);
	  if (tileData.collidable) {
	    this.tiles.set(key, { collidable: true });
	  } else {
	    this.tiles.delete(key); // Revert to non-collidable
	  }
	}
    
	// Get collidable tiles in an AABB
	getCollidableTilesInAABB(aabb) {
	  const collidableTiles = [];
	  const minX = Math.floor(aabb.x);
	  const maxX = Math.floor(aabb.x + aabb.width);
	  const minY = Math.floor(aabb.y);
	  const maxY = Math.floor(aabb.y + aabb.height);
    
	  for (let x = minX; x <= maxX; x++) {
	    for (let y = minY; y <= maxY; y++) {
		const tile = this.getTile(x, y);
		if (tile.collidable) {
		  collidableTiles.push({ x, y, tile });
		}
	    }
	  }
	  return collidableTiles;
	}
    }


// it also suggested since the key in a Map can be anything then why not just use an array [x,y] as the key? but it said it doesnt expect this method to be any faster than using a string and perhaps even worse
class Tilemap {
	constructor(width, height) {
	  this.width = width;
	  this.height = height;
	  this.tiles = new Map(); // key = [x, y], value = { collidable: true }
	}
    
	getTile(x, y) {
	  if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
	    return { collidable: false };
	  }
	  const key = [x, y];
	  return this.tiles.has(key) ? this.tiles.get(key) : { collidable: false };
	}
    
	setTile(x, y, tileData) {
	  if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
	  const key = [x, y];
	  if (tileData.collidable) {
	    this.tiles.set(key, { collidable: true });
	  } else {
	    this.tiles.delete(key);
	  }
	}
    
	// getCollidableTilesInAABB remains the same
    }


// it also suggested using a 2d array just to see if it is faster, it is giving me all these versions to profile myself, so at least i can gain some perspective on the difference any of these make
class Tilemap {
	constructor(width, height) {
	  this.width = width;
	  this.height = height;
	  this.tiles = Array.from({ length: height }, () => new Array(width).fill(false));
	}
    
	getTile(x, y) {
	  if (x < 0 || x >= this.width || y < 0 || y >= this.height) {
	    return { collidable: false };
	  }
	  return { collidable: this.tiles[y][x] };
	}
    
	setTile(x, y, tileData) {
	  if (x < 0 || x >= this.width || y < 0 || y >= this.height) return;
	  this.tiles[y][x] = tileData.collidable;
	}
    
	getCollidableTilesInAABB(aabb) {
	  const collidableTiles = [];
	  const minX = Math.floor(aabb.x);
	  const maxX = Math.floor(aabb.x + aabb.width);
	  const minY = Math.floor(aabb.y);
	  const maxY = Math.floor(aabb.y + aabb.height);
    
	  for (let x = minX; x <= maxX; x++) {
	    for (let y = minY; y <= maxY; y++) {
		const tile = this.getTile(x, y);
		if (tile.collidable) {
		  collidableTiles.push({ x, y, tile });
		}
	    }
	  }
	  return collidableTiles;
	}
    }
