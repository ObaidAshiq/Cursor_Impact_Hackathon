# Impact Intelligence Web App Architecture

## 1. Vision

Build a web app that turns global, regional, and country-level events into practical local guidance.

Instead of only answering "what happened?", the product answers:

- what happened
- why it matters
- who is affected
- how it affects a specific country, city, and persona
- what cautious actions a user should consider next

Example:

- Event: Strait of Hormuz disruption
- Country: India
- Likely impact: fuel price pressure, logistics cost increases, inflation on essentials
- User guidance: refill only if needed, budget for transport volatility, monitor official fuel advisories, avoid panic buying

The product category is best described as `personal impact intelligence`.

## 2. Product Goals

- Convert complex world events into understandable local impact.
- Use trustworthy sources, not rumor-driven summaries.
- Separate confirmed facts from modeled inference.
- Provide conservative, practical recommendations.
- Work well for underserved users and high-volatility contexts.

## 3. Core Product Principles

- Trust beats novelty.
- Official or highly credible sources should anchor all important claims.
- Show `what we know` separately from `what we infer`.
- Every meaningful recommendation must have citations and a confidence level.
- Avoid alarmist wording and false precision.
- Start narrow and reliable before broadening scope.

## 4. MVP Scope

Keep the first release focused on three event categories:

1. Energy and fuel disruptions
2. Food and supply chain shocks
3. Economic and policy changes

Initial personalization dimensions:

- country
- city or region
- persona

Initial personas:

- commuter
- student
- small business owner
- farmer
- importer

Initial output format for each event:

1. Event summary
2. Country impact
3. Local impact
4. Who is most affected
5. Severity
6. Time horizon
7. Recommended actions
8. Source citations
9. Confidence

## 5. Source Of Truth Strategy

Use a layered source strategy instead of relying on one feed.

### 5.1 Global Event And News Signals

Primary candidates:

- `GDELT`: broad event discovery and global news signal detection
- `ReliefWeb API`: humanitarian crises, disasters, conflict-adjacent impact context
- licensed reputable wire feeds later if available

Use these for:

- early event detection
- cross-source corroboration
- timeline building

Caveat:
Do not treat a single media mention as sufficient evidence for high-impact recommendations.

### 5.2 Disaster And Hazard Signals

Primary candidates:

- `GDACS`: official disaster alerts, feeds, and API
- `USGS`: earthquake feeds
- `NASA FIRMS`: wildfire and thermal anomaly signals

Use these for:

- hazard severity
- affected geographies
- time-sensitive alerts

### 5.3 Energy And Fuel Signals

Primary candidates:

- `U.S. EIA Open Data API`: energy market and petroleum data
- `PPAC India`: official Indian petroleum planning and pricing references
- `OPEC` and `IEA` reports for market context where accessible

Use these for:

- oil and fuel price context
- crude market disruptions
- India-specific downstream fuel signals

### 5.4 Economic And Policy Signals

Primary candidates:

- `World Bank Indicators API`
- `IMF` data services
- `OECD` economic APIs where relevant
- `RBI` and `MOSPI` for India-specific macro context
- `data.gov.in` for official India datasets

Use these for:

- inflation and price pressure context
- policy and macroeconomic baselines
- country vulnerability and recovery context

### 5.5 Travel, Safety, And Advisory Signals

Primary candidates:

- official government travel advisories
- public government notices
- ministry and regulator announcements

Use these for:

- confirmation of official actions
- safety guidance
- public-facing advisory overlays

### 5.6 Verification And Trust Layer

Primary candidates:

- official releases
- multi-source corroboration
- fact-check tools as secondary validation

Rules:

- High-urgency actions require at least one primary official or highly authoritative source.
- Single-source claims should be capped in confidence.
- The system must record source URLs, timestamps, and retrieval metadata.

## 6. Recommended Architecture

### 6.1 High-Level Flow

1. Ingest trusted signals from APIs, feeds, and selected sites
2. Normalize raw inputs into a canonical event model
3. Classify event type and affected sectors
4. Map event to country and local impact hypotheses
5. Generate user-facing summaries and cautious actions
6. Present results with citations, confidence, and freshness

### 6.2 Core Services

- `Ingestion Service`
  Pulls APIs, RSS feeds, and curated sources on schedules.

