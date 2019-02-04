const Metadata = require("../Metadata");
const Mock = require("./mocks/Mock");
const path = require("path");
const assert = require("assert");

let metaTest = new Metadata();
let mock = new Mock();

let controllerMockPath = path.join(process.cwd(), "tests/mocks/Mock.js");

metaTest.parseFile(controllerMockPath, ()=>{

  assert.strictEqual(metaTest.methods.length, 3);

  for(let method of metaTest.methods){
    let docblock = metaTest.forMethod(method);

    // assert we get annotations for annotated methods
    // mock class has "test" annotation, value ="foo"
    assert.strictEqual(docblock.getAnnotation("test").value, "foo");

    // assert the method exists on the target.
    assert.strictEqual(typeof mock[method], "function");
  }

  for(let prop of metaTest.propertyData){
    let propData = metaTest.forProperty(prop);
    assert.ok(propData.docblock.hasAnnotation("test"));

    if(prop === "readOnlyProperty"){
      assert.ok(propData.readOnly);
      // Read only prop doesn't change if you try to set it.
      mock[prop] = "test";
      assert.strictEqual(mock[prop], 'foo');
    } else {
      mock[prop] = "test";
      assert.strictEqual(mock[prop], "test");
    }

  }

});

