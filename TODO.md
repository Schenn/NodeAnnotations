Classes now have private and public properties in js.  
    - Refactor the metadata parser so that it can identify the new style of class property.

JS is adding its own decorators, which are different than annotations.
    - Refactor metadata parser to also identify the new decorators as annotations.