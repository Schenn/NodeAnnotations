const Metadata = require("../Metadata");
const Mock = require("./mocks/Mock");
const path = require("path");
const assert = require("assert");

let metaTest = new Metadata();
let mock = new Mock();

let mockClassPath = path.join(process.cwd(), "tests/mocks/Mock.js");

/**
 * Tests MetaData, DocBlock and Annotations
 *
 * Parse a mock class and once its ready, run the asserts.
 */
metaTest.parseFile(mockClassPath, ()=>{

  assert.strictEqual(metaTest.methods.length, 3);

  for(let method of metaTest.methods){
    let docblock = metaTest.forMethod(method);

    // assert we get annotations for annotated methods
    // mock class has "test" annotation with a value of "foo"
    //  @test foo
    assert.strictEqual(docblock.getAnnotation("test").value, "foo");

    // assert the method exists on the target.
    assert.strictEqual(typeof mock[method], "function");
  }

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
});

