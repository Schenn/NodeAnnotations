const fs = require("fs");
const path = require("path");
const Metadata = require("./Metadata");

const isJsFile = /((\.js)$)/;

module.exports = class Collector {

  constructor(){
    this._ = Symbol("Collector");
    this[this._] = {
      metadata:{},
      fileCount:-1
    };
  }

  get namespaces(){
    return Object.keys(this[this._].metadata);
  }

  classMetadata(namespace){
    return this[this._].metadata[namespace];
  }

  collectFromFile(fullPath, cb){
    let namespace = fullPath.replace(process.cwd(), "").replace(".js", "");
    // file
    this[this._].metadata[namespace] = new Metadata();
    this[this._].metadata[namespace].parseFile(fullPath, ()=>{
      if(this[this._].fileCount < 0){
        cb();
      } else {
        this[this._].fileCount--;
      }
    });
  }

  collectFromPath(fullPath, cb){
    // Does the path point to a file or a directory?
    if(isJsFile.test(fullPath)){
      this.collectFromFile(fullPath, cb);
    } else {
      // directory
      fs.readdir(fullPath, (err, subpaths)=>{
        if(err){
          console.log(err);
        }
        // -1 for the currently parsed directory.
        this[this._].fileCount += subpaths.length-1;
        for(let subpath of subpaths){
          this.collectFromPath(path.join(fullPath,subpath), cb);
        }
      });
    }
  }

};