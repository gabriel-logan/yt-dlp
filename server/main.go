package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
)

func main() {
	distPath, err := filepath.Abs("../client/dist")

	if err != nil {
		log.Fatal(err)
	}

	serverPort := "8080"

	http.HandleFunc("/api/hello", func(w http.ResponseWriter, r *http.Request) {
		w.Header().Set("Content-Type", "application/json")
		w.Write([]byte(`{"message":"Hello from Go API!"}`))
	})

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {

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

	log.Println("Server running at http://localhost:" + serverPort)
	log.Fatal(http.ListenAndServe(":"+serverPort, nil))
}
