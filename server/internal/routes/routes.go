package routes

import (
	"net/http"

	"github.com/gabriel-logan/yt-dlp/server/internal/controllers"
)

func RegisterAPIRoutes() error {
	http.HandleFunc("GET /api/hello", controllers.HelloHandler)

	return nil
}
