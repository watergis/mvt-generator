const fs = require('fs');
const path = require('path');

module.exports = class MBTiles{
  constructor(format){
    this.format = format;
  }

  start(){
    const this_ = this;
    return new Promise((resolve, reject)=>{
      if (fs.existsSync(this_.format.output)){
        fs.rmdirSync(this_.format.output, { recursive: true });
      }
      resolve()
    })
  }

  write(tile, buffer){
    const this_ = this;
    return new Promise((resolve, reject)=>{
      let filepath;
      if (buffer){
        filepath = this_.format.output + `/${tile[2]}/${tile[0]}/${tile[1]}.pbf`
        fs.mkdirSync(path.dirname(filepath), { recursive: true });
        fs.writeFileSync(filepath, buffer);
      }
      resolve(filepath)
    })
  }

  stop(){
    return new Promise((resolve, reject)=>{
      resolve()
    })
  }
}