# Impact Intelligence MVP Plan

## 1. MVP Goal

Ship an India-first web app that helps a user understand how major fuel, supply-chain, and economic-policy events may affect them locally.

The MVP must prove this loop:

1. ingest trusted signals
2. normalize them into one event
3. map event impact to India and optional local context
4. tailor guidance by persona
5. show citations and confidence

## 2. Product Scope

### In Scope

- India-first experience
- three event categories only
- feed plus event detail pages
- region and persona selection
- citation-first presentation
- confidence labels
- manual or semi-automated curation for reliability

### Out Of Scope

- full global coverage
- health and disaster expansion beyond relevance context
- investment or trading advice
- native mobile apps
- advanced notifications
- fully autonomous publishing without review

## 3. Primary Users

- commuter
- student
- small business owner
- farmer
- importer

## 4. Core User Stories

1. As a commuter in Mumbai, I want to know whether a fuel-related global event will likely affect my transport costs and what I should watch next.
2. As a small business owner, I want to know whether a logistics or trade disruption could affect inventory, deliveries, or costs.
3. As a student or budget household, I want simple explanations for inflation, subsidy, or policy changes and their likely local effect.
4. As a skeptical user, I want every major claim backed by sources and clearly separated from inference.

## 5. Exact V1 Features

### 5.1 Feed

- list of current published events
- category filter
- severity badge
- freshness timestamp
- persona and region filter

### 5.2 Event Detail

- event summary
- `what we know`
- `what we infer`
- India impact
- local impact
- who is most affected
- time horizon
- recommended actions
- citations panel
- confidence label

### 5.3 Profile

- city or region selector
- persona selector
- optional saved profile

### 5.4 Method Page

- how sources are chosen
- what confidence means
- what is fact vs inference
- limitations and disclaimers

### 5.5 Minimal Admin Flow

- add or review event drafts
- inspect sources
- approve or suppress outputs

## 6. MVP Event Categories

Only these three:

1. `energy_fuel`
2. `food_supply_chain`
3. `economic_policy`

Examples of good seed events:

- Strait of Hormuz disruption
- port or shipping bottleneck
- export ban on key commodities
- fuel pricing revision
- subsidy changes
- RBI rate decision

## 7. Recommended First Source Connectors

Priority order:

1. `RBI` official releases or notifications
2. `PIB` press releases
3. `PPAC India` or Ministry of Petroleum sources
4. `data.gov.in` or `MOSPI` datasets where useful
5. `U.S. EIA Open Data API` for energy context
6. `ReliefWeb API` for crisis spillover context
7. `GDELT` for early broad discovery

MVP rule:

- at least one official or highly authoritative source should support every published high-impact event

## 8. Data Milestones

### Milestone A: Canonical Event

Create the `Event` model with:

- id
- title
- category
- subtype
- severity
- horizon
- summary facts
- India impact
- local impact
- personas affected
- status

### Milestone B: Evidence Layer

Create supporting records:

- `Source`
- `RawDocument`
- `Evidence`

### Milestone C: Personalization

Create:

- `PersonaProfile`

Support:

- country
- city or region
- persona

### Milestone D: Reasoning Output

Create:

- `ImpactHypothesis`
- `ActionCard`
- `AuditRecord`

## 9. Page Map

1. `/`
   Home feed with filters

2. `/event/[slug]`
   Event detail page

3. `/profile`
   Persona and region preferences

4. `/method`
   Trust and confidence explanation

5. `/admin`
   Draft review queue

## 10. Delivery Sequence

### Phase 0: Setup

- initialize app shell
- define domain types
- define event taxonomy
- define trust and confidence policy

### Phase 1: Curated MVP

- seed 8 to 12 manually curated events
- build feed UI
- build event detail UI
- build citations and confidence components

### Phase 2: Personalization

- add persona selector
- add city or region selector
- tailor event outputs by persona

### Phase 3: Source Ingestion

- implement first official connectors
- store raw source payloads
- normalize into event drafts
- add draft review flow

### Phase 4: Automation And Hardening

- dedupe similar events
- add stale warnings
- add reprocessing
- improve mobile polish and demo reliability

## 11. Suggested 2-Week Sprint Plan

### Days 1 To 2

- scaffold app
- define models
- define UI structure
- create seed event data

### Days 3 To 4

- implement feed page
- implement detail page
- implement source citation panel
- implement confidence labels

### Days 5 To 6

- implement profile and persona selection
- implement local impact rendering
- refine copy for `what we know` vs `what we infer`

### Days 7 To 9

- implement first connector for `RBI`
- implement second connector for `PIB` or `PPAC`
- store raw documents and normalized drafts

### Days 10 To 11

- implement admin draft review
- add stale content handling
- tighten confidence rules

### Days 12 To 14

- seed final demo events
- improve responsiveness and polish
- rehearse demo flow
- fix reliability issues

## 12. Demo Success Criteria

The MVP is successful if it can demonstrate:

- at least 10 strong event entries
- coverage across all three categories
- citations on all important claims
- confidence labels on all modeled impact sections
- one or more live connector-generated drafts
- a clear user journey from event to local action

## 13. Demo Script

### Flow 1: Energy Shock

- choose persona `commuter`
- choose city `Mumbai`
- open a fuel-related event
- show India impact, local impact, and cautious actions
- open source citations

### Flow 2: Supply Chain Shock

- switch persona to `small business owner`
- open a logistics or trade disruption event
- show likely business impact and mitigation suggestions

### Flow 3: Policy Shock

- switch persona to `student` or `household`
- open an RBI or subsidy-related event
- show effect on expenses and budgeting pressure

## 14. Risks And Mitigations

### Risk: Scope Creep

Mitigation:

- keep only three event categories
- avoid global expansion in MVP

### Risk: Trust Failure

Mitigation:

- force citation-backed publishing
- separate fact from inference clearly

### Risk: Bad Automation

Mitigation:

- start with manual curation plus limited connectors
- require review for high-severity items

### Risk: Stale Information

Mitigation:

- show freshness timestamps
- expire action cards automatically

### Risk: LLM Overreach

Mitigation:

- use structured prompts
- validate outputs
- never allow uncited claims into final UI

## 15. Team Split Suggestion

If multiple people are building in parallel:

1. One person handles data models, connectors, and ingestion
2. One person handles feed, detail page, and profile UX
3. One person handles trust rules, citations, and admin workflow

## 16. Definition Of Done

Done means:

- the app can show a feed of impact events
- a user can select city and persona
- the detail page clearly separates fact and inference
- recommendations are cautious and persona-aware
- important claims are cited
- at least one live ingestion path exists
- the demo is stable on mobile and desktop

## 17. Recommended Immediate Next Step

After this plan, the next best move is to scaffold the actual app and create:

- base page routes
- TypeScript domain models
- seeded event JSON or database records
- first connector skeletons
