import {Annotation} from "./Annotation";

const annotationPhraseRegex = /^(?:\s*\*\s*)(@\w+)(.*)$/gm;


/**
 * DocBlock represents a comment node and parses the annotations from the comment into Annotation objects.
 *
 * @type {DocBlock}
 */
export class DocBlock {

  #name = '';
  #type = '';
  #extends = '';
  #annotations = null;
  #comment = '';

  readOnly = false;

  constructor(type='', comment = ''){
    this.#type = type;
    this.#annotations = new Map();
    if(comment !== ''){
      this.comment = comment;
    }
  }

  [Symbol.iterator]() {
    let annotationKeys = Array.from(this.#annotations.keys());
    let keyStep = 0;
    let annotationStep = 0;
    /**
     * Iteration Process to allow devs to simply iterate through the annotations in a doc block
     * @return {*}
     */
    let next = ()=>{
      let retValue = {value: undefined, done: false};
      // If we haven't reached the end of the annotation keys
      if(keyStep < this.#annotations.size){
        let key = annotationKeys[keyStep];
        // If the step through the annotations hasn't already reached the end of the collection
        if(annotationStep < this.#annotations.get(key).length){
          retValue.value = this.#annotations.get(key)[annotationStep];
          // If the next annotation step would reach the end of the collection,
          //  reset the annotation step and advance the keystep
        }
        if(++annotationStep >= this.#annotations.get(key).length){
          annotationStep = 0;
          keyStep++;
        }
      } else {
        retValue.done = true;
      }
      return retValue;
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
    return this.#comment;
  }

  /**
   * Set the comment string and extract any annotations within.
   *  Can only be set once
   * @param {string} text
   */
  set comment(text){
    if(this.#comment === ''){
      this.#comment = text;
      let annotationMatches = text.match(annotationPhraseRegex);
      if(annotationMatches){
        for (let expression of annotationMatches){
          this.annotationFromPhrase(expression);
        }
      }
    }
  }

  get name(){
    return this.#name;
  }

  get type(){
    return this.#type;
  }

  get extends(){
    return this.#extends;
  }

  forBlock(...args){
    this.#name = args[0];
    if(this.#type === "class"){
      this.#extends = args[1];
    } else if(this.#type === "property"){
      this.readOnly = args[1] === 'get';
    }
  }

  /**
   * If there are any annotations in this docblock.
   *
   * @return {boolean}
   */
  hasAnnotations(){
    return this.#annotations.size > 0;
  }

  /**
   * Does the docblock have a specific annotation.
   *
   * @param {string} annotation
   * @return {boolean}
   */
  hasAnnotation(annotation){
    return typeof this.#annotations.get(annotation) !== "undefined";
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
    // if name has /, then split on / and do the following:
    //    if key path does not exist
    //    annotations.set(firstPhrase, {secondPhrase: {each nested phrase})
    //    annotations.get(firstPhrase)[secondPhrase][etc].lastPhrase = [];
    //
    //    annotations.get(firstPhrase)[secondPhrase][thirdPhrase].lastPhrase.push(annotation);
    //
    if(typeof this.#annotations.get(annotation.name) === "undefined"){
      this.#annotations.set(annotation.name,[]);
    }
    this.#annotations.get(annotation.name).push(annotation);
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
    if(typeof this.#annotations.get(annotation.name) === "undefined"){
      this.#annotations.set(annotation.name, []);
    }
    this.#annotations.get(annotation.name).push(annotation);
  }

  /**
   * Get the annotation object(s) for a given name
   *
   * @param {string} annotation
   * @return {Annotation}
   */
  getAnnotation(annotation){
    return typeof this.#annotations.get(annotation) !== "undefined" ? this.#annotations.get(annotation) : [];
  }

  /**
   * Get the value of the first matching annotation
   * @param {string} annotation
   * @return {null | string}
   */
  getFirstAnnotationValue(annotation){
    return typeof this.#annotations.get(annotation) !== "undefined" ?
      this.#annotations.get(annotation)[0].value :
      null;
  }
}