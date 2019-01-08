/*
*/

// f:x -> y
// g:x -> y
// g(f:x) = g(x') -> y'
// g(f:x) = (g*f)(x) -> y'

const identity = x => x;
const nullity = x => null;

const inc = x => x+1;
const add = c => x => x+c;
const sum = (...x) => x.reduce((a,c)=>a + c,0);
// const fold = (fn, ...x) => x.reduce((a,c)=>fn(a)(c));

// const tadd = x => fold(add, add(5), add(54))(x);

// console.log(sum(4,5,6,3,5,4,3));

// console.log( tadd(5)  );

/**
 * The four
 */
const isNull = t => t.length === 0;
const head = t => isNull(t) ? [] : t[0];
const tail = t => isNull(t) ? [] : t.slice(1);
const cons = x => t => [x].concat(t);

const fold = (Fns) => (x) => isNull(Fns) ? x : head(Fns)(fold(tail(Fns))(x)); 
const aply = (Fns) => (Xs) => isNull(Fns) ? [] : cons(head(Fns)(head(Xs)))(aply(tail(Fns))(tail(Xs)));

const f1 = a => x => a + x;
const f2 = b => x => b - x;

const f1f2 = (a,b) => (x) => f1(a)(f2(b)(x));

console.log(f1f2(3,5)(6));

const f1xf2 = (a,b) => fold([f1(a),f2(b)]);



console.log(f1xf2(3,5)(6));

const f1yf2 = (a,b) => fold(aply([f1,f2])([3,5]));

console.log(f1yf2(3,5)(6));
