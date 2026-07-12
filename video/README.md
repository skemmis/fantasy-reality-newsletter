# video/ — The Market Says (Remotion workspace)

Remotion 4.x workspace that turns Kalshi prediction markets into short,
data-heavy YouTube episodes in the Fantasy Reality pixel-art house style
(Press Start 2P + Space Mono, hard offset shadows, zero border-radius).
Strategy, stack decisions, and compliance notes live in
[`docs/video/PLAN.md`](../docs/video/PLAN.md).

## Production workflow (PLAN.md §1.5, Oliver-style)

Per episode, in order — each step gates the next:

1. **Research** (Claude): `public/episodes/<slug>/research.md` — dated, sourced
   facts, market-move timeline, neutral beat-sheet. No jokes, no voice.
2. **Script** (Sam): `script.md` — voice, jokes, pacing. Only facts from the
   research doc are allowed in.
3. **VO** (Sam records, or TTS): audio into `vo/`, aligned to word timings
   with `scripts/vo_make_timeline.py` → `vo/words.json`.
4. **Elements** (Claude): build/render every visual element against the VO
   timeline; deliver an element reel for feedback BEFORE assembly.
5. **Episode** (Claude): assemble `src/episodes/<slug>.tsx`, render, deliver.

## Directory map

```
video/
├─ remotion.config.ts        jpeg frames, pinned headless Chromium, angle-egl
├─ scripts/gen_sfx.mjs       deterministic jsfxr chiptune SFX -> public/assets/sfx/
├─ public/
│  ├─ assets/                art library + assets.json manifest (see below)
│  ├─ episodes/<slug>/       per-episode data (the "episode folder contract")
│  └─ fonts/                 source woff2 files (inlined into src/theme/fonts-inline.json)
└─ src/
   ├─ Root.tsx               all <Composition>s (pilot, Short, thumb, reels, tests)
   ├─ episodes/shared.tsx    episode-agnostic beat builders (see Components)
   ├─ episodes/fedhike.tsx   EP01 assembly: BEATS table + <Sequence> collage
   ├─ ShortFedHike.tsx       ~45s 9:16 vertical cut of EP01
   ├─ ThumbFedHike.tsx       1-frame 1280x720 thumbnail comp
   ├─ ShotReel.tsx/ShotReel2.tsx  component/FX vocabulary reels
   ├─ TestChart.tsx          20s chart proving comp (landscape + vertical)
   ├─ components/            scene components (below)
   ├─ fx/                    overlays/particles/shake (below)
   ├─ theme/                 tokens.json (exported from Python), theme.ts, fonts-inline.json
   ├─ fonts.ts               synchronous FontFace loading — READ THE RULE BELOW
   ├─ assets.ts              manifest loader + resolveAsset/resolveMeme
   ├─ load-episode.ts        data.json fetcher + normalizer (calculateMetadata)
   ├─ reveal.ts              beat-paced chart draw-on math (pure, no React)
   └─ types.ts               EpisodeData/Market/PricePoint/Annotation
```

## Episode folder contract — `public/episodes/<slug>/`

| File | Produced by | Purpose |
|---|---|---|
| `research.md` | Claude (step 1) | Sourced facts + beat-sheet skeleton |
| `script.md` | Sam (step 2) | Narration lines + `[beat:id]` markers |
| `vo/words.json`, `vo/vo.mp3` | `vo_make_timeline.py` (step 3) | Word-timed VO timeline for CaptionLayer + beat timing |
| `data.json` | `export_episode_data.py` | Market series (percent 0–100) + annotations |
| `moves.md` | `export_episode_data.py` | Biggest daily swings, scratchpad for annotating |
| `annotations.json` | human | Chart callouts (`t`, `label`, `dx/dy`) fed to the exporter |
| `episode.yaml` | human/Claude | Beat table: `beat` id, `scene`, `est` seconds, props, overlays — the spec `src/episodes/<slug>.tsx` implements |

Compositions never read these directly at frame time: `calculateMetadata`
(see `load-episode.ts` / `assets.ts`) fetches `data.json` + `assets.json`
once and passes them down as plain props. Missing files fall back to
`sample-data.ts` / placeholder art, so every comp renders from a bare clone.

## Components (`src/components/`, one line each)

