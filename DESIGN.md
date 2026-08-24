---
title: "Linktree — Broadcast Poster"
status: "active"
updated: "2026-08-24"
---

# Linktree — Broadcast Poster

## Overview

Linktree is an editable personal links page. The public-facing job is to move
someone from identity to the right door quickly; the private/demo job is to let
the owner test the link list locally. The page therefore gives the profile and
links the visual weight, while editing stays secondary.

## Colors

- **Cobalt field** — `#173FBA`, the broadcast ground.
- **Warm white** — `#FFFDF1`, readable link strips.
- **Ink navy** — `#111D50`, hard outlines and offset shadows.
- **Coral sun** — `#F16853`, identity and removal accents.
- **Signal lime** — `#D5E94E`, labels and active editorial marks.
- Avoid neutral dashboard gray and gradients; the poster relies on strong flat
  blocks.

## Typography

- Avenir Next / Trebuchet MS handles interface copy and links.
- Georgia provides the profile's expressive editorial moments.
- Monospace marks transmissions, edit status, and small system notes.

## Layout

- A small top bar establishes the page as a personal broadcast.
- The centered profile stage keeps identity and link doors together.
- Links are numbered strips with a single external-open affordance.
- The editor is revealed after the main link experience and remains local-only.
- Mobile keeps the profile centered and turns the editor into a vertical form.

## Elevation & Depth

- Link strips use a hard five-pixel ink offset, reduced on hover.
- The profile sticker uses a small offset shadow and slight rotation.
- The coral sun is a flat backdrop shape, not a gradient or illustration asset.

## Shapes

- Circular sticker for identity.
- Rectangular link strips with hard edges.
- Underlined text actions for share/edit; no rounded card grid.

## Components

- **Broadcast top bar** — share action and local edit label.
- **Profile sticker** — initial and edition mark.
- **Signal links** — external link strips with order numbers.
- **Editor note** — states the prototype boundary.
- **Local editor** — add/remove links with protocol validation.
- The local storage key remains scoped to this page.

## Do's and Don'ts

- Do make the owner and destination obvious.
- Do label local-only behavior.
- Do validate new links to http/https.
- Don't imply a hosted profile service or public publishing workflow.
- Don't bury the links under an editor/dashboard.
- Don't replace the poster identity with a generic monochrome template.

