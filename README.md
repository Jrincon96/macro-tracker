# Macro Tracker

A personal macro tracker built as an installable phone app (PWA). Log meals by hand, by search (USDA), by text, or with a photo that Claude analyzes. Set goals (cut, fat loss, maintain, lean bulk, muscle gain), see weekly and monthly stats and your weight trend, and get meal suggestions for the macros you still need.

## Stack

- **Next.js** (App Router) + **TypeScript**, Tailwind CSS, shadcn/ui
- **Supabase**: Postgres, Auth (magic link), Storage for meal photos
- **Anthropic Claude API**: photo and text macro estimates, meal suggestions
- **USDA FoodData Central**: food search
- **Vercel** hosting. A Dockerfile is included for self-hosting.

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in keys
npm run dev                  # http://localhost:3000
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm test` | Vitest unit tests |
| `npm run build` | Production build |
| `docker compose up --build` | Run the production build in Docker |

## Roadmap

- [x] Scaffold, CI, Docker
- [ ] Supabase schema + auth
- [ ] Goals + macro math
- [ ] Manual logging (USDA search, saved foods)
- [ ] AI: text parsing, photo analysis, suggestions
- [ ] Stats + weight trend
- [ ] PWA + Vercel deploy
