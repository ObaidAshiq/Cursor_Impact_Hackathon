# Frontend design implementation — Impact Intelligence

This document describes the **current** UI so every visual and structural choice can be reproduced from text alone. It maps to the Next.js app under `web/src`.

---

## 1. Product framing (content, not chrome)

- **App name (visible):** “Impact Intelligence” (site header link and document title).
- **Browser title / meta:** “Impact Intelligence”; description mentions global/regional events, India, sources, and confidence.
- **Tone:** Informational, calm, trust-oriented; disclaimers appear on event detail (small muted legal-style note at bottom).

---

## 2. Technical stack (affects implementation)

- **Framework:** Next.js (App Router).
- **Styling:** Tailwind CSS v4 (`@import "tailwindcss"` in `globals.css`), utility classes on elements.
- **Fonts:** Next.js `next/font/google` loads **Geist Sans** and **Geist Mono**; CSS variables `--font-geist-sans` and `--font-geist-mono` are registered on `<html>`. Note: `globals.css` sets `body { font-family: Arial, Helvetica, sans-serif; }`, which overrides the Geist body font unless changed — implementers should align body font with product intent (Geist vs Arial).

---

## 3. Global layout shell

### 3.1 Document root (`<html>`)

- **Attributes:** `lang="en"`.
- **Classes:** Geist variable classes, `h-full`, `antialiased`.

### 3.2 Body

- **Layout:** `min-h-full flex flex-col` (full viewport height, column flex).
- **Colors:** Background `zinc-50`, text `zinc-900`; dark mode: background `zinc-950`, text `zinc-50`.

### 3.3 Main content column

- **Placement:** Sibling below header, grows to fill space (`flex-1`).
- **Width:** `max-w-3xl` centered (`mx-auto`), full width of parent up to that cap.
- **Padding:** Horizontal `px-4`, vertical `py-8`.
- **Internal layout:** `flex flex-col` (stack children vertically).

---

## 4. Color and theme model

### 4.1 CSS variables (`:root` in `globals.css`)

- **Light default:** `--background: #ffffff`, `--foreground: #171717`.
- **Dark (prefers-color-scheme: dark):** `--background: #0a0a0a`, `--foreground: #ededed`.
- **Tailwind theme bridge:** `--color-background`, `--color-foreground` map to those variables; font tokens reference Geist variables.

The **visible** page chrome primarily uses **Tailwind zinc/orange/sky/violet/emerald/amber/rose** scales (see below), not only the CSS variables above.

### 4.2 Semantic palette (by usage)

| Role | Light mode (text description) | Dark mode (text description) |
|------|-------------------------------|------------------------------|
| Page background | Very light gray (zinc-50) | Near-black gray (zinc-950) |
| Primary text | Dark zinc (zinc-900) | Near-white (zinc-50) |
| Secondary / supporting text | Medium gray (zinc-600) | Lighter gray (zinc-400) |
| Tertiary / meta text | Muted (zinc-500) | Same family, adjusted for dark |
| Borders (cards, inputs, header) | Light border (zinc-200) | Dark border (zinc-800 / zinc-700) |
| Card surface | White | zinc-950 |
| Inline code | bg zinc-200, small text | bg zinc-800 |
| **Warning / status banners** | Amber border, pale amber fill, dark amber text | Darker amber border, translucent amber fill, light amber text |
| **Apify “live” badge** | Orange tint background, dark orange text | Deep orange bg, light orange text |
| **ReliefWeb “live” badge** | Sky tint, dark sky text | Deep sky bg, light sky text |
| **EIA “live” badge** | Violet tint, dark violet text | Deep violet bg, light violet text |
| **AI-assisted / Gemini** | Emerald tint, dark emerald text | Deep emerald bg, light emerald text |
| **Category / neutral pills** | zinc-100 bg, zinc-800 text | zinc-800 bg, zinc-200 text |
| **Confidence: high** | Emerald-100 / emerald-900 | emerald-950 / emerald-200 |
| **Confidence: medium** | Amber-100 / amber-950 | amber-950 / amber-100 |
| **Confidence: low** | zinc-200 / zinc-800 | zinc-800 / zinc-200 |
| **Confidence: insufficient** | rose-100 / rose-950 | rose-950 / rose-100 |
| **Primary CTA button** | Filled zinc-900, white text, hover zinc-800 | Inverted: light fill, dark text, hover white |
| **Secondary button (outline)** | Border zinc-200, zinc-700 text, hover zinc-100 | Border zinc-600, zinc-200 text, hover zinc-900 |
| **Citation kind chip** | White bg, zinc ring, zinc-700 text | zinc-950 bg, zinc-300 text, dark ring |
| **Citation row surface** | zinc-50/80 with border | zinc-900/40 with dark border |

