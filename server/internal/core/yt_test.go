package core_test

import (
	"bytes"
	"context"
	"os"
	"path/filepath"
	"testing"

	"github.com/gabriel-logan/yt-dlp/server/internal/core"
)

func createFakeBin(t *testing.T, content string) string {
	t.Helper()

	dir := t.TempDir()
	binPath := filepath.Join(dir, "fakebin")

	if err := os.WriteFile(binPath, []byte(content), 0755); err != nil {
		t.Fatalf("cannot write fake bin: %v", err)
	}

	return binPath
}

func TestInitYTCore(t *testing.T) {
	t.Setenv("YT_DLP_SCRIPT_NAME", "fakebin")

	testRoot := t.TempDir()
	scriptsDir := filepath.Join(testRoot, "..", "scripts")
	os.MkdirAll(scriptsDir, 0755)

	fake := createFakeBin(t, "#!/bin/sh\necho ok\n")
	fakeDest := filepath.Join(scriptsDir, "fakebin")

	os.Link(fake, fakeDest)

	old, _ := os.Getwd()
	os.Chdir(testRoot)
	defer os.Chdir(old)

	yt, err := core.InitYTCore()
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	if yt.BinaryPath != fakeDest {
		t.Fatalf("expected %s, got %s", fakeDest, yt.BinaryPath)
	}
}

func TestGetVideoInfo(t *testing.T) {
	fake := createFakeBin(t, `#!/bin/sh
echo '{"title":"OK"}'
`)

	yt := &core.YTCore{BinaryPath: fake}

	out, err := yt.GetVideoInfo("http://x")
	if err != nil {
		t.Fatalf("error: %v", err)
	}

	if out != "{\"title\":\"OK\"}\n" {
		t.Fatalf("unexpected output: %s", out)
	}
}

func TestGetVideoInfo_Error(t *testing.T) {
	fake := createFakeBin(t, `#!/bin/sh
echo "error" >&2
exit 1
`)

	yt := &core.YTCore{BinaryPath: fake}

	_, err := yt.GetVideoInfo("http://x")
	if err == nil {
		t.Fatalf("expected error")
	}
}

func TestDownloadBinaryCtx(t *testing.T) {
	fake := createFakeBin(t, `#!/bin/sh
echo -n "STREAMDATA"
`)

	yt := &core.YTCore{BinaryPath: fake}

	cfg := core.DownloadConfig{
		URL:     "http://x",
		Type:    core.Audio,
		Quality: 1,
	}

	ctx := context.Background()
	r, cmd, err := yt.DownloadBinaryCtx(ctx, cfg)
	if err != nil {
		t.Fatalf("unexpected error: %v", err)
	}

	buf := new(bytes.Buffer)
	buf.ReadFrom(r)

	if buf.String() != "STREAMDATA" {
		t.Fatalf("unexpected: %s", buf.String())
	}

	if cmd.Process == nil {
		t.Fatalf("cmd was not started")
	}
}
