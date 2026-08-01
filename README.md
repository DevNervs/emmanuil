# vinext-starter

A clean full-stack starter running on
[vinext](https://github.com/cloudflare/vinext) and Cloudflare Workers, with
optional Cloudflare D1 and Drizzle support.

## Prerequisites

- Node.js `>=22.13.0`

## Quick Start

```bash
npm install
npm run dev
npm run build
```

## Project Structure

- `app/` — Next.js application routes and components
- `worker/` — Cloudflare Workers entry (`worker/index.ts`)
- `public/` — static assets served from the Worker
- `db/` — Drizzle schema and helpers (optional D1)
- `drizzle.config.ts` — migration generation config

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the values:

- `NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION`
- `NEXT_PUBLIC_BING_SITE_VERIFICATION`
- `NEXT_PUBLIC_SITE_URL`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_ADMIN_CHAT_ID`

## Useful Commands

- `npm run dev` — start local development
- `npm run build` — verify the vinext production build
- `npm run start` — start the production Worker locally
- `npm test` — build and run the rendered HTML test
- `npm run lint` — run ESLint
- `npm run db:generate` — generate Drizzle migrations after schema changes

## Deploy

This site is built for Cloudflare Pages and can be deployed manually or via GitHub Actions.

### Manual

```bash
npm run build:pages
npm run deploy
```

`NEXT_PUBLIC_SITE_URL` is build-time. Current production host:

```bash
NEXT_PUBLIC_SITE_URL=https://app.boris-reminder.workers.dev npm run build
```

When `new.emmanuil.cv.ua` DNS is active, switch the URL (and the GitHub Actions env) to that origin, rebuild, and redeploy.

### GitHub Actions

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and deploys to Cloudflare Pages.

Required GitHub secret:

- `CLOUDFLARE_API_TOKEN` — create a token with `Cloudflare Pages:Edit`, `Account:Read`, and `Zone:Read` permissions.

`NEXT_PUBLIC_SITE_URL` is set in the workflow (currently the temporary workers.dev host) so it is baked into the build on CI.

## Learn More

- [vinext Documentation](https://github.com/cloudflare/vinext)
- [Drizzle D1 Guide](https://orm.drizzle.team/docs/get-started/d1-new)
