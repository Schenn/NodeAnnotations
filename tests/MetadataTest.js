import Metadata from "../Metadata";
import Mock from "./mocks/Mock";
import path from "path";
import assert from "assert";

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
    assert.ok(propData.hasAnnotation("test"));

    mock[prop] = "test";
    let expects = (prop === "readOnlyProperty" && propData.readOnly) ?
      'foo' : 'test';

    // In our mocks, only the "readOnlyProperty" property is read only.
    assert.ok(propData.readOnly === (prop === "readOnlyProperty"));
    assert.strictEqual(mock[prop], expects);
  }
}

/**
 * Validate that we can iterate through the docblocks in a MetaData object.
 *  The metadata object iterates through -
 *      the class doc first, then the property docs, then the methods
 */
function testIteration(){
  let metaTest = new Metadata();
  metaTest.parseFile(mockClassPath).then(()=>{
    let i = 0;
    // When iterating over a metadata, the class doc comes first, than the properties, then the methods.
    for(let doc of metaTest){
      if(i === 0){
        assert.strictEqual("class", doc.type);
        assert.strictEqual("Mock", doc.doc.name);
      } else if (i <= 2) {
        assert.strictEqual(doc.type, "property");
        if(i === 1){
          assert.strictEqual(doc.doc.name, "dbProperty");
        } else if (i === 2){
          assert.strictEqual(doc.doc.name, "readOnlyProperty");
        }
      } else {
        assert.strictEqual(doc.type, "method");
        if(i === 3){
          assert.strictEqual(doc.doc.name, "doSomething");
        } else if (i === 4){
          assert.strictEqual(doc.doc.name, "doSomethingElse");
        }
      }
      i++;
    }
  });
}

/**
 * Validate that the Metadata class can correctly parse a file for docblocks
 */
function testMetaDataParsing(){
  let metaTest = new Metadata();
  metaTest.parseFile(mockClassPath).then(()=>{
    assert.strictEqual(metaTest.className, "Mock");
    assert.ok(metaTest.classDoc);

    assert.strictEqual(metaTest.methods.length, 4);
    assert.strictEqual(metaTest.propertyData.length, 2);

    assert.ok(metaTest.getInstance() instanceof Mock);

    checkMethods(metaTest);
    checkProperties(metaTest);

  });
}

/**
 * Tests MetaData, DocBlock and Annotations
 *
 * Validate that the Metadata is able to read a class file and translate that into details.
 */

function runTest(){
  testMetaDataParsing();
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
console.info('Metadata tests Execution time: %dms', hrend[1] / 1000000);
/*

runTestLoop(100);
hrend = process.hrtime(hrstart);
console.info('100 loop Metadata tests Execution time: %dms', hrend[1] / 1000000);
*/
