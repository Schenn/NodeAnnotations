const path = require("path");
const assert = require("assert");
const DocBlock = require("../DocBlock");

const docBlockPhraseA = `/**
 *
 * @param {module.Mock} a
 * @param {string} b
 * @foo bar
 */`;

const docBlockPhraseClass = `/**
 *
 * @foo bar
 */
 class foo {
`;

const docBlockPhraseMethod = `/**
 *
 * @foo bar
 */
  foo() {
`;

const docBlockPhraseProperty = `/**
 *
 * @foo bar
 */
  set foo(val) {
`;

/**
 * Validate that DocBlock can get annotations out of a docblock
 */
function testPhraseA(){
  let docblockA = new DocBlock();
  let commentEnd = docblockA.fromIndex(docBlockPhraseA);
  assert.strictEqual(docBlockPhraseA.length, commentEnd);
  assert.ok(docblockA.hasAnnotation("param"));
  let typeAnnotations = docblockA.getAnnotation("param");
  // The return of getAnnotations is always an array for predictibility. Even when there's no annotations found.
  assert.ok(typeAnnotations instanceof Array && typeAnnotations.length > 0);
  assert.strictEqual(typeAnnotations[0].name, "param");
  assert.strictEqual(typeAnnotations[0].type, "module.Mock");
  assert.strictEqual(typeAnnotations[1].type, "string");
  assert.strictEqual(typeAnnotations[0].value,"a");
  assert.strictEqual(typeAnnotations[1].value, "b");

  // When there's no annotation found
  assert.strictEqual(docblockA.getAnnotation("type").length, 0);
  assert.strictEqual(docblockA.getAnnotation("foo").length, 1);
}

/**
 * Validate that DocBlock can recognize when its a docblock for a class
 */
function testClassPhrase(){
  let doc = new DocBlock();
  doc.fromIndex(docBlockPhraseClass);
  assert.strictEqual(doc.name, "foo");
  assert.strictEqual(doc.type, "class");
}

/**
 * Validate that DocBlock can recognize when its a class method
 */
function testMethodPhrase() {
  let doc = new DocBlock();
  doc.fromIndex(docBlockPhraseMethod);
  assert.strictEqual(doc.name, "foo");
  assert.strictEqual(doc.type, "method");
}

/**
 * Validate that DocBlock can recognize when its a class property
 */
function testPropertyPhrase() {
  let doc = new DocBlock();
  doc.fromIndex(docBlockPhraseProperty);
  assert.strictEqual(doc.name, "foo");
  assert.strictEqual(doc.type, "property");
  assert.strictEqual(doc.readOnly, false);
}

/**
 * Validate that we can iterate through the annotations in a doc block.
 */
function testIteration(){
  let doc = new DocBlock();
  doc.fromIndex(docBlockPhraseA);
  let i = 0;
  for(let annotation of doc){
    switch(i){
      case 0:
        assert.strictEqual(annotation.name, "param");
        assert.strictEqual(annotation.value, "a");
        break;
      case 1:
        assert.strictEqual(annotation.name, "param");
        assert.strictEqual(annotation.value, "b");
        break;
      case 2:
        assert.strictEqual(annotation.name, "foo");
        assert.strictEqual(annotation.value, "bar");
        break;
    }
    i++;
  }
}

function runTest() {
  testPhraseA();
  testClassPhrase();
  testMethodPhrase();
  testPropertyPhrase();
  testIteration();
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
console.info('DocBlock tests Execution time (hr): %dms', hrend[1] / 1000000);

runTestLoop(100);
hrend = process.hrtime(hrstart);
console.info('100 Loop DocBlock tests Execution time (hr): %dms', hrend[1] / 1000000);