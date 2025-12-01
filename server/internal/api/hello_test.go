package api_test

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/api"
)

func TestHelloHandler(t *testing.T) {
	req := httptest.NewRequest("GET", "/api/hello", nil)
	rr := httptest.NewRecorder()

	handler := http.HandlerFunc(api.HelloHandler)
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	if ctype := rr.Header().Get("Content-Type"); ctype != "application/json" {
		t.Fatalf("expected content-type application/json, got %s", ctype)
	}

	var data map[string]string
	if err := json.Unmarshal(rr.Body.Bytes(), &data); err != nil {
		t.Fatalf("invalid json response: %v", err)
	}

	if data["message"] != "Hello World!" {
		t.Fatalf("expected message 'Hello World!', got %s", data["message"])
	}
}
