#!/usr/bin/env python3
"""Render every chart in a story config.

Usage:
    python scripts/make_chart.py stories/balogun-red-card/story.json [--refresh]

A story is a JSON file describing one newsletter story: the market, the
events, and one or more charts. Candle data is snapshotted next to the story
(``data/``) so committed charts stay reproducible; ``--refresh`` refetches.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO))

from fr_newsletter.data import kalshi  # noqa: E402
from fr_newsletter.viz import Event, market_closeup, price_timeline  # noqa: E402

BUILDERS = {"timeline": price_timeline, "closeup": market_closeup}


def load_story_data(story: dict, story_dir: Path, refresh: bool):
    client = kalshi.KalshiClient()
    ref = client.resolve(story["market"])
    interval = story.get("interval", "1m")
    snap = kalshi.snapshot_path(story_dir, ref, interval)
    if snap.exists() and not refresh:
        ref, df, fetched_at = kalshi.load_snapshot(snap)
        print(f"using snapshot {snap.relative_to(REPO)} (fetched {fetched_at})")
        return ref, df, fetched_at
    start = pd.Timestamp(story["data_start"]).to_pydatetime()
    end_cfg = story.get("data_end")
    end = pd.Timestamp(end_cfg).to_pydatetime() if end_cfg else datetime.now(timezone.utc)
    df = client.get_candles(ref, start, end, interval)
    kalshi.save_snapshot(snap, ref, df)
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    print(f"fetched {len(df)} candles -> {snap.relative_to(REPO)}")
    return ref, df, fetched_at


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__)
    p.add_argument("story", type=Path)
    p.add_argument("--refresh", action="store_true", help="refetch candles, update snapshot")
    args = p.parse_args()

    story_path = args.story if args.story.is_absolute() else REPO / args.story
    story = json.loads(story_path.read_text())
    story_dir = story_path.parent

    ref, df, fetched_at = load_story_data(story, story_dir, args.refresh)

    for chart in story["charts"]:
        cfg = dict(chart)
        builder = BUILDERS[cfg.pop("type")]
        out = REPO / cfg.pop("output")
        events = [Event.from_dict(e) for e in cfg.pop("events", [])]
        if "ylim" in cfg:
            cfg["ylim"] = tuple(cfg["ylim"])
        fig = builder(df, events, ticker=ref.market_ticker, as_of=fetched_at, **cfg)
        out.parent.mkdir(parents=True, exist_ok=True)
        fig.savefig(out)
        print(f"wrote {out.relative_to(REPO)}")


if __name__ == "__main__":
    main()
