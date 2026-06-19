# Dogedex — Product Overview

> **Status**: V1 product definition — ready for design/build handoff
> **Last updated**: 2026-06-19
> **Core loop**: Snap → Share

## What It Is

Dogedex is a dog-spotting companion app — a Pokédex for dogs, built around a single core loop: **Snap → Share**. Users photograph dogs they encounter, instantly identify the breed with AI, tag the GPS location, and share the sighting — adding it to their personal collection and broadcasting the encounter to fellow dog lovers. Every entry can hold personal comments and notes. The experience is personal (your Dogedex, your collection) and social (share the joy with every dog lover in the world).

---

## Users & Audience

**Primary user**: Every dog lover in the world — anyone who encounters dogs in daily life (on walks, in parks, on city streets, at cafés) and wants a satisfying, structured way to identify breeds, remember where they saw them, and build a growing personal collection. The appeal is universal: casual dog admirers through to devoted breed enthusiasts.

**Ambition**: Mass-market consumer app — the joy and completeness of a personal Dogedex for anyone who loves dogs, anywhere on the planet.

**Archetype**: Consumer hobbyist with global reach — the experience is deeply personal (your collection, your sightings) but the audience is everyone who loves dogs.

---

## Positioning

- **Tagline**: Gotta pat 'em all — one dog at a time.
- **Concept parallel**: Pokédex for dogs — the satisfaction of a new entry being filled in and the thrill of an ever-growing collection.
- **Brand feeling**: Warm, playful, slightly nerdy in the best way. The "got it!" moment when a new breed is identified and added to the Dogedex.
- **Tone**: Joyful, clean, personal. Not clinical — this is about the love of dogs and the delight of discovery.

---

## Core User Flow (Snap → Share)

The whole product is one loop. Target: see dog to shared in under 30 seconds.

1. **Open & Snap** — user taps the central Snap action, frames the dog, captures a photo in-app.
2. **Identify** — AI returns the most likely breed with a confidence score while the capture-reveal plays.
3. **Tag location** — app suggests a readable place name from GPS (if permission granted); user confirms or edits. Declining permission never blocks the next step.
4. **Add notes** — optional comment: the dog's name, mood, encounter context.
5. **Share** — one tap broadcasts the sighting to the global map/feed **and** stamps it into the personal Dogedex at the same time.
6. **Payoff** — entry lands in the collection with the stamp-to-dex moment; rarity tier, streak, and any new badge surface here.

Steps 2–4 happen on one review screen so the loop stays fast; only Snap and Share are required taps.

---

## App Structure & Navigation

Bottom tab bar, five destinations, with Snap as the raised center action (standard 5-slot mobile pattern).

| Slot | Tab | Purpose |
|---|---|---|
| 1 | **Feed** | Home: a scrollable stream of recent shared sightings from dog lovers worldwide — the social heartbeat and default landing tab. |
| 2 | **Map** | Global Sightings Map: recent shared sightings worldwide as pins. |
| 3 (center) | **Snap** | Camera capture — raised, primary action, always one tap away. |
| 4 | **Dogedex** | Personal collection: spotted breeds, with silhouette placeholders for un-spotted ones. The trophy case. |
| 5 | **You** | Profile: streaks, badges, milestones, collection stats, and settings (permissions, etc.). |

The post-capture review screen (identify, location, notes, share) is a flow launched from Snap, not a tab.

---

## Core Features

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Photo Capture (Snap)** | In-app camera to photograph dogs encountered in the wild — the trigger for the whole loop. |
| 2 | **Share Sighting** | Instantly share the encounter — broadcasts the sighting and adds it to the personal Dogedex simultaneously. |
| 3 | **AI Breed Identification** | Automatic breed detection from the captured photo, with confidence score. |
| 4 | **Smart Location Tagging** | On capture, the app asks for location permission and auto-suggests a readable place name from GPS (Instagram-style) — the user confirms or edits it. Both the coordinates and the place label are stored. Saving is never blocked if permission is declined. |
| 5 | **Dogedex Collection** | A running, Pokédex-style catalogue of all breeds spotted — showing what's been found and what remains to be discovered. |
| 6 | **Comments & Notes** | Per-entry commenting for personal observations, the dog's name (if learned), or encounter context. |
| 7 | **Global Sightings Map** | A dedicated map tab showing recent shared sightings from dog lovers worldwide as pins — tap a pin for the dog's photo, breed, and place, and jump to the full sighting. Only shared sightings appear. |
| 8 | **Global Feed** | The home tab: a scrollable stream of recent shared sightings worldwide — photo, breed, place, notes. The social heartbeat that makes Share feel worth doing. Only shared sightings appear. |
| 9 | **Streaks & Badges** | Gamification surfaced on the You tab: consecutive-day spotting streak, milestone badges (breed counts, first legendary, countries mapped), and collection stats. |

---

## Scope Boundaries (V1)

- One complete "dog encounter" = photo + share + AI breed ID + location tag + notes = one Dogedex entry
- **Snap → Share is the primary V1 loop** — sharing is a first-class action, not a future add-on
- Audience is global: every dog lover, not a closed personal diary
- No user accounts or multi-device sync in V1 (sharing is lightweight, not full social network)
- Breed identification accuracy is shown with a confidence score so the user can correct it if needed

---

## Strategic Principles

