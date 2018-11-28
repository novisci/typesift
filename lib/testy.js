// Set up logging
const log = [];
let widths = [];

function l() {
  let line = [...arguments].map(x => (typeof x === 'string') ? x : (typeof x === 'function') ? x.toString() : (typeof x === 'undefined' ? 'undefined': JSON.stringify(x)));
  line.map( (x,i) => {
    if (typeof widths[i] === 'undefined') widths[i] = 0;
    x = x.replace(/\u001b\[[0-9]*m/, '');
    widths[i] = Math.max(x.length, widths[i]);
  });
  log.push(line);
}

function logprint() {
  //console.log(widths);
  if (failures>0) l(FgRed+`${failures} test${failures==1?'':'s'} failed`+Reset);
  else l(FgGreen+'All Tests Pass'+Reset);
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

// Test result exit code
let failures = 0;

// Test harness functions
const Tester = (fnTest) => (name, ...args) => { 
  // Perform test and emit a log entry 
  const result = fnTest(...args);
  if (!result) failures++;

  l(name, args[0], args[0](), result ? passed : failed, timeFunction(args[0]));
};

const True = Tester(f => f());
const False = Tester(f => !f());
const Comparator = (fnCompare) => Tester((fnA,b) => fnCompare(fnA(),b));

// const CaughtException = (f) => {try {f();} catch(e) {return true;} return false;};
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

// Place a header row in the output log
l('TEST NAME','FUNCTION','VALUE','RESULT','TIME');

module.exports = {
  l,
  logprint,
  exitCode: () => (failures > 0) ? 1 : 0,
  True,
  False,
  Comparator,
  Throws,
  NoThrow
};