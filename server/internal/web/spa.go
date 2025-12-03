package web

import (
	"net/http"
	"os"
	"path/filepath"
	"strings"
)

func RegisterSPA(mux *http.ServeMux, distPath string) error {
	distAbs, err := filepath.Abs(distPath)
	if err != nil {
		return err
	}

	mux.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// block API routes from SPA handler
		if strings.HasPrefix(r.URL.Path, "/api") {
			http.NotFound(w, r)
			return
		}

		reqPath := filepath.Clean(r.URL.Path)

		absPath := filepath.Join(distAbs, reqPath)

		// ensure the requested path is within the dist directory
		if !strings.HasPrefix(absPath, distAbs) {
			http.Error(w, "invalid path", http.StatusBadRequest)
			return
		}

		// check if file exists and is not a directory
		if info, err := os.Stat(absPath); err == nil && !info.IsDir() {
			http.ServeFile(w, r, absPath)
			return
		}

		// fallback to index.html
		http.ServeFile(w, r, filepath.Join(distAbs, "index.html"))
	})

	return nil
}
