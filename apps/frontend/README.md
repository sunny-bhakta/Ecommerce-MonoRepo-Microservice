# Frontend (Next.js)

Next.js App Router frontend (Tailwind + shadcn/ui) that speaks exclusively to the API gateway.

## Getting started

```bash
cd apps/frontend
npm install
npm run dev -- --port 4000
```

```
cd apps/frontend && npm install && npm run dev -- --port 4000
```

Set `GATEWAY_URL` in `.env.local` (see `env.example`). For production, `next build` followed by `next start` produces a standalone output. Tailwind/shadcn components live under `components/ui`.

## What is wired up

- Catalog & product detail (reads via `/catalog/*`)
- Local cart and checkout -> gateway `/checkout`
- Auth (login/logout) using gateway `/auth/login`
- Orders list + detail + payments (gateway `/orders`)
- Profile (gateway `/me/profile`)
- Generic proxy at `/api/proxy/*` to reach any gateway endpoint from the browser without exposing tokens
- Tailwind + shadcn/ui primitives for world-class fashion UX (buttons, cards, badges, inputs)

## Notes

- All authenticated requests depend on the HTTP-only cookie set by `/api/auth/login`.
- If the payment service exposes `GET /payments/:id`, the payment status page will render live data.
- The proxy route includes the `Authorization` header from the auth cookie and forwards request bodies.

Set GATEWAY_URL (and CDN domain) in apps/frontend/.env.local.
Add your image CDN domain to next.config.mjs images.remotePatterns and wire real product media.