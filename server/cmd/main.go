package main

import (
	"log"
	"net/http"

	"github.com/gabriel-logan/yt-dlp/server/internal/api"
	"github.com/gabriel-logan/yt-dlp/server/internal/web"
)

func main() {
	mux := http.NewServeMux()

	serverHttp := "http"
	serverHost := "localhost"
	serverPort := "8080"
	webDistPath := "../client/dist"

	// API Routes
	if err := api.RegisterAPIRoutes(mux); err != nil {
		panic(err)
	}

	// SPA Handler
	if err := web.RegisterSPA(mux, webDistPath); err != nil {
		panic(err)
	}

	log.Printf("Starting server on %s://%s:%s", serverHttp, serverHost, serverPort)
	log.Fatal(http.ListenAndServe(serverHost+":"+serverPort, mux))
}
