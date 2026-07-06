"""Story rendering — the shared engine behind the CLI, the Action, and the web UI.

A *story* dict describes one newsletter idea: the market/event, optional
generated sprites, and a list of charts with their events. See
``stories/balogun-red-card/story.json`` for the shape.

Chart-level keys beyond the builder kwargs:

- ``markets``: list of market tickers from the story's event to overlay as
  separate series (default: the story's primary market)
- ``show_no``: also plot the primary market's NO side (100 - YES)
- ``output``: repo-relative PNG path (used by the CLI/Action, ignored by the web UI)
"""
from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

from .data import kalshi
from .viz import Event, market_closeup, price_timeline
from .viz.sprites import generate_sprite

BUILDERS = {"timeline": price_timeline, "closeup": market_closeup}


def _fetch(client: kalshi.KalshiClient, ref: kalshi.MarketRef, story: dict,
           story_dir: Path | None, refresh: bool) -> tuple[pd.DataFrame, str]:
    interval = story.get("interval", "1m")
    snap = kalshi.snapshot_path(story_dir, ref, interval) if story_dir else None
    if snap and snap.exists() and not refresh:
        _, df, fetched_at = kalshi.load_snapshot(snap)
        return df, fetched_at
    start = pd.Timestamp(story["data_start"]).to_pydatetime()
    end_cfg = story.get("data_end")
    end = pd.Timestamp(end_cfg).to_pydatetime() if end_cfg else datetime.now(timezone.utc)
    df = client.get_candles(ref, start, end, interval)
    if snap:
        kalshi.save_snapshot(snap, ref, df)
    return df, datetime.now(timezone.utc).isoformat(timespec="seconds")


def ensure_sprites(story: dict, *, force: bool = False) -> list[str]:
    """Generate any story-declared sprites that don't exist yet.

    ``story["sprites"]`` maps sprite name -> subject description for Nano
    Banana. Returns the paths it ensured.
    """
    made = []
    for name, subject in (story.get("sprites") or {}).items():
        made.append(str(generate_sprite(name, subject, force=force)))
    return made


def render_story(story: dict, story_dir: Path | None = None, refresh: bool = False):
    """Yield ``(chart_config, figure)`` for every chart in the story."""
    ensure_sprites(story)
    client = kalshi.KalshiClient()
    primary = client.resolve(story["market"])
    markets_by_ticker = {m["ticker"]: m for m in client.list_markets(story["market"])}
    cache: dict[str, tuple[pd.DataFrame, str]] = {}

    def market_df(ticker: str) -> tuple[pd.DataFrame, str, str]:
        if ticker not in cache:
            ref = kalshi.MarketRef(
                series_ticker=primary.series_ticker, event_ticker=primary.event_ticker,
                market_ticker=ticker,
            )
            cache[ticker] = _fetch(client, ref, story, story_dir, refresh)
        meta = markets_by_ticker.get(ticker, {})
        return (*cache[ticker], meta.get("label") or ticker.rsplit("-", 1)[-1])

    for chart in story["charts"]:
        cfg = dict(chart)
        builder = BUILDERS[cfg.pop("type")]
        cfg.pop("output", None)
        events = [Event.from_dict(e) for e in cfg.pop("events", [])]
        if cfg.get("ylim"):
            cfg["ylim"] = tuple(cfg["ylim"])
        else:
            cfg.pop("ylim", None)

        if builder is market_closeup:  # closeup always shows volume, never resamples
            cfg.pop("show_volume", None)
            cfg.pop("resample", None)

        tickers = cfg.pop("markets", None) or [primary.market_ticker]
        show_no = cfg.pop("show_no", False)
        series: dict[str, pd.DataFrame] = {}
        fetched_at = None
        for t in tickers:
            df, fetched_at, label = market_df(t)
            series[label] = df
        if show_no and len(tickers) == 1:
            label, df = next(iter(series.items()))
            no_df = df.copy()
            for col in ("close", "mid"):
                if col in no_df:
                    no_df[col] = 100 - no_df[col]
            if "bid" in no_df and "ask" in no_df:  # NO's book is YES's, mirrored
                no_df["bid"], no_df["ask"] = 100 - no_df["ask"], 100 - no_df["bid"]
            series = {f"YES · {label}": df, f"NO · {label}": no_df}

        data = next(iter(series.values())) if len(series) == 1 else series
        ticker_line = tickers[0] if len(tickers) == 1 else primary.event_ticker
        fig = builder(data, events, ticker=ticker_line, as_of=fetched_at, **cfg)
        yield chart, fig
