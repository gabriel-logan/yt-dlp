package middleware

import (
	"net/http"
	"os"
	"strings"
)

func Auth(next http.Handler) http.Handler {
	apiKeyFromEnv := os.Getenv("VITE_X_API_KEY")

	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		if r.URL.Path == "/api/hello" {
			next.ServeHTTP(w, r)
			return
		}

		if strings.HasPrefix(r.URL.Path, "/api") {
			apiKeyFromHeader := r.Header.Get("X-API-KEY")

			if apiKeyFromHeader != apiKeyFromEnv {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}
