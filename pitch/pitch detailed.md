# Impact Intelligence — Pitch Script

---

## 1. Hook

> A new tariff was announced this morning. Oil prices shifted overnight. A monsoon warning just hit the wires.
>
> Do you know what any of that means for *your* grocery bill, your commute, or your small business — *right now*?
>
> You shouldn't have to be an economist to answer that question.

---

## 2. Problem

Every day, dozens of global events — trade policy shifts, energy price swings, supply chain disruptions, humanitarian crises — ripple outward and land on real people in India.

But here's the gap:

- **News tells you *what* happened.** It doesn't tell you what it means for *you*.
- The same headline hits a commuter in Mumbai, a farmer in Punjab, and an SMB owner in Bengaluru completely differently — but they all see the same generic article.
- There is no way to know whether the information is verified fact or editorial speculation. No confidence level. No citation trail. No recommended action.
- By the time a person pieces it all together from six different sources — it's too late to act.

**The information exists. The understanding doesn't.**

---

## 3. Solution

**Impact Intelligence** is a persona-first intelligence feed that turns live global signals into actionable need cards for people in India.

Here's how it works:

1. **Ingest** — We pull live data from multiple real-time sources: Google News headlines via Apify, petroleum spot prices from the U.S. Energy Information Administration, humanitarian reports from ReliefWeb, and curated baseline events.

2. **Enrich** — Google Gemini reframes each signal through the lens of five specific personas: commuter, student, small business owner, farmer, and importer. It generates per-persona titles, summaries, and recommended actions — while preserving the original factual backbone.

3. **Present** — Each signal becomes a scrollable need card that answers three questions:
   - **What happened?** (sourced, cited, confidence-rated)
   - **Why does it matter to *me*?** (persona-specific framing)
   - **What should I do?** (concrete, time-bound recommended actions)

4. **Trust** — Every card carries a confidence badge (high / medium / low / insufficient) separating verified facts from inference, with a full citations panel linking to original sources.

---

## 4. Demo Walkthrough

> *[Open the live app at impact-cursor-hackathon.vercel.app]*

**Feed view:**
- Show the infinite-scroll feed of user need cards — each with a persona badge, urgency indicator, confidence level, and provenance tag (Live source / Curated).
- Point out the recommended action preview on each card.
- Show the local context blurb ("Local note: Mumbai diesel retail prices tend to lag…").

**Filtering:**
- Toggle the persona filter from "All" to "Commuter" — watch the feed re-render with commuter-specific framing.
- Switch category to "Energy & Fuel" — cards narrow to fuel cost and energy-related needs.
- Set region to "Mumbai" — cards gain city-level local notes.

**Event detail page:**
- Click into a card. Show the full event page with:
  - "What We Know" (fact-backed, green confidence badge)
  - "What We Infer" (AI-flagged, orange confidence badge)
  - India Impact narrative
  - Per-persona recommended actions
  - Full citations panel with publisher, retrieval date, and source type (official / media / data / multilateral)
  - AI provenance indicator showing which narrative blocks were refined by Gemini

**Graceful degradation:**
- Mention that every API is independently optional — remove the Apify key, curated events still flow. Remove Gemini, baseline narrative still renders. The app never breaks.

---

## 5. Differentiators

| Others | Impact Intelligence |
|--------|---------------------|
| Generic news aggregation | **Persona-first** framing — the same event produces different cards for a commuter vs. a farmer |
| No confidence signal | **Confidence badges** on every card distinguishing verified facts from AI inference |
| No sources visible | **Full citation trail** — publisher, date, URL, source type — for every claim |
| National-level reporting | **City-level local context** for Mumbai, Delhi, Bengaluru, Chennai, Hyderabad, Kolkata, and more |
| Alarmist or clickbait tone | **Conservative, measured guidance** — we frame actions, not fear |
| All-or-nothing architecture | **Graceful degradation** — works offline with zero API keys using curated seed data; each source is independently optional |
| Static articles | **Live ingestion pipeline** — Apify scraper, EIA spot prices, and ReliefWeb reports refresh on every load |

---

## 6. Impact

**Who this serves:**

- **130M+ daily commuters** in Indian metros who need to know when fuel prices will hit their wallets — before it happens, not after.
- **63M+ small businesses** that can't afford a Bloomberg terminal but need to understand how a tariff change or supply chain disruption affects their margins.
- **118M+ farming households** whose livelihoods depend on monsoon patterns, commodity prices, and trade policy — distilled into language they can act on.
- **Students and young professionals** entering the workforce who need economic literacy served in a format they actually use.

**What changes:**

- People stop reacting to news and start *preparing* for its effects.
- Trust in information rises because every claim is traceable.
- The gap between "macro event" and "personal action" shrinks from days to seconds.
- Regional equity improves — a farmer in rural Maharashtra gets the same quality of intelligence as a trader in South Mumbai.

**Built with Cursor:**

This entire application — data pipeline, AI enrichment layer, infinite-scroll feed, event detail pages, accessibility infrastructure, dark mode, citations system — was built in a hackathon sprint using Cursor as the primary development environment. Cursor's agent mode accelerated architecture decisions, component scaffolding, API integration, and iterative refinement across the full stack.

---

## 7. Close

> Impact Intelligence doesn't give you more news. It gives you *understanding*.
>
> Live signals. Persona context. Confidence levels. Source citations. City-level relevance. Recommended actions.
>
> Because the question was never "what happened in the world today."
>
> The question is: **"What does it mean for me — and what should I do about it?"**
>
> That's what we answer.
>
> **Try it live:** [impact-cursor-hackathon.vercel.app](https://impact-cursor-hackathon.vercel.app/)

---

*Built for the Cursor Impact Hackathon, March 2026.*
