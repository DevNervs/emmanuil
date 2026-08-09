# Развёртывание Emmanuil

## Целевой проект

- Cloudflare Pages: `emmanuil`
- Производственная ветка: `main`
- URL: `https://emmanuil.pages.dev`

## Автоматический деплой

При пуше в `main` запускается `.github/workflows/deploy.yml`:

1. `npm ci`
2. `npm run lint`
3. `npm test` (сборка + тесты)
4. `npm run deploy` — сборка `dist/pages` и `wrangler pages deploy --project-name emmanuil --branch main`

## Необходимые настройки

- Repository secret `CLOUDFLARE_API_TOKEN`
- Repository variable `CLOUDFLARE_ACCOUNT_ID` = `367ca81763872c78fbc5a8d69ac8eb1d`
- Repository variable `EMMANUIL_SITE_URL` = `https://emmanuil.pages.dev` (передаётся в `NEXT_PUBLIC_SITE_URL`)

## Ручной fallback

```bash
npm ci
npm test
CLOUDFLARE_API_TOKEN=<token> CLOUDFLARE_ACCOUNT_ID=367ca81763872c78fbc5a8d69ac8eb1d \
  NEXT_PUBLIC_SITE_URL=https://emmanuil.pages.dev npm run deploy
```
