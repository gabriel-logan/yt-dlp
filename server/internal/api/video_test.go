package api_test

import (
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/api"
)

func TestVideoInfoHandler_BadURL(t *testing.T) {
	req := httptest.NewRequest("GET", "/info?url=", nil)
	w := httptest.NewRecorder()

	api.VideoInfoHandler(w, req)

	if w.Code != 400 {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}

func TestVideoInfoHandler_BigBadURL(t *testing.T) {
	longURL := "http://example.com/" + strings.Repeat("a", 2001)
	req := httptest.NewRequest("GET", "/info?url="+longURL, nil)
	w := httptest.NewRecorder()

	api.VideoInfoHandler(w, req)

	if w.Code != 400 {
		t.Fatalf("expected 400, got %d", w.Code)
	}
}
