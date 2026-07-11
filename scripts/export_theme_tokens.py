#!/usr/bin/env python3
"""Export the Fantasy Reality brand tokens to JSON for the Remotion side.

The house style lives in ``fr_newsletter/viz/theme.py`` (matplotlib). This
freezes the palette/fonts/shadow into ``video/src/theme/tokens.json`` so
Python and TypeScript share one source of truth (see docs/video/PLAN.md §2).

Deterministic: sorted keys, stable schema.

Usage:
    python scripts/export_theme_tokens.py
"""
from __future__ import annotations

import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO))

from fr_newsletter.viz import theme  # noqa: E402

OUT = REPO / "video" / "src" / "theme" / "tokens.json"

# The canonical hard pixel shadow is ``pixel_shadow`` (offset_px=6.0), drawn at
# (x0 + 6px, y0 - 6px) in figure space — i.e. 6px right, 6px down on screen.
# theme.SHADOW carries its alpha (0.15). The callout box uses a smaller 3px
# variant, so the top-level token uses the panel shadow.
_SHADOW_PX = 6


def build_tokens() -> dict:
    return {
        "colors": {
            "ink": theme.INK,
            "canvas": theme.CANVAS,
            "card": theme.CARD,
            "cream": theme.CREAM,
            "magenta": theme.MAGENTA,
            "red": theme.RED,
            "gold": theme.GOLD,
            "mutedText": theme.MUTED_TEXT,
            "grid": theme.GRID,
        },
        "series": list(theme.SERIES),
        "yes": theme.YES,
        "no": theme.NO,
        "fonts": {"pixel": theme.FONT_PIXEL, "mono": theme.FONT_MONO},
        "shadow": {"dx": _SHADOW_PX, "dy": _SHADOW_PX, "alpha": theme.SHADOW[3]},
        "radius": 0,
    }


def main() -> None:
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(build_tokens(), indent=2, sort_keys=True) + "\n")
    print(f"wrote {OUT.relative_to(REPO)}")


if __name__ == "__main__":
    main()
