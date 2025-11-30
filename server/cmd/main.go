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
	const serverHost = "localhost"
	const requestsTimeout = 5 * time.Minute

	cwd, err := os.Getwd()
	if err != nil {
		panic(fmt.Sprintf("failed to get current directory: %v", err))
	}

	envPath := filepath.Join(cwd, "..", ".env")

	if err := godotenv.Load(envPath); err != nil {
		log.Fatal("Error loading .env file")
	}

	mux := http.NewServeMux()

	// API Routes
	if err := api.RegisterAPIRoutes(mux); err != nil {
		panic(err)
	}

	webDistPath := filepath.Join(cwd, "..", "client", "dist")

	// SPA Handler
	if err := web.RegisterSPA(mux, webDistPath); err != nil {
		panic(err)
	}

	stack := middleware.CreateChain(
		middleware.Recover,
		middleware.Logger,
		middleware.CORSMiddleware,
		middleware.AuthMiddleware,
		middleware.Timeout(requestsTimeout),
	)

	serverPort := os.Getenv("SERVER_PORT")

	server := http.Server{
		Addr:    ":" + serverPort,
		Handler: stack(mux),
	}

	goEnv := os.Getenv("GO_ENV")

	if goEnv == "production" {
		sslCertPath := os.Getenv("SSL_CERT_PATH")
		sslKeyPath := os.Getenv("SSL_KEY_PATH")

		fmt.Printf("Using SSL_CERT_PATH: %s\n", sslCertPath)
		fmt.Printf("Using SSL_KEY_PATH: %s\n", sslKeyPath)

		log.Printf("Starting server on https://%s:%s", serverHost, serverPort)

		log.Fatal(server.ListenAndServeTLS(sslCertPath, sslKeyPath))
	} else {
		log.Printf("Starting server on http://%s:%s", serverHost, serverPort)

		log.Fatal(server.ListenAndServe())
	}
}
