const Annotation = require("./Annotation");

const phraseRegex = /^(?:\s*\*\s*)(@\w+)(.*)$/gm;
const _ = Symbol("private");

const commentOpen = '/**';
const commentClose = '*/';

// class {name} [extends name]
const classRegex = /((class\s[A-z]+\s?)(?:\sextends\s[A-z]+\s)?){$/;

// */\n methodName[ ](prop, {prop}, ...prop, prop=1, prop="foo", prop='bar')[ \n]{
// only collects methods which follow a comment block
//  method and propregex will not capture arguments with a default argument that has a parenthesis between the quotes.

const methodRegex = /([A-z]+)(?:\s?\([^/)]*\)\s?)\n?\s*{/;
// */\n set|get propName ([value])[ \n]{  only collects properties which follow a comment block
const propRegex = /((set|get)\s([A-z]+))(?:\s?\([^/)]*\)\s?)\n?\s*{/;

/**
 * DocBlock represents a comment node and parses the annotations from the comment into Annotation objects.
 *
 * @type {DocBlock}
 */
module.exports = class DocBlock {

  constructor(){
    this[_] = {
      name: '',
      type: '',
      extends: '',
      readOnly: false,
      annotations: {},
      comment:''
    };
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

  getNameForContent(commentIsFor){
    if(propRegex.test(commentIsFor)){
      this[_].type = "property";
      let prop = commentIsFor.substring(commentIsFor.indexOf("et ")-1,
        commentIsFor.indexOf("(")).trim().split(" ");
      this[_].name = prop[1];
      this[_].readOnly = (prop[0] === "get");
    } else if (methodRegex.test(commentIsFor)){
      this[_].type = "method";
      this[_].name = commentIsFor.replace(commentClose, "").trim();
      this[_].name = this[_].name.substring(0, this[_].name.indexOf("(")).trim();
    } else if (classRegex.test(commentIsFor)){
      this[_].type = "class";
      let classPhrase = commentIsFor.match(classRegex);
      let classData = classPhrase[0].match(/\w+/g);
      this[_].name = classData[1];
      this[_].extends = (typeof classData[3] !== "undefined") ? classData[3] : '';
    } else {
      // There's no prop, method, or class name to associate with this block.
      // Depending on what this docblock is actually parsing, that might be ok.
      /**
       * Known Issue:
       *    if the arguments in a method or property in the file contain a default value that is inside quotes
       *       AND that phrase contains a closing parenthesis, this method can fail. If the quoted content contains
       *       a closing parenthesis followed by an opening brace, the caller method will fail.
       *       If the quoted content contains a characters that match a comment block may cause failures.
       *
       *       The reasonable solution is to not use such an explicit default argument and instead set it in the
       *       method, or use the unicode versions of those characters.
       *
       *       Its possible to improve the character stream read so that it can handle the process of interpreting what
       *       the docblock is for. But, that's a lot of work, tests, and processing time for such a rare edge case.
       *
       *       This only applies to manually written quoted content in the file. Not string values in memory.
       */

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
      let commentIsForIndex = fileContent.indexOf("{", nextIndex)+1;
      let commentIsFor = fileContent.substring(nextIndex, commentIsForIndex);
      this.getNameForContent(commentIsFor);

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

  /**
   * Get the value of the first matching annotation
   * @param {string} annotation
   * @return {null | string}
   */
  getFirstAnnotationValue(annotation){
    return typeof this[_].annotations[annotation] !== "undefined" ? this[_].annotations[annotation][0].value : null;
  }
};