//const equalType = (a) => (b) => typeof a !== typeof b;

//const nop = ()=>{};

//const iff = (Fn) => (exp) => exp ? Fn() : nop();
//const unless = (Fn) => (exp) => exp ? nop() : Fn();

const ifelse = (FnT) => (FnF) => (exp) => exp ? FnT() : FnF();

const vector = (len, init) => {
  let v = [...Array(len)];  // "Spread" the entries of a new array of length len to pre-fill entries set to undefined
  if (typeof init !== 'undefined') v = v.map((x,i) => init[i]);
  return v;
};

/**
 * [[a], [b,c], d, e, [f,g,h], ...] => [a,b,c,d,e,f,g,h,...]
 * @param {*} v 
 */
const flatten = (v) => v.reduce((a, c) => a.concat(Array.isArray(c) ? flatten(c) : c), []);

/**
 * [[fn], fn, fn, [fn,fn,fn], ...], val => (val | null)
 * 
 * fn: val => val | null
 */
const chainEval = (chain) => (val) => flatten(chain).reduce((v, fn) => fn(v), val);

//const head = (v) => v.length > 0 ? v.slice(0,1) : v;
//const tail = (v) => v.length > 0 ? v.slice(v.length-1) : v;

const longer = (a,b) => a.length > b.length ? a : b;
//const shorter = (a,b) => a.length > b.length ? b : a;

/**
 * Zip with null
 * [a,b,c,...] [1,2,3,...] => [[a,1],[b,2],[c,3],...]
 * [a,b] [1,2,3,4] => [[a,1],[b,2],[null,3],[null,4]]
 * @param {*} a 
 * @param {*} b 
 */
const zip = (a) => (b) => longer(a,b).map((x,i) => vector(2,[a[i],b[i]]));

/**
 * Zip with replace
 * [a,b,c,...] [1,2,3,...] => [[a,1],[b,2],[c,3],...]
 * [a,b] [1,2,3,4] => [[a,1],[b,2],[a,3],[b,4]]
 * @param {*} a 
 * @param {*} b 
 */
const zipr = (a) => (b) => longer(a,b).map((x,i) => vector(2,[a[i%a.length],b[i%b.length]]));

/**
 * 
 * @param {*} a 
 * @param {*} b 
 */
const equals = (a,b) => {  
  if (typeof a !== typeof b) return false;
  // non-object types: boolean, string, number, function, undefined
  if (typeof a !== 'object') return a===b;
  // object type: null, array, object
  if (a===null && b===null) return true;
  if (a===null || b===null) return false;
  // object type: array
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return zip(a)(b).reduce((eq,p) => eq ? equals(p[0],p[1]) : false, true);
  }
  if (Array.isArray(a) || Array.isArray(b)) return false;
  // object: 
  //  Note: keys are not order dependent, {a:1,b:2} == {b:2,a:1}
  let ka = sort(byValue)(Object.keys(a));
  let kb = sort(byValue)(Object.keys(b));
  if (!equals(ka,kb)) return false;
  return ka.reduce((eq,k) => eq ? equals(a[k],b[k]) : false, true);
};

// Sequential operations
const shift = (v) => v.slice(1);
const unshift = (c) => (v) => [c].concat(v);

// Sorting
const sort = (Fn) => (v) => v.slice().sort(Fn);
const byValue = (a,b) => a>b ? 1 : (a<b ? -1 : 0);

module.exports = {
  equals,
  ifelse,
  flatten,
  chainEval,
  vector,
  zip,
  zipr,
  shift,
  unshift,
  sort,
  byValue
};