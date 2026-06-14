# Scalpel Services Market

In-game services marketplace plugin for [Scalpel](https://github.com/scalpelpoe/scalpel) (PoE1/PoE2).

Publish your carries, trials, ascendancies, map hosting, full campaign runs and more. Browse and request services from other players directly inside Scalpel's overlay. Discord OAuth identity, in-game currency only — **no real-money trade allowed**.

## Features

- **Discord login** — your Discord identity (display name + ID) carries across sessions; ratings stick to you
- **Service board** — filter by category (Act/Boss/Leveling/Map host/Trial/Campaign/Other), league, PoE version, search
- **Flexible pricing** — currency dropdown (chaos / divine / exalted / mirror / free for vouch). Single price, range, or multi-tier (Campaign carries auto-suggest preset tiers)
- **Request flow** — pending → accepted → completed, with rate-after-complete (1-5 ★ both ways)
- **Overlay notification + beep** — pops up in-game when a request arrives
- **Copy `/invite <name>`** — one click to clipboard
- **Anti-RMT** — keyword blacklist server-side, report button on cards, auto-flag after 3 reports

## Install

When the plugin is approved in the [Scalpel plugin registry](https://github.com/scalpelpoe/scalpel-plugins-registry):

1. Scalpel → Settings → **Plugins** → **Browse**
2. Find "Services Market" → **Install**

Until then, load it as an unpacked plugin:

1. Clone this repo + `npm install && npm run build`
2. Scalpel → Settings → **Developer** → **Load unpacked plugin** → point at `dist/`

## Tabs

| Tab | What it does |
|---|---|
| **Board** | All active services across players. Filter, search, request, report, copy /invite |
| **Mine** | Your published services. Create, edit, pause, delete (2-click confirm) |
| **Incoming** | Service requests from clients on your services. Accept/decline/complete/cancel |
| **Outgoing** | Your requests to other players. Cancel, mark complete, rate |
| **Public profile** | Click any provider name to see their reputation history |
| **⚙ Settings** | Beep toggle |
| **Profile** | Your character name + default league + sign out |

## Backend

[scalpel-services-market-api.vercel.app](https://scalpel-services-market-api.vercel.app) (Next.js on Vercel + Neon Postgres).
Source: [cccarv82/scalpel-services-market-api](https://github.com/cccarv82/scalpel-services-market-api)

## Dev

```bash
npm install
npm run dev        # vite build --watch -> dist/plugin.js
npm run build      # production build
npm run typecheck
npm test
```

## License

AGPL-3.0-only (same as Scalpel).
