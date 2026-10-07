# Product Definition — Teddy Care (working title)

## Vision
An offline-first PWA pet-raising game for young children starring **Teddy**,
a cartoon bear in a blue-and-white striped onesie (modeled on the owner's
son's doll). One living pet on one warm screen: feed him, wash him, rest him,
play with him — and he loves you back with expressive faces, breathing idle
motion, and playful reactions. Free forever, no ads, no accounts, zero
tracking.

## Audience
- **Primary:** children ages 4+ (pre-readers — icons and cause-effect, not text)
- **Secondary:** parents (trust, bedtime, peace of mind)
- **Playtester-in-chief:** the owner's son

## Core Loop
1. Check Teddy's mood (face tells the story: happy / sad / sleepy / eating / blink-idle)
2. Care action: feed, wash, rest, pet — 4 stats (hunger, happiness, energy, cleanliness)
3. Earn stars → unlock costumes
4. Mini-games for joy + stars: tap game, runner/platformer, puzzle
5. Kind offline timers nudge return visits — never punish

## MVP Scope (Track 1)
- Single-screen care UI, one pet (collection metagame deferred)
- 5 emotion stills + breathing idle (depth 0.06, 2 breaths per 2s loop, face rigid)
- 15-frame run loop for the runner (sprite strip + WebP)
- 3 mini-games, parent panel + bedtime mode, music + SFX with parent mute
- Full offline, IndexedDB persistence, installable PWA, responsive 360px → desktop

## Shipped (Track 2: Teddy's Room)
- Care happens in a wander-around room: tap a POI (bowl, bed, tub, toy box,
  closet) or the floor and Teddy walks there, then the care action fires on
  arrival — no buttons
- Tap Teddy himself to pet; room reads as object state (bowl fill, scruffy
  fur, droopy posture, mood face), not numeric bars; star chip in the corner
- Portrait + landscape room layouts; bedtime stages the room (night tint,
  glowing bed, sleeping Teddy); reduced-motion skips walks but keeps feedback
- New gentle walk cycle + room art via the sprite-gen pipeline; new room
  sounds (footsteps, munch, fizz, yawn) behind the same parent mute/bedtime

## Deferred (Post-MVP)
- Costume system (accessories + palette recolor, not per-face redraws)
- Pet collection metagame

## Constraints & Principles
- Offline-first, local-only, no login; COPPA-safe: zero analytics
- No ads, no IAP — free MVP
- Performance: tiny install payload, 60fps care UI, sheet/WebP animation
- Kindness: timers encourage, never punish; bedtime mode dims and quiets
