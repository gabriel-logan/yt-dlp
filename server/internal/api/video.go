package api

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"
	"sync"

	"github.com/gabriel-logan/yt-dlp/server/internal/core"
)

var (
	ytCore      *core.YTCore
	initErr     error
	downloadSem = make(chan struct{}, 10) // limite de 10 downloads simultâneos
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

	if strings.TrimSpace(url) == "" {
		http.Error(w, "url parameter is required", http.StatusBadRequest)
		return
	}

	yt, err := getYTCore()
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

func VideoDownloadHandler(w http.ResponseWriter, r *http.Request) {
	downloadSem <- struct{}{}
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

	if req.Quality < 0 {
		http.Error(w, "quality parameter must be a non-negative integer", http.StatusBadRequest)
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

	reader, cmd, err := yt.DownloadBinaryCtx(r.Context(), core.DownloadConfig{
		URL:        req.URL,
		Type:       dType,
		Quality:    req.Quality,
		FormatNote: req.FormatNote,
	})
	if err != nil {
		http.Error(w, "yt-dlp failed", http.StatusInternalServerError)
		return
	}

	if stderrPipe, _ := cmd.StderrPipe(); stderrPipe != nil {
		go io.Copy(io.Discard, stderrPipe)
	}

	buf := make([]byte, 256*1024)

	go func() {
		<-r.Context().Done()
		cmd.Process.Kill()
		cmd.Wait()
	}()

	_, copyErr := io.CopyBuffer(w, reader, buf)

	cmd.Wait()

	if copyErr != nil {
		return
	}

	if f, ok := w.(http.Flusher); ok {
		f.Flush()
	}
}
