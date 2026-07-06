# fantasy-reality-newsletter

Toolkit for the [Fantasy Reality substack](https://fantasyreality.substack.com/) —
finding prediction-market stories, charting them in the Fantasy Reality house
style, and drafting newsletter outlines.

**Status:** data viz is live; trend-finding and outline drafting are stubs
(`fr_newsletter/trends`, `fr_newsletter/outlines`).

## Making a chart — no terminal required

### Option A: web UI (Railway)

A three-step wizard with a live preview:

1. **Market** — paste a Kalshi *event* URL (events often contain several
   markets); the markets are listed with volumes, and the tool best-guesses
   the axes, window, and title. Check several markets to overlay them as
   series.
2. **Frame** — adjust y-axis, x-window, titles, preset, smoothing; toggle a
   volume panel or a YES + NO view.
3. **Annotations** — add timestamped callouts, with optional sprites
   (generate new ones inline via Nano Banana).

The preview is the real PNG, re-rendered after every change. Save downloads
the chart and the story JSON that reproduces it — commit that JSON to
`stories/` to make it re-runnable by the Action.

Deploy once (needs a [Railway](https://railway.app) account):
1. Railway → **New Project → Deploy from GitHub repo** → pick this repo.
2. Railway reads `Dockerfile` / `railway.json` automatically — no settings needed.
3. Open the generated URL. That's the chart generator.

### Option B: GitHub Action

1. Edit (or copy) a story file like `stories/balogun-red-card/story.json`
   directly in the GitHub web editor — the market, the charts, the annotated events.
2. **Actions → Make charts → Run workflow**, pointing at your story file.
3. Fresh data is fetched, PNGs render, and the results are committed to
   `charts/<slug>/` — open the PNG in the repo and download it.

### Option C: locally (optional)

```bash
pip install .
python scripts/make_chart.py stories/balogun-red-card/story.json --refresh
```

## Anatomy of a story

A *story* is one newsletter idea: a market, a set of timestamped events, and
the charts that tell it. See `stories/balogun-red-card/story.json`:

- `market` — Kalshi URL or ticker; resolved to the highest-volume market of the event
- `charts[]` — each has a `type` (`timeline` = days-long saga; `closeup` =
  minutes-level zoom with a volume subpanel), a `preset` (`editorial` = quiet
  labels; `meme` = pixel callout boxes + sprites), a title/subtitle, and `events`
- `events[]` — `ts`, `label` (`\n` breaks lines), optional `sprite`
  (`red_card`), `dx`/`dy` label nudges in points, `line: false` for states
  rather than moments, `zoom` for sprite scale
- `sprites` (optional) — `{ "name": "subject description" }`; missing sprites
  are generated with Nano Banana (see below) before rendering

Chart-level knobs: `ylim` (tighten the y-axis around the action; omit for a
best-guess), `start`/`end` (window the x-axis; naive timestamps are UTC),
`title`, `subtitle`, `preset`, `resample`, `markets` (list of the event's
market tickers to overlay as series), `show_volume` (volume subpanel on a
timeline), `show_no` (plot YES and NO of a single market).

## Sprites via Nano Banana

Annotation art (the red card, etc.) can be generated instead of hand-drawn:
each subject is wrapped in a house-style prompt (16-bit pixel art, Hyper Light
Drifter palette, white background), then post-processed — background knocked
out, nearest-neighbor downscaled so it stays crisp — into
`fr_newsletter/assets/sprites/<name>.png`, referenceable from any event.

Set `GEMINI_API_KEY` (a [Google AI Studio](https://aistudio.google.com/) key):
- **Railway**: project → Variables → `GEMINI_API_KEY` — then use the web UI's
  sprite generator card.
- **GitHub Action**: repo → Settings → Secrets → Actions → `GEMINI_API_KEY` —
  then story-declared `sprites` generate automatically on the next run.

Candle data is snapshotted into `stories/<slug>/data/` so committed charts stay
reproducible after markets close; `--refresh` (or the Action's checkbox)
refetches.

## House style

`fr_newsletter/viz/theme.py` translates the Fantasy Reality app's design system
into matplotlib: warm card surface, indigo ink 2px borders, hard pixel shadows,
Press Start 2P titles, Space Mono everything else, and the teal/pink YES/NO
pair. The categorical palette is validated (colorblind separation, contrast,
lightness/chroma bands) — derivation and rules in
`fr_newsletter/assets/palette.md`. Fonts are vendored under
`fr_newsletter/assets/fonts/` (SIL OFL).

## Layout

```
fr_newsletter/
  data/       Kalshi API client + snapshot caching
  viz/        theme, chart builders (timeline, closeup), events
  trends/     market scanners (stub)
  outlines/   outline drafter (stub)
  assets/     fonts, sprites, palette.md
app/          FastAPI chart-generator web UI
scripts/      make_chart.py CLI
stories/      one folder per newsletter story (config + data snapshots)
charts/       rendered PNGs, one folder per story
```
