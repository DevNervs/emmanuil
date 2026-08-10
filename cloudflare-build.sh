#!/usr/bin/env bash
set -euo pipefail

# Cloudflare Pages native build gate. Project root: repository root.
# Build command: bash cloudflare-build.sh; output directory: dist/pages.
export NEXT_PUBLIC_SITE_URL="${NEXT_PUBLIC_SITE_URL:-https://emmanuil.pages.dev}"

npm ci
npm audit --omit=dev --audit-level=high
npm run lint
npm run build
node scripts/prerender.mjs
npx tsx --test tests/rendered-html.test.mjs

test -f dist/pages/index.html
echo "Cloudflare Pages gate passed. Output: dist/pages"