---

## 5. Typography

### 5.1 Page titles (`h1`)

- **Size/weight:** `text-2xl font-semibold tracking-tight`.
- **Color:** Inherits primary foreground (zinc-900 / zinc-50 via body).

### 5.2 Section titles on event detail (`h2`)

- **Variant A (uppercase labels):** `text-sm font-semibold uppercase tracking-wide text-zinc-500` (dark: `text-zinc-400`).
- **Variant B (Method page sections):** `text-sm font-semibold` with explicit `text-zinc-900` / `dark:text-zinc-50` (sentence case, no uppercase).

### 5.3 Card titles (`h2` inside event cards)

- **Size:** `text-lg font-semibold tracking-tight`.
- **Color:** zinc-900 / zinc-50.
- **Link:** Default link styling with `hover:underline`.

### 5.4 Body copy

- **Intro / descriptions:** `text-sm` with `text-zinc-600` / `dark:text-zinc-400`.
- **Dense reading (Method, some event paragraphs):** `text-sm leading-relaxed text-zinc-800` or `text-zinc-700` with dark counterparts.
- **Lists (event detail):** `text-sm`, disc or decimal markers, `list-inside`, vertical spacing `space-y-1`.

### 5.5 Meta and captions

- **Timestamps, hints:** `text-xs text-zinc-500` (and dark variants as in source).
- **Filter group labels:** `text-xs font-medium uppercase tracking-wide text-zinc-500` / dark zinc-400.

### 5.6 Inline emphasis

- **Strong labels in body:** `<strong>` inside paragraphs (Method page).
- **Highlighted proper nouns (home intro):** `font-medium text-zinc-800` / `dark:text-zinc-200`.
- **Inline code:** `rounded bg-zinc-200 px-1 text-xs` / dark `bg-zinc-800`.

### 5.7 Header brand

- **Logo text:** `text-sm font-semibold tracking-tight text-zinc-900` / `dark:text-zinc-50`.

### 5.8 Navigation links

- **Default:** `text-sm`, zinc-600 / dark zinc-400.
- **Hover:** zinc-900 / dark zinc-100.

---

## 6. Spacing and rhythm

- **Page sections:** Common outer gap `gap-8` (home event page column, event article).
- **Tighter stacks:** `gap-6` (profile, method intro blocks).
- **Within sections:** `space-y-2` or `space-y-3` for vertical lists of blocks.
- **Filter groups:** `space-y-3` between Category / Persona / Region blocks; label margin below label `mb-1.5`.
- **Chip rows:** `flex flex-wrap gap-2`.
- **Card internal:** Padding `p-4`; title `mt-2`; paragraph `mt-2`; meta `mt-2`.

---

## 7. Elevation and surfaces

- **Event cards:** `rounded-xl border border-zinc-200 bg-white shadow-sm` (dark: border zinc-800, bg zinc-950).
- **Citation items:** `rounded-lg border` with softer fill (`bg-zinc-50/80` light, `dark:bg-zinc-900/40`).
- **Status alerts:** `rounded-lg border` + padding `px-3 py-2`.
- **Header:** Bottom border only; background **semi-transparent** white or zinc-950 with **backdrop blur** (`bg-white/80` / `dark:bg-zinc-950/80`, `backdrop-blur`).

---

## 8. Interactive patterns

### 8.1 Filter pills (FeedFilters)

