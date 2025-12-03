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
[ -z "$DEPLOY_DIR" ] && echo "DEPLOY_DIR is invalid!" && exit 1

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
