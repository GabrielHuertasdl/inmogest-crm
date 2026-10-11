#!/usr/bin/env bash
# Build locally (the 512 MB container can't build) and ship to the server.
# Usage: scripts/deploy.sh [root@192.168.1.52]
set -euo pipefail
HOST="${1:-root@192.168.1.52}"
cd "$(dirname "$0")/.."
pnpm build
rsync -az --delete \
  --exclude /node_modules --exclude /data --exclude /.git --exclude /.next/cache --exclude /.next/dev \
  --exclude '/.env*.local' --exclude '*.log' \
  ./ "$HOST:/opt/inmogest/"
ssh "$HOST" 'cd /opt/inmogest && COREPACK_ENABLE_DOWNLOAD_PROMPT=0 CI=1 corepack pnpm install --prod --frozen-lockfile >/dev/null \
  && chown -R inmogest:inmogest /opt/inmogest && systemctl restart inmogest && sleep 5 \
  && curl -fsS -o /dev/null -w "login %{http_code}\n" http://127.0.0.1:3000/login'
