const Annotation = require("../Annotation");
const assert = require("assert");
const phraseRegex = /^\s*\*\s*@\w+.*$/gm;

const annotationPhraseA = `
 *
 * @type {module.Mock}`;

const annotationPhraseB = `
 * @type {string}
 * @test
`;

const spacingPhrase = `
    *    @type {string} 
    *  @test
  * @phrase value value value
`;

const specialCharacterPhrase = `
 *
 * @param /
 * @param !phrase
 * @param a+b
 * @param {path/to/class} varName
`;

/**
 * Validate that the Annotation can find both an annotation and a provided type string
 */
function testPhraseA(){
  let aMatches = annotationPhraseA.match(phraseRegex);
  assert.equal(1, aMatches.length);
  let phraseAType = new Annotation(aMatches[0]);
  assert.equal("type", phraseAType.name);
  assert.equal("module.Mock", phraseAType.type);
}

/**
 * Validate that the Annotation can find an annotation with a type, or an annotation by itself
 */
function testPhraseB(){
  let bMatches = annotationPhraseB.match(phraseRegex);
  assert.equal(2, bMatches.length);
  let phraseBType = new Annotation(bMatches[0]);
  assert.equal("type", phraseBType.name);
  let phraseBTest = new Annotation(bMatches[1]);
  assert.equal("test", phraseBTest.name);
}

/**
 * Validate that the Annotation can find an annotation with a type, by itself, or with a value,
 *  regardless of how much extra whitespace there might be.
 */
function testPhraseC(){
  let cMatches = spacingPhrase.match(phraseRegex);
  assert.equal(3, cMatches.length);
  let phraseCValues = new Annotation(cMatches[2]);
  assert.equal("value value value", phraseCValues.value);
}

/**
 * Validate that the Annotation can find annotations with values that have special characters
 */
function testSpecialChars(){
  let specialMatches = specialCharacterPhrase.match(phraseRegex);
  assert.equal(4, specialMatches.length);
  let slash = new Annotation(specialMatches[0]);
  assert.equal("/", slash.value);
  let notPhrase = new Annotation(specialMatches[1].trimStart());
  assert.equal("!phrase", notPhrase.value);
  let expression = new Annotation(specialMatches[2].trimStart());
  assert.equal("a+b", expression.value);
  let namespace = new Annotation(specialMatches[3].trimStart());
  assert.equal("path/to/class", namespace.type);
}

/**
 * Run all phrase tests once.
 */
function runTest(){
  testPhraseA();
  testPhraseB();
  testPhraseC();
  testSpecialChars();
}

/**
 * Run the phrase tests multiple times
 * @param {int} count
 */
function runTestLoop(count){
  for(let i = 0; i < count; i++){
    runTest();
  }
}

let hrstart = process.hrtime();
runTest();
let hrend = process.hrtime(hrstart);
console.info('Annotation Tests Execution time (hr): %dms', hrend[1] / 1000000);

runTestLoop(100);
hrend = process.hrtime(hrstart);
console.info('100 loop Annotation Tests Execution time (hr): %dms', hrend[1] / 1000000);