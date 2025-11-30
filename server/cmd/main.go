package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"path/filepath"
	"time"

	"github.com/gabriel-logan/yt-dlp/server/internal/api"
	"github.com/gabriel-logan/yt-dlp/server/internal/middleware"
	"github.com/gabriel-logan/yt-dlp/server/internal/web"
	"github.com/joho/godotenv"
)

func main() {
	const serverHttp = "http"
	const serverHost = "localhost"
	const requestsTimeout = 2 * time.Minute

	if err := godotenv.Load(); err != nil {
		log.Fatal("Error loading .env file")
	}

	serverPort := os.Getenv("SERVER_PORT")

	cwd, err := os.Getwd()
	if err != nil {
		panic(fmt.Sprintf("failed to get current directory: %v", err))
	}

	webDistPath := filepath.Join(cwd, "..", "client", "dist")

	mux := http.NewServeMux()

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
		middleware.AuthMiddleware,
		middleware.Timeout(requestsTimeout), // Timeout of 30 seconds for each request
	)

	server := http.Server{
		Addr:    serverHost + ":" + serverPort,
		Handler: stack(mux),
	}

	log.Printf("Starting server on %s://%s:%s", serverHttp, serverHost, serverPort)
	log.Fatal(server.ListenAndServe())
}
