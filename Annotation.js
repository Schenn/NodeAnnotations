// \s*\s@word[\s{typeInfo}][\swordorcharacters]$
const phraseRegex = /^(?:\s*\*\s*)(@\w+)(.*)/g;

const _ = Symbol("private");

/**
 * Annotation wraps the individual elements of an annotation string.
 *  An annotation string looks like
 * @type {module.Annotation}
 */
module.exports = class Annotation {
  constructor(expression = ''){

    this[_] = {
      // Drop the comment star, the annotation @ symbol and any remaining whitespace at the beginning of the phrase.
      phrase: '',
      nodes: {
        name: '',
        type: '',
        value: ''
      }
    };
    if(expression !== ''){
      this.fromExpression(expression);
    }
  }

  /**
   * Parse a comment line for annotations.
   *
   * @param {string} expression
   */
  fromExpression(expression){
    this[_].phrase = expression.match(phraseRegex)[0].replace("*", "").trim();
    this[_].nodes.name = expression.match(/(@\w+)/)[0].replace("@", "");
    // Extract the annotation from the string.
    let typeMatch = this[_].phrase.match(/({.+})/);
    this[_].nodes.value = this[_].phrase.replace(`@${this[_].nodes.name}`, '').trim();
    if(typeMatch){
      this[_].nodes.value = this[_].nodes.value.replace(typeMatch[0], '').trim();
    }

    this[_].nodes.type = (typeMatch) ?
      typeMatch[0].replace("{", '').replace("}", '') :
      '';

  }

  /**
   * Set the properties for the Annotation from values.
   *
   * @param {string} name
   * @param {string|null} value
   * @param {string|null} type
   */
  fromValues(name, value=null, type=null){
    this[_].phrase = `@${name}${type ? ` {${type}} `: ''}${value ? ` ${value}` : ''}`;
    this[_].nodes.name = name;
    this[_].nodes.value = value;
    this[_].nodes.type = type;
  }

  /**
   * Get the REGEX which is used to identify an annotation within a comment block.
   * @return {RegExp}
   */
  static get REGEX(){
    return phraseRegex;
  }

  /**
   * Get the whole annotation string
   *
   * @return {*|string|string}
   */
  get phrase(){
    return this[_].phrase;
  }

  /**
   * The name of the annotation
   *
   * @return {string}
   */
  get name(){
    return this[_].nodes.name;
  }

  /**
   * The annotation's {type}
   *  If there was no type an empty string is returned.
   *
   * @return {string}
   */
  get type(){
    return this[_].nodes.type;
  }

  /**
   * Return the value associated with the given annotation.
   *  If there was no value, an empty string is returned.
   *
   * @return {string}
   */
  get value(){
    return this[_].nodes.value;
  }
};