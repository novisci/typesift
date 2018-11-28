// Set up logging

let fixed = [1,0,0,1,1];

let widths = [];

function maxwidths() {
  let fixw = widths.reduce((a,w,i) => fixed[i] ? a+w+1 : a+1, 0);
  let dynw = widths.reduce((a,w,i) => fixed[i] ? a : a+w, 0);
  let scale = (process.stdout.columns - fixw) / dynw;
  return widths.map((w,i) => fixed[i] ? widths[i] : Math.max(Math.floor(scale*widths[i]),3));
}

const log = [];
function l() {
  let line = [...arguments].map(
    x => typeof x === 'string' ? x 
      : typeof x === 'function' ? x.toString() 
      : typeof x === 'undefined' ? 'undefined'
      : JSON.stringify(x)
  );
  line.map( (x,i) => {
    if (typeof widths[i] === 'undefined') widths[i] = 0;
    x = stripcolor(x);
    widths[i] = Math.max(x.length, widths[i]);
  });
  log.push(line);
}

const stripcolor = (x) => x.replace(/\u001b\[[0-9]*m/, '');
const uncolor = (x) => (x.match(/(\u001b\[[0-9]*m)(.*)(\u001b\[[0-9]*m)/) || [x,'',x,'']).slice(1,4);
const recolor = (m) => m.join('');

const cellw = (i) => Math.min(widths[i],maxwidths()[i]);
const truncpad = (x,w) => (x.length > w ? x.slice(0,w-3)+'...' : x).padEnd(w);

const cell = (x,i) => uncolor(x).map((m,ix) => ix==1 ? truncpad(m,cellw(i)) : m ).join(''); //truncpad(x,cellw(i));

function logprint() {
  //console.log(widths);
  if (failures>0) l(FgRed+`${failures} test${failures==1?'':'s'} failed`+Reset);
  else l(FgGreen+'All Tests Pass'+Reset);
  // log.map(v => {
  //   v.map(c => console.log(uncolor(c)));
  // });
  log.map(v => {
    console.log(...v.map(cell));
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
  med = med.toFixed(2).padStart(6);

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