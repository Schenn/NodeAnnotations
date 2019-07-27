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

  [Symbol.iterator]() {
    let docStep = 0;
    let methods = this.methods;
    let properties = this.propertyData;
    let methodStage = Object.keys(properties).length; // would be -1, but classDoc is first, which negates the -1
    let phaseStep = 0;
    let next = ()=>{
      // class doc at index 0
      if(docStep === 0){
        docStep++;
        return {value: {type: 'class', doc: this[_].classDoc}, done: false};
      }
      // If the current step is a property
      else if (docStep <= methodStage){
        // If the current step is not greater than the number of properties
        if(phaseStep < properties.length){
          let prop = this[_].propertyData[properties[phaseStep]];
          docStep++;
          phaseStep++;
          // If we've parsed through the properties, reset the phase step for methods.
          if(phaseStep >= properties.length){
            phaseStep = 0;
          }
          return {value: {type: 'property', doc: prop}, done: false};
        }
      }
      // If the current step is past properties but before the end of the docblocks
      else if (docStep >= methodStage && docStep < methodStage + methods.length){
        let method = this[_].methods[methods[phaseStep]];
        docStep++;
        phaseStep++;
        return {value: {type: 'method', doc: method}, done: false};
      } else {
        // We've reached the end of the metadata.
        return {value: undefined, done: true};
      }
    };
    return {
      next: next.bind(this)
    }
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
    this[_].fileName = fullPath;
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
   * @param {DocBlock} docblock
   * @return {boolean}
   */
  addDocBlock(docblock){
    let success = true;
    switch(docblock.type){
      case "class":
        this[_].className = docblock.name;
        this[_].classDoc = docblock;
        this[_].classExtends = docblock.extends;
        break;
      case "property":
        if(typeof this[_].propertyData[docblock.name] === "undefined"){
          this[_].propertyData[docblock.name] = docblock;
        } else {
          // If this is the second entry for the property, than there must be a getter and setter.
          this[_].propertyData[docblock.name].readOnly = false;
        }
        break;
      case "method":
        this[_].methods[docblock.name] = docblock;
        break;
      default:
        success = false;
        break;
    }
    return success;
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
      docblock.fromIndex(content, commentData.commentStart);
      if(!docblock.hasAnnotations()){
        index=nextComment(content, commentData.commentEnd);
        continue;
      }

      let commentIsFor = content.substring(commentData.commentEnd - DocBlock.commentClose.length,
        commentData.nextBrace+1);

      index = (!this.addDocBlock(docblock))?
          nextComment(content, commentData.commentEnd): // Look for the next docblock after the comment closing tag.
          nextComment(content, commentData.nextBrace); // Look for the next opening brace.
    }
    if(typeof cb === "function"){
      cb(this);
    }
  }
};