- `Normalization Service`
  Deduplicates stories and converts raw source material into structured events.

- `Entity And Geography Service`
  Resolves countries, cities, regions, chokepoints, commodities, and sectors.

- `Impact Engine`
  Uses rules plus constrained AI reasoning to infer likely downstream effects.

- `Recommendation Engine`
  Tailors output by country, city, and persona while enforcing safety rules.

- `Citation And Confidence Service`
  Tracks evidence, timestamps, corroboration count, and confidence scoring.

- `Web App And API Layer`
  Delivers dashboards, event detail pages, filters, and saved profiles.

- `Admin Console`
  Lets operators suppress bad events, inspect sources, and review outputs.

## 7. Data Model

Core entities:

- `Source`
  Provider metadata, trust tier, access type, rate limits

- `RawDocument`
  Original content, source URL, fetched time, hash, parse status

- `Event`
  Canonical event record with title, category, locations, time range, status

- `ImpactHypothesis`
  Event-to-geography impact mapping with rationale, severity, and confidence

- `PersonaProfile`
  User context such as country, city, interests, and persona

- `ActionCard`
  Recommendation text, urgency, citations, confidence, and expiry

- `AuditRecord`
  Captures which sources, rules, and model outputs produced a user-facing result

## 8. Trust, Confidence, And Safety Model

Every event view should explicitly separate:

- `What we know`
  Confirmed facts directly supported by citations

- `What we infer`
  Likely downstream impacts based on rules and reasoning

- `What you can do`
  Conservative action guidance for the selected persona and location

Confidence bands:

- `High`
  Multiple strong sources, direct relevance, recent confirmation

- `Medium`
  Credible evidence plus modeled downstream effects

- `Low`
  Early signal, limited corroboration, weak local precision

- `Insufficient`
  Not enough evidence to recommend action

Safety rules:

- never invent missing evidence
- never hide uncertainty
- never present predictions as confirmed facts
- downgrade or block recommendations when evidence is stale or conflicting

## 9. Suggested Tech Stack

This repo already points toward a modern TypeScript stack. For the first build, keep it simple.

### 9.1 Frontend

- `Next.js` with App Router
- `React`
- `TypeScript`
- `Tailwind CSS`

Why:

- fast iteration
- strong web app ergonomics
- good SEO and shareable event pages
- easy server and client boundary control

### 9.2 Backend

Keep the backend choice portable for now.

Recommended starting pattern:

- Next.js server routes or server actions for thin product APIs
- standalone domain services inside `lib/` and `server/`

Storage options:

- `MongoDB` if ingestion flexibility and document-heavy data matter most
- `Convex` if realtime product behavior becomes central

Recommendation:
Start with a clean domain layer so either backend remains viable.

### 9.3 Validation

Use `Zod` as the single source of truth for structured data rules.

Apply it consistently at boundaries:

- **Forms and client UX:** parse or resolve against schemas (for example with React Hook Form) so users get fast feedback.
- **Server Actions and Route Handlers:** always validate again on the server; never trust the client alone.
- **Environment configuration:** validate `process.env` at startup so misconfiguration fails fast.
- **External APIs:** validate JSON from feeds and third-party responses so schema drift surfaces as explicit errors instead of silent bugs.

Note: Zod validates **data shape and constraints**. Separately, the product still needs deterministic **claim-level validation** (citations, confidence, stale data) in the domain layer; that is not a substitute for Zod and vice versa.

### 9.4 Authentication

Use `NextAuth.js` (Auth.js for the App Router) for user sign-in and sessions.

- **Providers:** **Google only** for MVP — no email/password or additional OAuth providers until there is a clear need.
- **Rationale:** fewer secrets to manage, no custom password storage, straightforward “Sign in with Google” UX aligned with managed auth.

Implementation notes to keep in mind:

- Configure the Google provider with OAuth client ID and secret from Google Cloud Console.
- Use the framework’s session patterns (`getServerSession` / `auth()` depending on package version) to protect server routes and personalize the app.
- If user profiles are stored in the database, sync or link accounts in callbacks using the stable provider subject identifier.

### 9.5 Data And Caching

- primary database for events, impacts, and profiles
- `Redis` or managed cache for hot dashboards and rate-limited source fetches
- object storage for raw source artifacts if needed later

