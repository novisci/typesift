// Set up logging
const log = [];
let widths = [];
function l() {
  let line = [...arguments].map(x => (typeof x === 'string') ? x : (typeof x === 'function') ? x.toString() : JSON.stringify(x));
  line.map( (x,i) => {
    if (typeof widths[i] === 'undefined') widths[i] = 0;
    x = x.replace(/\u001b\[[0-9]*m/, '');
    widths[i] = Math.max(x.length, widths[i]);
  });
  log.push(line);
}
function logprint() {
  console.log(widths);
  log.map(v => {
    console.log(...v.map((x,i) => x.padEnd(widths[i]+1)));
  });
}
const FgRed = "\x1b[31m";
const FgGreen = "\x1b[32m";
const Reset = "\x1b[0m";
const failed = FgRed+'FAILED'+Reset;
const passed = FgGreen+' pass '+Reset;

// Timing functions
function parseHrtimeToMicroseconds(hrtime) {
  var seconds = (hrtime[0] + (hrtime[1] / 1e3));
  return seconds;
}

function timeF(fn) {
  var startTime = process.hrtime();
  fn();
  return parseHrtimeToMicroseconds(process.hrtime(startTime));
}

const iterations = 100;
function timeFunction(fn) {
  let t = [...Array(iterations)].map(() => timeF(fn));

  let st = [].concat(t).sort();
  let med = st[st.length/2];
  med = med.toFixed(2).padStart(5);

  return `${med} 𝛍s`;
}

// Test harness functions
const Tester = (fnTest) => (name, ...args) => { 
  // Perform test and emit a log entry 
  l(name, args[0], args[0](), fnTest(...args) ? passed : failed, timeFunction(args[0]));
};

const True = Tester(f => f());
const False = Tester(f => !f());
const Comparator = (fnCompare) => Tester((fnA,b) => fnCompare(fnA(),b));

const CaughtException = (f) => {try {f();} catch(e) {return true;} return false;};
// const Throws = Tester(f => true);//CaughtException(f));
// const NoThrow = Tester(f => false);//!CaughtException(f));

function Throws(name, Fn) {
  let threw = false;
  try{ Fn() } catch(e) {threw = true;}
  if (!threw) l(name+' throws exception',Fn,'[no exception]',failed,'na');
  else l(name+' throws exception',Fn,'[exception]',passed,'na');
}

function NoThrow(name, Fn) {
  let threw = false;
  try{ Fn() } catch(e) {threw = true;throw e;}
  if (threw) l(name+' throws no exception',Fn,'[exception]',failed,'na');
  else l(name+' throws no exception',Fn,'[no exception]',passed,'na');
}

const fp = require('./lib/fp');

const Compare = Comparator(fp.equals);

//const a = [1, 2, [3,4], 5, [6, [7, 8]]];
l('TEST NAME','FUNCTION','VALUE','RESULT','TIME');

// Equals
True('equals() Test equality of flat arrays', () => fp.equals([1,2,3],[1,2,3]));
True('equals() Test equality of nested arrays', () => fp.equals([1,[2,3]],[1,[2,3]]));
True('equals() Test equality of multiple nested arrays', () => fp.equals([[1,2],[3,4]],[[1,2],[3,4]]));
False('equals() Test inequality of different types', () => fp.equals([1,2,3],4));
False('equals() Test inequality different length arrays', () => fp.equals([1,2,3],[4,5]));
True('equals() Test equality of null', () => fp.equals(null,null));
True('equals() Test nested null', () => fp.equals([[1,4],[2,5],[3,null]],[[1,4],[2,5],[3,null]]));
False('equals() Test inequality of null and undefined', () => fp.equals([null], fp.vector(1)));
False('equals() Test inequality of undefined and null', () => fp.equals(fp.vector(1), [null]));
True('equals() Test empty object equality', () => fp.equals({},{}));
True('equals() Test object equality', () => fp.equals({a:1,b:2},{a:1,b:2}));
True('equals() Test order independence of keys', () => fp.equals({a:1,b:2},{b:2,a:1}));
False('equals() Test object inequality', () => fp.equals({a:1,b:2},{a:1}));
False('equals() Test object inequality', () => fp.equals({a:1,b:2},{a:1,b:4}));
True('equals() Test nested object equality', () => fp.equals({a:1,b:{c:4,d:{e:5}}},{a:1,b:{c:4,d:{e:5}}}));

Compare('ifelse() Execeute true case on true', () => fp.ifelse(()=>'yes')(()=>'no')(true), 'yes');
Compare('ifelse() Execeute false case on false', () => fp.ifelse(()=>'yes')(()=>'no')(false), 'no');

// Flatten
Compare('flatten() Flatten empty array', () => fp.flatten([]), [] );
Compare('flatten() Flatten single element array', () => fp.flatten([1]), [1] );
Compare('flatten() Degenerate Flatten', () => fp.flatten([1,2,3,4,5]), [1,2,3,4,5] );
Compare('flatten() Flatten nested array', () => fp.flatten([1, 2, [3,4], 5, [6, [7, 8]]]), [1,2,3,4,5,6,7,8] );

const a = Object.freeze([1, 2, 3, 4, 5]);

NoThrow('flatten() Input not mutated', () => fp.flatten(a)); 

Throws('flatten() Non arrary input', () => fp.flatten(6));
Throws('flatten() No input', () => fp.flatten());

// Chain Evaluation
function pass(v) { return v; }
function accum(v) { return v+1; }
function pusher(v) { return v.concat([1]); }

True('chainEval() Evaluate flat array with passthru', () => fp.chainEval([pass, pass, pass])(5) == 5);
True('chainEval() Evaluate flat array with accumulate', () => fp.chainEval([accum, accum, accum])(1) == 4);
True('chainEval() Evaluate nested array with passthru', () => fp.chainEval([pass, [pass, pass]])(5) == 5);
True('chainEval() Evaluate nested array with accumulate', () => fp.chainEval([[accum, accum], accum])(1) == 4);

Compare('chainEval() Evaluate concatenate array', () => fp.chainEval([pusher, pusher, pusher])([1]), [1, 1, 1, 1] );

const missing2 = [3];
missing2.length = 2;
const missing1 = new Array(2);
missing1[1] = 6;

//console.log(missing1, missing2);

False('equals() Check nested null vs undefined', () => fp.equals(missing2,[3,null]));
False('equals() Check nested undefined vs null', () => fp.equals(missing1,[null,6]));

Compare('zip() Zip valid array inputs', () => fp.zip([1,2,3])([4,5,6]), [[1,4],[2,5],[3,6]]);
Compare('zip() Missing values are null', () => fp.zip([1,2,3])([4,5]), [[1,4],[2,5],missing2]);
Compare('zip() Missing values are null, list a is shorter', () => fp.zip([1,2])([4,5,6]), [[1,4],[2,5],missing1]);

Compare('zipr() Zip with replace copies shorter lists', () => fp.zipr([1,2])([1,2,3,4]), [[1,1],[2,2],[1,3],[2,4]]);

Compare('shift() Shift array removes first element', () => fp.shift([1,2,3,4]), [2,3,4]);
Compare('unshift() Unshift pushes value to first element', () => fp.unshift(1)([2,3,4]), [1,2,3,4]);

Compare('sort() Sort numbers by value', () => fp.sort(fp.byValue)([6,2,4,5,3,7]), [2,3,4,5,6,7]);
Compare('sort() Sort strings by value', () => fp.sort(fp.byValue)(['f','t','d','h','w','u']), ['d','f','h','t','u','w']);

//=================================
const T = require('./lib/tuple');

//l(' ');

Compare('isNull() returns true for empty list', () => T.isNull([]), true);
Compare('isNull() returns false for list with elements', () => T.isNull([1]), false);

Compare('head() returns first element', () => T.head([1]), 1);
Compare('head() returns first element in many element list', () => T.head([1,2,3,4]), 1);
Compare('head() returns empty (null) for empty list', () => T.head([]), []);

Compare('tail() returns elements [1..n]', () => T.tail([1,2,3,4,5]), [2,3,4,5]);
Compare('tail() returns first empty (null) for one element list', () => T.tail([1]), []);
Compare('tail() returns empty (null) for empty list', () => T.tail([]), []);

Compare('cons() adds an element to an empty list', ()=>T.cons(5)([]), [5]);
Compare('cons() adds an element to a populated list', ()=>T.cons(5)([1,2,3]), [5,1,2,3]);

Compare('length() returns 0 for empty list', ()=>T.length([]), 0);
Compare('length() returns 5 for 5 element list', () => T.length([1,2,3,4,5]), 5);

Compare('last() returns empty (null) for empty list', () => T.last([]), []);
Compare('last() returns the last element in a list', () => T.last([1,2,3,4,5]), 5);

//console.log(JSON.stringify(fp.zip([1,2,3])([4,5])));
//=================================
const S = require('./lib/sift');

//l(' ');

Compare('validator() True case returns value', () => S.validator(() => true)([1]), [1]);
Compare('validator() False case returns null', () => S.validator(() => false)([1]), null);
Compare('validator() True case with null input returns null', () => S.validator(true)(null), null);

Compare('numeric() Integer case returns value', () => S.numeric(2), 2);
Compare('numeric() Float case returns value', () => S.numeric(2.23), 2.23);
Compare('numeric() String case returns null', () => S.numeric('fred'), null);
Compare('numeric() Null input returns null', () => S.numeric(null), null);

Compare('string() Numeric case returns null', () => S.string(2), null);
Compare('string() String case returns null', () => S.string('fred'), 'fred');
Compare('string() Null input returns null', () => S.string(null), null);

Compare('lowLimit() Non-numeric type returns null', () => S.lowLimit(5)('fred'), null);
Compare('lowLimit() Above limit returns value', () => S.lowLimit(5)(8), 8);
Compare('lowLimit() Below limit returns null', () => S.lowLimit(5)(3), null);
Compare('lowLimit() Null input returns null', () => S.lowLimit(5)(null), null);

Compare('highLimit() Non-numeric type returns null', () => S.highLimit(5)('fred'), null);
Compare('highLimit() Above limit returns null', () => S.highLimit(5)(8), null);
Compare('highLimit() Below limit returns value', () => S.highLimit(5)(3), 3);
Compare('highLimit() Null input returns null', () => S.highLimit(5)(null), null);

Compare('rangeLimit() Non-numeric type returns null', () => S.lowLimit(5)('fred'), null);
Compare('rangeLimit() In range returns value', () => S.rangeLimit(3,5)(4), 4);
Compare('rangeLimit() Out of range returns null', () => S.rangeLimit(3,5)(8), null);
Compare('rangeLimit() Null input returns null', () => S.rangeLimit(3,5)(null), null);

Compare('enumLimit() Value in collection returns value', () => S.enumLimit(['red','blue'])('red'), 'red');
Compare('enumLimit() Value not in collection returns null', () => S.enumLimit(['red','blue'])('green'), null);
Compare('enumLimit() Null input returns null', () => S.enumLimit(['red','blue'])(null), null);
Compare('enumLimit() Numeric input returns null', () => S.enumLimit(['red','blue'])(5), null);

Compare('defaultValue() Null input receives default', () => S.defaultValue(5)(null), 5);
Compare('defaultValue() Non-null input returns value', () => S.defaultValue(5)(10), 10);

const def1 = [S.numeric, [S.rangeLimit(3,8), S.defaultValue(4)]];
//const def2 = [S.string, S.enumLimit(['red','blue']), S.defaultValue('blue')];

Compare('chainEval(def1) with valid numeric input', () => fp.chainEval(def1)(8), 8);
Compare('chainEval(def1) with invalid numeric input', () => fp.chainEval(def1)(10), 4);
Compare('chainEval(def1) with null input returns default value', () => fp.chainEval(def1)(null), 4);
Compare('chainEval(def1) with string input returns default value', () => fp.chainEval(def1)('fred'), 4);

Compare('structEval() Boolean with no value', () => S.structEval(['boolean',true])(), true);
Compare('structEval() Boolean with value', () => S.structEval(['boolean',true])(false), false);
Compare('structEval() Boolean with non-boolean value', () => S.structEval(['boolean',true])('string'), true);

Compare('structEval() Integer with no value', () => S.structEval(['integer',[S.rangeLimit(2,5)], 3])(), 3);
Compare('structEval() Integer with value', () => S.structEval(['integer',[S.rangeLimit(2,5)], 3])(4), 4);
Compare('structEval() Integer with out of range value', () => S.structEval(['integer',[S.rangeLimit(2,5)], 3])(7), 3);

True('structEval() Integer with out of range value and no default', () => S.structEval(['integer', [S.rangeLimit(2,5)]])() == null  );

logprint();

// const tests = [
//   // Test simple values, not structs
//   "a simple string", 3, 3.5, true,
//   // Test base struct types
//   ['boolean', true],
//   ['string', 'fred'],
//   ['integer', 21],
//   ['float', 1.5],
//   // Test array specification
//   ['array', []],
//   // Test object inline specification
//   ['object', {fred: ['string', 'a'], betty: 32}],
//   {test: ['_letters', 'f'], _letters: {f: 1, g: 2, h: 3}},
//   // Test nesting of subtypes
//   {
//     test: ['object', '_subtype'],
//     _outtype: {
//       g: 3, h: 5, j: 6
//     },
//     _subtype: {
//       prop1: ['string', 'terry'],
//       prop2: ['float', 1.6532],
//       prop3: ['object', '_embedded'],
//       _embedded: {
//         a: ['string', 'gretta'],
//         b: ['_outtype', 'g']
//       }
//     }
//   },
//   // Test ipwrisk analysis
//   {
//     // Top level properties
//     notes: ['string', ''],
//     models: ['array', '_model'],
//     params: ['object', '_params'],

//     // Inner types
//     _model: {
//       disable: ['boolean', false],
//       use: ['_modelTypes', 'censor'],
//       variable: ['string', ''],
//       formula: ['string', ''],
//       value: ['string', ''],
//     },
//     _params: {
//       timeTable2: ['float', null],
//       timeLimit: ['float', null],
//       timeStep: ['float', null],
//       trimming: ['float', 0.0],
//       truncation: ['float', 1.0],
//       characteristics: ['array', 'string'],

//       digits: ['integer', 4],
//       weightType: ['_weightTypes', 'i'],
//       seed: ['integer', 0],
//       bootSamples: ['integer', 0],
//     },

//     // Enumerations
//     _modelTypes: {
//       outcome: 'Outcome',
//       treatment: 'Treatment',
//       censor: 'Censoring',
//       'competing-risk': 'Competing Risk'
//     },
//     _weightTypes: {
//       i: 'IPW Weighting',
//       s: 'SMD Weighting'
//     }
//   }
// ];

// tests.forEach(function(def) {
//   try {
//     console.log(JSON.stringify(def),' => ',struct.initialValue(def));
//   } catch( err ) {
//     console.log(err);
//     throw err;
//   }
// }) 