const fs = require("fs");
const DocBlock = require("./DocBlock");

const classRegex = /((class\s[A-z]+\s?)(?:\sextends\s[A-z]+\s)?){$/gm;
const methodRegex = /(?:\*\/\n?\s+)([A-z]+)(?:\s?\([A-z,\s]*\)\s?)\n?\s*{/;
const propRegex = /(?:\*\/\n?\s+)((set|get)\s([A-z]+))(?:\s?\([A-z\s]*\)\s?)\n?\s*{/;

const nextComment = (fileContent, from)=>{
  return fileContent.indexOf(DocBlock.commentOpen, from) - 1;
};

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

  get fileName(){
    return this[this._].fileName;
  }

  set fileName(fileName){
    this[this._].fileName = fileName;
  }

  get className(){
    return this[this._].className;
  }

  get extends(){
    return this[this._].extends;
  }

  get classDoc(){
    return this[this._].classDoc;
  }

  get methods(){
    return Object.keys(this[this._].methods);
  }

  get propertyData(){
    return Object.keys(this[this._].propertyData);
  }

  forMethod(method){
    return this[this._].methods[method];
  }

  forProperty(prop){
    return this[this._].propertyData[prop];
  }

  parseFile(fullPath, cb){
    this.fileName = fullPath.replace(process.cwd(), "");
    fs.readFile(fullPath,'utf8', (err, fileContent)=>{
      if(err){
        console.log(err);
      }
      this.parseContent(fileContent, cb);
    });
  }

  addPropFromPhrase(index, phrase, docblock){
    // cut phrase down to get|set property
    let prop = phrase.substring(phrase.indexOf("et ")-1, phrase.indexOf("(")).
        trim().split(" ");

    // if prop doesn't already exist in prop list
    if(typeof this[this._].propertyData[prop[1]] === "undefined"){
      this[this._].propertyData[prop[1]] = {
        docblock:docblock,
        readOnly:(prop[0] === "get")
      };
    } else {
      if(prop[0] === "set"){
        this[this._].propertyData[prop[1]].readOnly = false;
      }
    }
  }

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
};