### 9.6 AI And Reasoning

- `OpenAI` for summarization and constrained reasoning
- retrieval-first prompts grounded on stored source facts
- deterministic validation for important claims

Rule:
AI should enrich reasoning, not replace evidence.

### 9.7 Search And Geospatial

- geocoding provider for country and city normalization
- lightweight search first, then dedicated search engine only when needed

### 9.8 Monitoring

- structured logs
- source ingestion health dashboard
- stale data alerts
- event pipeline tracing

## 10. Build Vs Buy Guidance

Buy or use managed tools for:

- hosting
- authentication via NextAuth with Google OAuth (credentials managed in Google Cloud Console)
- database hosting
- caching
- observability
- email or notifications

Build in-house for:

- event taxonomy
- impact engine
- confidence logic
- persona-aware recommendation layer
- citation-first UI and trust model

That is the product moat.

## 11. Proposed MVP User Experience

### 11.1 Home Dashboard

- major active events
- impacted countries
- severity badges
- freshness timestamps

### 11.2 Personalized View

Inputs:

- country
- city or region
- persona

Outputs:

- event summary
- country impact
- local impact
- who is affected
- time horizon
- recommended actions
- source list
- confidence

### 11.3 Event Detail Page

- canonical event summary
- related sources
- impact map
- country comparison
- change over time

### 11.4 Admin Review Page

- raw sources
- normalized event payload
- generated inferences
- suppressed or approved recommendations

## 12. Implementation Roadmap

### Phase 0: Architecture And Validation

- finalize event taxonomy
- define domain models
- define trust and confidence rules
- choose first 5 to 8 sources

### Phase 1: Data Foundation

- build source connectors
- store raw documents
- normalize into events
- implement deduplication

### Phase 2: Impact Engine MVP

- encode first impact rules for fuel, supply chain, and policy events
- support country and city mapping
- create confidence scoring

### Phase 3: Web App MVP

- build dashboard
- build personalized event view
- build citations panel
- build admin inspection page

### Phase 4: Recommendation Quality

- improve persona-based action cards
- add freshness and contradiction handling
- add operator review tools

### Phase 5: Scale And Expansion

- add more countries
- add more languages
- expand event categories
- add notifications and saved watchlists

## 13. Key Risks

- low-quality news ingestion causing false alarms
- source terms restricting scraping or redistribution
- incorrect local impact mapping
- overconfident AI wording
- stale data presented as current
- poor citation UX reducing trust

Mitigations:

- prioritize official APIs and feeds
- build confidence caps
- log every output with source lineage
- add admin suppression controls
- expire stale action cards automatically

## 14. Tools Needed To Build This

Minimum engineering tools:

- `Next.js`
- `TypeScript`
- `Tailwind CSS`
- `Zod` for validation at API and form boundaries
- `NextAuth.js` with Google as the sole sign-in provider (MVP)
- database of choice such as `MongoDB`
- optional cache such as `Redis`
- `OpenAI` for grounded summaries and reasoning
- background jobs or scheduler for ingestion
- API clients for trusted sources
- logging and monitoring stack

Recommended product and ops tools:

- NextAuth (Google provider only for MVP)
- deployment platform
- error tracking
- analytics
- uptime monitoring

Recommended data-source starting set:

1. `GDELT`
2. `ReliefWeb API`
3. `GDACS`
4. `U.S. EIA Open Data API`
5. `PPAC India`
6. `World Bank Indicators API`
7. `RBI` or `MOSPI` or `data.gov.in`

## 15. Open Decisions

These should be resolved before heavy implementation:

- MongoDB vs Convex as the first backend
- exact geocoding and map provider
- which 5 to 8 sources are approved for MVP
- whether admin review is mandatory before all recommendations, or only high-severity ones
- whether the first release is India-first or multi-country from day one

## 16. Recommended Next Move

Build the first version as an India-first web app focused on:

1. fuel and energy shocks
2. supply chain disruptions
3. economic and policy changes

That keeps the dataset manageable, makes the demo concrete, and directly supports the motivating use case.

After this document, the next best artifact is a `SYSTEM_DESIGN.md` or `MVP_PLAN.md` that defines:

- exact APIs and connectors
- database schema
- page map
- first sprint task breakdown
