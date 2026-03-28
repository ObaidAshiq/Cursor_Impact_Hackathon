# Impact Intelligence — Web App

This is the Next.js web application for Impact Intelligence. See the [root README](../README.md) for full project documentation.

## Quick start

```bash
cp .env.example .env.local   # configure your API keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | Run ESLint |
| `npm run test` | Run Vitest test suite |
| `npm run test:gemini` | Smoke-test your Gemini API key |

## Environment variables

All configuration lives in `.env.local`. Copy `.env.example` for the full list with documentation. Every external integration is optional — the app falls back to curated seed data.
