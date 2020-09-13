const fs = require('fs');
const path = require('path');
const MBTilesControler = require('@mapbox/mbtiles');

module.exports = class MBTiles{
  constructor(format){
    this.format = format;
    this.mbtiles = null;
  }

  start(){
    const this_ = this;
    
    return new Promise((resolve, reject)=>{
      const output = this_.format.output;
      const metadata = this_.format.metadata;
    
      if (fs.existsSync(output)){
        fs.unlinkSync(output);
      }
      fs.mkdirSync(path.dirname(output), { recursive: true });

      new MBTilesControler(output, function(err, mbtiles) {
        if (err) reject(err);
        this_.mbtiles = mbtiles;
        this_.mbtiles.startWriting((err)=>{
          if (err) reject(err);
          this_.mbtiles.putInfo(metadata, function(err) {
            if (err) reject(err);
            resolve() // mbtiles object with methods listed below
          });
        })
      });
    })
  }

  write(tile, buffer){
    const this_ = this;
    return new Promise((resolve, reject)=>{
      if (!this_.mbtiles)resolve();
      if (!buffer)resolve();
      this_.mbtiles.putTile(tile[2], tile[0], tile[1], buffer, function(err) {
        if (err) reject(err);
        resolve(`${tile[2]}/${tile[0]}/${tile[1]}.pbf`);
      });
    })
  }

  stop(){
    const this_ = this;
    return new Promise((resolve, reject)=>{
      if (!this_.mbtiles)resolve();
      this_.mbtiles.stopWriting(function(err) {
        if (err) reject(err);
        resolve()
      });
    })
  }
}