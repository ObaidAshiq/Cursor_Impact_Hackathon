# Impact Intelligence System Design

## 1. Purpose

This document translates the product architecture into a practical system design for an India-first MVP.

Goal:

- ingest trusted event signals
- normalize them into canonical events
- infer likely India and city-level impact
- generate cautious persona-aware action guidance
- expose every important claim with citations and confidence

## 2. System Context

Primary users:

- India-based consumers
- small business owners
- students
- commuters
- operators reviewing risky outputs

External dependencies:

- global event and news sources
- India government and regulator sources
- macroeconomic and energy data providers
- geocoding provider
- AI reasoning provider
- auth and hosting providers

## 3. Recommended MVP Stack

Frontend:

- `Next.js` App Router
- `React`
- `TypeScript`
- `Tailwind CSS`

Backend:

- Next.js route handlers for product APIs
- background worker for ingestion and processing

Storage recommendation:

- `MongoDB Atlas`

Why `MongoDB` first:

- raw ingestion payloads are heterogeneous
- canonical event shapes will evolve quickly
- document storage fits source snapshots and evidence metadata well
- the app is ingestion-heavy before it is realtime-heavy

Supporting infrastructure:

- `Redis` or managed cache for hot queries and rate-limited fetch state
- object storage for large raw source payloads if needed
- `OpenAI` for grounded summarization and constrained reasoning

## 4. High-Level Components

### 4.1 User-Facing Layer

- `Web App`
  Feed, event detail pages, personalized view, source citations, confidence display

- `API Layer`
  Thin backend-for-frontend that reads published event snapshots and profile context

### 4.2 Data And Processing Layer

- `Connector Layer`
  One connector per source family

- `Raw Ingestion Store`
  Immutable raw responses and fetch metadata

- `Normalization Layer`
  Converts source-specific payloads into a canonical event format

- `Deduplication Layer`
  Clusters related source items into one event

- `Impact Engine`
  Maps events to India, state, city, and persona-level implications

- `Recommendation Engine`
  Produces conservative `what you can do` outputs

- `Trust And Confidence Service`
  Scores evidence quality, corroboration strength, recency, and publish readiness

### 4.3 Human Control Layer

- `Admin Review Console`
  Inspect sources, approve or suppress events, trigger reprocessing

- `Audit Store`
  Persist source lineage, rules used, model version, and moderation decisions

## 5. End-To-End Data Flow

1. Scheduled jobs fetch from approved sources
2. Raw payloads are stored with source metadata and content hashes
3. Parsers extract titles, summaries, time, geo hints, and categories
4. Related source items are deduplicated into canonical events
5. Event classification maps into one of three MVP categories
6. Geography and entity resolution determine India relevance and local scope
7. The impact engine creates `ImpactHypothesis` records
8. The recommendation engine creates persona-aware `ActionCard` drafts
9. Trust and confidence rules decide whether to publish, hold, or suppress
10. Published outputs are exposed through the web app and APIs

## 6. C4-Style Container View

### 6.1 Web App

Responsibilities:

- render feed and detail pages
- collect region and persona preferences
- display `what we know`, `what we infer`, and `what you can do`

### 6.2 Application API

Responsibilities:

- serve filtered events
- serve personalized impact views
- update user profile
- expose admin review endpoints

### 6.3 Worker Process

Responsibilities:

- run scheduled ingestion
- normalize and dedupe
- compute impact hypotheses
- generate and refresh action cards
- expire stale outputs

### 6.4 Primary Database

Responsibilities:

- store canonical business records
- store evidence and audit lineage
- support event, profile, and admin workflows

### 6.5 Cache Layer

Responsibilities:

- cache home feed
- cache personalized result snapshots
- store rate-limit and job coordination metadata

## 7. Source Connector Design

Each connector should implement the same contract:

- fetch latest source data
- parse into source DTO
- emit normalized records
- store raw payload reference
- provide connector health status

Recommended MVP connectors:

1. `RBI` or official notifications feed
2. `PIB` press release feed or structured government notices
3. `PPAC India` or Ministry of Petroleum sources
4. `ReliefWeb API` for crisis context when relevant
5. `GDELT` for broad discovery
6. `U.S. EIA Open Data API` for energy context

Connector metadata should capture:

- `connectorKey`
- `sourceName`
- `sourceTier`
- `pollInterval`
- `rateLimitHint`
- `lastSuccessfulRunAt`
- `lastError`

## 8. Canonical Domain Model

### 8.1 Source

Fields:

- `id`
- `name`
- `baseUrl`
- `sourceTier`
- `regionHint`
- `enabled`

### 8.2 RawDocument

Fields:

- `id`
- `sourceId`
- `externalId`
- `url`
- `fetchedAt`
- `contentHash`
- `mimeType`
- `rawRef`
- `parseStatus`
- `error`

### 8.3 Event

Fields:

- `id`
- `slug`
- `title`
- `summaryFacts`
- `category`
- `subtype`
- `status`
- `severity`
- `timeRange`
- `locations`
- `indiaRelevance`
- `publishedAt`

### 8.4 Evidence

Fields:

- `id`
- `eventId`
- `rawDocumentId`
- `url`
- `title`
- `publisher`
- `retrievedAt`
- `claimType`
- `trustWeight`

### 8.5 ImpactHypothesis

Fields:

- `id`
- `eventId`
- `scope`
- `geoId`
- `statement`
- `isInference`
- `severity`
- `confidence`
- `rationale`
- `modelVersion`

### 8.6 ActionCard

Fields:

- `id`
- `eventId`
- `persona`
- `geoId`
- `urgency`
- `text`
- `citationIds`
- `confidence`
- `expiresAt`
- `status`

