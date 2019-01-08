const fp = require('./fp');
/*
  Types and Validators
 */

const TypeNames = ['boolean','string','integer','float','object','array'];

/*
  Handling of undefined and null

  Notes/axioms: 
    - null is a value, undefined is the absence of a value
    - operations with null inputs return null
    - undefined and null are synonymous in value, but not in assignment 
      - when taking a value, undefined and null both indicate "no value"
      - 
*/

// Some really primitive axiomatic stuff
const identity = (v) => v;
//const undefine = (v) => {return;};  // This conflicts with axiom above, cannot set to undefined
const nullify = () => null;

// Convenient functional comparables to if/then/else 
// These functions evaluate an expression and return either the supplied value unchanged, or
//  depending on the case selected for action, they return the result of a supplied function of a value
const ifThenElse = (fnExp, TFn, FFn) => (v) => fnExp(v) ? TFn(v) : FFn(v);
const ifThen     = (fnExp, Fn) => ifThenElse(fnExp, Fn, identity); 
const unlessThen = (fnExp, Fn) => ifThenElse(fnExp, identity, Fn);

const isUndefined     = (v) => (typeof v === 'undefined');
const ifUndefined     = (Fn) => ifThen(isUndefined, Fn); 
const unlessUndefined = (Fn) => unlessThen(isUndefined, Fn);

const isNull     = (v) => (v === null);
const ifNull     = (Fn) => ifThen(isNull, Fn);
const unlessNull = (Fn) => unlessThen(isNull, Fn);

const isNullOrUndefined     = (v) => (isNull(v) || isUndefined(v));
const ifNullOrUndefined     = (Fn) => ifThen(isNullOrUndefined, Fn);  
const unlessNullOrUndefined = (Fn) => unlessThen(isNullOrUndefined, Fn); 

const reduce = (Fns) => fp.chainEval(fp.flatten([Fns]));



/*
  The validator function evaluates an expression which takes a value and returns a boolean.
    true -> returns supplied value (identity)
    false -> returns null (nullify)
  If the supplied value is null or undefined, it is passed through without evaluating the expression
*/

// fnExp: (value) -> bool
// validator: (fnExp) -> (value) -> (value|null)
//const validator = (fnExp) => unlessNullOrUndefined(unlessThen(fnExp,nullify));

/* 
 * The validator returns the following based on the supplied value:
 *    value is undefined    -> undefined
 *    value is null         -> null
 *    fnExp(value) is false -> null
 *    fnExp(value) is true  -> value
 */
// fnExp: (value) -> bool
// validator: (fnExp) -> (value) -> (value|null)
const validator = (fnExp) => unlessThen(isNullOrUndefined, unlessThen(fnExp,nullify));

// Type validators
const boolean = validator((v) => typeof v === 'boolean');
const numeric = validator((v) => typeof v === 'number');
const string  = validator((v) => typeof v === 'string');
const array   = validator((v) => Array.isArray(v));
const object  = validator((v) => typeof v === 'object' && !Array.isArray(v) && !isNull(v) );

// Return the properties of an object as an array of strings
const properties = (v) => unlessNullOrUndefined(v => Object.keys(v))(object(v));
const keys = (v) => {
  if (object(v)) {
    return fp.flatten(properties(v).map(p => [p].concat(keys(v[p]).map(k => `${p}.${k}`))));
  }
  return [];
};

// Numeric range validators
const lowLimit  =  (l)  => fp.chainEval([numeric,validator(v => v >= l)]); //(v) => validator(v => v >= l)(numeric(v));
const highLimit =  (h)  => fp.chainEval([numeric,validator(v => v <= h)]); //(v) => validator(v => v <= h)(numeric(v));
const rangeLimit = (l,h) => fp.chainEval([lowLimit(l),highLimit(h)]); //(v) => lowLimit(l)(highLimit(h)(v));

// Enumerated type validator (array of strings)
const enumLimit = (enu) => fp.chainEval([string,validator(v => enu.includes(v))]); //(v) => validator(v => enu.includes(v))(string(v));


