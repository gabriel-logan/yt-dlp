package middleware_test

import (
	"bytes"
	"io"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/middleware"
)

func TestRecover_PanicReturns500AndLogs(t *testing.T) {
	var buf bytes.Buffer
	orig := log.Default().Writer()
	log.SetOutput(&buf)
	defer log.SetOutput(orig)

	panicHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		panic("boom")
	})

	ts := httptest.NewServer(middleware.Recover(panicHandler))
	defer ts.Close()

	resp, err := http.Get(ts.URL)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusInternalServerError {
		t.Fatalf("expected status 500, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	if string(body) != "Internal Server Error\n" {
		t.Fatalf("unexpected body: %q", string(body))
	}

	if !strings.Contains(buf.String(), "Recovered from panic: boom") {
		t.Fatalf("expected log to contain panic message, got: %q", buf.String())
	}
}

func TestRecover_NoPanicPassThrough(t *testing.T) {
	called := false
	okHandler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		called = true
		w.WriteHeader(http.StatusTeapot)
		_, _ = w.Write([]byte("ok"))
	})

	ts := httptest.NewServer(middleware.Recover(okHandler))
	defer ts.Close()

	resp, err := http.Get(ts.URL)
	if err != nil {
		t.Fatalf("request failed: %v", err)
	}
	defer resp.Body.Close()

	if !called {
		t.Fatalf("expected downstream handler to be called")
	}

	if resp.StatusCode != http.StatusTeapot {
		t.Fatalf("expected status 418, got %d", resp.StatusCode)
	}

	body, _ := io.ReadAll(resp.Body)
	if string(body) != "ok" {
		t.Fatalf("unexpected body: %q", string(body))
	}
}
