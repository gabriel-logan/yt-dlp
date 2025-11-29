package web

import (
	"net/http"
	"os"
	"path/filepath"
)

func RegisterSPA(mux *http.ServeMux, distPath string) error {
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Prevent access to /api routes
		if len(r.URL.Path) >= 4 && r.URL.Path[:4] == "/api" {
			http.NotFound(w, r)
			return
		}

		requestPath := filepath.Join(distPath, r.URL.Path)

		// Check if file exists and is not a directory
		if info, err := os.Stat(requestPath); err == nil && !info.IsDir() {
			http.ServeFile(w, r, requestPath)
			return
		}

		// Fallback for SPA routing
		http.ServeFile(w, r, filepath.Join(distPath, "index.html"))
	})

	return nil
}