### 8.7 PersonaProfile

Fields:

- `userId`
- `country`
- `cityOrRegion`
- `persona`
- `preferences`

### 8.8 AuditRecord

Fields:

- `id`
- `entityType`
- `entityId`
- `pipelineRunId`
- `sourceIds`
- `ruleIds`
- `llmCallIds`
- `outcome`
- `createdAt`

## 9. Event Taxonomy For MVP

Only support these categories in v1:

1. `energy_fuel`
2. `food_supply_chain`
3. `economic_policy`

Examples of subtypes:

- oil chokepoint disruption
- refinery outage
- export restriction
- port congestion
- inflation update
- subsidy change
- rate decision

## 10. Trust And Confidence Subsystem

Every event response must present three distinct sections:

- `What we know`
- `What we infer`
- `What you can do`

Confidence inputs:

- source tier
- number of independent sources
- recency of evidence
- direct relevance to India
- precision of local mapping

Confidence outputs:

- `high`
- `medium`
- `low`
- `insufficient`

Policy rules:

- urgent actions require at least one official or highly authoritative source
- single-source evidence caps confidence
- stale evidence downgrades confidence
- conflicting evidence triggers admin review or soft wording
- the model cannot generate claims unsupported by stored evidence

## 11. AI Usage Model

AI is allowed for:

- summarization
- structured reasoning from stored facts
- persona-specific action wording

AI is not allowed to:

- invent evidence
- fabricate citations
- make numeric predictions without data backing
- merge fact and inference into one ambiguous statement

Recommended pattern:

1. retrieve structured facts and citations
2. prompt the model with only approved evidence
3. require structured JSON output
4. validate output against schema
5. reject outputs with unsupported claims

## 12. API Design

### 12.1 Public APIs

- `GET /api/v1/events`
  Returns published events with filters for category, severity, persona, and region

- `GET /api/v1/events/[slug]`
  Returns event details, evidence, impact sections, action cards, and confidence

- `GET /api/v1/me/profile`
  Returns saved user preferences

- `PATCH /api/v1/me/profile`
  Updates city, region, persona, and preferences

- `GET /api/v1/feed/personalized`
  Returns a personalized feed based on stored profile context

### 12.2 Internal APIs

- `POST /internal/v1/ingest/run`
  Starts a connector run

- `POST /internal/v1/events/[id]/reprocess`
  Recomputes impact and recommendations for one event

### 12.3 Admin APIs

- `GET /api/v1/admin/queue`
- `POST /api/v1/admin/events/[id]/approve`
- `POST /api/v1/admin/events/[id]/suppress`
- `POST /api/v1/admin/action-cards/[id]/approve`
- `POST /api/v1/admin/action-cards/[id]/suppress`
- `GET /api/v1/admin/audit`

## 13. Storage Design

Suggested collections:

- `sources`
- `raw_documents`
- `events`
- `evidence`
- `impact_hypotheses`
- `action_cards`
- `persona_profiles`
- `audit_records`
- `admin_decisions`
- `pipeline_runs`

Critical indexes:

- unique on `raw_documents(sourceId, externalId)`
- unique on `raw_documents(contentHash)` where applicable
- index on `events(status, publishedAt)`
- index on `events(category, severity)`
- index on `action_cards(eventId, persona, geoId)`
- index on `action_cards(status, expiresAt)`

## 14. Job Design

Scheduled jobs:

- connector ingestion every 5 to 30 minutes depending on source
- indicator refresh daily
- stale output sweep hourly
- contradiction and evidence refresh daily

Async jobs:

- parse and normalize raw payload
- dedupe and merge event clusters
- run impact engine
- run recommendation generation
- reprocess event on admin request

## 15. Admin Workflow

Admin states:

- `draft`
- `needs_review`
- `approved`
- `published`
- `suppressed`

Admin capabilities:

- inspect raw evidence
- compare clustered source items
- approve or suppress outputs
- override title or display severity
- trigger event reprocessing

High-risk outputs should enter `needs_review` automatically when:

- confidence is low but severity is high
- evidence conflicts
- local mapping is weak
- only one non-official source exists

## 16. Deployment Topology

Recommended MVP deployment:

- `Next.js` on Vercel
- `MongoDB Atlas` in an India-friendly region
- managed `Redis`
- background worker on Railway, Render, or another simple Node host

Environment separation:

- local
- preview
- production

Secrets to manage:

- database URL
- cache URL
- OpenAI API key
- source provider keys if needed
- internal API secret
- auth provider secrets

## 17. Observability

Track at minimum:

- ingestion success rate
- connector latency
- stale published events
- recommendation generation failures
- admin queue depth
- API error rate
- LLM cost and usage

Logs should include:

- `pipelineRunId`
- `connectorKey`
- `eventId`
- `durationMs`
- `outcome`

## 18. Security And Privacy

Requirements:

- role-based access for admin endpoints
- secret-protected internal routes
- rate limiting on public APIs
- schema validation on all writes
- server-only access to AI and source credentials
- minimal PII collection
- no raw profile details in logs

Privacy principle:

Store explicit user preferences, not continuous location tracking.

## 19. Build Order

1. Define TypeScript domain types
2. Set up database collections and repository layer
3. Build first two connectors
4. Implement raw document storage and normalization
5. Implement dedupe and canonical event creation
6. Implement impact hypothesis generation
7. Implement confidence and citation rules
8. Build feed and event detail APIs
9. Build UI pages
10. Add admin review flow

## 20. Open Technical Decisions

- exact geocoding provider
- whether to store raw payloads in MongoDB or object storage
- whether admin review is required for all new events or only higher-risk ones
- whether auth is included in MVP or deferred
- whether background jobs run inside the app host or a separate worker from day one
