const fs = require("fs");
const path = require("path");
const Metadata = require("./Metadata");

// Does the phrase end in .js
const isJsFile = /((\.js)$)/;

/**
 * The Collector parses directories and files and memoizes their details using the Metadata class.
 *
 * @type {module.Collector}
 */
module.exports = class Collector {

  constructor(){
    this._ = Symbol("Collector");
    this[this._] = {
      metadata:{},
      fileCount:-1,
      filePath:''
    };
  }

  /**
   * The namespaces (relative file paths) of the classes that were memoized.
   *
   * @return {string[]}
   */
  get namespaces(){
    return Object.keys(this[this._].metadata);
  }

  /**
   * Get the metadata for a given namespace.
   *
   * @param {string} namespace
   * @return {Metadata}
   */
  classMetadata(namespace){
    return this[this._].metadata[namespace];
  }

  /**
   * Get the filepath that this collector fetched from.
   * @return {string}
   */
  get filePath(){
    return this[this._].filePath;
  }

  /**
   * Create a metadata for a given file.
   *
   * @param {string} fullPath
   * @param {function} cb
   */
  collectFromFile(fullPath, cb){
    let namespace = fullPath.replace(process.cwd(), "").replace(".js", "");
    // file
    this[this._].metadata[namespace] = new Metadata();
    this[this._].metadata[namespace].parseFile(fullPath, ()=>{
      // If this is the last file being parsed, trigger the callback.
      if(this[this._].fileCount < 0){
        cb();
      } else {
        this[this._].fileCount--;
      }
    });
  }

  /**
   * Collect all the files from a directory (and any subdirectories).
   *  Each file is then passed to collectFromFile which memoizes the class details in a Metadata class.
   *
   * @param {string} fullPath
   * @param {function} cb
   */
  collectFromPath(fullPath, cb){
    if(this[this._].filePath ===''){
      this[this._].filePath = fullPath;
    }
    // Does the path point to a file or a directory?
    if(isJsFile.test(fullPath)){
      this.collectFromFile(fullPath, cb);
    } else {
      // directory
      fs.readdir(fullPath, (err, subpaths)=>{
        if(err){
          console.log(err);
        }
        // -1 for managing offset.
        this[this._].fileCount += subpaths.length-1;
        for(let subpath of subpaths){
          this.collectFromPath(path.join(fullPath,subpath), cb);
        }
      });
    }
  }
};