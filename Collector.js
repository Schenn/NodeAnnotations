const fs = require("fs");
const path = require("path");
const Metadata = require("./Metadata");
const EventEmitter = require('events');

// Does the phrase end in .js
const isJsFile = /\.js$/;

/**
 * The Collector parses directories and files and memoizes their details using the Metadata class.
 *
 * @type {Collector}
 */
module.exports = class Collector extends EventEmitter {

  #metadata = null;
  #fileCount = 0;

  filePath = '';

  constructor(){
    super();
    this.#metadata = new Map();
  }

  [Symbol.iterator]() {
    let meta = this.#metadata.entries();
    const nextMeta = ()=>{
      return meta.next().value;
    };

    return {next: nextMeta};
  }

  /**
   * The namespaces (relative file paths) of the classes that were memoized.
   *
   * @return {string[]}
   */
  get namespaces(){
    return Array.from(this.#metadata.keys());
  }

  /**
   * For looping/mapping
   *
   * @return {*|metadata|{}}
   */
  get metadata(){
    return this.#metadata;
  }


  /**
   * Get the metadata for a given namespace.
   *
   * @param {string} namespace
   * @return {Metadata}
   */
  classMetadata(namespace){
    return this.#metadata.get(namespace);
  }

  /**
   * Create a metadata for a given file.
   *
   * @param {string} fullPath
   */
  collectFromFile(fullPath, onComplete){
    let namespace = fullPath.replace(path.join(process.cwd(), this.filePath), "")
      .replace(".js", "");

    // file
    this.#metadata.set(namespace, new Metadata());
    this.#metadata.get(namespace).parseFile(fullPath).then((metadata)=>{
      this.emit("fileParsed", metadata, namespace);
      if(--this.#fileCount <= 0){
        onComplete();
      }
    });

  }

  /**
   * Collect all the files from a directory (and any subdirectories).
   *  Each file is then passed to collectFromFile which memoizes the class details in a Metadata class.
   *
   * @param {string} fullPath
   */
  collectFromPath(fullPath, onComplete, onError=(err)=>{console.error(err);}){
    if(this.filePath ===''){
      this.filePath = fullPath;
    }
    let pathStats = fs.lstatSync(fullPath);

    // Does the path point to a js file or a directory?
    if(pathStats.isFile() && isJsFile.test(fullPath)){
      this.collectFromFile(fullPath, onComplete);
    } else if(pathStats.isDirectory()) {
      // directory or ignored file.
      // decrement the fileCount for the current subpath, if this is a subpath and not the base.
      if(this.#fileCount !== 0){
        this.#fileCount--;
      }
      fs.readdir(fullPath, (err, subpaths)=>{
        if(err){
          onError(err);
        }
        // add the subpath count to the filecount. when fileCount is 0, then all files are considered complete.
        this.#fileCount += subpaths.length;
        for(let subpath of subpaths){
          this.collectFromPath(path.join(fullPath,subpath), onComplete, onError);
        }
      });
    } else {
      // ignore it.
      this.#fileCount--;
    }
  }

  /**
   * Start the collection process and get a promise
   * @return {Promise<*>}
   */
  collect(){
    return new Promise((resolve, reject)=>{
      this.collectFromPath(this.filePath, resolve, reject);
    });
  }
};