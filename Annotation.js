// \s*\s@word[\s{typeInfo}][\sword]
const phraseRegex = /(?:\s?\*\s?)(@\w+\s?)(({.+})?\s?(\w+)?)?/g;

/**
 * Annotation wraps the individual elements of an annotation string.
 *  An annotation string looks like
 * @type {module.Annotation}
 */
module.exports = class Annotation {
  constructor(expression){
    // Extract the annotation from the string.
    this.phrase = expression.match(phraseRegex)[0].
    // Drop the comment star, the annotation @ symbol and any remaining whitespace at the beginning of the phrase.
      replace("*", "").replace("@","").trim();

    this.nodes = this.phrase.split(" ");
  }

  /**
   * The name of the annotation
   *
   * @return {string}
   */
  get name(){
    return this.nodes[0];
  }

  /**
   * If the annotation has a 'type' in between the name and value, return that entry
   *
   * @return {any}
   * @todo Currently due to how the type is wrapped with braces, the string is converted to an object. We need to find a way to leave it as a string.
   */
  get type(){
    return (this.nodes.length === 3) ? this.nodes[1] : null;
  }

  /**
   * Return the value associated with the given annotation.
   *  If there is no value for the annotation, undefined is returned
   *
   * @return {string | undefined}
   */
  get value(){
    if(this.nodes.length === 3){
      return this.nodes[2];
    }

    return (typeof this.nodes[1] !== "undefined") ? this.nodes[1] : undefined;
  }
};