// Default value functions are sort of the inverse of a validator.  Defaultor takes a value and if 
//  it's null or undefined, returns the result of the supplied function (which takes the value).  Otherwise, 
//  it returns the value as is.
const defaultor = (Fn) => ifNullOrUndefined(Fn); 

// defaultValue is a defaultor which simply sets the value to the supplied default
const defaultValue = (val) => defaultor(() => val);

// Map the text name of the type to its type validator
const TypeValidators = {
  boolean: [boolean],
  string:  [string],
  integer: [numeric],
  float:   [numeric],
  object:  [object],
  array:   [array]
};

/*
  A base "struct" definition is an up to three element tuple which describes a variable
    of type 'type', an optional set of validators (for range limiting, valid value
    checking, etc.), and an optional default value

  ['type', [validators], default]  --or--  ['type', [validators]]  --or--  ['type', default]  --or--  ['type']

      Note: The above alternate forms imply that a default value may not be an array type. This
        is okay, because while the structure of an array's element might be described in the
        validators, manipulation of an array's actual elements is not handled by the default
        value parameter. (i.e. the default value of an array type is an empty array)

  Eg:
      ['string']                                  Any string value
      ['boolean', true]                           A boolean with a default value of true
      ['integer', [rangeLimit(1,5)], 2]           An integer between [1..5] with a default value of 2
      ??? ['object', [], {a:['integer',[],1]}]        An object with a default value of {a:1}
      ??? ['array', [arrayOf(['object',[],{a:1}])]]   An array of abjects with default values of {a:1}
*/

const compileDefinition = (def) => {
  return compileValidators(def).concat(compileDefaultors(def));
}

const compileValidators = (def) => {
  def = validate(def);

  let typeName = def[0];
  def = fp.shift(def);

  // Handle optional arguments
  let valids = [], defVal;
  if (Array.isArray(def[0])) {
    valids = [].concat(def[0]);
  }

  valids = [].concat(TypeValidators[typeName], valids);

  //valids.map(v => console.log(v.toString()));
  return valids;
};

const compileDefaultors = (def) => {
  def = validate(def);

  def = fp.shift(def);

  // Handle optional arguments
  if (Array.isArray(def[0])) def = fp.shift(def);

  let defaultors = [];
  if (typeof def[0] !== 'undefined') {
    defaultors = [].concat([defaultValue(def[0])]);
  }

  return defaultors;
};

const validate = (def) => {
  // Check type declaration
  if (!Array.isArray(def) || typeof def[0] === 'undefined' || typeof def[0] !== 'string') 
    throw new Error('Struct defintion must be an array with a string as its first element');
  if (!TypeNames.includes(def[0]))
    throw new Error(`"${def[0]}" is not a valid type`);

  return def;
};

const traverse = (def) => (Fn) => {   // def,v Fn -> v'
    // If def is an object, consider it a named list of properties and their type definitions
    if (object(def)) {
      if (isNullOrUndefined(v)) v = {};   
      return properties(def).reduce((a,c) => {
        let val = traverse(def[c])((v) => Fn(v[c]));
        unlessUndefined(x => {a[c] = x;})(val);
        return a;
      }, {});
    }

    return Fn(v);
};

//const structEval = (def) => traverse(def)(v => )

const structEval = (def) => (v) => {
    // If def is an object, consider it a named list of properties and their type definitions
    if (object(def)) {
      if (isNullOrUndefined(v)) v = {};   
      return properties(def).reduce((a,c) => {
        let val = structEval(def[c])(v[c]);
        unlessUndefined(x => {a[c] = x;})(val);
        return a;
      }, {});
    }
  
    //return fp.chainEval(compileDefinition(def))(v);
    return fp.chainEval(compileDefaultors(def))(fp.chainEval(compileValidators(def))(v));
};

module.exports = {
  boolean,
  numeric,
  string,
  array,
  object,
  validator,
  lowLimit,
  highLimit,
  rangeLimit,
  enumLimit,
  defaultValue,
  properties,
  //compileDefinition,
  structEval,
  keys
};