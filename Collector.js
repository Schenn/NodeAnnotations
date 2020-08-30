import fs from "fs";
import path from"path";
import EventEmitter from 'events';

import {Metadata} from "./Metadata";

// Does the phrase end in .js
const isJsFile = /\.js$/;

/**
 * The Collector parses directories and files and memoizes their details using the Metadata class.
 *
 * @type {Collector}
 */
export class Collector extends EventEmitter {

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

  namespaceFromPath(fullPath){
    if(fullPath === ""){
      fullPath = this.filePath;
    }
    return fullPath.replace(path.join(process.cwd(), this.filePath), "")
      .replace(".js", "");
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
   * Left this method in here for backwards compatibility,
   *  collectFromPath now uses the collectFromFileAsync method instead.
   * @param {string} fullPath
   * @param {function} onComplete
   * @param {function} onError
   */
  collectFromFile(fullPath, onComplete, onError=((e)=>{console.log(e);})){
    let namespace = this.namespaceFromPath(fullPath);

    // file
    this.#metadata.set(namespace, new Metadata());
    this.#metadata.get(namespace).parseFile(fullPath).then((metadata)=>{
      this.emit("fileParsed", metadata, namespace);
      if(--this.#fileCount <= 0){
        onComplete();
      }
    }).catch(onError);

  }

  /**
   * Use a Promise instead of a callback or event
   *
   * @see Collector.collectFromFile
   * @param fullPath
   * @return {Promise<Metadata>}
   */
  collectFromFileAsync(fullPath){
    return new Promise((resolve, reject)=>{
      let namespace = this.namespaceFromPath(fullPath);
      this.#metadata.set(namespace, new Metadata());
      this.#metadata.get(namespace).parseFile(fullPath).then((metadata)=>{
        resolve(metadata);
      }).catch(reject);
    });
  }

  /**
   * Collect all the files from a directory (and any subdirectories).
   *  Each file is then passed to collectFromFile which memoizes the class details in a Metadata class.
   *
   * @param {string} fullPath
   * @param {function} onComplete
   * @param {function} onError
   */
  collectFromPath(fullPath, onComplete, onError=(err)=>{console.error(err);}){
    let pathStats = fs.lstatSync(fullPath);

    // Does the path point to a js file or a directory?
    if(pathStats.isFile() && isJsFile.test(fullPath)){
      this.collectFromFileAsync(fullPath).then((metadata)=>{
        this.emit("fileParsed", metadata, this.namespaceFromPath(fullPath));
        if(--this.#fileCount <= 0){
          onComplete();
        }
      });
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

}