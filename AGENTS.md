# Project Rules

## User Communication Preference

- All assistant responses in this project thread must be written in **Russian**.
- Code, comments, and commit messages should follow existing repository conventions (Ukrainian/English where already established).

## Worker build and Telegram bot

- Pages function source lives in `worker/`.
- `worker/index.ts` is the **vinext SSR worker** (dev, tests, `vinext start`).
- `worker/pages.ts` is the **Cloudflare Pages function** and is bundled into `public/_worker.js` by `scripts/build-worker.mjs`.
- `public/_worker.js` is generated — do not edit by hand. It is ignored by git.
- `npm run build`, `npm run build:pages` and `npm run dev` run `prebuild`/`predev`, which call `npm run build-worker`.
- Tests run with `tsx`: `npm run test` does `npm run build && npx tsx --test tests/rendered-html.test.mjs`.
- Telegram bot flow:
  1. Create a KV namespace and bind it as `GROUP_APPLICATIONS` in the Pages project.
  2. Set `TELEGRAM_BOT_TOKEN`, `TELEGRAM_ADMIN_CHAT_ID`, and `TELEGRAM_WEBHOOK_SECRET` (optionally `TELEGRAM_ADMIN_USER_IDS`).
  3. After deploy, call `POST /api/setup-telegram` with `Authorization: Bearer <TELEGRAM_WEBHOOK_SECRET>` to register the webhook.
  4. Admin commands: `/start`, `/last [тип]`, `/list [тип]`, `/search <query>`, `/group <number>`, `/serving`, `/questions`, `/stats`, `/delete <id>`.
- Applications have three types (`type` field, legacy records default to `group`):
  - `group` — запис на домашню групу: `POST /api/group-registration`.
  - `serving` — заявка на служіння: `POST /api/serving-registration`; список служінь: `GET /api/servings`, адмін-CRUD: `/admin/api/servings`.
  - `question` — питання з контактної форми: `POST /api/question`.
- Admin API supports `?type=group|serving|question` on `/admin/api/applications` and `/admin/api/export`; counts via `/admin/api/stats`.
