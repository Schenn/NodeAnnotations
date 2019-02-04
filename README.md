The annotations library is a tool which allows you to generate metadata about a javascript class from the 
annotations in the class, methods, and property comments. 
This can be useful for things such as, automatic validation, controller routing, dependency injection, and much much more.

Comments must use the following format to be scanned

    /**
     * @annotation
     * @annotation {types}
     * @annotation value
     * @annotation {types} value
     */

The methods and properties you wish to memoize must follow a comment or they will be skipped.     
Methods must use the following format to be scanned
The whitespaces are optional. There can be a linebreak between the end paren and opening brace

    /**
     * @annotations
     */
     methodName (params...) {
Properties must use the following format to be scanned
The whitespaces are optional. There can be a linebreak between the end paren and opening brace

     /**
      * @annotations
      */
      get prop () {
      
and/or

    /**
     * @annotations
     */
     set prop (value) {

To use for scanning a directory or multiple individual files.
    
    let collector = new Collector();
    collector.collectFromPath(FullWorkingPathToDirectory, onCompleteCallback);
    
or, for loading a single file at a time.

    let collector = new Collector();
    collector.collectFromFile(FullWorkingPathToFile, onCompleteCallback);
        
The collector creates a Metadata object for each class.  
If you want to bypass the Collector then you can just use the Metadata class.
for example, If you're only working with a limited set of classes or only need to fetch the metadata occasionally 

    let metadata = new Metadata();
    metadata.parseFile(FullWorkingPathToFile, OnCompleteCallback);
    
If you're working with strings instead of filepaths

    let metadata = new Metadata();
    metadata.parseContent(TextThatDescribesClass, OnCompleteCallback);
    
The string must represent the text of a class. For example, see any of the classes in the annotations library.
Comments which do not immediately precede the class declaration, a class method, or a class property are skipped. 
You can include them in your classes for the sake of documentation without worrying about them being memoized. 
        
If you're only interested in scanning a string which contains a comment block

    let docblock = new DocBlock();
    let startIndex = contentString.indexOf(docBlock.openComment, currentTextIndex);
    let endIndex = docblock.fromIndex(contentString, startIndex);
    
or, if your string is just the comment body or you don't need the end index of the comment being memoized

    let docblock = new DocBlock();
    docblock.comment = commentString;
    
The Annotation takes a string that looks like a slice of the comment format above

    * @annotation
    * @annotation {types}
    * @annotation value
    * @annotation {types} value