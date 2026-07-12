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
