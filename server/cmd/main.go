package main

import (
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gabriel-logan/yt-dlp/server/internal/api"
	"github.com/gabriel-logan/yt-dlp/server/internal/core"
	"github.com/gabriel-logan/yt-dlp/server/internal/middleware"
	"github.com/gabriel-logan/yt-dlp/server/internal/web"
	"github.com/joho/godotenv"
)

const requestsTimeout = 5 * time.Minute

func main() {
	envPath := filepath.Join(core.Getwd(), "..", ".env")
	if err := godotenv.Load(envPath); err != nil {
		log.Fatal("Error loading .env file")
	}

	mux := http.NewServeMux()

	webDistPath := filepath.Join(core.Getwd(), "..", "client", "dist")

	// SPA Handler
	web.RegisterSPA(mux, webDistPath)

	// API Routes
	api.RegisterAPIRoutes(mux)

	// Global Middleware Stack
	stack := middleware.CreateChain(
		middleware.Recover,
		middleware.Logger,
		middleware.CORS,
		middleware.RateLimit,
		middleware.Auth,
		middleware.Timeout(requestsTimeout),
	)

	serverPort := os.Getenv("SERVER_PORT")

	server := http.Server{
		Addr:    ":" + serverPort,
		Handler: stack(mux),
	}

	log.Printf("Starting server on http://localhost:%s", serverPort)
	log.Fatal(server.ListenAndServe())
}
