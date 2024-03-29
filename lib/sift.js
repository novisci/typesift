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

const trace = v => {console.log(v); return(v);}

// Convenient functional comparables to if/then/else 
// These functions evaluate an expression and return either the supplied value unchanged, or
//  depending on the case selected for action, they return the result of a supplied function of a value
const ifThenElse = (fnExp, TFn, FFn) => (v) => fnExp(v) ? TFn(v) : FFn(v);
const ifThen     = (fnExp, Fn) => ifThenElse(fnExp, Fn, identity); 
const unlessThen = (fnExp, Fn) => ifThenElse(fnExp, identity, Fn);

const isUndefined     = (v) => (typeof v === 'undefined');
const ifUndefined     = (Fn) => ifThen(isUndefined, Fn); 
const unlessUndefined = (Fn) => unlessThen(isUndefined, Fn);

//const isNull     = (v) => (v === null);
// const ifNull     = (Fn) => ifThen(isNull, Fn);
// const unlessNull = (Fn) => unlessThen(isNull, Fn);

const isNullOrUndefined     = (v) => ((v === null) || (typeof v === 'undefined'));
const ifNullOrUndefined     = (Fn) => ifThen(isNullOrUndefined, Fn);  
const unlessNullOrUndefined = (Fn) => unlessThen(isNullOrUndefined, Fn); 

const nully = t => t.length === 0;
const head = t => nully(t) ? [] : t[0];
const tail = t => nully(t) ? [] : t.slice(1);
const cons = x => t => [x].concat(t);

const fold = (Fns) => (x) => nully(Fns) ? x : fold(tail(Fns))(head(Fns)(x));   //head(Fns)(fold(tail(Fns))(x)); 
//const aply = (Fns) => (Xs) => nully(Fns) ? [] : cons(head(Fns)(head(Xs)))(aply(tail(Fns))(tail(Xs)));

/*
  The validator function evaluates an expression which takes a value and returns a boolean.
    true -> returns supplied value (identity)
    false -> returns null (nullify)
  If the supplied value is null or undefined, it is passed through without evaluating the expression
*/

// fnExp: (value) -> bool
// validator: (fnExp) -> (value) -> (value|null)
//const validator = (fnExp) => unlessNullOrUndefined(unlessThen(fnExp,nullify));

// Valor: f(value) -> value

// Type validators
const boolean = (v) => typeof v === 'boolean';
const numeric = (v) => typeof v === 'number';
const string  = (v) => typeof v === 'string';
const array   = (v) => Array.isArray(v);
const object  = (v) => (typeof v === 'object' && !Array.isArray(v) && v !== null);

// Numeric range validators
const lowLimit  =  (l)  => [numeric,v => (v >= l)]; //(v) => validator(v => v >= l)(numeric(v));
const highLimit =  (h)  => [numeric,v => (v <= h)]; //(v) => validator(v => v <= h)(numeric(v));
const rangeLimit = (l,h) => [lowLimit(l),highLimit(h)]; //(v) => lowLimit(l)(highLimit(h)(v));

// Enumerated type validator (array of strings)
const enumLimit = (enu) => [string,v => enu.includes(v)]; //(v) => validator(v => enu.includes(v))(string(v));

// Return the properties of an object as an array of strings
const properties = (v) => unlessNullOrUndefined(v => Object.keys(v))(validate([object])(v));
const keys = (v) => {
  if (object(v)) {
    return fp.flatten(properties(v).map(p => [p].concat(keys(v[p]).map(k => `${p}.${k}`))));
  }
  return [];
};

//const chainEval = (chain) => (val) => flatten(chain).reduce((v, fn) => fn(v), val);
const wrap = (chain) => (Fn) => fp.flatten(chain).map((fn) => Fn(fn));
const cheval = (chain) => (val) => fp.flatten(chain).reduce((v, fn) => fn(v), val);

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

const validate = (chain) => fold(wrap(chain)(validator));

// Default value functions are sort of the inverse of a validator.  Defaultor takes a value and if 
//  it's null or undefined, returns the result of the supplied function (which takes the value).  Otherwise, 
//  it returns the value as is.
const defaultor = (Fn) => ifNullOrUndefined(Fn); 

// defaultValue is a defaultor which simply sets the value to the supplied default
const defaultValue = (val) => defaultor(() => val);

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

// Map the text name of the type to its type validator
const TypeValidators = {
  boolean: [boolean],
  string:  [string],
  integer: [numeric],
  float:   [numeric],
  object:  [object],
  array:   [array]
};

const compileDefinition = (def) => {
  return compileValidators(def).concat(compileDefaultors(def));
}

const compileValidators = (def) => {
  def = validateDef(def);

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
  def = validateDef(def);

  def = fp.shift(def);

  // Handle optional arguments
  if (Array.isArray(def[0])) def = fp.shift(def);

  let defaultors = [];
  if (typeof def[0] !== 'undefined') {
    defaultors = [].concat([defaultValue(def[0])]);
  }

  return defaultors;
};

const validateDef = (def) => {
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
        if (typeof val !== 'undefined') {
          a[c] = val;
        }
        // unlessUndefined(x => {a[c] = x;})(val);
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
    //return fp.chainEval(compileDefaultors(def))(validate(compileValidators(def))(v));
    return cheval([validate(compileValidators(def)),compileDefaultors(def)])(v);
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
  cheval,
  structEval,
  keys,
  validate
};