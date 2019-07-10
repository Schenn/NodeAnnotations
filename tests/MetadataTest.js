const Metadata = require("../Metadata");
const Mock = require("./mocks/Mock");
const path = require("path");
const assert = require("assert");

// for testing we only need one.
const mock = new Mock();
const mockClassPath = path.join(process.cwd(), "mocks/Mock.js");

/**
 * @param {Metadata} metaTest
 */
function checkMethods(metaTest){
  for(let method of metaTest.methods){
    let docblock = metaTest.forMethod(method);

    // assert we get annotations for annotated methods
    // mock class has "test" annotation with a value of "foo"
    //  @test foo
    assert.strictEqual(docblock.getAnnotation("test")[0].value, "foo");

    // assert the method exists on the target.
    assert.strictEqual(typeof mock[method], "function");
  }
}

/**
 * Check the properties on the metadata test object
 * @param {Metadata} metaTest
 */
function checkProperties(metaTest){
  for(let prop of metaTest.propertyData){
    let propData = metaTest.forProperty(prop);
    assert.ok(propData.docblock.hasAnnotation("test"));

    mock[prop] = "test";
    let expects = (prop === "readOnlyProperty" && propData.readOnly) ?
      'foo' : 'test';

    // In our mocks, only the "readOnlyProperty" property is read only.
    assert.ok(propData.readOnly === (prop === "readOnlyProperty"));
    assert.strictEqual(mock[prop], expects);
  }
}

/**
 * Tests MetaData, DocBlock and Annotations
 *
 * Validate that the Metadata is able to read a class file and translate that into details.
 */

function runTest(){
  let metaTest = new Metadata();
  metaTest.parseFile(mockClassPath).then(()=>{
    assert.strictEqual("Mock", metaTest.className);
    assert.ok(metaTest.classDoc);

    assert.strictEqual(metaTest.methods.length, 3);
    assert.strictEqual(metaTest.propertyData.length, 2);

    assert.ok(metaTest.getInstance() instanceof Mock);

    checkMethods(metaTest);
    checkProperties(metaTest);

  });
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
console.info('Metadata tests Execution time (hr): %dms', hrend[1] / 1000000);

runTestLoop(100);
hrend = process.hrtime(hrstart);
console.info('100 loop Metadata tests Execution time (hr): %dms', hrend[1] / 1000000);
