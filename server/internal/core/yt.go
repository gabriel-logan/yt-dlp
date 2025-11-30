package core

import (
	"bytes"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
)

type DownloadType int

const (
	Video DownloadType = iota
	Audio
)

type DownloadConfig struct {
	URL        string
	Type       DownloadType
	Format     string
	Quality    int
	FormatNote string // Ex: "720p60", "1080p60", 480p", etc.
}

type YTCore struct {
	BinaryPath string
}

func InitYTCore() (*YTCore, error) {
	cwd, err := os.Getwd()

	if err != nil {
		return nil, fmt.Errorf("failed to get current directory: %v", err)
	}

	binPath := filepath.Join(cwd, "..", "scripts", "yt-dlp")

	return &YTCore{
		BinaryPath: binPath,
	}, nil
}

func (yt *YTCore) DownloadBinary(cfg DownloadConfig) (io.Reader, error) {
	args := []string{"-o", "-"}

	switch cfg.Type {
	case Audio:
		args = append(args, "-f", "bestaudio")
		if cfg.Format != "" {
			args = append(args, "--extract-audio", "--audio-format", cfg.Format)
		}
	case Video:
		// USAR FORMAT_NOTE DIRETAMENTE
		format := "best" // fallback
		if cfg.FormatNote != "" {
			format = cfg.FormatNote
		}
		args = append(args, "-f", format)
	}

	args = append(args, cfg.URL)

	cmd := exec.Command(yt.BinaryPath, args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return nil, fmt.Errorf("failed to create stdout pipe: %v", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("failed to start yt-dlp: %v, details: %s", err, stderr.String())
	}

	return stdoutPipe, nil
}

func (yt *YTCore) GetVideoInfo(url string) (string, error) {
	args := []string{"--dump-json", url}

	cmd := exec.Command(yt.BinaryPath, args...)
	var out, stderr bytes.Buffer
	cmd.Stdout = &out
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return "", fmt.Errorf("error getting video info: %v, details: %s", err, stderr.String())
	}

	return strings.TrimSpace(out.String()), nil
}
