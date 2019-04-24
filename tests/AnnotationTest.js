const Annotation = require("../Annotation");
const assert = require("assert");

let annotationPhraseA = `/**
 *
 * @type {module.Mock}`;

let annotationPhraseB = `/**
 * @type {string}
 * @test
`;

let spacingPhrase = `/**
    *    @type {string} 
    *  @test
  * @phrase value value value
`;

let specialCharacterPhrase = `/**
 *
 * @param /
 * @param !phrase
 * @param a+b
 * @param {path/to/class} varName
`;

let aMatches = annotationPhraseA.match(Annotation.REGEX);
assert.equal(1, aMatches.length);
let PhraseAType = new Annotation(aMatches[0]);
assert.equal("type", PhraseAType.name);
assert.equal("module.Mock", PhraseAType.type);

let bMatches = annotationPhraseB.match(Annotation.REGEX);
assert.equal(2, bMatches.length);
let BPhraseType = new Annotation(bMatches[0]);
assert.equal("type", BPhraseType.name);
let BPhraseTest = new Annotation(bMatches[1]);
assert.equal("test", BPhraseTest.name);

let cMatches = spacingPhrase.match(Annotation.REGEX);
console.log(cMatches);
assert.equal(3, cMatches.length);
let CPhraseValues = new Annotation(cMatches[2]);
assert.equal("value value value", CPhraseValues.value);

let specialMatches = specialCharacterPhrase.match(Annotation.REGEX);
assert.equal(4, specialMatches.length);
let slash = new Annotation(specialMatches[0]);
assert.equal("/", slash.value);
let notPhrase = new Annotation(specialMatches[1]);
assert.equal("!phrase", notPhrase.value);
let expression = new Annotation(specialMatches[2]);
assert.equal("a+b", expression.value);
let namespace = new Annotation(specialMatches[3]);
assert.equal("path/to/class", namespace.type);
