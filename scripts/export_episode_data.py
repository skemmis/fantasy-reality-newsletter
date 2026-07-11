#!/usr/bin/env python3
"""Export a Kalshi market's candlesticks to the Remotion episode ``data.json``.

Fetches one or more markets (URLs or tickers), converts the bid/ask midpoint to
a probability PERCENT (0-100), and writes a per-episode
``video/public/episodes/<slug>/data.json`` plus a ``moves.md`` scratch file of
the biggest day-over-day swings (for a human to write annotations against).

See docs/video/PLAN.md §2 for how this feeds the Remotion MarketChartScene.

Usage:
    python scripts/export_episode_data.py <ref>... --slug SLUG \\
        [--interval 1m|1h|1d] [--start ET] [--end ET] [--annotations path.json]

Timestamps are ET-friendly (naive input is Eastern Time; see fr_newsletter.times).
Kalshi ticker quirk: the fed-hike series is KXFEDHIKE but its event ticker is
FEDHIKE and the flagship market is FEDHIKE-26DEC31 — resolve() handles this, and
an ``op_market_ticker=`` URL param is honored if present.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import parse_qs, urlsplit

REPO = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(REPO))

import pandas as pd  # noqa: E402

from fr_newsletter.data import kalshi  # noqa: E402
from fr_newsletter.times import parse_ts  # noqa: E402

# Cap points shipped to the browser per market; the Remotion draw-on doesn't
# need sub-pixel resolution.
_MAX_POINTS = 2500
# Fallback history start when a ref has no discoverable open_time.
_DEFAULT_START = datetime(2025, 1, 1, tzinfo=timezone.utc)


def _market_ticker_override(ref: str) -> str | None:
    """Honor a Kalshi ``?op_market_ticker=`` URL param (the market the page
    actually opens to), which parse_market_ref drops with the query string."""
    if "op_market_ticker=" not in ref:
        return None
    qs = parse_qs(urlsplit(ref).query)
    vals = qs.get("op_market_ticker")
    return vals[0].upper() if vals else None


def _resolve(client: kalshi.KalshiClient, ref: str) -> tuple[kalshi.MarketRef, dict]:
    """Resolve a ref to (MarketRef, market-summary meta dict)."""
    resolved = client.resolve(ref)
    override = _market_ticker_override(ref)
    markets = client.list_markets(ref)
    if override and override != resolved.market_ticker:
        chosen = next((m for m in markets if m["ticker"] == override), None)
        if chosen is not None:
            resolved = kalshi.MarketRef(
                series_ticker=resolved.series_ticker,
                event_ticker=resolved.event_ticker,
                market_ticker=override,
                title=chosen.get("title", resolved.title),
                subtitle=chosen.get("label", resolved.subtitle),
            )
    meta = next((m for m in markets if m["ticker"] == resolved.market_ticker), {})
    return resolved, meta


def _downsample(df: pd.DataFrame) -> pd.DataFrame:
    """Evenly thin to <= _MAX_POINTS rows, always keeping first and last."""
    n = len(df)
    if n <= _MAX_POINTS:
        return df
    import numpy as np

    idx = np.linspace(0, n - 1, _MAX_POINTS).round().astype(int)
    idx = np.unique(idx)
    idx[0], idx[-1] = 0, n - 1
    return df.iloc[idx]


def _points(df: pd.DataFrame) -> tuple[list[dict], list[dict]]:
    points, volume = [], []
    for ts, row in df.iterrows():
        t = ts.tz_convert("UTC").isoformat().replace("+00:00", "Z")
        points.append({"t": t, "p": round(float(row["mid"]), 1)})
        volume.append({"t": t, "v": round(float(row["volume"]), 2)})
    return points, volume


def _biggest_moves(df: pd.DataFrame, n: int = 10) -> list[dict]:
    """Top-n largest absolute day-over-day percent moves of the midpoint."""
    daily = df["mid"].resample("1D").last().dropna()
    delta = daily.diff().dropna()
    if delta.empty:
        return []
    top = delta.reindex(delta.abs().sort_values(ascending=False).index[:n])
    out = []
    for ts, d in top.items():
        frm = float(daily.loc[:ts].iloc[-2])
        to = float(daily.loc[ts])
        out.append(
            {
                "date": ts.tz_convert("UTC").date().isoformat(),
                "from": round(frm, 1),
                "to": round(to, 1),
                "delta": round(float(d), 1),
            }
        )
    return out


def _write_moves_md(path: Path, slug: str, ticker: str, moves: list[dict]) -> None:
    lines = [
        f"# Biggest day-over-day moves — {slug} ({ticker})",
        "",
        "Ten largest single-day swings in the market's midpoint probability.",
        "Use these to write annotations (what news moved each spike).",
        "",
        "| # | Date | From | To | Delta |",
        "|---|------|------|-----|-------|",
    ]
    for i, m in enumerate(moves, 1):
        arrow = "+" if m["delta"] >= 0 else ""
        lines.append(
            f"| {i} | {m['date']} | {m['from']:.1f}% | {m['to']:.1f}% "
            f"| {arrow}{m['delta']:.1f} |"
        )
    path.write_text("\n".join(lines) + "\n")


def main() -> None:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("refs", nargs="+", help="Kalshi market URL(s) or ticker(s)")
    p.add_argument("--slug", required=True, help="episode slug (output dir name)")
    p.add_argument("--interval", default="1h", choices=sorted(kalshi.INTERVALS),
                   help="candle interval (default 1h)")
    p.add_argument("--start", help="history start (ET-friendly; default: market open)")
    p.add_argument("--end", help="history end (ET-friendly; default: now)")
    p.add_argument("--annotations", type=Path, help="JSON list merged verbatim")
    args = p.parse_args()

    end = parse_ts(args.end).to_pydatetime() if args.end else datetime.now(timezone.utc)
    start_override = parse_ts(args.start).to_pydatetime() if args.start else None

    client = kalshi.KalshiClient()
    out_dir = REPO / "video" / "public" / "episodes" / args.slug
    out_dir.mkdir(parents=True, exist_ok=True)

    markets_out = []
    title = ""
    last_price_pct = None
    volume_usd = None
    primary_df = None
    primary_ticker = None

    for slot, ref in enumerate(args.refs):
        resolved, meta = _resolve(client, ref)
        start = start_override
        if start is None:
            open_time = meta.get("open_time")
            start = (parse_ts(open_time).to_pydatetime() if open_time
                     else _DEFAULT_START)
        df = client.get_candles(resolved, start, end, args.interval)
        if df.empty:
            print(f"warning: no candles for {resolved.market_ticker}", file=sys.stderr)
        df = _downsample(df)
        points, volume = _points(df)
        name = resolved.subtitle or meta.get("label") or resolved.market_ticker
        markets_out.append(
            {
                "ticker": resolved.market_ticker,
                "name": name,
                "slot": slot,
                "points": points,
                "volume": volume,
            }
        )
        if slot == 0:
            title = resolved.title
            last_price_pct = points[-1]["p"] if points else None
            primary_df = df
            primary_ticker = resolved.market_ticker
            if not df.empty:
                volume_usd = round(float((df["volume"] * df["close"] / 100).sum()))
        print(f"slot {slot}: {resolved.market_ticker} -> {len(points)} points "
              f"({points[0]['t'] if points else '-'} .. {points[-1]['t'] if points else '-'})")

    annotations = []
    if args.annotations:
        annotations = json.loads(Path(args.annotations).read_text())
        if not isinstance(annotations, list):
            raise SystemExit("--annotations file must contain a JSON list")

    data = {
        "slug": args.slug,
        "markets": markets_out,
        "annotations": annotations,
        "meta": {
            "title": title,
            "generated_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
            "interval": args.interval,
            "last_price_pct": last_price_pct,
            "volume_usd": volume_usd,
        },
    }
    data_path = out_dir / "data.json"
    data_path.write_text(json.dumps(data, indent=2) + "\n")
    print(f"wrote {data_path.relative_to(REPO)}")

    if primary_df is not None and not primary_df.empty:
        moves = _biggest_moves(primary_df)
        _write_moves_md(out_dir / "moves.md", args.slug, primary_ticker, moves)
        print(f"wrote {(out_dir / 'moves.md').relative_to(REPO)} ({len(moves)} moves)")

    client.close()


if __name__ == "__main__":
    main()
