# Scalpel Services Market

Marketplace plugin for [Scalpel](https://github.com/scalpelpoe/scalpel) (PoE1/PoE2 overlay).

Publish and request in-game services (act carries, boss carries, trials, ascendancies, map hosting, etc.). Discord-authed. **Currency-only payments — no real-money trade.**

## Backend

Hosted on Vercel: [scalpel-services-market-api.vercel.app](https://scalpel-services-market-api.vercel.app)
Source: [cccarv82/scalpel-services-market-api](https://github.com/cccarv82/scalpel-services-market-api)

## Dev

```bash
npm install
npm run dev        # vite build --watch -> dist/plugin.js
npm run build      # production
npm run typecheck
```

Load `dist/` via Scalpel Settings → Developer → Load unpacked plugin.

## License

AGPL-3.0-only
