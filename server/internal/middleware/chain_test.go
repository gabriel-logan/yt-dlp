package middleware_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/middleware"
)

func TestCreateChainOrder(t *testing.T) {
	var order []string

	m1 := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			order = append(order, "m1")
			next.ServeHTTP(w, r)
		})
	}
	m2 := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			order = append(order, "m2")
			next.ServeHTTP(w, r)
		})
	}
	m3 := func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			order = append(order, "m3")
			next.ServeHTTP(w, r)
		})
	}

	final := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		order = append(order, "handler")
	})

	chain := middleware.CreateChain(m1, m2, m3)
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	chain(final).ServeHTTP(rr, req)

	want := []string{"m1", "m2", "m3", "handler"}

	if len(order) != len(want) {
		t.Fatalf("unexpected order length: got %d want %d", len(order), len(want))
	}

	for i := range want {
		if order[i] != want[i] {
			t.Fatalf("order mismatch at %d: got %q want %q", i, order[i], want[i])
		}
	}
}

func TestCreateChainNoMiddleware(t *testing.T) {
	var called bool

	final := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
	})

	chain := middleware.CreateChain()
	rr := httptest.NewRecorder()
	req := httptest.NewRequest(http.MethodGet, "/", nil)
	chain(final).ServeHTTP(rr, req)

	if !called {
		t.Fatal("final handler was not called")
	}
}
