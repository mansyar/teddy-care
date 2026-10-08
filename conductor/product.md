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

## Shipped (Track 3: Bubble Pop)
- The toy box now opens an icon-only mini-game menu (Runner 🏃 / Bubbles 🫧)
  instead of jumping straight into the runner — room to grow the arcade
- Bubble Pop mini-game at `/bubbles`: 30s round of soap bubbles rising with
  a gentle ramp (faster, smaller), tap to pop with a bright blip, star
  burst at the tap point, and a corner counter — no missing, no losing
- Round end always celebrates: "All done!" card banks stars via the shared
  reward math (guaranteed ≥1, capped at 5) plus a happiness boost
- Full parity: bubbles are real buttons (Tab + Enter/Space pop), reduced
  motion parks them in place instead of rising, sounds follow parent mute
  and bedtime; sprite + pop sound work fully offline via precache

## Shipped (Track 4: Puzzle Pieces)
- Third mini-game at `/puzzle`: a tap-to-place jigsaw — tap a piece (lift +
  wiggle + tick), tap its shadow outline (pop + snap); wrong outlines get a
  gentle shake + boop and bounce back with no penalty
- Three-round climb across three generated Teddy pictures (ball 2×2, tub
  3×2, bed 3×3), pictures sliced at runtime via CSS background math
- Every finished round banks exactly ⭐1 immediately (+ happiness boost);
  "Done for now" between rounds keeps earned stars — quitting is safe
- Full parity: pieces and outlines are real buttons (Tab + Enter/Space),
  reduced motion drops the animations, sounds follow parent mute/bedtime,
  all three pictures precached for offline play

## Shipped (Track 5: Wardrobe Expansion)
- The closet is a real wardrobe now: a bottom-sheet with a live preview
  strip — every look is a tappable card showing Teddy wearing it (rendered
  through the costume's own CSS filter, so the thumbnail is the truth)
- Four looks, tiered prices: the free default Comfy Onesie plus Sunset
  Onesie ⭐10, Mint Dream ⭐20 and Berry Night ⭐30 — every entry a filter
  recolor, so the choice shows up consistently in the idle room, walk
  cycle and runner
- Free switching once owned: tap to wear, tap the default card to go back;
  buying is a small celebration (sparkle burst + happy chime, respecting
  mute/bedtime) and the new look is worn immediately
- Tapping a look you can't afford yet gives a gentle wiggle + soft boop —
  never failure language; the star chip and worn state update live
- Saves moved to v2 with an owned-costume list; old saves migrate safely
  (the onesie you wore implies you own it), and the save database itself
  now opens at the schema version

## Shipped (Track 6: Real Music & Audio Polish)
- The placeholder 4-note loop is gone: every screen now has its own
  composed synthesized theme — a gentle music-box room theme, a bouncy
  runner arpeggio, watery bubble blips, a calm puzzle marimba, and a
  very soft bedtime lullaby (bedtime no longer means total silence)
- Themes loop seamlessly (lookahead scheduling on the audio clock, no
  drift or gaps) and crossfade in ~1s when Teddy moves between screens;
  the parent panel keeps whatever was playing — music never restarts
- Sound still honors the single parent mute everywhere, and playback
  waits for the child's first tap or keypress (autoplay unlock, no UI)
- SFX got richer without new assets: warmer sub-octave layering plus
  tiny noise textures (crunchy bites, scuffy footsteps, fizz, chime
  tails) — same recognizable signatures, same mute/bedtime kindness
- Still zero audio files: everything is synthesized WebAudio, so the
  install payload and offline story are unchanged

## Shipped (Track 7: Save Integrity)
- Invisible reliability work: Teddy's progress (stars, stats, costume)
  now has a single owner in the app — a parent toggling mute or bedtime
  can no longer wipe stars the child just earned, and saved star values
  are clamped so a corrupted save can't produce impossible numbers

## Deferred (Post-MVP)
- Pet collection metagame

## Constraints & Principles
- Offline-first, local-only, no login; COPPA-safe: zero analytics
- No ads, no IAP — free MVP
- Performance: tiny install payload, 60fps care UI, sheet/WebP animation
- Kindness: timers encourage, never punish; bedtime mode dims and quiets