- **MarketChartScene** — the star: d3 line draw-on with now-cursor, odds
  counter, annotation callouts, window zoom; `reveal` accepts fraction,
  timestamp, or beat-paced plan (`reveal.ts`).
- **OddsCounter / DigitWheels** — odometer percent counter; wheels roll like
  a mechanical meter (ones continuously, higher wheels on wrap).
- **KineticTitle** — word-by-word title slam with accent words.
- **AnnotationCallout** — pixel callout box + elbow pointing at a chart point.
- **CaptionLayer** — TikTok-style word-pop caption pages from `vo/words.json`.
- **BigNumber** — full-frame stat slam (+172K) with odometer roll and shake.
- **CompareBars** — horizontal bar compare (payrolls vs consensus).
- **DotPlot** — FOMC dot-plot recreation; drop-in dots, magenta highlight
  flash + chip; portrait-aware header.
- **HawkDoveMeter** — signature gauge; needle sweep dove→hawk, flapping birds,
  verdict chip; portrait-aware card width.
- **HeadlineCard / ArticleZoom** — real article screenshot on a card with
  source/date chip, highlight box, optional Ken-Burns zoom into a quote.
- **PostCard** — re-typeset social/statement excerpt with avatar + attribution.
- **PortraitCard** — pixel caricature on a card with name-plate chip.
- **VersusCard** — two PortraitCards face off; left enters, right +8 frames,
  shaking VS badge, stat chips under each side.
- **PropPop** — icon prop (tariff crate, rate dial) pops in with wobble + label.
- **SpriteLoop** — cycles a manifest `loop` frame list (talking goblin, flame).
- **MemeCutaway** — full-frame meme/mascot card with caption, credit, and
  text overlays composited onto blank art regions.
- **MoneyPrinterBeat** — Veo printer b-roll + CoinRain + BRRRR stamps.
- **BreakingBanner** — full-width BREAKING ribbon slam with sirens, auto-exit.
- **ChapterCard** — 1s interstitial: roman numeral + title + ticker underline.
- **TickerWipe** — full-frame ticker-tape wipe transition (up/down).
- **IntroSting** — 1.6s channel sting (wordmark + goblin + coin + ka-ching).
- **IntroCam** — slot for a recorded human cold-open clip.
- **EndCard** — "Resolution Watch" scoreboard: markets covered vs resolved.

### Episode builders (`src/episodes/shared.tsx`)

Episode-agnostic pieces every episode composes; episode files (e.g.
`fedhike.tsx`) own only data (BEATS table, headlines, asset picks) and the
`<Sequence>` assembly:

- **makeBeatClock(BEATS, fps)** — `{start(id), frames(id), duration}` from a
  `[{id, est}]` beat table mirroring `episode.yaml`.
