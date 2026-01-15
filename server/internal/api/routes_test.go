package api_test

import (
	"net/http"
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/api"
)

func TestRegisterAPIRoutes_NoError(t *testing.T) {
	mux := http.NewServeMux()
	api.RegisterAPIRoutes(mux)
}

func TestRegisterAPIRoutes_RoutesRegistered(t *testing.T) {
	mux := http.NewServeMux()
	api.RegisterAPIRoutes(mux)

	tests := []struct {
		method  string
		path    string
		pattern string
	}{
		{"GET", "/api/hello", "GET /api/hello"},
		{"GET", "/api/video/info", "GET /api/video/info"},
		{"POST", "/api/video/download", "POST /api/video/download"},
	}

	for _, tt := range tests {
		req, err := http.NewRequest(tt.method, tt.path, nil)
		if err != nil {
			t.Fatalf("failed to create request for %s %s: %v", tt.method, tt.path, err)
		}
		h, p := mux.Handler(req)
		if h == nil {
			t.Errorf("no handler found for %s %s", tt.method, tt.path)
			continue
		}
		if p != tt.pattern {
			t.Errorf("unexpected pattern for %s %s: got %q, want %q", tt.method, tt.path, p, tt.pattern)
		}
	}
}
