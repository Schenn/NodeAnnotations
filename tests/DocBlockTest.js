const path = require("path");
const assert = require("assert");
const DocBlock = require("../DocBlock");

const docBlockPhraseA = `/**
 *
 * @param {module.Mock} a
 * @param {string} b
 * @foo bar
 */`;

function testPhraseA(){
  let docblockA = new DocBlock();
  let commentEnd = docblockA.fromIndex(docBlockPhraseA);
  assert.strictEqual(docBlockPhraseA.length, commentEnd);
  assert.ok(docblockA.hasAnnotation("param"));
  let typeAnnotations = docblockA.getAnnotation("param");
  // The return of getAnnotations is always an array for predictibility. Even when there's no annotations found.
  assert.ok(typeAnnotations instanceof Array && typeAnnotations.length > 0);
  assert.strictEqual("param", typeAnnotations[0].name);
  assert.strictEqual("module.Mock", typeAnnotations[0].type);
  assert.strictEqual("string", typeAnnotations[1].type);
  assert.strictEqual("a", typeAnnotations[0].value);
  assert.strictEqual("b", typeAnnotations[1].value);

  // When there's no annotation found
  assert.strictEqual(0, docblockA.getAnnotation("type").length);
  assert.strictEqual(1, docblockA.getAnnotation("foo").length);
}

function runTest() {
  testPhraseA();
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