- **ColdOpenStorm** — b-roll under the huge odds counter (portrait-aware).
- **DeskShot** — news-desk set with the goblin composited BEHIND the desk
  (backdrop slice re-drawn over the sprite's lower body).
- **LiveChip / LowerThird / PunchChip / StatCard** — broadcast overlay chips.
- **CutFlash** — 2-frame hard white flash (+ thud) at a cut point.
- **sfx(name)** — staticFile URL for `public/assets/sfx/<name>.wav`.
- **valueAt(market, tms, times)** — series value at a timestamp (for tick SFX).

### FX (`src/fx/`)

- **CRTOverlay** — scanlines + vignette + fringe + periodic tape tear (wrap a comp).
- **VHSGlitch** — 4–6 frame glitch burst spanning a hard cut.
- **FireBorder** — animated pixel flames around all four edges.
- **CoinRain** — deterministic coin particle shower (seeded random only).
- **PixelSprite** — procedural bitmap sprite fallback (birds, flames, coins).
- **ProgressBar** — episode progress segments; mount at composition ROOT.
- **useScreenShake** — deterministic decaying shake for slam impacts.

## Asset library — `public/assets/` + `assets.json`

Manifest schema (`src/assets.ts`): `{id, kind, file, alpha?, label?, tags[],
loop?, note?}` (+ additive `source`/`license` from the ingest tool); `kind` is
`portrait | prop | loop | meme | mascot | backdrop`. `file`/`alpha`/`loop`
paths are relative to `public/assets/`. **House rule: files not in the
manifest do not exist** — components must render their pixel placeholder
instead of pointing `<Img>` at a 404 (a failed image load fails the render).
Resolve with `resolveAsset(manifest, idOrTag, kind?)` (exact id → label → tag
→ substring) or `resolveMeme(manifest, 'this is fine')` (keyword scoring).

## Pipeline CLIs (repo root unless noted)

```bash
python scripts/export_episode_data.py <url|ticker>... --slug fedhike \
    [--interval 1h] [--annotations annotations.json]   # -> data.json + moves.md
python scripts/grab_headline.py --url URL --slug jobs-cnbc [--selector "h1"]
                                          # -> public/assets/headlines/<slug>.png + .json
python scripts/ingest_asset.py PATH --kind broll --id veo-printer --tags money,printer
                                          # copy into library + append to assets.json
python scripts/vo_make_timeline.py --tts   --slug fedhike --script script.md   # ElevenLabs v3
python scripts/vo_make_timeline.py --align --slug fedhike --script script.md --audio take.wav
python scripts/export_theme_tokens.py     # viz/theme.py -> src/theme/tokens.json
node   video/scripts/gen_sfx.mjs          # (or `npm run gen:sfx`) regenerate chiptune SFX
```

## Rendering

```bash
cd video
npm run studio                       # scrub review at http://localhost:3000
npx remotion render PilotFedHike out/pilot-v4.mp4 --concurrency=2
npx remotion render ShortFedHike out/short-fedhike.mp4 --concurrency=2
npx remotion still PilotFedHike out/frame.png --frame=800
npx tsc --noEmit                     # must pass before any render
```

- **Use `--concurrency=2`.** Higher parallelism OOMs/thrashes this container.
- Comp IDs live in `src/Root.tsx`: `PilotFedHike`, `ShortFedHike` (1080x1920),
  `ThumbFedHike`, `ShotReel`, `ShotReel2`, `IntroSting`, `TestChart`(+`Vertical`).
- `remotion.config.ts` pins a pre-installed Chromium (proxy blocks the
  download) and jpeg frame format.

## House rules & gotchas

- **Fonts are synchronous — never `loadFont()`/`delayRender` fonts.**
  `src/fonts.ts` builds `FontFace` objects from ArrayBuffers decoded out of
  `src/theme/fonts-inline.json`; the CSS Font Loading spec parses
  ArrayBuffer-constructed faces synchronously. Promise-based FontFace loads
  (what `@remotion/fonts` `loadFont` does) intermittently never settle late in
  long headless renders in this container, timing out the whole render.
  Import order also matters: `fonts.ts` runs at module load, before any frame.
- **Stale-bundle gotcha: never edit `src/` while a render is running.** The
  CLI bundles once at render start, but a long render that restarts its
  browser (or a second CLI invocation) can pick up half-edited code — and
  any render kicked off after your edit but before you re-checked `tsc` bakes
  the breakage into hours of frames. Edit, typecheck, THEN render; queue
  renders sequentially.
- **Determinism**: all randomness through remotion's seeded `random()`
  (never `Math.random`), all sprite cycling frame-derived, so every frame
  renders identically on every machine and across retries.
- **Data via `calculateMetadata` only** — no per-frame fetch/delayRender.

## Regenerating generated inputs

- **`src/theme/fonts-inline.json`** (after changing files in `public/fonts/`):

  ```bash
  cd video && node -e '
  const fs = require("fs");
  const f = (p) => "data:font/woff2;base64," + fs.readFileSync("public/fonts/" + p).toString("base64");
  fs.writeFileSync("src/theme/fonts-inline.json", JSON.stringify({
    pixel400:  f("press-start-2p-400.woff2"),
    mono400:   f("space-mono-400.woff2"),
    mono700:   f("space-mono-700.woff2"),
    mono400i:  f("space-mono-400-italic.woff2"),
  }, null, 0) + "\n");'
  ```

- **SFX** (`public/assets/sfx/*.wav`): `npm run gen:sfx` — deterministic
  jsfxr params in `scripts/gen_sfx.mjs`; current one-shots: alarm, blip,
  glitch, ka-ching, pop-in, static, thud, tick, whoosh-down, whoosh-up.
- **`src/theme/tokens.json`**: `python scripts/export_theme_tokens.py`
  (single source of truth is `fr_newsletter/viz/theme.py`).
