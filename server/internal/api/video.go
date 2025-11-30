package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/gabriel-logan/yt-dlp/server/internal/core"
)

func VideoInfoHandler(w http.ResponseWriter, r *http.Request) {
	url := r.URL.Query().Get("url")

	if strings.TrimSpace(url) == "" {
		http.Error(w, "url parameter is required", http.StatusBadRequest)
		return
	}

	yt, err := core.InitYTCore()
	if err != nil {
		http.Error(w, fmt.Sprintf("error initializing YTCore: %v", err), http.StatusInternalServerError)
		return
	}

	info, err := yt.GetVideoInfo(url)
	if err != nil {
		http.Error(w, fmt.Sprintf("error getting video info: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(info))
}

func DownloadHandler(w http.ResponseWriter, r *http.Request) {
	var req struct {
		URL     string `json:"url"`
		Type    string `json:"type"`    // "video" or "audio"
		Format  string `json:"format"`  // "mp4", "mp3", etc
		Quality string `json:"quality"` // "best", "720", etc
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	dType := core.Video
	if req.Type == "audio" {
		dType = core.Audio
	}

	yt, _ := core.InitYTCore()

	reader, err := yt.DownloadBinary(core.DownloadConfig{
		URL:     req.URL,
		Type:    dType,
		Format:  req.Format,
		Quality: req.Quality,
	})
	if err != nil {
		http.Error(w, fmt.Sprintf("download failed: %v", err), http.StatusInternalServerError)
		return
	}

	ext := "mp4"
	contentType := "video/mp4"
	if dType == core.Audio && req.Format != "" {
		ext = req.Format
		contentType = "audio/mpeg"
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=video.%s", ext))
	w.Header().Set("Content-Type", contentType)

	// Stream the content directly to the response writer
	io.Copy(w, reader)
}
