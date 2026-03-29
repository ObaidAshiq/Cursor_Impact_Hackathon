# After Effects Motion Graphics Prompt — Impact Intelligence SaaS Showcase

Use this as a creative brief / generation prompt for After Effects, Rive, Cavalry, or any AI video tool.

---

## Master Prompt

Create a 40–45 second SaaS product showcase video for "Impact Intelligence" — a live-signal intelligence feed that turns global news, energy data, and humanitarian reports into persona-first actionable cards for users in India. The style is premium motion graphics with a dark UI aesthetic, minimal typography, and smooth easing. No live-action footage. No stock photography.

---

## Visual Style

- **Color palette:** Deep zinc/charcoal (#09090b) background, white (#fafafa) text, zinc-400 secondary text, with accent pops of amber (#f59e0b) for confidence badges and emerald (#10b981) for verified indicators.
- **Typography:** Geometric sans-serif (Geist Sans or Inter). Tight tracking for headlines, relaxed leading for body. All-caps micro labels (e.g., "LIVE FEED", "CONFIDENCE: HIGH").
- **UI fidelity:** Recreate the actual product UI in motion — rounded-2xl cards with subtle borders, backdrop blur, pill-shaped filter tags, infinite-scroll feed layout. This is a real product, not a concept.
- **Motion language:** Spring-based easing (ease-out cubic, 300ms default). Cards enter with subtle Y-translate + opacity fade. Staggered delays (48ms per card). Smooth scroll powered by Lenis-style physics.
- **Depth:** Subtle parallax layers. Ambient mesh/grain texture in the hero section background. Floating particles or soft glow behind the logo.

---

## Scene-by-Scene Breakdown

### Scene 1 — The Noise (0:00–0:04)
**Visual:** Black screen. Dozens of fragmented news headlines (rendered as floating translucent text blocks) swirl in 3D space — too many to read, overlapping, chaotic. A faint ambient mesh grid pulses in the background.
**Motion:** Slow orbit camera. Headlines drift and collide.
**SFX:** Low sub-bass rumble. Digital static / glitch crackle (subtle, not aggressive).
**Text overlay:** None yet — let the visual chaos communicate.

### Scene 2 — The Clarity Moment (0:04–0:10)
**Visual:** All headline fragments snap toward center and compress into a single glowing point. The point expands into the **Impact Intelligence** wordmark. Behind it, the hero section of the app fades in — the rounded card with "What people like you may need to act on" headline, "LIVE FEED" micro-label, and the ambient mesh background.
**Motion:** Fast converge (200ms), hold logo (800ms), gentle push-in as hero section appears.
**SFX:** Clarity tone — a single clean sine sweep rising to a soft bell hit. Synth pad (Cm7) fades in underneath and holds.
**Text overlay:** Tagline fades in below logo: "Live signals. Persona-first intelligence."

### Scene 3 — Persona Engine (0:10–0:18)
**Visual:** The persona filter bar appears at the top. A cursor (or highlight ring) selects "Commuter" — the feed below morphs: cards shuffle, new ones slide in from below with staggered delays. Then the persona switches to "Farmer" — cards morph again. Quick flash of "SMB Owner" selection.
**Motion:** Pill selection has a background-fill animation (zinc-900 fills left-to-right). Cards exit with Y-translate down + opacity out, new cards enter with Y-translate up + opacity in. 48ms stagger between cards.
**SFX:** Soft UI click on each persona switch. Light rhythmic pulse (4-on-the-floor at ~110 BPM, very understated — felt more than heard).
**Text overlay:** "Framed for *your* life" — appears briefly, tracks with the feed.

### Scene 4 — Trust Layer (0:18–0:26)
**Visual:** Camera zooms smoothly into a single UserNeedCard. The confidence badge ("High confidence") animates in with a scale-up + glow pulse. Then the card flips or expands to reveal the citations panel — source links, dates, provenance labels ("Live source", "Curated"). A subtle checkmark icon draws on.
**Motion:** Smooth zoom (ease-out, 600ms). Badge entrance: scale 0→1 with overshoot spring. Citations panel slides in from the right edge.
**SFX:** Confirmation chime (two-note ascending, clean). Subtle bass hit when citations panel opens. Soft data-tick sound as each citation row appears.
**Text overlay:** "Every claim cited. Confidence scored." — centered, fades out before next scene.

### Scene 5 — Filters & Local Context (0:26–0:34)
**Visual:** Pull back to full feed view. The filter bar shows category ("Energy", "Trade", "Climate") and region ("Mumbai", "Delhi NCR", "Bengaluru") dropdowns animating open. A stylized map of India appears to the right — city dots glow as each region is selected. A "Local note" blurb appears on a card, highlighted.
**Motion:** Dropdown menus open with height-expand animation. Map city dots pulse sequentially (north to south). Card local-note text highlights with a background sweep.
**SFX:** Map ping sound (soft sonar blip) for each city highlight. Tempo increases slightly — energy builds.
**Text overlay:** "City-level context. Not generic news."

### Scene 6 — Closing (0:34–0:42)
**Visual:** The full feed scrolls smoothly (Lenis-style butter scroll). Cards stream past. The scroll slows and the view pulls back to reveal the full app in a device frame (laptop mockup, minimal chrome). The Impact Intelligence logo locks up center-screen with the URL below.
**Motion:** Scroll decelerates with exponential ease-out. Device frame fades in. Logo and URL enter with a gentle Y-translate + opacity.
**SFX:** Music resolves to tonic chord (Cmaj7). Brief silence beat (200ms). Clean logo stinger — single piano note + soft reverb tail.
**Text overlay:**
- Line 1: **Impact Intelligence**
- Line 2: `impact-cursor-hackathon.vercel.app`
- Line 3: "Live signals. Local context. Actions you can trust."

---

## Sound Design Notes

| Element              | Description                                                        |
|----------------------|--------------------------------------------------------------------|
| **Music bed**        | Minimal electronic ambient. Think Tycho, Rival Consoles, or Kiasmos. Cm key. 100–110 BPM (half-time feel). Builds gently from Scene 2, peaks at Scene 5, resolves at Scene 6. |
| **UI sounds**        | Clean, non-gimmicky. Soft clicks for interactions, subtle whooshes for transitions. Reference: Linear or Stripe product videos. |
| **Data sounds**      | Soft tick/chime sounds when data appears — confidence badges, citations, live timestamps. Conveys "real-time intelligence arriving." |
| **Logo stinger**     | Single note (piano or marimba) with medium reverb. Authoritative but not aggressive. |
| **Spatial audio**    | Subtle stereo panning as cards enter from different positions. Map pings pan left-to-right across Indian geography. |

---

## Export Specs

| Property      | Value                   |
|---------------|-------------------------|
| Duration      | 40–45 seconds           |
| Resolution    | 1920×1080 (16:9)        |
| Frame rate    | 60 fps (smooth scroll)  |
| Color space   | sRGB                    |
| Audio         | 48 kHz / 24-bit stereo  |
| Format        | MP4 (H.265) + ProRes master |

---

## Reference Aesthetic

- [Actual App for which video is to be created](https://impact-cursor-hackathon.vercel.app/) main website, that needs to be seen
- [Linear.app](https://linear.app) product videos — the dark UI, smooth transitions, understated confidence
- [Stripe Sessions](https://stripe.com/sessions) — typographic motion, data visualization elegance
- [Vercel Ship](https://vercel.com/ship) — developer-tool energy, clean motion design
- Arc Browser launch video — personality in UI animation without being loud
