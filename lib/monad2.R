# 
# Axioms:
#  
# unit(value).bind(f) ==== f(value)
# 
# monad.bind(unit) ==== monad
# 
# monad.bind(f).bind(g) ==== monad.bind(value => f(value).bind(g))
# 
# 

bind <- function(.m, .f, ...) UseMethod("bind", .m) # bind: (monad,func) -> func(value) 
#unit <- function(.x)          UseMethod("unit")     # unit: value -> monad
lift <- function(.m, .n, .f) UseMethod("lift")     # lift: (monad,func) -> monad

# Function (degenerate) Monads
fmap.function <- function(.m, .f, ...) {
  function(...) {
    .f(.m(...))
  }
}

#' @export
bind.function <- function(m, f, ...) f(m(...))

# Identity Monad
identity      <- function(x)         structure(list(x), class="identity")
bind.identity <- function(m, f, ...) f(m[[1]], ...)
lift.identity <- function(m, n, f)   augment(m, n, function(...) identity(bind(m, f, ...))

# Null Monad
null      <- function(x)         structure(list(NULL), class="null")
bind.null <- function(m, f, ...) f(NULL, ...)
lift.null <- function(m, n, f, ...)   augment(m, n, function(...) NULL)

# Maybe Monad
maybe      <- function(x)         structure(list(x), class="maybe")
bind.maybe <- function(m, f, ...) (is.null(m[[1]]) ? NULL : f(m[[1]], ...))
lift.maybe <- function(m, n, f, ...)   augment(m, n, function(...) maybe(bind(m, f, ...)))

# Infix Bind
"%>+%" <- function(lhs, rhs) {
  call <- inline_call(quote(bind), substitute(lhs), substitute(rhs))
  eval(call, parent.frame())
}

# Helpers
inline_call <- function(f, lhs, rhs) {
  if (singular_form(rhs)) {
    call <- as.call(c(f, lhs, rhs))
  } else {
    call <- as.call(c(f, lhs, rhs[[1]], as.list(rhs[-1])))
  }
  call
}

singular_form <- function(x) {
  if (is.name(x))
    return(TRUE)

  x <- x[[1]]
  if (identical(x, quote(`function`)))
    return(TRUE)

  if (identical(x, quote(`(`)))
    return(TRUE)

  if (identical(x, quote(`{`)))
    return(TRUE)

  FALSE
}

augment <- function(m, n, v) { m[[n]] <- v; m }