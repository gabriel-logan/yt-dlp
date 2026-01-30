package config

import (
	"fmt"
	"io"
	"log"
	"os"
	"strings"
	"time"
)

func InitLogger() {
	log.SetFlags(0)
	log.SetOutput(&ytdlpWriter{out: os.Stdout})
}

type ytdlpWriter struct {
	out io.Writer
}

func (w *ytdlpWriter) Write(p []byte) (n int, err error) {
	msg := strings.TrimRight(string(p), "\n")

	level := "DEBUG"
	if strings.HasPrefix(strings.ToUpper(msg), "WARN") || strings.HasPrefix(strings.ToUpper(msg), "WARNING") {
		level = "WARNING"
	} else if strings.HasPrefix(strings.ToUpper(msg), "ERROR") || strings.HasPrefix(strings.ToUpper(msg), "FATAL") {
		level = "ERROR"
	} else {
		level = "INFO"
	}

	var prefix string
	switch level {
	case "INFO":
		prefix = "[YTDLP]"
	case "WARNING":
		prefix = "[YTDLP-warning]"
	case "ERROR":
		prefix = "[YTDLP-error]"
	default:
		prefix = "[YTDLP-debug]"
	}

	timestamp := time.Now().Format("2006/01/02 - 15:04:05")

	formatted := fmt.Sprintf("%s %s | %s\n", prefix, timestamp, msg)

	return w.out.Write([]byte(formatted))
}
