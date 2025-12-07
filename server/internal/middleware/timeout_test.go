package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gabriel-logan/yt-dlp/server/internal/middleware"
)

func TestTimeoutTriggersAfterDuration(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		time.Sleep(50 * time.Millisecond)
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	mw := middleware.Timeout(10 * time.Millisecond)
	wrapped := mw(handler)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()
	wrapped.ServeHTTP(rr, req)

	if rr.Code != http.StatusServiceUnavailable {
		t.Fatalf("expected status 503, got %d", rr.Code)
	}

	if body := rr.Body.String(); body != "Request timed out" {
		t.Fatalf("expected body 'Request timed out', got %q", body)
	}
}

func TestTimeoutPassesThroughBeforeDeadline(t *testing.T) {
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		w.Write([]byte("ok"))
	})

	mw := middleware.Timeout(100 * time.Millisecond)
	wrapped := mw(handler)

	req := httptest.NewRequest(http.MethodGet, "/", nil)
	rr := httptest.NewRecorder()
	wrapped.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected status 200, got %d", rr.Code)
	}

	if body := rr.Body.String(); body != "ok" {
		t.Fatalf("expected body 'ok', got %q", body)
	}
}
