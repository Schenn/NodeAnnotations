const path = require("path");
const assert = require("assert");
const Collector = require("../Collector");
// path to the mock classes
let mockPath = path.join(process.cwd(), "mocks");

let collector = new Collector();

let cbcount = 0;
let mockCount = 0;

let successTimeout = setTimeout(()=>{
  assert.fail("Collector callback never reached.");
}, 3000);

/**
 * Validate the collector is able to pull the metadata for class files.
 */
function collectorTest () {
  /**
   * Set the event before collecting metadata.
   */
  collector.on("fileParsed", (metadata, namespace)=>{
    assert.ok(++mockCount <= 3, "Too many mocks");
    assert.strictEqual(Object.keys(metadata.methods).length, 4);
    assert.strictEqual(metadata.propertyData.length, 2);
  });

  /**
   * If this timeout is reached, then the collector failed to trigger the callback
   * @type {number}
   */

  /**
   * Tests the Collector and MetaData
   */
  collector.filePath = mockPath;
  collector.collect().then(()=>{
    // Validate that the callback is only called once
    assert.strictEqual(collector.namespaces.length, 3);
    for(let i = 0; i < collector.namespaces; i++){
      let name = collector.namespaces[i];
      let data = collector.classMetadata(name);
      assert.strictEqual(data.methods.length, 4);
      assert.strictEqual(data.propertyData.length, 2);
    }
    if(mockCount === 3){
      clearTimeout(successTimeout);
    } else {
      throw "OnComplete triggered before all files parsed.";
    }
  });

}
// Due to asynchronous testing, can't test this in a loop.
let hrstart = process.hrtime();
collectorTest();
let hrend = process.hrtime(hrstart);
console.info('Collector Test Execution time (hr): %dms', hrend[1] / 1000000);

