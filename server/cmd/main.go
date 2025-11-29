package main

import (
	"log"
	"net/http"
	"time"

	"github.com/gabriel-logan/yt-dlp/server/internal/api"
	"github.com/gabriel-logan/yt-dlp/server/internal/middleware"
	"github.com/gabriel-logan/yt-dlp/server/internal/web"
)

func main() {
	mux := http.NewServeMux()

	serverHttp := "http"
	serverHost := "localhost"
	serverPort := "8080"
	webDistPath := "../client/dist"
	requestsTimeout := 30 * time.Second

	// API Routes
	if err := api.RegisterAPIRoutes(mux); err != nil {
		panic(err)
	}

	// SPA Handler
	if err := web.RegisterSPA(mux, webDistPath); err != nil {
		panic(err)
	}

	stack := middleware.CreateChain(
		middleware.Recover,
		middleware.Logger,
		middleware.Timeout(requestsTimeout), // Timeout of 30 seconds for each request
	)

	server := http.Server{
		Addr:    serverHost + ":" + serverPort,
		Handler: stack(mux),
	}

	log.Printf("Starting server on %s://%s:%s", serverHttp, serverHost, serverPort)
	log.Fatal(server.ListenAndServe())
}
