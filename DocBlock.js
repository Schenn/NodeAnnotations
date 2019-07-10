const Annotation = require("./Annotation");

const phraseRegex = /^(?:\s*\*\s*)(@\w+)(.*)$/gm;
const _ = Symbol("private");

const commentOpen = '/**';
const commentClose = '*/';

/**
 * DocBlock represents a comment node and parses the annotations from the comment into Annotation objects.
 *
 * @type {DocBlock}
 */
module.exports = class DocBlock {

  constructor(){
    this[_] = {
      annotations: {},
      comment:''
    };
  }

  /**
   * The string that is used to identify an opening comment
   * @return {string}
   */
  static get commentOpen(){
    return commentOpen;
  }

  /**
   * The string that is used to identify a closing comment
   * @return {string}
   */
  static get commentClose(){
    return commentClose;
  }

  /**
   * Get the full text of the comment node
   * @return {string}
   */
  get comment(){
    return this[_].comment;
  }

  /**
   * Set the comment string and extract any annotations within.
   *  Can only be set once
   * @param {string} text
   */
  set comment(text){
    if(this[_].comment === ''){
      this[_].comment = text;
      let annotationMatches = text.match(phraseRegex);
      if(annotationMatches){
        for (let expression of annotationMatches){
          this.annotationFromPhrase(expression);
        }
      }
    }
  }

  /**
   * Memoize the comment block which starts at a given index
   *
   * @param {string} fileContent
   * @param {int} index
   * @return {number} Where the comment ends.
   */
  fromIndex(fileContent, index=0){
    let commentIndexStart = fileContent.indexOf(commentOpen, index);
    let nextIndex = commentIndexStart;
    // If there's no docblock, there's nothing to collect.
    if(commentIndexStart !== -1) {
      let commentEnd = fileContent.indexOf(commentClose, commentIndexStart) + commentClose.length;
      this.comment = fileContent.substring(commentIndexStart, commentEnd);
      nextIndex = commentEnd;
    }

    return nextIndex;
  }

  /**
   * If there are any annotations in this docblock.
   *
   * @return {boolean}
   */
  hasAnnotations(){
    return Object.keys(this[_].annotations).length > 0;
  }

  /**
   * Does the docblock have a specific annotation.
   *
   * @param {string} annotation
   * @return {boolean}
   */
  hasAnnotation(annotation){
    return typeof this[_].annotations[annotation] !== "undefined";
  }

  /**
   * Create an annotation from data instead of a phrase.
   * Useful for memoizing system important data which the dev doesn't need to mark.
   *
   * @param {string} name
   * @param {*} value
   * @param {string} type
   */
  addAnnotation(name, value=null, type=null){
    let annotation = new Annotation();
    annotation.fromValues(name, value, type);
    if(typeof this[_].annotations[annotation.name] === "undefined"){
      this[_].annotations[annotation.name] = [];
    }
    this[_].annotations[annotation.name].push(annotation);
  }

  /**
   * Memoize an annotation from a slice of the comment.
   *  If there is already an annotation with a matching name (like param),
   *    then the internal reference is changed to an array and the current and
   *    new annotations are added to it.
   * @param {string} expression
   */
  annotationFromPhrase(expression){
    let annotation = new Annotation(expression.trim());
    if(typeof this[_].annotations[annotation.name] === "undefined"){
      this[_].annotations[annotation.name] = [];
    }
    this[_].annotations[annotation.name].push(annotation);
  }

  /**
   * Get the annotation object(s) for a given name
   *
   * @param {string} annotation
   * @return {Annotation}
   */
  getAnnotation(annotation){
    return typeof this[_].annotations[annotation] !== "undefined" ? this[_].annotations[annotation] : [];
  }
};