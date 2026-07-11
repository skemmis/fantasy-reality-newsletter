# Research: motion graphics / animated dataviz stack (agent 3, Fable) — July 2026

## Framework verdict
- **Remotion 4.x = clear winner.** React/TS, per-frame headless Chromium render, full CSS/SVG/web fonts. FREE for individuals/companies ≤3 people (solo monetized YouTube OK). CLI `npx remotion render`, Node API, Lambda, GH Actions. 2026: Studio interactive canvas/keyframes, pixelate/zoom-blur/glitch effects, @remotion/shapes.
- **Remotion Agent Skills (Jan 2026, remotion-dev/skills, 3.9k stars)**: 30+ rule files teaching Claude Code to write correct Remotion code — animations, transitions, charts (rules/charts.md: D3, stroke-dashoffset draw-on, @remotion/paths), captions (TikTok-style word highlight), audio viz, SFX, FFmpeg. `npx skills add remotion-dev/skills`. Docs serve raw .md for agents. This IS our workflow.
- Motion Canvas: dead upstream (site offline; community fork Canvas Commons). Revideo: team pivoted to Midrender; shaky. Manim: mid-refactor, LaTeX aesthetics, poor caption ecosystem. Theatre.js: dormant. Skip all.

## Fireship's actual stack
- Script-first, VO, screen recordings, Premiere Pro edit, After Effects animations, HEAVY well-designed static stills. Writing/pacing is the moat, not editing.
- Imitators use Remotion: wcandillon/remotion-fireship (production template + server.tsx render server), thecmdrunner/fireship-remotion-intro. Faceless pipelines: LLM script → ElevenLabs → TTS-first timing (derive scene durations from audio) → Remotion render (e.g. ClawVid).

## Animated dataviz patterns (Remotion)
- Line draw-on: d3-shape line over pandas-exported JSON, animate stroke-dashoffset via useCurrentFrame/interpolate; @remotion/paths evolvePath()/getPointAtLength().
- Now-cursor: getPointAtLength(progress) → cursor sprite + live odds readout at line tip.
- Counter flips: interpolate value per frame, tabular figures (Space Mono) or per-digit slot-machine springs.
- Zoom/pan: animate d3 scale domains with spring() — re-render per frame makes it trivial.
- Annotation pop-ins: absolutely-positioned components in <Sequence from={frame}> + spring scale; pixel shadows = plain CSS.
- No off-the-shelf market-odds template; skills chart rules + remotion-fireship cover building blocks.

## Matplotlib frames vs TS port — VERDICT: port the theme
- Compositing matplotlib PNG sequences works but: timing baked at Python render, VO-edit re-sync = re-render Python, can't coordinate with overlaid Remotion elements, heavy 60fps PNG seqs, two-language iteration loop. OK as escape hatch + for STATIC stills.
- Port is cheap: fonts via @remotion/google-fonts (Press Start 2P, Space Mono), palette JSON, zero radius, offset box-shadows → shared theme.ts. **Export design-tokens JSON from Python so both share one source of truth.** Keep matplotlib for thumbnails/static inserts/newsletter.

## Captions / kinetic typography
- Best path: **ElevenLabs /with-timestamps endpoint returns character-level timing — no alignment step needed.**
- Otherwise: WhisperX (default), easytranscriber (KBLab Feb 2026, 35-102% faster), MFA for max accuracy (we HAVE the script — script-based forced alignment beats ASR).
- @remotion/captions: createTikTokStyleCaptions() word-highlight pages; TikTok template + Recorder implement full pipeline; Pro store has paid Animated Captions component.

## Sound
- Epidemic Sound $25/mo commercial: Content ID pre-cleared, ~2x Artlist SFX library. Artlist ~$199-299/yr.
- Free: freesound.org, Pixabay SFX. **jsfxr/bfxr generate chiptune blips programmatically** — fits 8-bit aesthetic, SFX-as-code.
- Pattern: one music bed/video + curated local library of ~30 whooshes/risers/glitches/blips referenced by name in timeline JSON.

## Recommended architecture
1. Data: Python pulls Kalshi → per-video data.json (series, annotations, stats) + shared theme-tokens.json.
2. Script: markdown/YAML with beat markers referencing chart moments, memes, SFX names (LLM-draftable; review point 1).
3. Audio: ElevenLabs with timestamps → word timings + beat markers = master timeline JSON (review point 2: listen).
4. Composition: typed scene components — MarketChartScene (draw-on, cursor, zoom, pop-ins, counter), KineticTitle, CaptionLayer, MemeCutaway, SpriteBeat; video.json drives <Composition>; Claude Code + Agent Skills writes scene code.
5. Preview: Remotion Studio scrub (review point 3, main QC).
6. Render: npx remotion render → MP4; thumbnails via matplotlib or renderStill().
- 2-5 min videos render fine locally; Lambda only if batching.
