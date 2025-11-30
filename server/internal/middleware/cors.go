package middleware

import (
	"net/http"
	"os"
)

func CORSMiddleware(next http.Handler) http.Handler {
	env := os.Getenv("GO_ENV")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if env == "development" {
			w.Header().Set("Access-Control-Allow-Origin", "*")
			w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
			w.Header().Set("Access-Control-Allow-Headers", "Content-Type, Authorization")

			if r.Method == http.MethodOptions {
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}