- **Shape:** `rounded-full`.
- **Padding:** `px-3 py-1`.
- **Typography:** `text-xs font-medium`.
- **Ring:** `ring-1` always; **transition** on state.
- **Selected state:** Filled “inverse” — light mode: bg zinc-900, text white, ring zinc-900; dark mode: bg zinc-100, text zinc-900, ring zinc-100.
- **Unselected:** White (light) or zinc-950 (dark) background, zinc-700 / zinc-300 text, zinc-200 / zinc-700 ring; hover lightens/darkens surface (`hover:bg-zinc-50` / `dark:hover:bg-zinc-900`).
- **Behavior:** Each pill is a Next.js `<Link>`; navigation updates query string.

### 8.2 Primary button (Sign in, Profile CTA)

- **Shape:** `rounded-lg`.
- **Padding:** Sign in `px-2.5 py-1` (compact); Profile “View feed” `px-4 py-2`.
- **Style:** Dark filled in light mode (`bg-zinc-900 text-white hover:bg-zinc-800`); inverted in dark mode.

### 8.3 Secondary button (Sign out)

- **Shape:** `rounded-md`.
- **Style:** Outlined, `text-xs font-medium`, borders and hovers per section 4.2.

### 8.4 Text links (back to feed, citation titles)

- **Back link:** `text-sm font-medium` with zinc secondary colors and hover to primary-like contrast.
- **Citation title:** `font-medium`, underline on hover, `underline-offset-2`, opens in new tab (`target="_blank"`, `rel="noopener noreferrer"`).

### 8.5 Form controls (Profile)

- **Select:** Full width within max container, `rounded-lg border`, `px-3 py-2`, `text-sm`, white / dark zinc backgrounds.
- **Labels:** `text-sm font-medium` zinc-900 / zinc-50.
- **Helper text under region:** `text-xs text-zinc-500` / zinc-400.

---

## 9. Component specifications

### 9.1 SiteHeader

- **Structure:** Full-width header; inner row `max-w-3xl mx-auto`, horizontal padding `px-4`, vertical `py-3`, `flex justify-between items-center`, `gap-4`.
- **Left:** Single link “Impact Intelligence” (brand).
- **Right cluster:** `flex flex-wrap items-center gap-3 text-sm`.
  - **Nav:** Links “Feed”, “Profile”, “Method” in a row with `gap-3`.
  - **Divider:** Vertical rule `h-4 w-px` bg zinc-200 / dark zinc-700, **hidden below `sm`**, shown `sm:inline`.
  - **Auth:** Either user name (truncated `max-w-40`, `text-xs` muted) + Sign out form button, OR Sign in with Google button.

### 9.2 FeedFilters

- Three labeled groups: **Category**, **Persona**, **Region**.
- Each group: uppercase micro-label + row of pill links (section 8.1).
- Region includes an “All regions” option (empty value) plus city names.

### 9.3 EventCard

- **Container:** Article with card surface (section 7).
- **Top row:** Horizontal flex wrap, `gap-2`, `items-center`.
  - Optional **provenance** pill(s): Apify (orange), ReliefWeb (sky), EIA (violet) — only one typically shown; `rounded-full`, `px-2 py-0.5`, `text-xs font-medium`.
  - Optional **AI-assisted** pill (emerald) if narrative refined with Gemini.
  - **Category** pill: neutral zinc styling.
  - **Severity line:** `text-xs text-zinc-500` — “Severity N/5 · {horizon}”.
  - **ConfidenceBadge** for facts.
- **Title:** Linked heading (section 5.3).
- **India impact preview:** `text-sm` row with optional **AiContentMarker** at start (`flex gap-2`, marker `mt-0.5 self-start`); body `line-clamp-2 min-w-0 leading-relaxed`.
- **Footer meta:** “Updated {datetime}” in `text-xs` muted.

### 9.4 ConfidenceBadge

- **Shape:** `rounded-full`, `px-2.5 py-0.5`, `text-xs font-medium`.
- **Content:** Either explicit short `label` prop (e.g. “Facts”, “Inference”) or full sentence from level mapping (high/medium/low/insufficient).
- **Colors:** Per level (section 4.2).

### 9.5 AiContentMarker

- **Purpose:** Small inline “AI” tag for sections or lines touched by Gemini.
- **Visual:** Inline flex, shrink-0, `rounded` (not full pill), `border border-emerald-200`, `bg-emerald-50`, `px-1.5 py-0.5`, `text-[10px] font-semibold uppercase tracking-wide`, `text-emerald-900`; dark: darker emerald border/background/light text.
- **Tooltip:** `title` attribute explains AI drafting/refinement and points users to Sources.

