# Broadcast (link page)

A link-in-bio page with three authored links and a local editor at `/edit` (not linked from the page, `noindex`): add or remove links in this browser, and they survive a reload. Nothing is published.

Live: https://linktree.bookchaowalit.com (deployed by Vercel CLI; it can lag `main`, see `PRODUCT.md`).

## What it does not do

- No themes, reordering, analytics, short links or publishing. Edits stay in this browser.

## Run

```bash
npm ci
npm run dev
```

## Checks

```bash
npm test           # Vitest: link rules and saved-list parsing, local store, MCP route, home page render, Sentry scrubbing
npm run lint
npm run typecheck
npm run build
```

CI (`.github/workflows/ci.yml`) runs the shared Node workflow (with a line-coverage gate) and the shared security
scan on every push and PR to `main`.

## Code map

- `lib/linktree.ts`: the authored links, `normalizeUrl`, `addLink`, `removeLink`, saved-list parsing and the localStorage store.
- `lib/local-store.ts`: small localStorage store for `useSyncExternalStore` (hydration-safe, works when storage is blocked).
- `app/api/mcp/route.ts`: stateless JSON-RPC endpoint with `get_links` and `search_links` over the authored links.
- `lib/sentry.ts` + `instrumentation*.ts`: error reporting to Sentry, errors only, personal data stripped; off when `NEXT_PUBLIC_SENTRY_DSN` is unset.
- `/more-projects` is a permanent (308) redirect to https://bookchaowalit.com/ (`next.config.ts`); the footer links there too.
- `lib/site.ts` + `app/robots.ts` + `app/sitemap.ts`: canonical origin https://linktree.bookchaowalit.com (override with `NEXT_PUBLIC_SITE_URL`).
- `app/app-shell.css`, `components/app-shell.tsx`: the shared App shell, copied in (see `APP-SHELL.md`); `components/link-page.tsx` renders `/` and `/edit`.
