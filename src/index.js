const tilebelt = require('@mapbox/tilebelt');
const pg = require('pg');
const mapnik = require('mapnik');
const zlib = require('zlib');
if (mapnik.register_default_input_plugins) mapnik.register_default_input_plugins();
const Format = require('./format');

class MvtGenerator{
  constructor(config){
    this.config = config;
    this.pool = new pg.Pool(config.db);
  }

  async generate(extent, minzoom, maxzoom){
    const tiles = this.createTileIndexes(extent, minzoom, maxzoom);

    let formatConfig = this.config.format;
    let format;
    switch (formatConfig.type){
      case 'mbtiles':
        format = new Format.mbtiles(formatConfig);
        break;
      case 'pbf':
        format = new Format.pbf(formatConfig);
        break;
      default:
        throw new Error(`Invalid format: ${format.type}.`);
    }
    
    const client = await this.pool.connect();
    await format.start();
    let count=0;
    try {
      for (let i = 0; i < tiles.length; i++){
        let tile = tiles[i]
        let buffer = await this.createOnetile(client, tile);
        if (buffer){
          let result = await format.write(tile, buffer);
          // console.log(result);
          if (result){
            this.report(count, tiles.length, result);
          }
          count++;
        }
        
      }
    }finally{
      await format.stop();
      client.release();
    }
    

    return;
  }

  createTileIndexes(extent, minzoom, maxzoom){
    let tiles = [];
    for (let z=minzoom; z<=maxzoom; z++){
      let tile1 = tilebelt.pointToTile(extent[0], extent[1], z);
      let tile2 = tilebelt.pointToTile(extent[2], extent[3], z);

      let minx = (tile1[0]<=tile2[0])?tile1[0]:tile2[0];
      let maxx = (tile1[0]<=tile2[0])?tile2[0]:tile1[0];

      let miny = (tile1[1]<=tile2[1])?tile1[1]:tile2[1];
      let maxy = (tile1[1]<=tile2[1])?tile2[1]:tile1[1];

      for (let x = minx; x <= maxx; x++){
        for (let y = miny; y <= maxy; y++){
          tiles.push([x, y, z]);
        }
      }
    }
    return tiles;
  }

  tile_to_box(z, x, y, pixel){
    const scaleFactor = 20037508.342789244;
    const size = 256;
    pixel = pixel | 0;

    let tileX = x * size;
    let tileY = y * size;
    let center = (size << z) >> 1;

    let minLat = ((center - (tileY + size + pixel)) / center) * scaleFactor;
    let maxLat = ((center - (tileY - pixel)) / center) * scaleFactor;

    let minLon = (((tileX - pixel) - center) / center) * scaleFactor;
    let maxLon = (((tileX + size + pixel) - center) / center) * scaleFactor;
    return [minLon, minLat, maxLon, maxLat];
  }

  async createOnetile(client, tile){
    const x = tile[0];
    const y = tile[1];
    const z = tile[2];

    let promises = [];
    this.config.layers.forEach(layer=>{
      if (layer.minzoom && z < layer.minzoom){
        return null;
      }
      if (layer.maxzoom && z > layer.maxzoom){
        return null;
      }
      var extent = this.tile_to_box(z, x, y, layer.buffer);
      
      let sql = layer.query
        .replace(/{minx}/g, extent[0])
        .replace(/{miny}/g, extent[1])
        .replace(/{maxx}/g, extent[2])
        .replace(/{maxy}/g, extent[3]);
      promises.push(this.getGeoJSON(client, layer.name, sql));
    })

    const layers = await Promise.all(promises);
    var vtile = new mapnik.VectorTile(z, x, y);
    layers.forEach(layer=>{
      if (layer.geojson && layer.geojson.features){
        vtile.addGeoJSON(JSON.stringify(layer.geojson), layer.name)
      }
    })
    if (vtile.empty()){
      return null;
    }
    var buffer = zlib.gzipSync(new Buffer.from(vtile.getData()));
    return buffer;
  }

  async getGeoJSON(client, name, sql){
    const res = await client.query(sql);
    const geojson = res.rows[0].json;
    return {
      name: name,
      geojson: geojson
    }
  }

  report(c, count, path) {
    if (c === count || c % 100 === 0) {
      console.log(
        `${c} of ${count} (${Math.round((c * 100.0) / count)}%) ${path}`
      );
    }
  }

}

module.exports = MvtGenerator;