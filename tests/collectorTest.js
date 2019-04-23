const path = require("path");
const assert = require("assert");
const Collector = require("../Collector");
// path to the mock classes
let mockPath = path.join(process.cwd(), "mocks");

let collector = new Collector();

let cbcount = 0;
let mockCount = 0;

collector.onComplete = ()=>{
  // Validate that the callback is only called once
  cbcount++;
  assert.strictEqual(cbcount,1);
  assert.strictEqual(collector.namespaces.length, 3);

  for(let name of collector.namespaces){
    let data = collector.classMetadata(name);
    assert.strictEqual(data.methods.length, 3);
    assert.strictEqual(data.propertyData.length, 2);
  }
  if(mockCount === 3){
    clearTimeout(successTimeout);
  } else {
    throw "OnComplete triggered before all files parsed.";
  }
};

collector.onFileParsed = (metadata)=>{
  assert.ok(++mockCount <= 3);
  assert.strictEqual(metadata.methods.length, 3);
  assert.strictEqual(metadata.propertyData.length, 2);
};

/**
 * If this timeout is reached, then the collector failed to trigger the callback
 * @type {number}
 */
let successTimeout = setTimeout(()=>{
  assert.fail("Collector callback never reached.");
}, 2000);

/**
 * Tests the Collector and MetaData
 */
collector.collectFromPath(mockPath);