# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Design blueprint

The persona and design direction every change must serve:

- **Role** — senior full-stack developer and Awwwards-winning website designer.
- **Primary audience** — mobile users. Design mobile-first; desktop is a scaled-up layout, never the starting point. Touch targets, thumb reach, viewport units, and motion budget all assume a phone.
- **Personality** — the site must have a clear voice and character. No generic SaaS neutrality; every surface should feel intentional and authored.
- **Primary surface: polished mirror chrome** — the dominant visual material is a reflective, chromed/mirrored finish. Treat it as a real material: think highlight, gradient, environmental reflection, subtle distortion. It is the hero material, not an accent.
- **Composition: Awwwards-style hero** — the hero is *the* moment. Oversized type, confident negative space, a single focal object, strong vertical rhythm. Subsequent sections support the hero, they don't compete with it.
- **Motion with intention** — every animation must earn its place: reveal hierarchy, guide attention, or react to input. No idle decoration, no "because we can" parallax. Respect `prefers-reduced-motion` and keep the mobile motion budget tight (battery, jank, scroll feel).

When implementing UI, evaluate proposals against these five rules before writing code; if a change doesn't reinforce at least one, reconsider it.

## Commands

- `npm run dev` — start the Next.js dev server on http://localhost:3000
- `npm run build` — production build
- `npm run start` — serve the production build
- `npm run lint` — run ESLint (flat config)

There is no test runner configured.

## Stack and version notes

- **Next.js 16.2.6** with the App Router (`app/` directory). Treat this as a new major: APIs and defaults may differ from Next 14/15 patterns in training data. Per `AGENTS.md`, consult `node_modules/next/dist/docs/` (especially `01-app/`) before writing framework code, and heed deprecation notices.
- **React 19.2.4** — Server Components by default; add `"use client"` only when needed.
- **Tailwind CSS v4** — configured entirely in CSS. There is no `tailwind.config.*` file. Design tokens live in `app/globals.css` under `@theme inline { … }` (e.g. `--color-background`, `--font-sans`). PostCSS uses `@tailwindcss/postcss`.
- **TypeScript** with `strict: true`, `moduleResolution: "bundler"`, and the `@/*` path alias mapped to the project root (import as `@/app/...`, `@/lib/...`, etc.).
- **ESLint** uses flat config (`eslint.config.mjs`) composed from `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript` subpath exports.

## Architecture

Currently a minimal create-next-app scaffold:

- `app/layout.tsx` — root layout. Loads Geist Sans/Mono via `next/font/google` and exposes them as the `--font-geist-sans` / `--font-geist-mono` CSS variables that Tailwind's `@theme` block consumes. The `<html>`/`<body>` set up a flex column that lets pages fill the viewport.
- `app/page.tsx` — home route.
- `app/globals.css` — Tailwind v4 entry (`@import "tailwindcss"`) plus theme tokens and dark-mode `prefers-color-scheme` overrides.
- `public/` — static assets served from `/`.

When adding routes, colocate `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, and route handlers (`route.ts`) under `app/` per App Router conventions.
