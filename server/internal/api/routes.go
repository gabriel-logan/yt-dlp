package api

import "net/http"

func RegisterAPIRoutes(mux *http.ServeMux) error {
	mux.HandleFunc("GET /api/hello", HelloHandler)

	mux.HandleFunc("GET /api/video/info", VideoInfoHandler)
	mux.HandleFunc("POST /api/video/download", VideoDownloadHandler)

	return nil
}
