package api

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os/exec"
	"strings"
	"sync"
	"time"

	"github.com/gabriel-logan/yt-dlp/server/internal/core"
)

var (
	ytCore      *core.YTCore
	initErr     error
	downloadSem = make(chan struct{}, core.GetNumCPU())
	once        sync.Once
	copyBufPool = sync.Pool{
		New: func() any {
			b := make([]byte, 256*1024) // 256KB
			return &b
		},
	}
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

	url = stripYouTubeListParam(url)

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

	req.URL = stripYouTubeListParam(req.URL)

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
	defer reader.Close()

	flusher, canFlush := w.(http.Flusher)

	type flushEveryNWriter struct {
		w       http.ResponseWriter
		f       http.Flusher
		every   int
		pending int
	}

	write := func(p []byte) (int, error) {
		n, err := w.Write(p)
		return n, err
	}

	var dst io.Writer = writerFunc(write)
	if canFlush {
		fw := &flushEveryNWriter{w: w, f: flusher, every: 5 * 1024 * 1024} // flush every 5MB
		dst = writerFunc(func(p []byte) (int, error) {
			n, err := fw.w.Write(p)
			if n > 0 {
				fw.pending += n
				if fw.pending >= fw.every {
					fw.f.Flush()
					fw.pending = 0
				}
			}
			return n, err
		})
	}

	fileName := "download.bin"
	if dType == core.Audio {
		w.Header().Set("Content-Type", "application/octet-stream")
		fileName = "audio.bin"
	} else {
		w.Header().Set("Content-Type", "video/x-matroska")
		fileName = "video.mkv"
	}

	w.Header().Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", fileName))
	w.Header().Set("X-Content-Type-Options", "nosniff")
	w.Header().Set("Cache-Control", "no-store")
	w.Header().Set("X-Accel-Buffering", "no")

	w.WriteHeader(http.StatusOK)
	if canFlush {
		flusher.Flush()
	}

	bp := copyBufPool.Get().(*[]byte)
	buf := *bp
	defer copyBufPool.Put(bp)

	_, copyErr := io.CopyBuffer(dst, reader, buf)
	if copyErr != nil {
		msg := copyErr.Error()
		if strings.Contains(msg, "broken pipe") ||
			strings.Contains(msg, "reset by peer") ||
			strings.Contains(msg, "context canceled") {
			_ = cmd.Process.Kill()
			_ = cmd.Wait()
			return nil
		}
		_ = cmd.Process.Kill()
		_ = cmd.Wait()
		return fmt.Errorf("stream copy error: %v", copyErr)
	}

	if canFlush {
		flusher.Flush()
	}

	if waitErr := cmd.Wait(); waitErr != nil {
		return fmt.Errorf("yt-dlp error: %v", waitErr)
	}

	return nil
}

type writerFunc func([]byte) (int, error)

func (wf writerFunc) Write(p []byte) (int, error) { return wf(p) }

func stripYouTubeListParam(raw string) string {
	u, err := url.Parse(raw)
	if err != nil {
		return raw
	}

	host := strings.ToLower(u.Hostname())
	isYouTube := host == "youtube.com" ||
		host == "www.youtube.com" ||
		host == "m.youtube.com" ||
		host == "music.youtube.com" ||
		host == "youtu.be"

	if !isYouTube {
		return raw
	}

	q := u.Query()
	if _, ok := q["list"]; !ok {
		return raw
	}
	q.Del("list")
	u.RawQuery = q.Encode()
	return u.String()
}
