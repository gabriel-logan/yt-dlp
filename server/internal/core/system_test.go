package core_test

import (
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/core"
)

func TestGetGoVersion(t *testing.T) {
	v := core.GetGoVersion()
	if v == "" {
		t.Fatalf("expected Go version to be non-empty")
	}
}

func TestGetNumCPU(t *testing.T) {
	n := core.GetNumCPU()
	if n <= 0 {
		t.Fatalf("expected NumCPU > 0, got %d", n)
	}
}

func TestGetGOOS(t *testing.T) {
	os := core.GetGOOS()
	if os == "" {
		t.Fatalf("expected GOOS to be non-empty")
	}
}

func TestGetGOARCH(t *testing.T) {
	arch := core.GetGOARCH()
	if arch == "" {
		t.Fatalf("expected GOARCH to be non-empty")
	}
}

func TestGetNumGoroutine(t *testing.T) {
	n := core.GetNumGoroutine()
	if n <= 0 {
		t.Fatalf("expected NumGoroutine > 0, got %d", n)
	}
}

func TestGetNumCgoCall(t *testing.T) {
	n := core.GetNumCgoCall()
	if n < 0 {
		t.Fatalf("expected NumCgoCall >= 0, got %d", n)
	}
}

func TestGetwd(t *testing.T) {
	wd := core.Getwd()
	if wd == "" {
		t.Fatalf("expected working directory to be non-empty")
	}
}

func TestGetCompiler(t *testing.T) {
	c := core.GetCompiler()
	if c == "" {
		t.Fatalf("expected compiler to be non-empty")
	}
}
