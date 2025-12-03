## Deployment Workflow (Generic Example)

This document explains a **generic deployment flow** for a project composed of:

* A **client** (built with a JavaScript bundler such as Vite + pnpm)
* A **server** written in Go
* A system service managed by systemd

All values below are **examples only**. Replace them with the correct values for your environment.

---

## Environment Configuration

```sh
#!/usr/bin/env bash
set -e

### CONFIGURATION
DEPLOY_DIR="/opt/generic-app"
SERVICE_NAME="generic-app"
GO_BINARY_NAME="generic_server"

### ENVIRONMENT VARIABLES
GO_ENV=production
SERVER_PORT=9000
CLIENT_URL=http://127.0.0.1:9000
VITE_API_BASE_URL=http://127.0.0.1:9000
VITE_X_API_KEY=00000000000000000000000000000000
# Use "yt-dlp.exe" for Windows
YT_DLP_SCRIPT_NAME=yt-dlp

### Safety checks
# Check if DEPLOY_DIR is empty or whitespace-only
if [ -z "$DEPLOY_DIR" ] || [ -z "${DEPLOY_DIR// /}" ]; then
    echo "ERROR: DEPLOY_DIR is empty or invalid!" && exit 1
fi

# Normalize the path (remove trailing slashes)
DEPLOY_DIR="${DEPLOY_DIR%/}"

# Check if DEPLOY_DIR is the root directory
if [ "$DEPLOY_DIR" = "/" ]; then
    echo "ERROR: DEPLOY_DIR cannot be root (/)! This would wipe the entire system." && exit 1
fi

# List of protected system directories that must never be used as DEPLOY_DIR
# Note: /home, /srv, and /var/www are protected as base directories, but subdirectories under them are allowed
PROTECTED_DIRS="/bin /boot /dev /etc /home /lib /lib64 /media /mnt /proc /root /run /sbin /srv /sys /tmp /usr /var /var/www"
for protected in $PROTECTED_DIRS; do
    if [ "$DEPLOY_DIR" = "$protected" ]; then
        echo "ERROR: DEPLOY_DIR cannot be a protected system directory ($protected)!" && exit 1
    fi
done

# Ensure DEPLOY_DIR is an absolute path
case "$DEPLOY_DIR" in
    /*) ;; # Absolute path, OK
    *) echo "ERROR: DEPLOY_DIR must be an absolute path (starting with /)!" && exit 1 ;;
esac

# Ensure DEPLOY_DIR starts with a safe base directory (must be a subdirectory, not the base itself)
case "$DEPLOY_DIR" in
    /opt/*|/srv/*|/home/*|/var/www/*|/app/*|/data/*)
        ;; # Safe subdirectories, OK
    *)
        echo "ERROR: DEPLOY_DIR must be under a safe directory (/opt, /srv, /home, /var/www, /app, or /data)!" && exit 1 ;;
esac

echo "DEPLOY_DIR validated: $DEPLOY_DIR"

echo "=== Building CLIENT ==="
cd client
pnpm install

echo "=== Passing variables to Vite ==="
VITE_API_BASE_URL=$VITE_API_BASE_URL \
VITE_X_API_KEY=$VITE_X_API_KEY \
pnpm build

echo "=== Building GO SERVER ==="
cd ../server
go build -o $GO_BINARY_NAME ./cmd/main.go

echo "=== Preparing deploy folder ==="
sudo rm -rf "$DEPLOY_DIR"
sudo mkdir -p "$DEPLOY_DIR"

echo "=== Creating client/ folder ==="
sudo mkdir -p "$DEPLOY_DIR/client"

echo "=== Copying client/dist ==="
sudo cp -r ../client/dist "$DEPLOY_DIR/client/dist"

echo "=== Creating server/ folder ==="
sudo mkdir -p "$DEPLOY_DIR/server"

echo "=== Copying compiled server ==="
sudo cp "$GO_BINARY_NAME" "$DEPLOY_DIR/server/$GO_BINARY_NAME"

echo "=== Copying /scripts ==="
sudo mkdir -p "$DEPLOY_DIR/scripts"
sudo cp -r ../scripts/* "$DEPLOY_DIR/scripts/"

echo "=== Creating .env file in deploy folder ==="
sudo tee "$DEPLOY_DIR/.env" >/dev/null <<EOF
GO_ENV=$GO_ENV
SERVER_PORT=$SERVER_PORT
CLIENT_URL=$CLIENT_URL
VITE_API_BASE_URL=$VITE_API_BASE_URL
VITE_X_API_KEY=$VITE_X_API_KEY
YT_DLP_SCRIPT_NAME=$YT_DLP_SCRIPT_NAME
EOF

echo "=== Creating systemd service ==="
sudo tee /etc/systemd/system/$SERVICE_NAME.service >/dev/null <<EOF
[Unit]
Description=Generic App Server
After=network.target

[Service]
Type=simple
WorkingDirectory=$DEPLOY_DIR/server
ExecStart=$DEPLOY_DIR/server/$GO_BINARY_NAME
EnvironmentFile=$DEPLOY_DIR/.env
Restart=always
RestartSec=3
StandardOutput=journal
StandardError=journal

[Install]
WantedBy=multi-user.target
EOF

echo "=== Reloading systemd ==="
sudo systemctl daemon-reload
# sudo systemctl enable $SERVICE_NAME
sudo systemctl restart $SERVICE_NAME

echo "=== Service installed: $SERVICE_NAME ==="
echo "You can start it with: sudo systemctl start $SERVICE_NAME"
echo "Logs: sudo journalctl -u $SERVICE_NAME -f"
sudo systemctl status $SERVICE_NAME
```
