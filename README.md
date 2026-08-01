# 🥘 K-Food Safe

**Eat Korea Without Worry** — a dietary-restriction-friendly Korean food guide for foreign travelers (halal · vegan · vegetarian · gluten-free · allergies), starting with Busan.

Built for the **2026 Tourism Data Contest** (Korea Tourism Organization × Kakao, web/app development track).

## The problem

Korean food is full of hidden ingredients foreign visitors can't guess: fish sauce in kimchi, wheat in gochujang, pork in "vegetable" dumplings, anchovy broth in almost everything. Searching the national tourism API for dietary keywords (halal, vegan, vegetarian…) returns **only ~11 results nationwide** — that's the information gap this service closes.

## Features

| Route | Feature |
|---|---|
| `/dishes` | Ingredient & allergen guide for 80+ common Korean dishes with traffic-light safety ratings per diet |
| `/restaurants` | Live Busan restaurant explorer — KTO tourism data + Busan city's official guide + 3,101 city-certified safe restaurants |
| `/cards` | Allergy communication cards in Korean to show restaurant staff (print/PDF friendly) |

## Data sources

- **Korea Tourism Organization TourAPI 4.0** (KorService2/EngService2) — required contest API, primary source
- **Busan Metropolitan City OpenAPI** — FoodService (맛집), BusanSafeRestaurantService (안심식당)
- **Curated ingredient DB** (`src/data/dishes.ts`) — this project's core asset

## Getting started

```bash
npm install
cp .env.example .env.local   # then put your data.go.kr decoding key in KTO_KEY
npm run dev
```

Open http://localhost:3000.

## Stack

Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS 4. API keys stay server-side behind `/api/*` route handlers; responses are cached for 1h to respect the 1,000 calls/day dev quota.

## Roadmap

- [ ] Menu photo OCR → instant ingredient analysis
- [x] Kakao Map integration (marker clustering, needs NEXT_PUBLIC_KAKAO_MAP_KEY)
- [ ] User dietary profile (localStorage → accounts)
- [x] Ingredient DB expanded to 82 dishes with photos (target 100+)
- [ ] Seoul/Incheon expansion (phase 2)
