# Impact Intelligence

A persona-first feed that turns live global signals into actionable need cards for people in India — with urgency, confidence levels, citations, and local context.

Built for the [Cursor Impact Hackathon](https://cursor.com).

**Live demo:** [impact-cursor-hackathon.vercel.app](https://impact-cursor-hackathon.vercel.app/)
<img width="1200" height="750" alt="ImpactPreview" src="https://github.com/user-attachments/assets/08f52679-4a3a-433b-9bca-d5c07d6b743a" />

## What it does

Impact Intelligence pulls real-time data from multiple sources, enriches it with AI, and presents it as a scrollable feed of "user need" cards. Each card answers: **what happened, why it matters to you, and what you can do about it.**

**Key features**

- Infinite-scroll feed with category, persona, and region filters
- Persona-first framing (commuter, student, SMB owner, farmer, importer)
- Confidence badges distinguishing verified facts from AI inference
- Citations panel with source links for every claim
- Event detail pages with local/city-level context for Indian metros
- Dark mode, accessibility (skip links, ARIA), smooth scroll
- Optional Google sign-in (NextAuth)

## Data sources

| Source | What it provides |
|--------|-----------------|
| [Apify](https://apify.com) | Google News scraper — live headline ingestion |
| [U.S. EIA](https://www.eia.gov/opendata/) | Brent crude / petroleum spot price snapshots |
| [ReliefWeb](https://reliefweb.int) | Humanitarian reports (slug-based detail lookup) |
| [Google Gemini](https://ai.google.dev) | Optional narrative enrichment and persona framing |
| [Supabase](https://supabase.com) | Event storage and cron-based ingestion |
| Curated seed data | Baseline demo events always available offline |

## Tech stack

- **Framework:** Next.js 16 (App Router, React 19, Server Components)
- **Styling:** Tailwind CSS 4
- **Database:** Supabase (Postgres)
- **AI:** Google Gemini (2.5 Flash)
- **Auth:** NextAuth v5 (Google OAuth)
- **Data ingestion:** Apify client, EIA API, ReliefWeb API
- **Testing:** Vitest
- **Fonts:** Geist Sans & Geist Mono

## Getting started

### Prerequisites

- Node.js 18+
- npm (or pnpm / yarn)
- API keys for the services you want to enable (all optional for a basic demo)

### Setup

```bash
git clone https://github.com/<your-username>/Cursor_Impact_Hackathon.git  # update with your repo URL
cd Cursor_Impact_Hackathon/web

cp .env.example .env.local   # then fill in your keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Environment variables

Copy `web/.env.example` to `web/.env.local` and configure the keys you need. Every integration degrades gracefully — the app works with zero keys using curated seed data only.

See `web/.env.example` for detailed documentation of each variable.

## Project structure

```
web/
├── src/
│   ├── app/                  # Next.js App Router pages & API routes
│   │   ├── api/
│   │   │   ├── cron/         # Scheduled Apify → Supabase ingestion
│   │   │   └── feed/         # Paginated JSON feed for infinite scroll
│   │   ├── event/[slug]/     # Event detail page
│   │   ├── method/           # Methodology & trust explanation
│   │   └── profile/          # Persona & region preferences
│   ├── components/
│   │   ├── citations/        # Source citations panel
│   │   ├── events/           # Feed cards, filters, confidence badges
│   │   └── layout/           # Header, nav, theme, smooth scroll
│   ├── data/                 # Curated seed events
│   └── lib/
│       ├── ai/               # Gemini enrichment & narrative merge
│       ├── domain/           # Core types (ImpactEvent, UserNeed)
│       ├── jobs/             # Ingestion pipeline
│       ├── sources/          # Apify, EIA, ReliefWeb clients & mappers
│       └── supabase/         # Supabase admin client & queries
├── .env.example              # Environment variable template
└── package.json
```

## Scripts

```bash
npm run dev          # Start dev server
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run test         # Run Vitest tests
npm run test:gemini  # Smoke-test Gemini API key
```

## Design principles

- **Trust as a first-class concern** — every card separates facts from inference and shows confidence levels
- **Graceful degradation** — works offline with seed data; each API is independently optional
- **Conservative framing** — avoids alarmist language; presents actionable, measured guidance
- **India-first local context** — city-level notes for Mumbai, Delhi, Bengaluru, and more

## License

MIT
