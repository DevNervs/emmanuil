# Cloudflare deployment

Cloudflare Pages is the routine CI/CD owner. Because the healthy `emmanuil` project is Direct Upload and cannot be converted in place, an adjacent Git-integrated Pages project is validated first. Production branch `main` runs `bash cloudflare-build.sh` and publishes `dist/pages`.

The gate pins Node 22.13, audits production dependencies, lints, builds/prerenders every route, and runs the rendered production test suite. GitHub deployment remains available only as a manual fallback.
