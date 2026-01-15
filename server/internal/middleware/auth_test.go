package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"os"
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/middleware"
)

func TestAuthAllowsHelloWithoutApiKey(t *testing.T) {
	_ = os.Setenv("VITE_X_API_KEY", "secret")

	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Auth(next)

	req := httptest.NewRequest(http.MethodGet, "/api/hello", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200 for /api/hello, got %d", rr.Code)
	}

	if !called {
		t.Fatalf("expected next handler to be called for /api/hello")
	}
}

func TestAuthRejectsApiWithoutCorrectKey(t *testing.T) {
	_ = os.Setenv("VITE_X_API_KEY", "secret")

	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Auth(next)

	req := httptest.NewRequest(http.MethodGet, "/api/other", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusUnauthorized {
		t.Fatalf("expected status 401 when missing/incorrect api key, got %d", rr.Code)
	}

	if called {
		t.Fatalf("expected next handler NOT to be called when unauthorized")
	}
}

func TestAuthAllowsApiWithCorrectKey(t *testing.T) {
	_ = os.Setenv("VITE_X_API_KEY", "secret")

	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Auth(next)

	req := httptest.NewRequest(http.MethodGet, "/api/other", nil)
	req.Header.Set("X-API-KEY", "secret")
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200 when correct api key provided, got %d", rr.Code)
	}

	if !called {
		t.Fatalf("expected next handler to be called when authorized")
	}
}

func TestAuthNonApiPathPassThrough(t *testing.T) {
	_ = os.Setenv("VITE_X_API_KEY", "secret")

	called := false
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.Auth(next)

	req := httptest.NewRequest(http.MethodGet, "/home", nil)
	rr := httptest.NewRecorder()

	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200 for non-/api path, got %d", rr.Code)
	}

	if !called {
		t.Fatalf("expected next handler to be called for non-/api path")
	}
}
