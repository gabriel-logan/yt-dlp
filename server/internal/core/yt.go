package core

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
)

type DownloadType int

const (
	Video DownloadType = iota
	Audio
)

var audioABRLevels = []int{64, 96, 128, 160, 192, 256, 320}
var videoHeights = []int{144, 240, 360, 480, 720, 1080, 1440, 2160}

type DownloadConfig struct {
	URL        string
	Type       DownloadType
	Quality    int    // Ex: 0, 5, 6, 7, etc.
	FormatNote string // Ex: "720p60", "1080p60", 480p", etc.
}

type YTCore struct {
	BinaryPath string
}

func InitYTCore() (*YTCore, error) {
	cwd := Getwd()

	ytDlpScriptName := os.Getenv("YT_DLP_SCRIPT_NAME")

	binPath := filepath.Join(cwd, "..", "scripts", ytDlpScriptName)

	if _, err := os.Stat(binPath); os.IsNotExist(err) {
		return nil, fmt.Errorf("%s binary not found at path: %s", ytDlpScriptName, binPath)
	}

	return &YTCore{
		BinaryPath: binPath,
	}, nil
}

func (yt *YTCore) GetVideoInfo(url string) (string, error) {
	args := []string{"--dump-json", url}

	cmd := exec.Command(yt.BinaryPath, args...)

	var out, stderr bytes.Buffer

	cmd.Stdout = &out
	cmd.Stderr = &stderr

	if err := cmd.Run(); err != nil {
		return "", fmt.Errorf("error getting video info: %v, details: %s", err, stderr.String())
	}

	return out.String(), nil
}

func (yt *YTCore) DownloadBinaryCtx(ctx context.Context, cfg DownloadConfig) (io.ReadCloser, *exec.Cmd, error) {
	args := []string{
		"--no-part",
		"--no-continue",
		"--concurrent-fragments", fmt.Sprintf("%d", GetNumCPU()),
		"--downloader-args", "ffmpeg:-threads=0",
		"-o",
		"-",
	}

	var fmtSel string
	switch cfg.Type {
	case Audio:
		if cfg.FormatNote != "" {
			fmtSel = fmt.Sprintf("ba[format_note=%s]/ba/bestaudio", cfg.FormatNote)
		} else {
			idx := cfg.Quality

			if idx < 0 {
				idx = 0
			}

			if idx >= len(audioABRLevels) {
				idx = len(audioABRLevels) - 1
			}

			target := audioABRLevels[idx]
			fmtSel = fmt.Sprintf("ba[abr<=?%d]/bestaudio", target)
		}

	case Video:
		if cfg.FormatNote != "" {
			fmtSel = fmt.Sprintf("b[format_note=%s]/bv*+ba/b", cfg.FormatNote)
		} else {
			idx := cfg.Quality

			if idx < 0 {
				idx = 0
			}

			if idx >= len(videoHeights) {
				idx = len(videoHeights) - 1
			}

			h := videoHeights[idx]
			fmtSel = fmt.Sprintf("b[height<=?%d]/bv*[height<=?%d]+ba/b", h, h)
		}
		args = append(args, "--merge-output-format", "mkv")

	default:
		return nil, nil, fmt.Errorf("unknown download type")
	}

	args = append(args, "-f", fmtSel, cfg.URL)

	cmd := exec.CommandContext(ctx, yt.BinaryPath, args...)

	var stderr bytes.Buffer
	cmd.Stderr = &stderr

	stdout, err := cmd.StdoutPipe()
	if err != nil {
		return nil, nil, fmt.Errorf("failed to create stdout pipe: %v", err)
	}

	if err := cmd.Start(); err != nil {
		return nil, nil, fmt.Errorf("failed to start yt-dlp: %v, details: %s", err, stderr.String())
	}

	return stdout, cmd, nil
}
