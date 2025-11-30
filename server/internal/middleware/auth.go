package middleware

import (
	"net/http"
	"os"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		apiKeyFromEnv := os.Getenv("X_API_KEY")
		apiKeyFromHeader := r.Header.Get("X-API-KEY")

		if apiKeyFromHeader != apiKeyFromEnv {
			http.Error(w, "Unauthorized", http.StatusUnauthorized)
			return
		}

		next.ServeHTTP(w, r)
	})
}
