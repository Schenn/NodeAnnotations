
let privateProps = {
  dbProperty: '',
  readOnlyProperty: 'foo'
};

/**
 * A class to validate the Node Annotations library against.
 *
 * @type {Mock}
 */
class Mock {

  constructor(){

  }
  // This will be skipped
  get foobar(){

  }
  // This will be skipped
  set foobar(val){

  }

  /**
   * This property will be memoized
   *
   * @type {string}
   * @column
   * @test
   */
  get dbProperty(){
    return privateProps.dbProperty;
  }

  /**
   * This property will be memoized
   *
   * @type {string}
   * @column
   * @test
   */
  set dbProperty(val){
    privateProps.dbProperty = val;
  }

  /**
   * This property will be memoized as read-only, unless a setter was found.
   *
   * @type {string}
   * @test
   */
  get readOnlyProperty(){
    return privateProps.readOnlyProperty;
  }

  doThing(){

  }

  /**
   * This will be skipped
   *
   */
  doNothing(){

  }

  /**
   * This should be picked up
   *
   * @test foo
   * @bar
   */
  doSomething(){

  }

  /**
   * This should be picked up
   *
   * @test foo
   * @param {string} foo
   * @param {int} bar
   * @return {string | int}
   */
  doSomethingElse(foo, bar){
    return(foo ? 0 : '');
  }

  /**
   * This should be picked up
   *
   * @test foo
   * @param {string} foo
   */
  doAnotherThing(foo)
  {
    /**
     * This should be ignored.
     * @see adadadwad
     */
    doThing();
  }

  /**
   * This should be picked up
   * @test foo
   * @param {object} foo
   */
  deconstructedMethod(bar, {foo}){
    doThing();
  }
}

module.exports = Mock;