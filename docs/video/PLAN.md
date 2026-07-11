# Kalshi Market Videos — Production Plan

Turning interesting Kalshi prediction markets into short, funny, data-heavy
YouTube videos. Fireship-inspired pacing and density; Fantasy Reality pixel-art
house style; the animated market chart is the star of every episode.

Example episode: the [next Fed rate hike market](https://kalshi.com/markets/kxfedhike/next-fed-rate-hike/fedhike)
— what the market prices, why, and what moved the odds.

Research notes behind every decision here live in [`research/`](research/)
(five deep-dives: voice, generative video, motion stack, meme sourcing,
format/strategy — all current as of July 2026).

---

## 1. The show

**Format.** 2–4 minute flagship explainers on YouTube, one recurring series
(working title: **"The Market Says"**). Cold open on the odds number — no
intro, payoff in the first 3 seconds ("The market says 4% the Fed hikes this
year. Here's why that number is doing something weird."). ~180–200 WPM, a
visual change every 1–3 seconds, a joke beat every 10–20 seconds, zero dead
air. Cut 30–60s vertical clips (one odds swing + one punchline) for
Shorts/TikTok from each episode.

**What we borrow from Fireship (format conventions, fair game):** cold-open
hook, sub-5-min density, faceless VO + meme cutaways, kinetic word-pop
captions, snappy SFX on cuts, contrarian number-driven titles, minimal
high-contrast thumbnails.

**What we do NOT copy (his signatures):** "…in 100 Seconds" naming, the
"Code Report" sign-in line, his sponsor-segue cadence, the code-syntax
"like & subscribe" gag, his VO persona.

**What makes it ours:**

- **The pixel-art house style.** Press Start 2P + Space Mono, Hyper Light
  Drifter palette, hard offset shadows — already built and validated in
  `fr_newsletter/viz/theme.py`. A hard visual fork from Fireship's
  flat-vector/neon look, applied to *everything*: charts, captions,
  thumbnails, transitions, SFX (chiptune blips).
- **"The Tape."** The signature segment: the market's price history replays
  as an animated pixel ticker — line drawing on, a "now" cursor riding the
  tip, odds counter flipping, event callouts popping in as the VO narrates
  what moved each spike. Nobody else is doing prediction-market news with
  real animated dataviz; this is the moat.
- **A pixel mascot** (an 8-bit oracle / degenerate gambler goblin) who
  reacts to odds swings — fills the faceless-personality gap the way memes
  do for Fireship, but ownable. Generated/iterated with the existing Nano
  Banana sprite pipeline.
- **"Resolution Watch"** end-card: a running scoreboard of markets the
  channel covered vs. how they resolved. Return-viewer hook + credibility.

**The lane is open:** as of mid-2026 there is no dominant Kalshi/Polymarket
explainer channel — the space is sponsored integrations, finance-news
channels, and clip farms. Polished + funny + real dataviz is unclaimed.

---

## 2. Architecture: script + market data in → video out

The pipeline extends what the repo already does (story JSON → styled chart
PNG) into the time dimension:

```
                    ┌─ Python (existing) ──────────────────────────┐
 Kalshi API ──────► │ fr_newsletter.data.kalshi → per-episode      │
                    │ data.json (series, annotations, key stats)   │
                    │ + theme-tokens.json (palette/fonts/shadows)  │
                    └──────────────┬───────────────────────────────┘
                                   │
 script.md ──► ElevenLabs v3 ──────┤  VO + character-level timestamps
 (beats, meme     (/with-          │  (no forced-alignment step needed)
  intents,        timestamps)      │
  SFX cues)                        ▼
                    ┌─ Remotion (new, TypeScript) ─────────────────┐
                    │ video.json (scenes, props, timings) drives:  │
                    │  MarketChartScene · KineticTitle ·           │
                    │  CaptionLayer · MemeCutaway · SpriteBeat     │
                    │ Claude Code + Remotion Agent Skills writes/  │
                    │ edits scene code per episode                 │
                    └──────────────┬───────────────────────────────┘
                                   ▼
              Remotion Studio (scrub review) → npx remotion render → MP4
```

**Human review points:** (1) the script, (2) the VO takes, (3) a Remotion
Studio scrub before render. Everything else is code.

**Key integration decision — port the chart theme to TypeScript, keep
matplotlib for stills.** Compositing matplotlib PNG frame-sequences works as
an escape hatch, but bakes animation timing at Python render time, can't
coordinate with Remotion-side captions/counters, and makes every iteration a
two-language round trip. The house style is cheap to port (two Google Fonts,
a palette, zero radius, offset box-shadows). Export a `theme-tokens.json`
from `viz/theme.py` so Python and TS share one source of truth. Matplotlib
keeps doing thumbnails, static insert stills, and the newsletter.

---

## 3. Stack decisions (with July-2026 receipts)

### Motion & dataviz — **Remotion 4.x**
- Free at our size (individuals / teams ≤3, monetized YouTube included).
- **Remotion Agent Skills** (`npx skills add remotion-dev/skills`) teaches
  Claude Code to write correct Remotion code — including chart rules
  (D3 + stroke-dashoffset draw-on, `@remotion/paths`) and TikTok-style
  word-highlight captions. The "describe scene → agent writes comp"
  workflow is exactly how episodes get assembled.
- Chart animation patterns are all standard: `d3-shape` line over the
  exported JSON + `evolvePath()` for draw-on; `getPointAtLength()` for the
  now-cursor; per-digit springs for odds counter flips; animate the d3
  scale domain for zoom-into-a-time-window; `<Sequence>` + spring pop-ins
  for event callouts.
- `wcandillon/remotion-fireship` is a working reference for the overall
  look/assembly (study, don't fork — we want our own style anyway).
- Alternatives rejected: Motion Canvas (dead upstream), Revideo (team
  pivoted), Manim (mid-refactor, wrong aesthetics), After Effects (not
  code-driven).

### Voiceover — **ElevenLabs Eleven v3**, retakes on OpenAI
> **Register (decided):** deadpan, straight financial-news anchor — Good
> Work energy. Measured cadence, jokes written into the script and read
> flat; tags used sparingly (`[deadpan]`, `[pause]`), higher stability.
>
> **Human option (kept first-class):** Sam records the VO — and optionally
> an on-camera cold-open clip — instead of TTS. The pipeline treats both
> identically: recorded audio goes through forced alignment (WhisperX) to
> produce the same word-timed `words.json` that ElevenLabs timestamps
> produce, and the composition has an `IntroCam` scene slot for the
> talking-head clip. Decide per episode; a human intro + TTS body also
> works.
- v3 (GA Feb 2026) is the most expressive model shipped and the best fit
  for the deadpan-snark register: inline audio tags — `[sarcastic]`
  `[deadpan]` `[whispers]` `[pause]` `[rushed]` `[drawn out]`
  `[emphasized]` — plus a voice library with explicit snarky/sarcastic/
  explainer categories.
- Its `/with-timestamps` endpoint returns character-level timing, which
  drives caption sync and scene durations directly — no WhisperX step.
- Workflow: generate per sentence/clause, re-roll each line 5–10×, keep the
  funniest read, splice. Route bulk retakes through **gpt-4o-mini-tts**
  (~$0.015/min, steered with an "instructions" prompt) to stay on the $22
  ElevenLabs Creator tier; upgrade to Pro ($99) only if all-v3 retakes are
  worth it. A/B **Hume Octave 2** for sarcasm beats.
- Post: cut 2–4 kHz mids, gentle 3:1 compression, room tone at −55 dB,
  breath samples before long lines. And remember the real trick: tight
  cuts to a driving music bed mask residual TTS stiffness better than any
  model setting.

### Memes & cutaways — local library first, APIs second
- **Tenor API is dead** (June 2026) and **Giphy's ToS bars monetized-video
  use** — don't build on either.
- **Primary: a curated local asset library** — MP4/WebM (alpha where
  possible) + a JSON/SQLite manifest (`id, file, tags[], emotion, source,
  license, duration`). The script's beat markers carry a `meme_intent`
  tag; a resolver matches it to the library (embeddings/keywords), falling
  back to API fetch. This is also just faster and funnier than live search.
- **Imgflip API** ($9.99/mo) for programmatic captioned meme templates
  (LLM picks template + writes caption → hosted image).
- **Klipy API** (the designated Tenor successor; serves HD MP4 renditions)
  for GIF/clip search — *pending written confirmation* that baking assets
  into a monetized rendered MP4 is licensed. Most GIF APIs license an
  in-app picker, not redistribution; this is the #1 licensing trap.
- **AI-recreated meme formats** (Nano Banana redraws "distracted
  boyfriend" et al. with our mascot/pixel characters) — copyright-safer,
  on-brand, and a recurring bit in itself.
- Movie/TV clips: discovery via PlayPhrase/Yarn/Vlipsy, but any unlicensed
  clip stays **sub-2 seconds, transformed, under our VO, never
  load-bearing** — assume Content ID may claim that video's revenue and be
  ready to swap the clip. Original VO + graphics must dominate runtime
  (>50–70%), which also keeps us clear of YouTube's 2026 "inauthentic
  content" rules.
- Clean B-roll: Pexels/Pixabay APIs (free) + Envato Elements (license
  survives cancellation for published work — prefer over Storyblocks
  consumer tiers).

### Generative image & video — Gemini stays, plus Veo seasoning
- **Images: Nano Banana 2 / Pro** (already integrated for sprites).
  Conversational editing + character consistency is exactly what the
  mascot and recurring sprites need; grounding helps it get tickers and
  odds numbers right. **GPT Image 2** as backup for dense text-in-image
  frames. **PixelLab** (pixellab.ai) if we start needing animated
  sprite-sheets with rigging. All sprite output goes through a Python
  quantize-to-grid pass (downscale → palette-quantize → nearest-neighbor
  upscale) for true pixel fidelity.
- **Video: Veo 3.1 Fast** ($0.10/s, image-to-video from our own
  pixel-art stills + up to 3 reference images for consistency) for meme
  cutaways and scene-setters; **Veo Lite** ($0.05/s) for throwaway
  background motion; **Pika (via fal.ai) or Hailuo 2.3** for gag effects
  (squish/explode/inflate on an input image) and stylized clips.
  **Sora is deprecated (API removed Sept 2026) — do not touch.**
- Honest proportions for a 3-min episode: ~70% animated charts + kinetic
  text (the Remotion pipeline), ~20% stills/memes/sprites, ~10% generative
  clips (3–8 cutaways × 4–8s, as punchlines). Generative video is
  seasoning, not the meal. No model holds a strict pixel grid natively —
  seed i2v with our stills and post-quantize frames when it matters.

### Sound — Epidemic + chiptune-as-code
- **Epidemic Sound** ($25/mo commercial): Content ID pre-cleared music
  beds + the deepest whoosh/riser/glitch SFX library.
- **jsfxr/bfxr** to *generate* 8-bit blips programmatically — SFX-as-code
  fits both the aesthetic and the pipeline (a curated library of ~30
  named one-shots referenced from the timeline JSON).

---

## 4. Compliance & monetization (read before publishing)

- **YouTube gambling policy (Nov 2025, expanded 2026) is the big one.**
  Directing viewers to non-Google-certified gambling services — spoken
  promos, links, logos, screenshots, even casual references — is banned,
  and gambling-adjacent content can be age-restricted (18+), which cuts
  recommendations. Kalshi is CFTC-regulated and arguably not gambling, but
  enforcement is broad. Posture: **frame everything as news/analysis**, no
  in-video signup CTAs, referral links in the description only,
  "informational, not financial advice, 18+" disclaimers, and **recreate
  odds in our house style rather than screenshotting Kalshi's UI** (which
  we'd do anyway — it's the whole point of the channel).
- **AI disclosure:** tick "altered or synthetic content" in Studio for the
  synthetic voice (mandatory since Jan 2026). AI VO is explicitly fine for
  monetization as long as the research/script/editing are original — which
  they are; that's the product.
- **Kalshi referral program** exists (20% rev share) but the promo
  landscape is tightening (Kalshi pulled affiliate badges on X in early
  2026). Treat referral income as a bonus, not the model.
- **Content ID:** accept that any episode with an unlicensed movie clip
  might get its revenue claimed; keep clips swappable and non-load-bearing
  (see §3 memes).

---

## 5. Costs (steady state, ~4 episodes/month)

| Line item | Choice | $/month |
|---|---|---|
| Voiceover | ElevenLabs Creator + OpenAI retakes | $22–25 (or $99 Pro) |
| Motion stack | Remotion + DaVinci Resolve | $0 |
| Images | Nano Banana 2/Pro (~200–300/mo) | $10–30 |
| Generative video | Veo 3.1 Fast (~150 gen-sec/video incl. retries) | $30–100 |
| Memes | Imgflip Premium (+ Klipy TBD) | $10 |
| Music/SFX | Epidemic Sound commercial | $25 |
| Stock B-roll | Pexels/Pixabay free (Envato later) | $0–17 |
| **Total** | | **~$100–210** |

Avoided: Runway/avatar platforms ($500+/mo class), Descript ($24/mo —
optional later; ElevenLabs timestamps + Remotion captions cover the need).

---

## 6. Roadmap

> **Status (2026-07-11):** Phase 0 is DONE and Phase 1 is largely done —
> exporters + real fedhike data (steps 1–4), Remotion workspace with the
> full component library and verified test renders (`video/`, see
> `video/out/` targets), VO tooling for both TTS and recorded audio
> (step 5, pending an ElevenLabs key), mascot candidates generated
> (step 6), pilot script written with fact-checked annotation beats
> (step 7 — awaiting VO + assembly). Remaining for the pilot: pick
> mascot + voice, provide ELEVENLABS_API_KEY (or record VO), generate
> VO, wire real timings into `PilotFedHike`, music/SFX, final render.

**Phase 0 — Foundations (repo work, ~a week of evenings)**
1. Export `theme-tokens.json` from `fr_newsletter/viz/theme.py`.
2. Add a `video/` Remotion workspace; install `remotion-dev/skills`.
3. Port the theme to `theme.ts`; build `MarketChartScene` v1 (draw-on line
   + now-cursor + odds counter) fed by a `data.json` exported from the
   existing Kalshi fetcher. Success = a 15-second animated chart of a real
   market, in house style, at 1080p60.

**Phase 1 — Pilot episode (the Fed market)**
4. Extend the story-JSON concept to an episode spec: script beats, chart
   moments, `meme_intent` tags, SFX cues.
5. VO pipeline: ElevenLabs v3 with timestamps → master timeline JSON →
   `CaptionLayer` word-pop captions.
6. Design the mascot (Nano Banana, existing sprite pipeline) + seed asset
   library (~20 curated reactions, ~30 chiptune SFX).
7. Produce **"The market says 4% — why nobody believes the Fed will hike"**
   (or the juicier cut-divergence angle: Kalshi ~60% on a 2026 cut vs. CME
   futures ~27%). Ship it unlisted, review, iterate, publish.

**Phase 2 — Systemize (episodes 2–5)**
8. One command from episode spec → draft render; Remotion Studio scrub as
   the only manual step. Add `MemeCutaway` API fallbacks (Imgflip; Klipy
   once licensing is confirmed in writing). Add Veo cutaway generation.
9. Vertical (9:16) composition variant for Shorts/TikTok cuts.
10. Resolution Watch scoreboard component (this doubles as a data feature
    for the newsletter).

**Phase 3 — Cadence & distribution**
11. 2–3 episodes/week mixing timely ("The Tape" on a moving market) and
    evergreen ("how prediction markets work" explainers for baseline
    traffic). Shorts volume via clip cuts; investigate Content Rewards
    (Whop) which pays per-view for prediction-market clips.

**Episode backlog** (hot as of July 2026): Fed hike/cut divergence ·
"the market thinks OpenAI declares AGI before 2027" (KXOAIAGI, + the
Claude-vs-Gemini best-AI market) · the Kalshi trader who caught 500k fake
Spotify streams · government-shutdown markets retro (the market beat the
pundits) · "who IPOs next" (SpaceX/OpenAI markets).

---

## 7. Accounts & credentials needed

| What | Why | Needed when | How to provide |
|---|---|---|---|
| **ElevenLabs API key** (`ELEVENLABS_API_KEY`, + `ELEVENLABS_VOICE_ID` once a voice is picked) | VO generation with word timestamps. Creator tier ($22/mo) is enough to start; enable commercial use (included Creator+). | Before first VO render | Env var in the Claude Code environment settings (or Railway if we render there) |
| Gemini API key | Nano Banana sprites/mascot + Veo cutaways | **Already present** (`AI_INTEGRATIONS_GEMINI_API_KEY`) | — |
| OpenAI API key (optional) | Near-free bulk VO retakes via gpt-4o-mini-tts | Phase 2 | Env var |
| Imgflip Premium ($9.99/mo, optional) | Programmatic captioned meme templates | Phase 2 | Username/password env vars |
| Epidemic Sound ($25/mo commercial) | Music beds + SFX, Content ID pre-cleared | Before first *published* episode | Manual download; drop files in `video/public/assets/music|sfx/` |
| Klipy production key | GIF/clip API (Tenor successor) | Phase 2, after emailing them to confirm baked-into-video licensing | Env var |
| YouTube channel | Publishing; tick "altered/synthetic content" for TTS episodes | Publish time | Manual |

No signup needed: Kalshi market data (public API), Remotion (free at this
team size), DaVinci Resolve, Pexels/Pixabay, jsfxr.

## 8. Open decisions

1. **Show name / mascot concept** — DECIDED: the Anchor Goblin hosts
   (v2 quality pack in `video/public/assets/mascot/v2/`); the Oracle is a
   candidate recurring "forecast" bit character. Show name still open.
2. **Voice identity** — pick a v3 library voice vs. commission a
   Professional clone; decides how "ownable" the narrator is.
3. **Klipy commercial license** — email them before building the
   integration (in-app picker vs. baked-into-MP4 is the question).
4. **ElevenLabs tier** — start Creator ($22), upgrade to Pro only if
   retake volume on v3 demands it.
5. **Angle for the pilot** — the hike market (juicy "4% and falling"
   framing) vs. the cut-divergence story (built-in Wall Street conflict).
