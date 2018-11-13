function MONAD(modifier) {  // (monad,value) => modifier : monad
  var prototype = Object.create (null);

  function unit (value) {
    var monad = Object.create (prototype);
    monad.bind = function (func, args) {
      if (typeof args === 'undefined') args = [];
      return func(value, ...args);
    };
    if (typeof modifier === 'function') {
      modifier(monad, value);
    }
    return monad;
  }

  unit.lift = function (name, func) {
    prototype[name] = function (...args) {
      if (typeof args === 'undefined') args = [];
      return unit(this.bind(func, args));
    };
    return unit;
  };
  return unit;
}

/**
 * Axioms:
 * 
 * unit(value).bind(f) ==== f(value)
 * 
 * monad.bind(unit) ==== monad
 * 
 * monad.bind(f).bind(g) ==== monad.bind(value => f(value).bind(g))
 * 
 */

var identity = MONAD();
var monad = identity('Fred');
monad.bind(console.log);

var ajax = MONAD().lift('log',console.log);
monad = ajax("Freddo");
monad.log();

var maybe = MONAD( (monad, value) => {
  if (value === null || value === undefined) {
    monad.is_null = true;
    monad.bind = function () {
      return monad;
    };
  }
});

monad = maybe('Freddie');
monad.bind(console.log);

monad = maybe(null);
monad.bind(console.log);