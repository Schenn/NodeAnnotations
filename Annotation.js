// \s*\s@word[\s{typeInfo}][\sword]
const phraseRegex = /(?:\s?\*\s?)(@\w+\s?)(({.+})?\s?(\w+)?)?/g;

/**
 * Annotation wraps the individual elements of an annotation string.
 *  An annotation string looks like
 * @type {module.Annotation}
 */
module.exports = class Annotation {
  constructor(expression){
    this._ = Symbol("Annotation");
    this[this._] = {
      // Drop the comment star, the annotation @ symbol and any remaining whitespace at the beginning of the phrase.
      phrase: expression.match(phraseRegex)[0].replace("*", "").trim(),
      nodes: {
        name: expression.match(/(@\w+)/)[0],
        type: '',
        value: ''
      }
    };

    // Extract the annotation from the string.
    let typeMatch = this[this._].phrase.match(/({.+})/);
    let value = this[this._].phrase.replace(this[this._].nodes.name, '');
    if(typeMatch){
      value = value.replace(typeMatch[0], '').trim();
    }

    this[this._].nodes.name = this[this._].nodes.name.replace("@", "");
    this[this._].nodes.type = (typeMatch) ? typeMatch[0].replace("{", '').replace("}", '') : '';
    this[this._].nodes.value = value.trim();
  }

  /**
   * Get the REGEX which is used to identify an annotation in a comment block.
   * @return {RegExp}
   */
  static get REGEX(){
    return phraseRegex;
  }

  get phrase(){
    return this[this._].phrase;
  }

  /**
   * The name of the annotation
   *
   * @return {string}
   */
  get name(){
    return this[this._].nodes.name;
  }

  /**
   * If the annotation has a 'type' in between the name and value, return that entry
   *
   * @return {string}
   */
  get type(){
    return this[this._].nodes.type;
  }

  /**
   * Return the value associated with the given annotation.
   *  If there is no value for the annotation, undefined is returned
   *
   * @return {string}
   */
  get value(){
    return this[this._].nodes.value;
  }
};