1. **Snap → Share is the heartbeat** — the entire UX is optimised around this two-step loop. Everything else serves it.
2. **Speed of capture is critical** — from "see dog" to "shared" in under 30 seconds. Friction kills the habit.
3. **Every interaction should feel like filling in a Pokédex entry** — satisfying, complete, collectible.
4. **The collection view is the emotional payoff** — it must feel like a trophy case of every dog ever spotted.
5. **Breed ID confidence matters** — show the AI's confidence score; let the user override.

---

## Design Direction

**Concept**: *The Field Guide Arcade.* A sun-bright collector's almanac that behaves like a reward machine. The page reads like a well-loved field guide (paper warmth, hand-stamped entries, ink); the moments react like an arcade (a capture flips, shimmers, lands with a thunk). Wild and fun comes from energy and feedback, not clutter.

**Anti-references** (what it must never look like):
- Soft pastel "puppy app" with rounded everything and paw-print confetti as decoration
- Retro 8-bit / GameBoy pixel skin (the obvious Pokédex costume)
- Clinical white SaaS with a tidy card grid

### Theme — Light

Scene: a dog lover on a sunny afternoon walk, phone out, one-handed, capturing a stranger's dog between two cafés. Bright ambient light, upbeat mood, glanceable. Light mode is the home; daylight is the brand.

### Color — Full palette, light

Warm paper base, three saturated play colors, one reward gold. Tint every neutral toward the warm base hue. OKLCH, lower chroma at the extremes.

| Role | Name | OKLCH | Use |
|---|---|---|---|
| Surface | Bone cream | `oklch(0.97 0.015 85)` | App background, paper |
| Ink | Wet nose | `oklch(0.24 0.02 60)` | Text, outlines, stamps |
| Primary | Tennis ball | `oklch(0.86 0.18 128)` | Capture button, key actions, energy |
| Secondary | Tongue coral | `oklch(0.72 0.17 25)` | Highlights, likes, "got it" bursts |
| Tertiary | Sky-walk | `oklch(0.70 0.13 240)` | Map pins, location chips, links |
| Reward | Good-boy gold | `oklch(0.82 0.13 85)` | Rarity, new-breed foil, badges |

Color carries identity here, not a single timid accent. Big saturated fields are intentional.

### Type

Chunky rounded display for the loud moments (breed name reveal, "New entry!", counts), clean humanist sans for body and metadata. Strong scale jumps (≥1.33 step) so a finished entry shouts and the notes whisper.

### Gamification system

The point of difference. Capture is a slot-pull; the Dogedex is a trophy case.

- **Capture reveal** — snap triggers a card that flips from back to front; breed name + confidence "rolls" in like a counter settling.
- **Rarity tiers** — common / uncommon / rare / legendary by how often that breed is spotted globally. Rare breeds get a gold foil shimmer on the card edge.
- **Stamp-to-dex** — a new entry lands in the collection with a physical rubber-stamp thunk and a short kibble-burst (themed confetti, used sparingly, real moments only).
- **Streaks & milestones** — consecutive-day spotting streak; badges at breed-count thresholds ("10 breeds", "First legendary", "Mapped 3 countries").
- **Collection completeness** — silhouette placeholders for un-spotted breeds, the classic "gotta find this one" pull.

### Texture & depth

Tactile, not flat: subtle risograph/halftone print grain on surfaces, die-cut sticker shadows on badges and pins (thin white border + soft drop), stamped-ink treatment on entry metadata. No glass, no gradient text, no side-stripe borders.

### Motion

Reward feedback, ease-out (quart/expo), no bounce. Animate transforms/opacity only. Big payoff on capture and stamp-to-dex; quiet everywhere else so the loud moments land.

**Subtle emphasis is what makes it feel like an app, not a web page.** Two tiers of motion:

- **Loud moments** (rare, earned): capture reveal, stamp-to-dex, new-breed foil shimmer, kibble-burst. These are the dopamine.
- **Quiet craft** (everywhere, constant): the texture of nativeness. Without it the app feels flat and web-like.
  - Tab switches: content cross-fades/slides, active tab icon springs slightly.
  - Touch feedback: every tappable element scales down ~2–4% on press (`:active`), with a light haptic tap on capture, share, and stamp.
  - Lists & cards: entries fade-and-rise in on load with small staggered delays, not all at once.
  - State changes: counts roll instead of snapping; toggles and chips ease between states.
  - Loading: skeletons and gentle pulses, never a bare spinner on a blank screen.

Rule: loud moments must stay rare to keep their punch; quiet feedback must be everywhere to keep the app feeling alive and responsive. Respect `prefers-reduced-motion` — drop movement to fades, keep haptics.

---

## Open Questions (to resolve before/during build)

These affect architecture and scope; flagged for the handoff so they aren't discovered late.

- **Attribution without accounts** — V1 has no user accounts, but sharing is public. How are shared sightings attributed (anonymous device handle, display name on first share)? How does a user see only their own collection across reinstall?
- **Rarity needs a backend** — rarity tiers depend on global spotting counts, so even an "accountless" V1 needs a shared sightings store and a breed-frequency source.
- **Canonical breed list** — collection completeness (silhouette placeholders) requires a fixed master list of breeds. Source and count to be decided; must match what the AI model can return.
- **Breed ID model** — provider/model, breed coverage, on-device vs API, latency budget against the sub-30-second target, and handling of mixed-breed or no-dog photos.
- **Content moderation** — public map/feed means user photos are broadcast. Minimum moderation/reporting for V1.
- **Offline capture** — behavior when offline at capture time: queue the snap and identify/share later, or require connectivity.
- **Map privacy** — exact GPS vs coarsened location on the public map to avoid revealing homes.
