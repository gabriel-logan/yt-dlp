package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/gabriel-logan/yt-dlp/server/internal/core"
)

var (
	ytCore      *core.YTCore
	initErr     error
	downloadSem = make(chan struct{}, 4) // limite de 4 downloads simultâneos
	once        sync.Once
)

func getYTCore() (*core.YTCore, error) {
	once.Do(func() {
		ytCore, initErr = core.InitYTCore()
	})

	return ytCore, initErr
}

func VideoInfoHandler(w http.ResponseWriter, r *http.Request) {
	url := r.URL.Query().Get("url")

	if strings.TrimSpace(url) == "" || len(strings.TrimSpace(url)) > 2000 {
		http.Error(w, "url parameter is required and must be a valid URL with a maximum length of 2000 characters", http.StatusBadRequest)
		return
	}

	yt, err := getYTCore()
	if err != nil {
		http.Error(w, "Some error occurred while initializing yt-dlp core", http.StatusInternalServerError)
		return
	}

	info, err := yt.GetVideoInfo(url)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write([]byte(info))
}

func VideoDownloadHandler(w http.ResponseWriter, r *http.Request) {
	select {
	case downloadSem <- struct{}{}:
	case <-r.Context().Done():
		http.Error(w, "request was cancelled before acquiring semaphore", http.StatusRequestTimeout)
		return
	}
	defer func() { <-downloadSem }()

	var req struct {
		URL        string `json:"url"`
		Type       string `json:"type"`
		Quality    int    `json:"quality"`
		FormatNote string `json:"format_note"`
	}

	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, "invalid request body", http.StatusBadRequest)
		return
	}

	// Validations
	if strings.TrimSpace(req.URL) == "" || len(strings.TrimSpace(req.URL)) > 2000 {
		http.Error(w, "url parameter is required and must be a valid URL with a maximum length of 2000 characters", http.StatusBadRequest)
		return
	}

	if req.Type != "video" && req.Type != "audio" {
		http.Error(w, "type parameter must be either 'video' or 'audio'", http.StatusBadRequest)
		return
	}

	if req.Quality > 1000 {
		http.Error(w, "quality parameter must be less than or equal to 1000", http.StatusBadRequest)
		return
	}

	if len(strings.TrimSpace(req.FormatNote)) > 100 {
		http.Error(w, "format_note parameter must be less than or equal to 100 characters", http.StatusBadRequest)
		return
	}

	dType := core.Video
	if req.Type == "audio" {
		dType = core.Audio
	}

	yt, err := getYTCore()
	if err != nil {
		http.Error(w, "init error", http.StatusInternalServerError)
		return
	}

	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Minute)
	defer cancel()

	reader, cmd, err := yt.DownloadBinaryCtx(ctx, core.DownloadConfig{
		URL:        req.URL,
		Type:       dType,
		Quality:    req.Quality,
		FormatNote: req.FormatNote,
	})
	if err != nil {
		http.Error(w, "yt-dlp download failed", http.StatusInternalServerError)
		return
	}

	if err := sendDownloadResponse(w, reader, cmd, dType); err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}
}

func sendDownloadResponse(w http.ResponseWriter, reader io.ReadCloser, cmd *exec.Cmd, dType core.DownloadType) error {
	if dType == core.Audio {
		w.Header().Set("Content-Type", "audio/mpeg")
	} else {
		w.Header().Set("Content-Type", "application/octet-stream")
	}

	_, copyErr := io.Copy(w, reader)

	reader.Close()

	if copyErr != nil {
		msg := copyErr.Error()

		if strings.Contains(msg, "broken pipe") ||
			strings.Contains(msg, "reset by peer") ||
			strings.Contains(msg, "context canceled") {
			cmd.Process.Kill()
			cmd.Wait()
			return nil
		}

		cmd.Process.Kill()
		cmd.Wait()
		return fmt.Errorf("copy error: %v", copyErr)
	}

	waitErr := cmd.Wait()
	if waitErr != nil {
		return fmt.Errorf("yt-dlp error: %v", waitErr)
	}

	return nil
}
