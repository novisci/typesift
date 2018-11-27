/**
 * Operations on tuples
 */

/**
 * Pairs
 */

const fst = (a,b) => a;
const snd = (a,b) => b;

/**
 * The four
 */
const isNull = t => t.length === 0;
const head = t => isNull(t) ? [] : t[0];
const tail = t => isNull(t) ? [] : t.slice(1);
const cons = x => t => [x].concat(t);

/**
 * Some derivative functions
 */
const length = t => isNull(t) ? 0 : 1 + length(tail(t));
const last = t => isNull(tail(t)) ? head(t) : last(tail(t));
//const init = t => 

/**
 * Sequences
 */

const fold = (...v) => fn => fn(head(v), tail(v));

module.exports = {
  isNull, head, tail, cons, length, last
};