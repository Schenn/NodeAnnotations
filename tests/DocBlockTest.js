const path = require("path");
const assert = require("assert");
const DocBlock = require("../DocBlock");

const docBlockPhraseA = `/**
 *
 * @param {module.Mock} a
 * @param {string} b
 * @foo bar
 */`;

/**
 * Validate that DocBlock can get annotations out of a docblock
 *  If you use the fromIndex method on the docBlock, you can get the annotations
 *    from any docblock of your choice.
 *    Metadata filters the docblocks to only be for classes and their props and methods.
 */
function testPhraseA(){
  let docblockA = new DocBlock("foo", docBlockPhraseA);
  let commentEnd = docblockA.comment.length;
  assert.strictEqual(docBlockPhraseA.length, commentEnd, 'End of comment was not at expected position.');
  assert.ok(docblockA.hasAnnotation("param"));
  let typeAnnotations = docblockA.getAnnotation("param");
  // The return of getAnnotations is always an array for predictibility. Even when there's no annotations found.
  assert.ok(typeAnnotations instanceof Array && typeAnnotations.length > 0);
  assert.strictEqual(docblockA.getAnnotation("param").length, 2, "Failed to get appropriate number of param annotations.");
  assert.strictEqual(typeAnnotations[0].name, "param", "Failed to load param annotation.");
  assert.strictEqual(typeAnnotations[0].type, "module.Mock", "Failed to type for param.");
  assert.strictEqual(typeAnnotations[1].type, "string", "Failed to load the type for the second param.");
  assert.strictEqual(typeAnnotations[0].value,"a", "Failed to load param value.");
  assert.strictEqual(typeAnnotations[1].value, "b", "Failed to load param value.");

  // When there's no annotation found
  assert.strictEqual(docblockA.getAnnotation("type").length, 0, "Failed to get appropriate number of param annotations.");
  assert.strictEqual(docblockA.getAnnotation("foo").length, 1, "Failed to get appropriate number of param annotations.");
}


/**
 * Validate that we can iterate through the annotations in a doc block.
 */
function testIteration(){
  let doc = new DocBlock("foo", docBlockPhraseA);
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