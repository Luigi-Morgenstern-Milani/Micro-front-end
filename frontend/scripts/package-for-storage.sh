#!/usr/bin/env bash
# Empacota shell + remotes para upload no Azure Storage ($web).
# Uso: a partir de qualquer cwd → bash frontend/scripts/package-for-storage.sh
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "==> Build remotes (mfe-usuario, mfe-carona, mfe-apartment, mfe-chat)"
npm run build:remotes

echo "==> Copiar assets para shell/public (sem __federation_shared_*)"
rm -rf shell/public/mfe-usuario shell/public/mfe-carona shell/public/mfe-apartment shell/public/mfe-chat
mkdir -p shell/public/mfe-usuario/assets shell/public/mfe-carona/assets \
  shell/public/mfe-apartment/assets shell/public/mfe-chat/assets

rsync -a --exclude='__federation_shared_*' \
  mfe-usuario/dist/assets/ shell/public/mfe-usuario/assets/
rsync -a --exclude='__federation_shared_*' \
  mfe-carona/dist/assets/ shell/public/mfe-carona/assets/
rsync -a --exclude='__federation_shared_*' \
  mfe-apartment/dist/assets/ shell/public/mfe-apartment/assets/
rsync -a --exclude='__federation_shared_*' \
  mfe-chat/dist/assets/ shell/public/mfe-chat/assets/

test -f shell/public/mfe-usuario/assets/remoteEntry.js
test -f shell/public/mfe-carona/assets/remoteEntry.js
test -f shell/public/mfe-apartment/assets/remoteEntry.js
test -f shell/public/mfe-chat/assets/remoteEntry.js

echo "==> Build shell"
npm run build --prefix shell

echo
echo "Pacote pronto: $ROOT/shell/dist"
echo "Upload do conteúdo dessa pasta para o contêiner \$web."
echo "Passo a passo: infra/MANUAL_DEPLOY_MFE_STORAGE.md"
