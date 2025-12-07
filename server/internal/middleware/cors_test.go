package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/middleware"
)

func TestCORS_DevelopmentHeadersAndNextCalled(t *testing.T) {
	os.Setenv("GO_ENV", "development")
	os.Setenv("CLIENT_URL", "http://example.com")
	defer os.Unsetenv("GO_ENV")
	defer os.Unsetenv("CLIENT_URL")

	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.CORS(next)

	req := httptest.NewRequest(http.MethodGet, "http://localhost/test", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if !called {
		t.Fatalf("expected next handler to be called")
	}

	if got := rr.Header().Get("Access-Control-Allow-Origin"); got != "http://example.com" {
		t.Fatalf("expected Access-Control-Allow-Origin to be set to client URL, got %q", got)
	}

	if got := rr.Header().Get("Access-Control-Allow-Methods"); got != "GET, POST, PUT, DELETE, OPTIONS" {
		t.Fatalf("expected Access-Control-Allow-Methods header, got %q", got)
	}

	if got := rr.Header().Get("Access-Control-Allow-Headers"); got != "Content-Type, Authorization, X-API-KEY" {
		t.Fatalf("expected Access-Control-Allow-Headers header, got %q", got)
	}

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200 from next handler, got %d", rr.Code)
	}
}

func TestCORS_DevelopmentOptionsPreflight(t *testing.T) {
	os.Setenv("GO_ENV", "development")
	os.Setenv("CLIENT_URL", "http://example.com")
	defer os.Unsetenv("GO_ENV")
	defer os.Unsetenv("CLIENT_URL")

	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	})

	handler := middleware.CORS(next)

	req := httptest.NewRequest(http.MethodOptions, "http://localhost/test", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if called {
		t.Fatalf("expected next handler not to be called for OPTIONS preflight")
	}

	if rr.Code != http.StatusNoContent {
		t.Fatalf("expected status 204 for OPTIONS preflight, got %d", rr.Code)
	}

	if got := rr.Header().Get("Access-Control-Allow-Origin"); got != "http://example.com" {
		t.Fatalf("expected Access-Control-Allow-Origin to be set to client URL, got %q", got)
	}
}

func TestCORS_NonDevelopmentNoHeadersAndNextCalled(t *testing.T) {
	os.Setenv("GO_ENV", "production")
	os.Setenv("CLIENT_URL", "http://example.com")
	defer os.Unsetenv("GO_ENV")
	defer os.Unsetenv("CLIENT_URL")

	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusTeapot)
	})

	handler := middleware.CORS(next)

	req := httptest.NewRequest(http.MethodGet, "http://localhost/test", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if !called {
		t.Fatalf("expected next handler to be called")
	}

	if rr.Header().Get("Access-Control-Allow-Origin") != "" {
		t.Fatalf("expected no Access-Control-Allow-Origin header in non-development")
	}

	if rr.Header().Get("Access-Control-Allow-Methods") != "" {
		t.Fatalf("expected no Access-Control-Allow-Methods header in non-development")
	}

	if rr.Header().Get("Access-Control-Allow-Headers") != "" {
		t.Fatalf("expected no Access-Control-Allow-Headers header in non-development")
	}

	if rr.Code != http.StatusTeapot {
		t.Fatalf("expected status from next handler (418), got %d", rr.Code)
	}
}
