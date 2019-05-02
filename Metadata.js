const fs = require("fs");
const DocBlock = require("./DocBlock");
const { createRequireFromPath } = require("module");
const _ = Symbol("private");

// class {name} [extends name]
const classRegex = /((class\s[A-z]+\s?)(?:\sextends\s[A-z]+\s)?){$/gm;
// */\n methodName[ ](prop, prop..)[ \n]{  only collects methods which follow a comment block
const methodRegex = /(?:\*\/\n?\s+)([A-z]+)(?:\s?\([A-z,\s]*\)\s?)\n?\s*{/;
// */\n set|get propName ([value])[ \n]{  only collects properties which follow a comment block
const propRegex = /(?:\*\/\n?\s+)((set|get)\s([A-z]+))(?:\s?\([A-z\s]*\)\s?)\n?\s*{/;

// Find the index of the next docblock.
const nextComment = (fileContent, from)=>{
  return fileContent.indexOf(DocBlock.commentOpen, from) - 1;
};

/**
 * Metadata memoizes the details for a given class
 *  such as the filename, the class name, what class the given class extends from,
 *    what methods and what properties the class has.
 * @type {Metadata}
 */
module.exports = class Metadata {
  constructor(){
    this[_] = {
      fileName: "",
      className: "",
      classExtends: "",
      classDoc: null,
      methods: {},
      propertyData:{}
    };
  }

  /**
   * The filename for the memoized file.
   * @return {string}
   */
  get fileName(){
    return this[_].fileName;
  }

  /**
   * The name of the memoized class.
   * @return {string}
   */
  get className(){
    return this[_].className;
  }

  /**
   * The name of the class that the memoized class extends from
   * @return {string}
   */
  get extends(){
    return this[_].extends;
  }

  /**
   * Get the class docblock
   *
   * @return {DocBlock}
   */
  get classDoc(){
    return this[_].classDoc;
  }

  /**
   * Get the names of the methods which have been memoized
   *
   * @return {string[]}
   */
  get methods(){
    return Object.keys(this[_].methods);
  }

  /**
   * Get the names of the properties which have been memorized
   * @return {string[]}
   */
  get propertyData(){
    return Object.keys(this[_].propertyData);
  }

  /**
   * Get the associated class for this metadata object.
   *  Does a 'require' against the associated class filename and returns the result.
   *
   * All arguments are passed to target class constructor
   *
   * @return {*}
   */
  getInstance(){
    let target = require(this.fileName);
    return new target(...arguments);
  }

  /**
   * Get the docblock for a memoized method.
   * @param {string} method
   * @return {DocBlock}
   */
  forMethod(method){
    return this[_].methods[method];
  }

  /**
   * Get the data for a memoized property.
   *  The data is an object wrapper which contains a reference to the property
   *    and extra details about it. Such as whether or not the property is read only.
   *
   * @param {string} prop
   * @return {object}
   */
  forProperty(prop){
    return this[_].propertyData[prop];
  }

  /**
   * Read a file and pass the content to parseContent.
   *    sets the file name
   * @param {string} fullPath
   * @return {Promise}
   */
  parseFile(fullPath){
    this[_].fileName = fullPath.replace(`${process.cwd()}/`, "");
    return new Promise((resolve, reject)=>{
      fs.readFile(fullPath,'utf8', (err, fileContent)=>{
        if(err){
          console.log(err);
          reject(err);
        }
        this.parseContent(fileContent, (metadata)=>{
          resolve(metadata);
        });
      });
    });

  }

  /**
   * Determine if we can create a doc block or not. If we can, return the positional data of marker characters.
   * @param {string} content
   * @param {number} index
   * @return {boolean | Object}
   */
  canCreateDocBlock(content, index){
    let result = false;
    let commentStart = content.indexOf(DocBlock.commentOpen, index);
    // If there's no comments in the content, break
    if(commentStart !== -1){
      let commentEnd = content.indexOf(DocBlock.commentClose, commentStart);
      if(commentEnd === -1){
        throw Error("Malformed file has an open comment but no closing comment marker.");
      }
      let nextBrace = content.indexOf("{", commentEnd);
      // if there's no more opening braces, then there's nothing to interpret from the comment.
      if(nextBrace !== -1) {
        result = {
          commentStart: commentStart,
          commentEnd: commentEnd,
          nextBrace: nextBrace
        };
      }
    }

    return result;
  }

  /**
   * Add a docblock to the metadata.
   *  looks like: set prop(arg){, get prop(){, method(arg, arg){, class name {, class name extends name {,
   *
   * @param {string} contentLine
   * @param {DocBlock} docblock
   * @return {boolean}
   */
  addDocBlock(contentLine, docblock){
    let regexPassed = true;
    switch (true) {
      case methodRegex.test(contentLine):
        this.addMethodFromContent(contentLine, docblock);
        break;
      case propRegex.test(contentLine):
        this.addPropFromPhrase(contentLine, docblock);
        break;
      case classRegex.test(contentLine):
        this.setClassFromContent(contentLine, docblock);
        break;
      default:
        regexPassed = false;
        break;
    }
    return regexPassed;
  }


  /**
   * Parse text which represents the text body of a class file.
   *  The text must have docblocks to be memoized.
   *
   *  In order for Metadata to memoize a docblock,
   *    it must contain at least one annotation. and
   *    preface the class, a class method, or a class property
   *
   * @param {string} content
   * @param {function} cb
   */
  parseContent(content, cb=null){
    let index = 0;
    while(index > -1){
      let commentData = this.canCreateDocBlock(content, index);
      if(!commentData){
        break;
      }

      let docblock = new DocBlock();
      docblock.comment = content.substring(commentData.commentStart, commentData.commentEnd);
      // If there are no annotations for the docblock, then drop it and go to the next position.
      if(!docblock.hasAnnotations()){
        index=nextComment(content, commentData.commentEnd);
        continue;
      }

      let commentIsFor = content.substring(commentData.commentEnd - DocBlock.commentClose.length,
        commentData.nextBrace+1);

      index = (!this.addDocBlock(commentIsFor, docblock))?
          nextComment(content, commentData.commentEnd): // Look for the next docblock after the comment closing tag.
          nextComment(content, commentData.nextBrace); // Look for the next opening brace.
    }
    if(typeof cb === "function"){
      cb(this);
    }
  }

  /**
   * Extracts the class information from a string.
   *  class name [extends othername]
   * @param {string} content
   * @param {DocBlock} docblock
   */
  setClassFromContent(content, docblock){
    let classPhrase = content.match(classRegex);
    if(classPhrase){
      let classData = classPhrase[0].match(/\w+/g);
      this[_].className = classData[1];
      this[_].classExtends = (typeof classData[3] !== "undefined") ? classData[3] : '';
      this[_].classDoc = docblock;
    } else {
      throw "Failed to find class to scan.";
    }
  }

  /**
   * Determines if the docblock is for a method or a property.
   *  if it's a method, memoize the docblock and method information.
   *  if it's a property, pass to addPropFromPhrase
   *
   * if there is no method or property left to attach to,
   *   return -1 to stop parsing the text.
   * else
   *   returns the index of the next docblock
   *
   * @param {string} phrase
   * @param {DocBlock} comment
   */
  addMethodFromContent(phrase, comment){
    // If it is not a function/method comment, then skip it. Not the purpose of this tool.
    if(methodRegex.test(phrase)){
      // its a method for the comment! Cut the closing tag.
      phrase = phrase.replace(DocBlock.commentClose, '').trim();
      let method = phrase.substring(0, phrase.indexOf("(")).trim();
      this[_].methods[method] = comment;
    }
  }

  /**
   * Extracts the property name from text and memoizes it and its associated docblock.
   *  The memoized property is kept under a wrapper which contains additional details on the property itself.
   *    e.g. If there is no setter for the property, the property is marked as 'readOnly' for your reference.
   *    It does not use an annotation to do this to prevent overwriting any of the properties annotations.
   *
   * @param {string} phrase
   * @param {DocBlock} docblock
   */
  addPropFromPhrase(phrase, docblock){
    // cut phrase down to get|set property
    let prop = phrase.substring(phrase.indexOf("et ")-1, phrase.indexOf("(")).trim().split(" ");

    // if prop doesn't already exist in prop list
    if(typeof this[_].propertyData[prop[1]] === "undefined"){
      this[_].propertyData[prop[1]] = {
        docblock:docblock,
        readOnly:(prop[0] === "get") // if the property method is a get, set readOnly true. If its a set, set readOnly to false.
      };
    } else if(prop[0] === "set"){
      // If the property exists and a setter is found, update the readonly property to false
      this[_].propertyData[prop[1]].readOnly = false;
    }
  }
};