### 9.6 CitationsPanel

- **Empty:** Single paragraph, `text-sm` muted — “No citations linked for this view.”
- **List:** `space-y-3` unordered list.
- **Each item:** Bordered rounded panel (section 7).
  - **Row 1:** Kind chip (Official / Multilateral / Media / Data) + “Retrieved {date}” in `text-xs` muted.
  - **Row 2:** External link (title), publisher line below in smaller muted text.

---

## 10. Page-by-page UI

### 10.1 Home (`/`)

- **Vertical stack** `gap-8`.
- **Hero block:**
  - H1: “Events that may affect you”.
  - Subparagraph: explains data sources (Supabase, Apify, EIA) with emphasized names and inline code for env var; muted small text.
  - Optional **live snapshot** line: `text-xs` muted timestamp.
  - Optional **status banners** (Apify, EIA, Gemini errors): amber alert pattern, `role="status"`.
- **FeedFilters** component.
- **Empty state:** Muted `text-sm` — no matching events.
- **Event list:** `ul` with `flex flex-col gap-4`, each `li` contains EventCard.

### 10.2 Event detail (`/event/[slug]`)

- **Article** wrapper `gap-8`.
- **Header block:**
  - Back link “← Back to feed”.
  - H1: event title.
  - Meta line: severity, horizon, updated time — `text-sm` muted.
  - Row of pills: same provenance/AI badges as card (wording: “AI-assisted narrative” on detail), two ConfidenceBadges (Facts, Inference).
  - Optional amber banner if `aiError`.
- **Sections (in order):** What we know (bullets + optional AI marker in heading); What we infer (bullets + marker); Impact on India (paragraph + marker); Local or city lens (paragraph or empty-state copy); Who is most affected (persona pills, neutral zinc full pills); What you can do (numbered list or empty-state); Sources (CitationsPanel).
- **Disclaimer:** Final `text-xs` muted paragraph (legal / not advice).

### 10.3 Profile (`/profile`)

- **Stack** `gap-6`.
- **Intro:** H1 “Your profile”, supporting `text-sm` muted paragraph.
- **ProfileForm:** Max width `max-w-md`, vertical `gap-6`, two selects + helper + primary link-styled CTA “View feed for my profile”.

### 10.4 Method (`/method`)

- **Stack** `gap-6`.
- **Intro:** H1 “Method”, muted description.
- **Sections:** Sentence-case `h2` (sm semibold), body `text-sm` with relaxed leading; bullet list for confidence definitions; MVP scope paragraph.

---

## 11. Motion and feedback

- **Explicit transitions:** Filter pills use `transition` on class list; hover states on links and buttons rely on color/background change (no custom keyframes in provided files).

---

## 12. Accessibility and semantics

- **Landmarks:** Header + main (main provided in layout).
- **Lists:** Semantic `ul`/`ol` where content is enumerated.
- **Status messages:** Error/info strips use `role="status"` where implemented.
- **AI marker:** Supplemental `title` for tooltip on hover/focus-capable clients.
- **External links:** `rel="noopener noreferrer"` on citations.

---

## 13. Responsive behavior

- **Header:** Nav and auth stay in one flex row with wrap; divider hides on narrow viewports.
- **Main column:** Single column; `max-w-3xl` prevents over-wide lines on large screens.
- **Chips and badges:** `flex-wrap` prevents overflow on small widths.

---

## 14. File map (implementation reference)

| Concern | Primary files |
|--------|----------------|
| Global CSS & theme tokens | `src/app/globals.css` |
| Shell, fonts, metadata | `src/app/layout.tsx` |
| Home | `src/app/page.tsx` |
| Event detail | `src/app/event/[slug]/page.tsx` |
| Profile | `src/app/profile/page.tsx`, `ProfileForm.tsx` |
| Method | `src/app/method/page.tsx` |
| Header | `src/components/layout/SiteHeader.tsx` |
| Feed filters, cards, badges | `src/components/events/*` |
| Citations | `src/components/citations/CitationsPanel.tsx` |

---

This document is the text-only mirror of the current UI. When the code changes, update this file so design and implementation stay aligned.
