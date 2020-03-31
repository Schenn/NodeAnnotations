const fs = require("fs");
const DocBlock = require("./DocBlock");
const { createRequireFromPath } = require("module");

// Find the index of the next docblock.
const nextComment = (fileContent, from)=>{
  return fileContent.indexOf(DocBlock.commentOpen, from) - 1;
};

// class {name} [extends name]  // index 1 is class name, index 3 is the class it extends
const classRegex = /^\s*(?:\*\/)\s*(?:module.exports\s?=\s?)?class\s([A-z]+)((?:\sextends\s)([A-z]+))?\s*{\s*$/m;
// */\n methodName[ ](prop, {prop}, ...prop, prop=1, prop="foo", prop='bar')[ \n]{
const methodRegex = /^\s*(?:\*\/)\s*([A-z]+)(?:\s?\([^/)]*\)\s?)\n?\s*{/gm;
// */\n set|get propName ([value])[ \n]{  only collects properties which follow a comment block
const propRegex = /^\s*(?:\*\/)\s*((set|get)\s([A-z]+))(?:\s?\([^/)]*\)\s?)\n?\s*{/gm;

const commentOpen = '/**';
const commentClose = '*/';


/**
 * Metadata memoizes the details for a given class
 *  such as the filename, the class name, what class the given class extends from,
 *    what methods and what properties the class has.
 * @type {Metadata}
 */
module.exports = class Metadata {
  #fileName = "";
  #className = "";
  #classExtends = "";
  #classDoc = null;
  #methods = {};
  #propertyData = {};

  constructor(){
  }

  [Symbol.iterator]() {
    let docStep = 0;
    let methods = this.methods;
    let properties = this.propertyData;
    let methodStage = properties.length; // would be -1, but classDoc is first, which negates the -1
    let phaseStep = 0;
    let next = ()=>{
      let retValue = {value: undefined, done: false};
      // class doc at index 0
      switch(docStep){
        case docStep === 0:
          docStep++;
          retValue.value = {type: 'class', doc: this.#classDoc};
          break;
        case docStep > 0 && docStep <= methodStage && phaseStep < properties.length:
          let prop = this.#propertyData[properties[phaseStep]];
          docStep++;
          phaseStep++;
          // If we've parsed through the properties, reset the phase step for methods.
          if(phaseStep >= properties.length){
            phaseStep = 0;
          }
          retValue.value = {type: 'property', doc: prop};
          break;
        case docStep >= methodStage && docStep <= methodStage + methods.length:
          let method = this.#methods[methods[phaseStep]];
          docStep++;
          phaseStep++;
          retValue.value = {type: 'method', doc: method};
          break;
        default:
          retValue.done = true;
          break;
      }
      return retValue;
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
    return this.#fileName;
  }

  /**
   * The name of the memoized class.
   * @return {string}
   */
  get className(){
    return this.#className;
  }

  /**
   * The name of the class that the memoized class extends from
   * @return {string}
   */
  get extends(){
    return this.#classExtends;
  }

  /**
   * Get the class docblock
   *
   * @return {DocBlock}
   */
  get classDoc(){
    return this.#classDoc;
  }

  /**
   * Get the names of the methods which have been memoized
   *
   * @return {string[]}
   */
  get methods(){
    return Object.keys(this.#methods);
  }

  /**
   * Get the names of the properties which have been memorized
   * @return {string[]}
   */
  get propertyData(){
    return Object.keys(this.#propertyData);
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
    return this.#methods[method];
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
    return this.#propertyData[prop];
  }

  /**
   * Read a file and pass the content to parseContent.
   *    sets the file name
   * @param {string} fullPath
   * @return {Promise}
   */
  parseFile(fullPath){
    this.#fileName = fullPath;
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
        this.#className = docblock.name;
        this.#classDoc = docblock;
        this.#classExtends = docblock.extends;
        break;
      case "property":
        if(typeof this.#propertyData[docblock.name] === "undefined"){
          this.#propertyData[docblock.name] = docblock;
        } else {
          // If this is the second entry for the property, than there must be a getter and setter.
          this.#propertyData[docblock.name].readOnly = false;
        }
        break;
      case "method":
        this.#methods[docblock.name] = docblock;
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
    // Get the class phrase.
    // If there's no class phrase, then abort.
    let classPhrase = classRegex.exec(content);
    if(!classPhrase){
      return;
    }

    // class index = classPhrase.index
    let commentStart = content.lastIndexOf(commentOpen, classPhrase.index);
    let commentEnd = content.indexOf(commentClose, commentStart);
    let classDoc = new DocBlock( "class", content.substring(commentStart, commentEnd + commentClose.length));
    if(!classDoc.hasAnnotations()){
      return;
    }

    classDoc.forBlock(classPhrase[1], classPhrase[3]);
    this.addDocBlock(classDoc);
    let property;
    while((property = propRegex.exec(content))){
      let commentStart = content.lastIndexOf(commentOpen, property.index);
      let propBlock = new DocBlock("property", content.substring(commentStart, property.index + commentClose.length));
      if(propBlock.hasAnnotations()){
        propBlock.forBlock(property[3], property[2]);
        this.addDocBlock(propBlock);
      }
    }

    let method;
    while((method = methodRegex.exec(content))){
      let commentStart = content.lastIndexOf(commentOpen, method.index);
      let methodBlock = new DocBlock("method", content.substring(commentStart, method.index + commentClose.length));
      if(methodBlock.hasAnnotations()){
        methodBlock.forBlock(method[1]);
        this.addDocBlock(methodBlock);
      }
    }

    if(typeof cb === "function"){
      cb(this);
    }
  }
};