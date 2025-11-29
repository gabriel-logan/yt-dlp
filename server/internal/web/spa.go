package web

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func RegisterSPA(mux *http.ServeMux, distPath string) error {
	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {

		// block API routes from SPA handler
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFound(w, r)
			return
		}

		requestPath := filepath.Join(distPath, r.URL.Path)

		// check if file exists and is not a directory
		if info, err := os.Stat(requestPath); err == nil && !info.IsDir() {
			http.ServeFile(w, r, requestPath)
			return
		}

		// fallback to index.html
		http.ServeFile(w, r, filepath.Join(distPath, "index.html"))
	})

	return nil
}
