# Culled / skipped assets

Final visual review of every processed asset. **No assets were culled** — all 16
show-library finals (portraits, props, loops, memes, backdrops) passed inspection
and are in the manifest.

## Regenerations that fixed the previous agent's BAD raws
- **powell** — v1 had two faces. Regenerated with a single-face constraint and the
  good `warsh` raw passed as a framing reference so scale/bust match. Fixed.
- **money-printer** — v1 was a shapeless blob. Regenerated as a clear printer. Fixed.
- **flame-1** — v1 had a graph-paper background. Regenerated on plain white. Fixed.
- **tariff-crate** — v1 was cluttered. Regenerated as one crate + one tag. Fixed.
- **this-is-fine** — v1 refused by the content filter. Regenerated with softened
  "cozy cartoon flames / parody homage" wording. Rendered correctly. Kept.
- **oil-barrel** — took two passes: first pass fixed the graph-paper background but
  the model enclosed the barrel in a stray picture-frame border; a second retry with
  an explicit no-frame/no-border instruction produced a clean standalone barrel. Kept.

## Ignored
- Mascot exploration raws in scratchpad (`hero_a`, `hero_c`, `standalone_a`,
  `deadpan`, `panic`, `smug`, `coffee-sip`) — already finalized in `mascot/v2/`; not
  reprocessed.

---

# Expansion pass: mascot / cast / props / loops (silly-maximalist)

Added 21 manifest entries (24 → 45): 5 mascot goblin additions, the 7-entry
`cast/` hawk-&-dove bit, 7 props, 2 loops. Every goblin shot used
`mascot/v2/standalone.png` as an image reference; `warsh-hawk` / `powell-wave`
used the matching portrait as reference. All 26 model raws passed visual review
on the first take — **no assets were culled from the final library.**

## Retries (off-brand first take, fixed on the second)
- **hawk-flap-2** — first downstroke frame grew stray magenta/pink feathers,
  which would flicker against the solid-gold `hawk-flap-1` and static `hawk`.
  Regenerated passing `hawk-flap-1` as an extra reference with an explicit
  "no pink/magenta, solid gold wing" constraint. Fixed.
- **dove-flap-1** — same failure mode (pink crept into the upstroke wing).
  Regenerated passing the clean `dove-flap-2` as an extra reference to lock the
  cream/teal wing (only the beak flower stays pink). Fixed.

## Notes
- `confetti-coin-3` (reverse) is a horizontal flip of `confetti-coin-1` — a
  spinning coin's back reads as a mirrored face, so no separate generation.
- Loop frame sets (`talk`, `hawk-flap`, `dove-flap`, `confetti-coin`, `siren`)
  are processed on a shared union bounding box so the subject stays registered
  and only the intended delta (mouth / wing / glow) moves between frames.
