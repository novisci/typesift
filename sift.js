const fp = require('./fp');
/*
  Types and Validators
 */

const TypeNames = ['boolean','string','integer','float','object','array'];


const validator = (fnExp) => (v) => (v !== null && fnExp(v)) ? v : null;

const notNull = (Fn) => v !== null ? Fn(v) : null;

const boolean = (v) => validator((v) => typeof v === 'boolean')(v);
const numeric = (v) => validator((v) => typeof v === 'number')(v);
const string  = (v) => validator((v) => typeof v === 'string')(v);
const array   = (v) => validator((v) => Array.isArray(v))(v);
const object  = (v) => validator((v) => typeof v === 'object' && !Array.isArray(v) && v!==null )(v);

const lowLimit  =  (l)  => (v) => validator(v => v >= l)(numeric(v));
const highLimit =  (h)  => (v) => validator(v => v <= h)(numeric(v));
const enumLimit = (enu) => (v) => validator(v => enu.includes(v))(string(v));

const rangeLimit = (l,h) => (v) => lowLimit(l)(highLimit(h)(v));

const defaultValue = (def) => (v) => v === null ? def : v;

const properties = (v) => notNull(v => Object.keys(v))(object(v));

const TypeValidators = {
  boolean: [boolean],
  string:  [string],
  integer: [numeric],
  float:   [numeric],
  object:  [object],
  array:   [array]
};

/*
  A base "struct" definition is a three element tuple which describes a variable
    of type 'type', an optional set of validators (for range limiting, valid value
    checking, etc.), and an optional default value

  ['type', [validators], default]  --or--   ['type', default]

      Note: The above alternate forms imply that a default value may not be an array type. This
        is okay, because while the structure of an array's element might be described in the
        validators, manipulation of an array's actual elements is not handled by the default
        value parameter.

  Eg:
      ['string']                                  Any string value
      ['boolean', true]                           A boolean with a default value of true
      ['integer', [rangeLimit(1,5)], 2]           An integer between [1..5] with a default value of 2
      ['object', [], {a:['integer',[],1]}]        An object with a default value of {a:1}
      ['array', [arrayOf(['object',[],{a:1}])]]   An array of abjects with default values of {a:1}
*/

const compileDefinition = (def) => {
  // Check type declaration
  if (!Array.isArray(def) || typeof def[0] === 'undefined' || typeof def[0] !== 'string') 
    throw new Error('Struct defintion must be an array with a string as its first element');
  if (!TypeNames.includes(def[0]))
    throw new Error(`"${def[0]}" is not a valid type`);

  let typeName = def[0];
  def = fp.shift(def);

  // Handle optional arguments
  let valids = [], defVal;
  if (Array.isArray(def[0])) {
    valids = [].concat(def[0]);
    def = fp.shift(def);
  }
  if (typeof def[0] !== 'undefined') {
    defVal = def[0];
    def = fp.shift(def);
  }

  let validators = [].concat(TypeValidators[typeName], valids);

  if (typeof defVal !== 'undefined') {
    validators = validators.concat([defaultValue(defVal)]);
  }

  return validators;
};

const structEval = (def) => (v) => fp.chainEval(compileDefinition(def))(v);


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
  structEval
};