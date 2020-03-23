const Annotation = require("./Annotation");

const annotationPhraseRegex = /^(?:\s*\*\s*)(@\w+)(.*)$/gm;
const _ = Symbol("private");


/**
 * DocBlock represents a comment node and parses the annotations from the comment into Annotation objects.
 *
 * @type {DocBlock}
 */
module.exports = class DocBlock {

  constructor(type='', comment = ''){
    this[_] = {
      name: '',
      type: type,
      extends: '',
      readOnly: false,
      annotations: {},
      comment:''
    };
    if(comment !== ''){
      this.comment = comment;
    }
  }

  [Symbol.iterator]() {
    let annotationKeys = Object.keys(this[_].annotations);
    let keyStep = 0;
    let annotationStep = 0;
    /**
     * Iteration Process to allow devs to simply iterate through the annotations in a doc block
     * @return {*}
     */
    let next = ()=>{
      // If we haven't reached the end of the annotation keys
      if(keyStep < annotationKeys.length){
        let key = annotationKeys[keyStep];
        // If the step through the annotations hasn't already reached the end of the collection
        if(annotationStep < this[_].annotations[key].length){
          let annotation = this[_].annotations[key][annotationStep];
          // If the next annotation step would reach the end of the collection,
          //  reset the annotation step and advance the keystep
          if(++annotationStep >= this[_].annotations[key].length){
            annotationStep = 0;
            keyStep++;
          }
          return {value: annotation, done: false};
        } else {
          annotationStep = 0;
          keyStep++;
        }
      } else {
        return {value: undefined, done: true};
      }
    };
    return {
      next:next.bind(this)
    };
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
      let annotationMatches = text.match(annotationPhraseRegex);
      if(annotationMatches){
        for (let expression of annotationMatches){
          this.annotationFromPhrase(expression);
        }
      }
    }
  }

  get name(){
    return this[_].name;
  }

  get type(){
    return this[_].type;
  }

  get extends(){
    return this[_].extends;
  }

  get readOnly(){
    return this[_].readOnly;
  }

  set readOnly(mutable){
    this[_].readOnly = mutable;
  }

  forBlock(...args){
    this[_].name = args[0];
    if(this[_].type === "class"){
      this[_].extends = args[1];
    } else if(this[_].type === "property"){
      this[_].readOnly = args[1] === 'get';
    }
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

  /**
   * Get the value of the first matching annotation
   * @param {string} annotation
   * @return {null | string}
   */
  getFirstAnnotationValue(annotation){
    return typeof this[_].annotations[annotation] !== "undefined" ? this[_].annotations[annotation][0].value : null;
  }
};