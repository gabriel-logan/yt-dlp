package api

import "net/http"

func RegisterAPIRoutes(mux *http.ServeMux) error {
	mux.HandleFunc("GET /api/hello", HelloHandler)

	mux.HandleFunc("/api/video/info", VideoInfoHandler)
	mux.HandleFunc("/api/video/download", DownloadHandler)

	return nil
}
