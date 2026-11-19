# Design

Since 2026-11-19 this app uses the shared **App shell** in its single-column content form (`as-page`, `as-intro`,
`as-row-link`, as in checklists and journal): rules and pieces are in [`APP-SHELL.md`](APP-SHELL.md). The earlier
one-off look (cobalt "broadcast poster" with coral sun and lime marks) was retired so it reads like the other
`*.bookchaowalit.com` apps; see git history for its old design notes.

The public page (`/`) shows only the profile, a Share button and the links (label, host, ↗, opens in a new tab).
Editing lives at `/edit` (not linked, `noindex`): an add form with errors under the field they are about, rows with an
undoable Remove, and an empty state with "Restore default links". App-specific CSS uses the `lt-` prefix.
