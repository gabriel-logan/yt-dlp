package web_test

import (
	"bytes"
	"net/http"
	"net/http/httptest"
	"os"
	"path/filepath"
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/web"
)

const indexHtmlFileName = "index.html"
const aboutHtmlFileName = "about.html"
const indexHtmlContent = `<html><head><title>Test SPA</title></head><body><h1>Welcome to the SPA</h1></body></html>`
const aboutHtmlContent = `<html><head><title>About</title></head><body><h1>About Page</h1></body></html>`
const expected200Got = "expected 200, got %d"

func TestRegisterSPAServesStaticFile(t *testing.T) {
	dist := t.TempDir()
	indexContent := []byte(indexHtmlContent)
	aboutContent := []byte(aboutHtmlContent)
	if err := os.WriteFile(filepath.Join(dist, indexHtmlFileName), indexContent, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dist, aboutHtmlFileName), aboutContent, 0o644); err != nil {
		t.Fatal(err)
	}

	mux := http.NewServeMux()
	web.RegisterSPA(mux, dist)

	req := httptest.NewRequest(http.MethodGet, "/"+aboutHtmlFileName, nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf(expected200Got, rr.Code)
	}
	if !bytes.Equal(rr.Body.Bytes(), aboutContent) {
		t.Fatalf("expected body %q, got %q", string(aboutContent), rr.Body.String())
	}
}

func TestRegisterSPAFallbackToIndex(t *testing.T) {
	dist := t.TempDir()
	indexContent := []byte(indexHtmlContent)
	if err := os.WriteFile(filepath.Join(dist, indexHtmlFileName), indexContent, 0o644); err != nil {
		t.Fatal(err)
	}

	mux := http.NewServeMux()
	web.RegisterSPA(mux, dist)

	req := httptest.NewRequest(http.MethodGet, "/missing.js", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf(expected200Got, rr.Code)
	}
	if !bytes.Equal(rr.Body.Bytes(), indexContent) {
		t.Fatalf("expected index.html body %q, got %q", string(indexContent), rr.Body.String())
	}
}

func TestRegisterSPABlocksAPIPaths(t *testing.T) {
	dist := t.TempDir()
	if err := os.WriteFile(filepath.Join(dist, indexHtmlFileName), []byte(indexHtmlContent), 0o644); err != nil {
		t.Fatal(err)
	}

	mux := http.NewServeMux()
	web.RegisterSPA(mux, dist)

	req := httptest.NewRequest(http.MethodGet, "/api/users", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusNotFound {
		t.Fatalf("expected 404 for /api prefix, got %d", rr.Code)
	}
}

func TestRegisterSPADirectoryRequestFallsBackToIndex(t *testing.T) {
	dist := t.TempDir()
	indexContent := []byte(indexHtmlContent)
	if err := os.WriteFile(filepath.Join(dist, indexHtmlFileName), indexContent, 0o644); err != nil {
		t.Fatal(err)
	}
	assetsDir := filepath.Join(dist, "assets")
	if err := os.MkdirAll(assetsDir, 0o755); err != nil {
		t.Fatal(err)
	}

	mux := http.NewServeMux()
	web.RegisterSPA(mux, dist)

	req := httptest.NewRequest(http.MethodGet, "/assets", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf(expected200Got, rr.Code)
	}
	if !bytes.Equal(rr.Body.Bytes(), indexContent) {
		t.Fatalf("expected index.html body %q, got %q", string(indexContent), rr.Body.String())
	}
}
