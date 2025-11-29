package api

import "net/http"

func RegisterAPIRoutes(mux *http.ServeMux) error {
	mux.HandleFunc("GET /api/hello", HelloHandler)

	return nil
}
