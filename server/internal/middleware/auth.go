package middleware

import (
	"net/http"
	"os"
	"strings"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {

		if strings.HasPrefix(r.URL.Path, "/api") {
			apiKeyFromEnv := os.Getenv("VITE_X_API_KEY")
			apiKeyFromHeader := r.Header.Get("X-API-KEY")

			if apiKeyFromHeader != apiKeyFromEnv {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}
		}

		next.ServeHTTP(w, r)
	})
}
