const fs = require("fs");
const path = require("path");
const Metadata = require("./Metadata");
const EventEmitter = require('events');

// Does the phrase end in .js
const isJsFile = /(\.js)$/;
const _ = Symbol("private");

/**
 * The Collector parses directories and files and memoizes their details using the Metadata class.
 *
 * @type {Collector}
 */
module.exports = class Collector extends EventEmitter {

  constructor(){
    super();
    this[_] = {
      metadata:{},
      fileCount:-1,
      filePath:'',
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
   * For looping/mapping
   *
   * @return {*|metadata|{}}
   */
  get metadata(){
    return this[_].metadata;
  }

  set filePath(filepath){
    this[_].filePath = filepath;
  }

  /**
   * Get the filepath that this collector fetched from.
   * @return {string}
   */
  get filePath(){
    return this[_].filePath;
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
  async collectFromFile(fullPath, onComplete){
    let namespace = fullPath.replace(this.filePath, "").replace(".js", "");
    // file
    this[_].metadata[namespace] = new Metadata();
    let metadata = await this[_].metadata[namespace].parseFile(fullPath);
    this.emit("fileParsed", metadata, namespace);
    // If this is the last file being parsed, trigger the callback.
    if(this[_].fileCount < 0){
      onComplete();
    } else {
      this[_].fileCount--;
    }
  }

  /**
   * Collect all the files from a directory (and any subdirectories).
   *  Each file is then passed to collectFromFile which memoizes the class details in a Metadata class.
   *
   * @param {string} fullPath
   */
  collectFromPath(fullPath, onComplete, onError=(err)=>{console.log(err);}){
    if(this[_].filePath ===''){
      this[_].filePath = fullPath;
    }
    // Does the path point to a file or a directory?
    if(isJsFile.test(fullPath)){
      this.collectFromFile(fullPath, onComplete);
    } else {
      // directory
      fs.readdir(fullPath, (err, subpaths)=>{
        if(err){
          onError(err);
        }
        // -1 for managing offset.
        this[_].fileCount += subpaths.length-1;
        for(let subpath of subpaths){
          this.collectFromPath(path.join(fullPath,subpath), onComplete, onError);
        }
      });
    }
  }

  /**
   * Start the collection process and get a promise
   * @return {Promise<any>}
   */
  collect(){
    return new Promise((resolve, reject)=>{
      this.collectFromPath(this[_].filePath, resolve, reject);
    });
  }
};