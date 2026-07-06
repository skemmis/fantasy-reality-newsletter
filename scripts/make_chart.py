#!/usr/bin/env python3
"""Render every chart in a story config.

Usage:
    python scripts/make_chart.py stories/balogun-red-card/story.json [--refresh]

Candle data is snapshotted next to the story (``data/``) so committed charts
stay reproducible; ``--refresh`` refetches. Story-declared sprites are
generated via Nano Banana when missing (needs GEMINI_API_KEY).
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO))

from fr_newsletter.story import render_story  # noqa: E402


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("story", type=Path)
    p.add_argument("--refresh", action="store_true", help="refetch candles, update snapshot")
    args = p.parse_args()

    story_path = args.story if args.story.is_absolute() else REPO / args.story
    story = json.loads(story_path.read_text())

    for chart, fig in render_story(story, story_dir=story_path.parent, refresh=args.refresh):
        out = REPO / chart["output"]
        out.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(out)
        print(f"wrote {out.relative_to(REPO)}")


if __name__ == "__main__":
    main()
