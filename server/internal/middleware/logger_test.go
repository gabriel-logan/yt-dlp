package middleware_test

import (
	"bytes"
	"log"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/middleware"
)

func TestLoggerLogsStatusAndPath(t *testing.T) {
	var buf bytes.Buffer
	prev := log.Writer()
	log.SetOutput(&buf)
	defer log.SetOutput(prev)

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusTeapot) // 418
	})

	req := httptest.NewRequest(http.MethodGet, "/test/path", nil)
	rr := httptest.NewRecorder()

	middleware.Logger(handler).ServeHTTP(rr, req)

	logged := buf.String()

	if !strings.Contains(logged, "418") {
		t.Fatalf("expected log to contain status 418, got: %q", logged)
	}

	if !strings.Contains(logged, "GET") {
		t.Fatalf("expected log to contain method GET, got: %q", logged)
	}

	if !strings.Contains(logged, "/test/path") {
		t.Fatalf("expected log to contain path /test/path, got: %q", logged)
	}

	if !strings.Contains(logged, "(") || !strings.Contains(logged, ")") {
		t.Fatalf("expected log to contain duration in parentheses, got: %q", logged)
	}
}

func TestLoggerDefaultsTo200WhenNoWriteHeader(t *testing.T) {
	var buf bytes.Buffer
	prev := log.Writer()
	log.SetOutput(&buf)
	defer log.SetOutput(prev)

	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		_, _ = w.Write([]byte("ok")) // no explicit WriteHeader -> should be 200
	})

	req := httptest.NewRequest(http.MethodPost, "/no/header", nil)
	rr := httptest.NewRecorder()

	middleware.Logger(handler).ServeHTTP(rr, req)

	logged := buf.String()

	if !strings.Contains(logged, "200") {
		t.Fatalf("expected log to contain status 200 when no WriteHeader is called, got: %q", logged)
	}

	if !strings.Contains(logged, "POST") {
		t.Fatalf("expected log to contain method POST, got: %q", logged)
	}

	if !strings.Contains(logged, "/no/header") {
		t.Fatalf("expected log to contain path /no/header, got: %q", logged)
	}
}

func TestLoggerStatusAfterMultipleWriteHeaderCalls(t *testing.T) {
	var buf bytes.Buffer
	prev := log.Writer()
	log.SetOutput(&buf)
	defer log.SetOutput(prev)

	// Even if WriteHeader is called multiple times, net/http will use the first.
	// Our wrapper records the last call, but since the real ResponseWriter ignores subsequent calls,
	// we verify our logger records the final set status code as per wrapper's behavior.
	handler := http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusBadRequest)          // 400
		w.WriteHeader(http.StatusInternalServerError) // 500 (ignored by net/http, but wrapper will record)
	})

	req := httptest.NewRequest(http.MethodGet, "/multi/header", nil)
	rr := httptest.NewRecorder()

	middleware.Logger(handler).ServeHTTP(rr, req)

	logged := buf.String()

	if !strings.Contains(logged, "500") {
		t.Fatalf("expected log to reflect last written status 500 due to wrapper behavior, got: %q", logged)
	}

	if !strings.Contains(logged, "/multi/header") {
		t.Fatalf("expected log to contain path /multi/header, got: %q", logged)
	}
}
