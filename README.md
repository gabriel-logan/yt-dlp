# yt-dlp

Application using https://github.com/yt-dlp/yt-dlp to download videos and audios. NOTE: For academic purposes only, I do not recommend its use for commercial purposes. Misuse is your responsibility.

## Environment Setup

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Modify the `.env` file to set your desired environment variables.
3. Ensure you have `yt-dlp` installed and accessible in your system's PATH.

## Dependencies

- Go 1.25.0 or higher
- Node.js 20 or higher
- pnpm 8 or higher
- yt-dlp
- python 3.7 or higher

## Frontend

- React
- Vite
- TailwindCSS
- [README-frontend.md](./client/README.md)

## Backend

- Golang
- Net/HTTP
- yt-dlp
- [README-backend.md](./server/README.md)
