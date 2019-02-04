
let privateProps = {
  dbProperty: '',
  readOnlyProperty: 'foo'
};

/**
 *
 * @type {module.Mock}
 */
module.exports = class OtherMock {

  constructor(){

  }

  get foobar(){

  }

  set foobar(val){

  }

  /**
   * @type {string}
   * @column
   * @test
   */
  get dbProperty(){
    return privateProps.dbProperty;
  }

  /**
   * @type {string}
   * @column
   * @test
   */
  set dbProperty(val){
    privateProps.dbProperty = val;
  }

  /**
   * @type {string}
   * @test
   */
  get readOnlyProperty(){
    return privateProps.readOnlyProperty;
  }

  doThing(){

  }

  /**
   * adadadasdwasdasd
   *
   */
  doNothing(){

  }

  /**
   * dosafawfafaf
   *
   * @test foo
   * @bar
   */
  doSomething(){

  }

  /**
   * adadadawdadad
   *
   * @test foo
   * @param {string} foo
   * @param {int} bar
   */
  doSomethingElse(foo, bar){

  }

  /**
   * adadadadawdaw
   *
   * @test foo
   * @param foo
   */
  doAnotherThing(foo)
  {
    /**
     * Fewafdafdafafafdad
     * @see adadadwad
     */
    doThing();
  }
};