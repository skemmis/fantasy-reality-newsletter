"""Story rendering — the shared engine behind the CLI, the Action, and the web UI.

A *story* dict describes one newsletter idea: the market, optional generated
sprites, and a list of charts with their events. See
``stories/balogun-red-card/story.json`` for the shape.
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from .data import kalshi
from .viz import Event, market_closeup, price_timeline
from .viz.sprites import generate_sprite

BUILDERS = {"timeline": price_timeline, "closeup": market_closeup}


def load_story_data(story: dict, story_dir: Path | None, refresh: bool = False):
    """Resolve the market and get candles — from the story's snapshot when
    available (reproducibility), otherwise from the API."""
    client = kalshi.KalshiClient()
    ref = client.resolve(story["market"])
    interval = story.get("interval", "1m")
    snap = kalshi.snapshot_path(story_dir, ref, interval) if story_dir else None
    if snap and snap.exists() and not refresh:
        return (*kalshi.load_snapshot(snap), True)
    start = pd.Timestamp(story["data_start"]).to_pydatetime()
    end_cfg = story.get("data_end")
    end = pd.Timestamp(end_cfg).to_pydatetime() if end_cfg else datetime.now(timezone.utc)
    df = client.get_candles(ref, start, end, interval)
    if snap:
        kalshi.save_snapshot(snap, ref, df)
    fetched_at = datetime.now(timezone.utc).isoformat(timespec="seconds")
    return ref, df, fetched_at, False


def ensure_sprites(story: dict, *, force: bool = False) -> list[str]:
    """Generate any story-declared sprites that don't exist yet.

    ``story["sprites"]`` maps sprite name -> subject description for Nano
    Banana. Returns the names it generated.
    """
    made = []
    for name, subject in (story.get("sprites") or {}).items():
        path = generate_sprite(name, subject, force=force)
        made.append(str(path))
    return made


def render_story(story: dict, story_dir: Path | None = None, refresh: bool = False):
    """Yield ``(chart_config, figure)`` for every chart in the story."""
    ensure_sprites(story)
    ref, df, fetched_at, _ = load_story_data(story, story_dir, refresh)
    for chart in story["charts"]:
        cfg = dict(chart)
        builder = BUILDERS[cfg.pop("type")]
        cfg.pop("output", None)
        events = [Event.from_dict(e) for e in cfg.pop("events", [])]
        if "ylim" in cfg:
            cfg["ylim"] = tuple(cfg["ylim"])
        fig = builder(df, events, ticker=ref.market_ticker, as_of=fetched_at, **cfg)
        yield chart, fig
