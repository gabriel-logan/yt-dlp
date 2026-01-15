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

func TestRegisterSPA_ServesStaticFile(t *testing.T) {
	dist := t.TempDir()
	indexContent := []byte("<html>index</html>")
	aboutContent := []byte("<html>about</html>")
	if err := os.WriteFile(filepath.Join(dist, "index.html"), indexContent, 0o644); err != nil {
		t.Fatal(err)
	}
	if err := os.WriteFile(filepath.Join(dist, "about.html"), aboutContent, 0o644); err != nil {
		t.Fatal(err)
	}

	mux := http.NewServeMux()
	web.RegisterSPA(mux, dist)

	req := httptest.NewRequest(http.MethodGet, "/about.html", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if !bytes.Equal(rr.Body.Bytes(), aboutContent) {
		t.Fatalf("expected body %q, got %q", string(aboutContent), rr.Body.String())
	}
}

func TestRegisterSPA_FallbackToIndex(t *testing.T) {
	dist := t.TempDir()
	indexContent := []byte("<html>index</html>")
	if err := os.WriteFile(filepath.Join(dist, "index.html"), indexContent, 0o644); err != nil {
		t.Fatal(err)
	}

	mux := http.NewServeMux()
	web.RegisterSPA(mux, dist)

	req := httptest.NewRequest(http.MethodGet, "/missing.js", nil)
	rr := httptest.NewRecorder()
	mux.ServeHTTP(rr, req)

	if rr.Code != http.StatusOK {
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if !bytes.Equal(rr.Body.Bytes(), indexContent) {
		t.Fatalf("expected index.html body %q, got %q", string(indexContent), rr.Body.String())
	}
}

func TestRegisterSPA_BlocksAPIPaths(t *testing.T) {
	dist := t.TempDir()
	if err := os.WriteFile(filepath.Join(dist, "index.html"), []byte("<html>index</html>"), 0o644); err != nil {
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

func TestRegisterSPA_DirectoryRequestFallsBackToIndex(t *testing.T) {
	dist := t.TempDir()
	indexContent := []byte("<html>index</html>")
	if err := os.WriteFile(filepath.Join(dist, "index.html"), indexContent, 0o644); err != nil {
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
		t.Fatalf("expected 200, got %d", rr.Code)
	}
	if !bytes.Equal(rr.Body.Bytes(), indexContent) {
		t.Fatalf("expected index.html body %q, got %q", string(indexContent), rr.Body.String())
	}
}
