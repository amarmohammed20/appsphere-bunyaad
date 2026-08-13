---
name: Bunyaad
version: 1.0.0
description: >
  Design source of truth for bunyaad. Bunyaad ships deliberately unbranded —
  a neutral shadcn/ui baseline that every client project rethemes. This file
  documents the system and its rules; a client project replaces it with a
  full brand version extracted from that client's brand guidelines (see the
  eco-construction DESIGN.md for what the finished form looks like).
---

# Bunyaad — DESIGN.md

## Overview

Bunyaad is the boilerplate, so it has no brand. What it ships is the
**system**: semantic tokens, shadcn/ui components restyled through those
tokens, dark mode, and mechanical enforcement that keeps raw values out of
component code. A client project keeps the system and swaps the values.

The UI's job in every project built from this: clarity and speed over
decoration. Compose existing components; don't design new primitives when a
restyled shadcn component will do.

## Tokens

`src/app/globals.css` is the single source of token values — this file does
not duplicate them. Tailwind v4: tokens are CSS custom properties in `:root`
and `.dark`, mapped through `@theme inline`. There is **no**
`tailwind.config.ts`; do not create one.

The palette is the shadcn neutral default in `oklch` — greyscale surfaces,
near-black `primary`, one red `destructive`. That is a placeholder, not a
decision: it exists so every screen built before branding arrives rethemes
correctly later.

Component code uses **semantic classes only** — `bg-primary`,
`text-muted-foreground`, `border-border` — never raw palette classes
(`bg-zinc-900`, `text-red-500`). `pnpm check:colours` fails raw classes
outside `components/ui/` in CI and pre-commit. This is what makes retheming
six variables instead of a find-and-replace.

## Typography

**Geist** (sans) and **Geist Mono**, loaded in `src/app/layout.tsx` via
`next/font`. One family everywhere; mono for code only. No type ramp is
prescribed yet — Tailwind's default scale applies until a client's brand
guideline defines roles. When it does, the ramp lands here.

## Radius

One anchor: `--radius: 0.625rem` (10px). Every step (`sm` through `4xl`) is
computed from it in `@theme inline`, so a client rounds the entire UI —
sharper or softer — by changing a single variable.

## Dark mode

Class-based (`.dark`), toggled by `next-themes` through
`components/shared/ThemeProvider.tsx`. Every token has a value in both
themes; a component that uses semantic classes is dark-ready by
construction. Never style for one theme with literals.

## Components

shadcn/ui + Radix primitives in `src/components/ui/` — generated, restyled
via tokens, not hand-edited for style. Hand-written composites live in
`src/components/shared/`. Deliberate deviations from shadcn defaults are
documented in [src/components/ui/README.md](src/components/ui/README.md) —
the standing one: **interactive controls are 44px minimum touch targets**
(button, input, select).

Icons: Lucide, outline style — already a shadcn dependency.

## Motion

Two utilities in `globals.css`: `fade-up` (entrance, 0.45s, staggered
delays) and `glow-pulse` (ambient). `prefers-reduced-motion` disables all
animation globally — already wired; keep any new animation behind the same
media query.

## Accessibility

WCAG 2.1 AA is the baseline:

- Contrast: normal text ≥ 4.5:1; large text and UI graphics ≥ 3:1. The
  neutral palette passes; a client palette must be checked before it lands.
- Every control keyboard-reachable with visible focus (`--ring` outline —
  applied globally in `@layer base`).
- Status is never colour alone — pair with icon or text.
- Touch targets ≥ 44px.

## Retheming for a client

The whole point of the system. In order:

1. Extract the client's brand guideline into a full DESIGN.md replacing this
   one — palette, type ramp, spacing, elevation, component rules
   (eco-construction's DESIGN.md is the reference for shape and depth).
2. Replace the `:root` and `.dark` values in `globals.css`. Semantic classes
   throughout the app pick the new values up with no component edits.
3. Load the brand's font in `layout.tsx` and point `--font-geist-sans`'s
   consumers at it (or rename the variable in both files).
4. Set `--radius` to the brand's corner style.
5. Verify contrast in both themes, then run `pnpm check:colours` — any raw
   value that crept in fails there.

## Do's and Don'ts

**Do**

- Use semantic token classes for every colour; the check enforces it.
- Build with existing `components/ui/` primitives; compose in
  `components/shared/` or the feature's `components/`.
- Keep both themes working — check any new surface in dark mode.

**Don't**

- No `tailwind.config.ts` — Tailwind v4 config lives in `globals.css`.
- No hex/oklch/px literals in component code; no raw palette classes.
- No second typeface; no ad-hoc animation outside the reduced-motion guard.
- No hand-edits to `components/ui/` for styling — tokens or a wrapper.
- Don't grow this file into brand guidance bunyaad doesn't have — real
  values arrive with a real client's guideline.
