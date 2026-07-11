# Anchor Goblin — v2 Mascot Pack

The show's host: a deadpan, half-lidded goblin financial-news anchor (Good Work /
Dan Toomey energy) for the Kalshi prediction-markets parody show. This v2 pack
supersedes the v1 candidate `../anchor-goblin.png`, which had muddy pixel
clusters, weak palette adherence, a faint mug `%`, and an inconsistent grid.

## Model

**`gemini-3-pro-image` (Nano Banana Pro)** — chosen over v1's
`gemini-2.5-flash-image`. It was the highest-quality image model exposed by the
Gemini API at generation time (also listed as `nano-banana-pro-preview` /
`gemini-3-pro-image-preview`). It renders far crisper pixel grids, holds the
limited palette much better, produces a legible `%` on the mug, and supports
multi-image conversational editing — so every variant was generated with the
chosen hero/standalone frame passed in as an image reference to keep the goblin
identical (skin tone, suit, shirt, tie) across all shots.

House palette: indigo ink `#17122b`, magenta `#c8327a`, teal `#128a72`,
pink `#e84581`, gold `#ffc37a`, cream `#fff3d6`, warm paper `#e9e5dd`.

## Post-processing

Every final: downscale to ~120px longest side (LANCZOS) → quantize to ≤24
colors (median-cut, no dither) → NEAREST upscale 8×. Alpha versions additionally
get an edge-seeded white-background flood-fill to transparent (cream mug/eyes and
white eye-glints preserved), then a hard alpha threshold for clean cutout edges.
Full-resolution model outputs are kept in `raw/<name>-raw.png`.

## Files

| File | Contents |
|------|----------|
| `anchor-desk.png` | Hero host shot — goblin at the news desk, `%` mug (opaque white bg) |
| `standalone.png` / `standalone-alpha.png` | Full-body character, no desk (white bg + cutout) |
| `deadpan.png` / `-alpha.png` | Expression: default resting face |
| `panic.png` / `-alpha.png` | Expression: eyes wide, sweat drop (odds spiking) |
| `smug.png` / `-alpha.png` | Expression: cocked brow + smirk (the market was right) |
| `coffee-sip.png` / `-alpha.png` | Expression: mid-sip, unbothered (chaos beat) |
| `raw/*.png` | Unprocessed 1408px model outputs |

Character lock (identical across all shots): olive-green skin, big pointed ears,
slightly-too-big navy-indigo suit jacket, magenta dress shirt, teal necktie,
heavy-lidded deadpan eyes.

---

## Prompts

### `anchor-desk.png` (hero) — text-only
> Pixel art sprite illustration, authentic 16-bit era, rendered on a CRISP UNIFORM PIXEL GRID with large square chunky pixels of consistent size, hard flat color fills, bold 2px dark indigo outlines, NO anti-aliasing, NO gradients, NO blur, NO dithering noise.
>
> Subject: "The Anchor Goblin" — a green-skinned goblin news anchor sitting behind a financial-news broadcast desk, facing forward, centered. He is the deadpan host of a prediction-markets TV show. KEY EXPRESSION: half-lidded, heavy-lidded droopy deadpan eyes, utterly unbothered and bored, flat mouth — this bored half-asleep stare is the most important feature. Big pointed goblin ears, olive-green skin.
>
> Outfit: a slightly-too-big navy-indigo business suit jacket with a magenta dress shirt and a teal necktie. On the desk in front of him he holds a cream-colored coffee mug with a LARGE, BOLD, CLEARLY LEGIBLE magenta percent sign "%" printed on the front of the mug — the % must be crisp and unmistakable. A small monitor on the desk shows a rising line chart. The desk front has a glowing ticker / line-chart display.
>
> Strict limited palette, high saturation, strong contrast, use ALL of these colors boldly (do not desaturate): indigo ink #17122b (outlines/darks), magenta #c8327a, teal #128a72, hot pink #e84581, gold #ffc37a (desk trim / mug rim highlights), cream #fff3d6, warm paper #e9e5dd.
>
> Plain solid pure-white background (#ffffff), no scenery behind the desk, no text or watermark anywhere except the "%" on the mug. Bold readable silhouette. Half-body/upper-body framing showing the goblin from roughly the waist up behind the desk.

_3 takes generated; picked the take with the strongest droopy half-lidded deadpan eyes, cleanest composition, and a legible mug `%`._

### `standalone.png` — hero image passed as reference
> Using the EXACT SAME goblin character shown in the reference image (same olive-green skin, same big pointed ears, same slightly-too-big navy-indigo suit jacket, same magenta shirt, same teal necktie, same heavy-lidded droopy DEADPAN bored half-asleep eyes and flat mouth), redraw him as a FULL-BODY standalone character.
>
> Remove the news desk, the monitor, and the mug entirely. Show the complete goblin standing, facing forward, from head to feet, arms relaxed at his sides, centered with generous margin around him. Same slightly-too-big navy suit with trousers, magenta shirt, teal tie.
>
> [Same pixel-art style + strict palette block as above.] Plain solid pure-white background (#ffffff), absolutely nothing else in the scene, no text, no watermark, no shadow. Bold readable silhouette.

_2 takes; picked the fuller-suited stance with visible magenta cuff accents._

### Expression pack — standalone frame passed as reference
Shared base prompt (bust / half-body, chest up, facing forward, same pixel-art
style + strict palette + pure-white background as above), with the `EXPRESSION:`
line swapped per file:

- **`deadpan.png`** — "DEADPAN default — heavy-lidded droopy half-asleep bored eyes, flat neutral straight mouth, utterly unbothered. This is the resting host face."
- **`panic.png`** — "PANIC — eyes suddenly WIDE OPEN and round with alarm, small white eye highlights, eyebrows raised high, mouth a small tense open frown, one bold cream-white sweat drop running down the side of his face. Startled, like the odds just spiked."
- **`smug.png`** — "SMUG — half-lidded knowing eyes, one eyebrow cocked up, a subtle smug closed-mouth smirk pulling up one corner of the mouth, chin slightly raised. Self-satisfied, 'the market was right' energy."
- **`coffee-sip.png`** — "COFFEE SIP — mid-sip, holding a cream-colored coffee mug (with a bold magenta percent sign \"%\" on it) up to his mouth with one green hand, eyes still droopy and half-lidded and completely unbothered, calmly sipping amid chaos."
