// \s*\s@word[\s{typeInfo}][\swordorcharacters]$
const phraseRegex = /^(?:\s*\*\s*)(@\w+)(.*)/g;

/**
 * Annotation wraps the individual elements of an annotation string.
 *  An annotation string looks like
 * @type {module.Annotation}
 */
export class Annotation {

  #phrase = '';
  #nodes = {
    name: "",
    type: "",
    value: ""
  };

  constructor(expression = ''){
    if(expression !== ''){
      this.expression = expression;
    }
  }

  set expression(expression){
    this.#phrase = expression.match(phraseRegex)[0].replace("*", "").trim();
    this.#nodes.name = expression.match(/(@\w+)/)[0].replace("@", "");
    let typeMatch = this.#phrase.match(/({.+})/);
    this.#nodes.value = this.#phrase.replace(`@${this.#nodes.name}`, '').trim();
    if(typeMatch){
      this.#nodes.value = this.#nodes.value.replace(typeMatch[0], '').trim();
    }

    this.#nodes.type = (typeMatch) ?
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
    this.#phrase = `@${name}${type ? ` {${type}} `: ''}${value ? ` ${value}` : ''}`;
    this.#nodes.name = name;
    this.#nodes.value = value;
    this.#nodes.type = type;
  }

  /**
   * Get the REGEX which is used to identify an annotation within a comment block.
   * @return {RegExp}
   */
  static get phraseRegex(){
    return phraseRegex;
  }

  /**
   * Get the whole annotation string
   *
   * @return {*|string|string}
   */
  get phrase(){
    return this.#phrase;
  }

  /**
   * The name of the annotation
   *
   * @return {string}
   */
  get name(){
    return this.#nodes.name;
  }

  /**
   * The annotation's {type}
   *  If there was no type an empty string is returned.
   *
   * @return {string}
   */
  get type(){
    return this.#nodes.type;
  }

  /**
   * Return the value associated with the given annotation.
   *  If there was no value, an empty string is returned.
   *
   * @return {string}
   */
  get value(){
    return this.#nodes.value;
  }
}