package middleware

import "net/http"

type Middleware func(http.Handler) http.Handler

func CreateChain(middlewares ...Middleware) Middleware {
	return func(next http.Handler) http.Handler {
		for i := len(middlewares) - 1; i >= 0; i-- {
			x := middlewares[i]
			next = x(next)
		}

		return next
	}
}
