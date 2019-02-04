const Annotation = require("./Annotation");
// * @annotation [{descriptor}|=| ] [value]
const annotationRegex = /(?:\s?\*\s?)(@\w+)(?:\s*=\s*|\s)?(({\w*})(?:\s))?(\S+)/g;

const commentOpen = '/**';
const commentClose = '*/\n';

module.exports = class DocBlock {

  constructor(){
    this.annotations = {};
    this.comment = '';
  }

  static get commentOpen(){
    return commentOpen;
  }

  static get commentClose(){
    return commentClose;
  }

  fromIndex(fileContent, index){
    let commentIndexStart = fileContent.indexOf(commentOpen, index);
    // If there's no docblock, there's nothing to collect.
    if(commentIndexStart === -1) {
      return commentIndexStart;
    }

    let commentEnd = fileContent.indexOf(commentClose, commentIndexStart) + commentClose.length;
    let text = fileContent.substring(commentIndexStart, commentEnd);
    this.comment = text;
    let annotationMatches = text.match(annotationRegex);
    if(annotationMatches){
      for (let expression of annotationMatches){
        this.addAnnotation(expression);
      }
    }
    return commentEnd;
  }

  hasAnnotations(){
    return Object.keys(this.annotations).length > 0;
  }

  hasAnnotation(annotation){
    return typeof this.annotations[annotation] !== "undefined";
  }

  addAnnotation(expression){
    let annotation = new Annotation(expression.trim());
    if(typeof this.annotations[annotation.name] === "undefined"){
      this.annotations[annotation.name] = annotation;
    } else if(this.annotations[annotation.name] instanceof Array) {
      this.annotations[annotation.name].push(annotation);
    } else {
      let temp = this.annotations[annotation.name];
      this.annotations[annotation.name] = [temp];
      this.annotations[annotation.name].push(annotation);
    }
  }

  getAnnotation(annotation){
    return this.annotations[annotation];
  }
};