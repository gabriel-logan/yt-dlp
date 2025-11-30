package core

import (
	"bytes"
	"fmt"
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
	URL       string
	Type      DownloadType
	Format    string
	Quality   string
	OutputDir string
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

func (yt *YTCore) Download(cfg DownloadConfig) error {
	args := []string{}

	args = append(args, "-o", fmt.Sprintf("%s/%%(title)s.%%(ext)s", cfg.OutputDir))

	switch cfg.Type {
	case Audio:
		args = append(args, "-f", "bestaudio")

		if cfg.Format != "" {
			args = append(args, "--extract-audio", "--audio-format", cfg.Format)
		}

	case Video:
		format := "bestvideo+bestaudio"

		if cfg.Quality != "" {
			format = fmt.Sprintf("bestvideo[height<=%s]+bestaudio/best", cfg.Quality)
		}

		if cfg.Format != "" {
			format += fmt.Sprintf("[ext=%s]", cfg.Format)
		}

		args = append(args, "-f", format)
	}

	args = append(args, cfg.URL)

	cmd := exec.Command(yt.BinaryPath, args...)
	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	err := cmd.Run()
	if err != nil {
		return fmt.Errorf("error while downloading: %v, details: %s", err, stderr.String())
	}

	return nil
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
