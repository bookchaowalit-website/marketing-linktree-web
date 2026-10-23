# Broadcast (link page) — Product truth

> Inferred from the code and copy (no user interview). Checked against the portfolio card claims review
> (`portfolio-site-web/docs/audits/CARD-CLAIMS-REVIEW-2026-10.md`, row `linktree`) on 2026-10-23.

## What it is

A client-only link-in-bio page: three authored links plus an editor that adds or removes links in this browser's localStorage. Nothing is published to a server.

## Who it is for

A portfolio visitor who wants to see a personal link page and try editing it locally.

## What works today

1. The three authored links (portfolio, GitHub, knowledge hub) open in a new tab.
2. Edit mode: add a link (label plus an http(s) URL; other schemes are refused) or remove one. The list is saved in localStorage and survives a reload; a saved value of the wrong shape, or a saved link that is not http(s), is ignored.
3. Share page copies the page URL to the clipboard.
4. `/api/mcp` answers JSON-RPC with `get_links` and `search_links` over the authored links only (visitor edits stay in their browser); unknown tools and methods get JSON-RPC errors.
5. Front-end and server errors go to Sentry (errors only, personal data stripped) when `NEXT_PUBLIC_SENTRY_DSN` is set.

## What does not work (and must not be claimed)

- No themes, categories, drag-to-reorder, visibility toggles or click analytics (removed from the portfolio card in the 2026-10 review).
- Edits are not published: other visitors always see the authored three links.
- No account, no short links, no redirect server.

## Live URL and deploy state

- Live: https://linktree.bookchaowalit.com (HTTP 200 on 2026-10-23).
- The Vercel project `bookchaowalit-linktree-frontend` is deployed only by CLI. Its last production deploy is the CVE patch (2026-10-23, CLI, commit ced177a). Its Git link names the old repository `bookchaowalit/bookchaowalit-linktree-frontend`, so a push to `main` does not deploy: the L2 work stays undeployed until the owner reconnects Vercel Git to this repository (owner action D9). `NEXT_PUBLIC_SENTRY_DSN` is already set on the Vercel project (Sentry project `marketing-linktree-web`, org `personal-yu0`).

## Boundaries

- Browser-only apart from the stateless `/api/mcp` route.
- Separate job from marketing-url-shortener-web, marketing-redirect-manager-web and marketing-link-analytics-web (see the consolidation note in the b-website result file).
