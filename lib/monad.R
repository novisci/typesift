
# MONAD <- function (modifier) {
#   unit <- function (monad, value) {
#     bind <- function (fn, ...) fn(value, ...)
#     if (!missing(modifier)) bind <- modifier(bind, value)
#     bind
#   }
#   unit
# }
                                                # MONAD: (?modifier) -> monad
MONAD <- function (modifier) {                  # modifier: (monad,value) -> monad
  if (missing(modifier)) modifier <- function(m, v) m
  function (value) {                            # unit: (value) -> monad
    modifier(function (fn, ...) fn(value, ...), value)   # bind: (fn) -> fn(value)
  }
}

ID <- MONAD()
monad <- ID('Fred');
monad(print);

MAYBE <- MONAD((function (m,v) {
  if (missing(v) || is.null(v)) {
    m <- function(fn) NULL
  }
  m
}))

monad <- MAYBE('Freddie');
monad(print);

monad <- MAYBE(NULL);
monad(print);


# MONAD <- function (modifier) {  #  modifier: (monad,value) -> monad
#   prototype <- list()

#   prototype$unit <- function (monad, value) {
#     monad$bind <- function (func, ...) func(value, ...)
#     if (!missing(modifier)) monad <- modifier(monad, value)
#     monad
#   }

#   prototype$lift <- function (monad, name, func) {
#     monad[[name]] <- function (...) monad$unit(monad$bind(func, ...))
#     monad
#   }

#   prototype
# }

# var identity = MONAD();
# var monad = identity('Fred');
# monad.bind(console.log);

# var ajax = MONAD().lift('log',console.log);
# monad = ajax("Freddo");
# monad.log();

# var maybe = MONAD( (monad, value) => {
#   if (value === null || value === undefined) {
#     monad.is_null = true;
#     monad.bind = function () {
#       return monad;
#     };
#   }
# });

# monad = maybe('Freddie');
# monad.bind(console.log);

# monad = maybe(null);
# monad.bind(console.log);