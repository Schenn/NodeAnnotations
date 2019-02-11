const fs = require("fs");
const path = require("path");
const Metadata = require("./Metadata");

// Does the phrase end in .js
const isJsFile = /(\.js)$/;
const _ = Symbol("private");

/**
 * The Collector parses directories and files and memoizes their details using the Metadata class.
 *
 * @type {Collector}
 */
module.exports = class Collector {

  constructor(){
    this[_] = {
      metadata:{},
      fileCount:-1,
      filePath:'',
      onFileParsed: (metadata)=>{},
      onComplete: ()=>{}
    };
  }

  /**
   * The namespaces (relative file paths) of the classes that were memoized.
   *
   * @return {string[]}
   */
  get namespaces(){
    return Object.keys(this[_].metadata);
  }

  /**
   * Get the filepath that this collector fetched from.
   * @return {string}
   */
  get filePath(){
    return this[_].filePath;
  }

  /**
   * Callback to trigger whenever any file is finished parsing.
   * @param {function} cb
   */
  set onFileParsed(cb){
    this[_].onFileParsed = cb;
  }

  /**
   * Callback to trigger when all the requested files are finished parsing.
   * @param cb
   */
  set onComplete(cb){
    this[_].onComplete = cb;
  }

  /**
   * Get the metadata for a given namespace.
   *
   * @param {string} namespace
   * @return {Metadata}
   */
  classMetadata(namespace){
    return this[_].metadata[namespace];
  }

  /**
   * Create a metadata for a given file.
   *
   * @param {string} fullPath
   */
  collectFromFile(fullPath){
    let namespace = fullPath.replace(this.filePath, "").replace(".js", "");
    // file
    this[_].metadata[namespace] = new Metadata();
    this[_].metadata[namespace].parseFile(fullPath, ()=>{
      this[_].onFileParsed(this[_].metadata[namespace], namespace);
      // If this is the last file being parsed, trigger the callback.
      if(this[_].fileCount < 0){
        this[_].onComplete();
      } else {
        this[_].fileCount--;
      }
    });
  }

  /**
   * Collect all the files from a directory (and any subdirectories).
   *  Each file is then passed to collectFromFile which memoizes the class details in a Metadata class.
   *
   * @param {string} fullPath
   */
  collectFromPath(fullPath){
    if(this[_].filePath ===''){
      this[_].filePath = fullPath;
    }
    // Does the path point to a file or a directory?
    if(isJsFile.test(fullPath)){
      this.collectFromFile(fullPath);
    } else {
      // directory
      fs.readdir(fullPath, (err, subpaths)=>{
        if(err){
          console.log(err);
        }
        // -1 for managing offset.
        this[_].fileCount += subpaths.length-1;
        for(let subpath of subpaths){
          this.collectFromPath(path.join(fullPath,subpath));
        }
      });
    }
  }
};