const fs = require("fs");
const DocBlock = require("./DocBlock");

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
 * @type {module.Metadata}
 */
module.exports = class Metadata {
  constructor(){
    this._ = Symbol("metadata");
    this[this._] = {
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
    return this[this._].fileName;
  }

  /**
   * The name of the memoized class.
   * @return {string}
   */
  get className(){
    return this[this._].className;
  }

  /**
   * The name of the class that the memoized class extends from
   * @return {string}
   */
  get extends(){
    return this[this._].extends;
  }

  /**
   * Get the class docblock
   *
   * @return {DocBlock}
   */
  get classDoc(){
    return this[this._].classDoc;
  }

  /**
   * Get the names of the methods which have been memoized
   *
   * @return {string[]}
   */
  get methods(){
    return Object.keys(this[this._].methods);
  }

  /**
   * Get the names of the properties which have been memorized
   * @return {string[]}
   */
  get propertyData(){
    return Object.keys(this[this._].propertyData);
  }

  /**
   * Get the docblock for a memoized method.
   * @param {string} method
   * @return {DocBlock}
   */
  forMethod(method){
    return this[this._].methods[method];
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
    return this[this._].propertyData[prop];
  }

  /**
   * Read a file and pass the content to parseContent.
   *    sets the file name
   * @param {string} fullPath
   * @param {function} cb
   */
  parseFile(fullPath, cb){
    this[this._].fileName = fullPath.replace(process.cwd(), "");
    fs.readFile(fullPath,'utf8', (err, fileContent)=>{
      if(err){
        console.log(err);
      }
      this.parseContent(fileContent, cb);
    });
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
    let classIndex = this.setClassFromContent(content);
    let index = 0;
    while(index > -1){
      let comment = new DocBlock();
      // If there's no comments in the content, break
      if(content.indexOf(DocBlock.commentOpen, index) === -1){
        break;
      }
      index = comment.fromIndex(content, index);

      if(comment.hasAnnotations()){
        if(index > classIndex){
          index = this.addMethodFromContent(index, content, comment);
        } else {
          this[this._].classDoc = comment;
          // It's a Class comment. Continue looking for a method comment
          index = nextComment(content, classIndex);
        }
      } else {
        // no annotations, skip to the next docblock
        index = nextComment(content, index);
      }
    }
    if(typeof cb === "function"){
      cb(this);
    }
  }

  /**
   * Extracts the class information from a string.
   *  class name [extends othername]
   * @param {string} content
   * @return {number} The index in the text where the class string came from.
   */
  setClassFromContent(content){
    let classIndex = content.search(classRegex);
    if(classIndex > -1){
      let classData = content.match(classRegex)[0].match(/\w+/g);
      this[this._].className = classData[1];
      this[this._].classExtends = (typeof classData[3] !== "undefined") ? classData[3] : '';
    } else {
      throw "Failed to find class to scan.";
    }
    return classIndex;
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
   * @param {int} index
   * @param {string} content
   * @param {DocBlock} comment
   * @return {int}
   */
  addMethodFromContent(index, content, comment){
    // Use the comment close as a part of the method regex test.
    // Essentially, checks to see if the method is right after the comment and not many lines later.
    index -= DocBlock.commentClose.length;
    let nextBrace = content.indexOf("{", index);
    // if the last method contains a semi-passable phrase
    if(nextBrace === -1) {
      return -1;
    }
    // If it is not a function/method comment, then skip it. Not the purpose of this tool.
    let phrase = content.substring(index, nextBrace+1);
    if(methodRegex.test(phrase)){
      // its a method for the comment! Cut the closing tag.
      phrase = phrase.replace(DocBlock.commentClose, '').trim();
      let method = phrase.substring(0, phrase.indexOf("(")).trim();
      this[this._].methods[method] = comment;
    } else if(propRegex.test(phrase)){
      this.addPropFromPhrase(index, phrase, comment);
    }
    return nextComment(content, index + phrase.length);
  }

  /**
   * Extracts the property name from text and memoizes it and its associated docblock.
   *  The memoized property is kept under a wrapper which contains additional details on the property itself.
   *    e.g. If there is no setter for the property, the property is marked as 'readOnly' for your reference.
   *    It does not use an annotation to do this to prevent overwriting any of the properties annotations.
   *
   * @param {int} index
   * @param {string} phrase
   * @param {DocBlock} docblock
   */
  addPropFromPhrase(index, phrase, docblock){
    // cut phrase down to get|set property
    let prop = phrase.substring(phrase.indexOf("et ")-1, phrase.indexOf("(")).
        trim().split(" ");

    // if prop doesn't already exist in prop list
    if(typeof this[this._].propertyData[prop[1]] === "undefined"){
      this[this._].propertyData[prop[1]] = {
        docblock:docblock,
        readOnly:(prop[0] === "get") // if the property method is a get, set readOnly true. If its a set, set readOnly to false.
      };
    } else if(prop[0] === "set"){
      // If the property exists and a setter is found, update the readonly property to false
      this[this._].propertyData[prop[1]].readOnly = false;
    }
  }
};