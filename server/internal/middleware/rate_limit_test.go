package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/middleware"
	"golang.org/x/time/rate"
)

func TestRateLimit_AllowsWithinLimit(t *testing.T) {
	middleware.RateLimits["GET"] = middleware.MethodLimit{
		Limiter: rate.NewLimiter(5, 5),
		BanTime: 1,
	}

	var hitCount int
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		hitCount++
		w.WriteHeader(http.StatusOK)
	})

	handler := middleware.RateLimit(next)
	rr1 := httptest.NewRecorder()
	req1 := httptest.NewRequest(http.MethodGet, "http://example.com/", nil)
	req1.RemoteAddr = "10.0.0.1:12345"
	handler.ServeHTTP(rr1, req1)

	rr2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, "http://example.com/", nil)
	req2.RemoteAddr = "10.0.0.1:12346"
	handler.ServeHTTP(rr2, req2)

	if rr1.Code != http.StatusOK {
		t.Fatalf("first request expected 200, got %d", rr1.Code)
	}

	if rr2.Code != http.StatusOK {
		t.Fatalf("second request expected 200, got %d", rr2.Code)
	}

	if hitCount != 2 {
		t.Fatalf("expected next handler to be called twice, got %d", hitCount)
	}
}

func TestRateLimit_OverLimitTriggersBan(t *testing.T) {
	middleware.RateLimits["GET"] = middleware.MethodLimit{
		Limiter: rate.NewLimiter(1, 1),
		BanTime: 2,
	}

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	handler := middleware.RateLimit(next)

	// Use a unique IP for isolation
	ip := "10.0.0.2:54321"

	// First request should pass
	rr1 := httptest.NewRecorder()
	req1 := httptest.NewRequest(http.MethodGet, "http://example.com/", nil)
	req1.RemoteAddr = ip
	handler.ServeHTTP(rr1, req1)
	if rr1.Code != http.StatusOK {
		t.Fatalf("first request expected 200, got %d", rr1.Code)
	}

	// Second immediate request should be rate limited -> 429 and client banned
	rr2 := httptest.NewRecorder()
	req2 := httptest.NewRequest(http.MethodGet, "http://example.com/", nil)
	req2.RemoteAddr = ip
	handler.ServeHTTP(rr2, req2)

	if rr2.Code != http.StatusTooManyRequests {
		t.Fatalf("second request expected 429, got %d", rr2.Code)
	}

	// Third request while banned should still be 429 (temp ban path)
	rr3 := httptest.NewRecorder()
	req3 := httptest.NewRequest(http.MethodGet, "http://example.com/", nil)
	req3.RemoteAddr = ip
	handler.ServeHTTP(rr3, req3)

	if rr3.Code != http.StatusTooManyRequests {
		t.Fatalf("third request during ban expected 429, got %d", rr3.Code)
	}
}

func TestRateLimit_MethodNotAllowed(t *testing.T) {
	// Ensure PUT is not configured
	delete(middleware.RateLimits, http.MethodPut)

	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	handler := middleware.RateLimit(next)

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodPut, "http://example.com/", nil)
	req.RemoteAddr = "10.0.0.3:10001"
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusMethodNotAllowed {
		t.Fatalf("expected 405 for unsupported method, got %d", rr.Code)
	}
}

func TestRateLimit_InvalidIP(t *testing.T) {
	next := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})
	handler := middleware.RateLimit(next)

	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "http://example.com/", nil)
	// Invalid RemoteAddr format should trigger 400
	req.RemoteAddr = "invalid"
	handler.ServeHTTP(rr, req)

	if rr.Code != http.StatusBadRequest {
		t.Fatalf("expected 400 for invalid IP, got %d", rr.Code)
	}
}
