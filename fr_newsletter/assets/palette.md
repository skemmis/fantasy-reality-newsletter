# Fantasy Reality chart palette

The chart theme's design-system parameters, derived from the app's CSS tokens
(`Fantasy-Reality/client/src/index.css`) and validated with the dataviz
six-checks validator — never eyeballed.

## Surfaces

| Surface | Hex | Source token |
|---|---|---|
| Chart surface (light) | `#f9f7f0` | `--card` hsl(42 45% 96%) |
| Page canvas | `#e9e5dd` | `--background` hsl(42 22% 89%) |
| Ink (text/borders) | `#17122b` | `--foreground` hsl(252 41% 12%) |
| Muted text | `#544a6b` | derived from `--muted-foreground` |
| Grid hairline | `#e7e2d6` | one step off surface |

## Categorical theme (default order) — validator: ALL SIX CHECKS PASS

Validated against `#f9f7f0`, light mode, adjacent pairs:
lightness band PASS · chroma floor PASS · CVD worst adjacent ΔE 13.6 (deutan) PASS · contrast ≥3:1 PASS.

| Slot | Hex | Derivation |
|---|---|---|
| 1 (YES) | `#128a72` | `--yes` #2ea890, darkened one step for mark contrast |
| 2 (NO) | `#e84581` | `--no` — exact app token |
| 3 | `#2470ad` | `--accent` #2b6f97, chroma raised past the 0.10 floor |
| 4 | `#b0761a` | coin gold `#ffc37a`, darkened into the lightness band |
| 5 | `#7050a0` | muted purple `#543776`, lightened into the band |
| 6 | `#a9324a` | `--no-strong` — exact app token |

Slots 1–2 are the app's YES/NO outcome pair and keep that meaning in any
outcome chart. Green/red are never used for YES/NO (app rule).

## Reserved / non-series colors

| Role | Hex | Use |
|---|---|---|
| Brand accent | `#c8327a` | wordmark, UI accents — never a data series |
| Red card / destructive | `#e24050` | the red-card sprite, status only |
| Warning | `#ffac70` | status only, always with icon+label |
| Volume bars | ink `#17122b` at 22% alpha | recessive magnitude; event minutes wear slot 1 at 90% |

## Rules carried from the dataviz method

- Single series → no legend; the title names the series.
- Volume never shares a y-axis with price — it gets its own subpanel.
- Text wears ink/muted tokens, never a series color.
- Sequential ramps (when needed) build light→dark on slot 1's hue.
- Any new categorical order must re-run
  `validate_palette.js "<hexes>" --mode light --surface "#f9f7f0"` before shipping.
