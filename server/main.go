package main

import (
	"log"
	"net/http"
	"path/filepath"
)

func main() {
	distPath, err := filepath.Abs("../client/dist")

	if err != nil {
		log.Fatal(err)
	}

	fs := http.FileServer(http.Dir(distPath))

	serverPort := "8080"

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Try to serve static files first
		path := filepath.Join(distPath, r.URL.Path)
		if _, err := filepath.Glob(path); err == nil {
			fs.ServeHTTP(w, r)
			return
		}

		// fallback to index.html for SPA routing
		http.ServeFile(w, r, filepath.Join(distPath, "index.html"))
	})

	log.Println("Server running at http://localhost:8080")
	log.Fatal(http.ListenAndServe(":"+serverPort, nil))
}
