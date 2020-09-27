// \s*\s@word[\s{typeInfo}][\swordorcharacters]$ If there's a new line right after the anno name, then set reference
const phraseRegex = /(?:\s*\*\s*)(?<anno>@\w+)\s*(?:{(?<type>[^}]+)} *)?(?:(?<rest>.*))?$/;

/**
 * Annotation wraps the individual elements of an annotation string.
 *  An annotation string looks like
 * @type {Annotation}
 */
class Annotation {

  #name= "";
  #type= "";
  #value= "";
  for="";

  constructor(expression = ''){
    if(expression !== ''){
      this.expression = expression;
    }
  }

  set expression(expression){
    let phrase = phraseRegex.exec(expression);
    this.#name = phrase.groups.anno.replace("@", "").trim();
    this.#type = phrase.groups.type ? phrase.groups.type.trim() : '';
    this.#value = phrase.groups.rest ? phrase.groups.rest.trim() : '';
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
    this.#name = name;
    this.#value = value;
    this.#type = type;
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
    return `${this.name} ${this.type} ${this.value} For: ${this.for}`;
  }

  /**
   * The name of the annotation
   *
   * @return {string}
   */
  get name(){
    return this.#name;
  }

  /**
   * The annotation's {type}
   *  If there was no type an empty string is returned.
   *
   * @return {string}
   */
  get type(){
    return this.#type;
  }

  /**
   * Return the value associated with the given annotation.
   *  If there was no value, an empty string is returned.
   *
   * @return {string}
   */
  get value(){
    return this.#value;
  }
}

module.exports = Annotation;