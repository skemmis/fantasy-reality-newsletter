"""Kalshi public API client.

Read-only access to the trade API (no auth needed for market data):
markets, events, and minute/hour/day candlesticks — plus JSON snapshot
caching so a chart committed to a story stays reproducible after the
market closes.
"""
from __future__ import annotations

import json
import re
import time
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path

import httpx
import pandas as pd

BASE_URL = "https://api.elections.kalshi.com/trade-api/v2"

# Candlestick period_interval is in minutes; only these are accepted.
INTERVALS = {"1m": 1, "1h": 60, "1d": 1440}
# Max candles the API returns per request.
_MAX_CANDLES = 5000

# Short-lived caches so a preview UI can re-render without refetching, and so
# resolve/list/render don't refetch the same event within a session burst.
_CACHE_TTL_S = 120
_candle_cache: dict[tuple, tuple[float, pd.DataFrame]] = {}
_event_cache: dict[str, tuple[float, dict]] = {}

# Kalshi rate-limits per IP (aggressively for unauthenticated readers, and
# cloud egress IPs are shared) — space requests out and back off on 429.
_MIN_CALL_SPACING_S = 0.25
_RETRIES = 4
_last_call = 0.0


def _throttle() -> None:
    global _last_call
    wait = _last_call + _MIN_CALL_SPACING_S - time.monotonic()
    if wait > 0:
        time.sleep(wait)
    _last_call = time.monotonic()


@dataclass
class MarketRef:
    """A resolved pointer to one Kalshi binary market."""

    series_ticker: str
    event_ticker: str
    market_ticker: str
    title: str = ""
    subtitle: str = ""


def parse_market_ref(ref: str) -> tuple[str, str | None]:
    """Parse a kalshi.com URL or a raw ticker.

    Returns ``(event_ticker, market_ticker_or_None)`` — market ticker is only
    known when the ref itself is a full market ticker (event tickers and URLs
    resolve to an event whose markets are then listed).

    Accepted forms::

        https://kalshi.com/markets/kxwcadvance/world-cup-advance/kxwcadvance-26jul06usabel
        KXWCADVANCE-26JUL06USABEL          (event ticker)
        KXWCADVANCE-26JUL06USABEL-USA      (market ticker)
    """
    ref = ref.strip()
    if "//" in ref or "kalshi.com" in ref:
        path = ref.split("kalshi.com", 1)[-1]
        segments = [s for s in path.split("?")[0].split("#")[0].split("/") if s]
        if not segments:
            raise ValueError(f"Could not find a ticker in URL: {ref}")
        ref = segments[-1]
    ticker = ref.upper()
    if not re.fullmatch(r"[A-Z0-9.\-]+", ticker):
        raise ValueError(f"Not a Kalshi ticker: {ref!r}")
    # Heuristic: SERIES-EVENT is an event ticker, SERIES-EVENT-SUFFIX a market.
    parts = ticker.split("-")
    if len(parts) >= 3:
        return "-".join(parts[:2]), ticker
    return ticker, None


class KalshiClient:
    def __init__(self, timeout: float = 30.0):
        self._http = httpx.Client(base_url=BASE_URL, timeout=timeout)

    def _get(self, path: str, params: dict | None = None) -> dict:
        """GET with request spacing and 429/5xx backoff (honors Retry-After)."""
        for attempt in range(_RETRIES):
            _throttle()
            r = self._http.get(path, params=params)
            if r.status_code == 429 or r.status_code >= 500:
                if attempt == _RETRIES - 1:
                    if r.status_code == 429:
                        raise RuntimeError(
                            "Kalshi is rate-limiting this server's IP (429) even after "
                            f"{_RETRIES} retries with backoff — wait a minute and try again."
                        )
                    r.raise_for_status()
                retry_after = r.headers.get("Retry-After")
                delay = float(retry_after) if retry_after and retry_after.isdigit() else 0.8 * 2**attempt
                time.sleep(min(delay, 15))
                continue
            r.raise_for_status()
            return r.json()
        raise AssertionError("unreachable")

    def get_event(self, event_ticker: str) -> dict:
        hit = _event_cache.get(event_ticker)
        if hit and time.monotonic() - hit[0] < _CACHE_TTL_S:
            return hit[1]
        event = self._get(f"/events/{event_ticker}", params={"with_nested_markets": True})["event"]
        _event_cache[event_ticker] = (time.monotonic(), event)
        return event

    def list_markets(self, ref: str) -> list[dict]:
        """Summaries of every market in an event, highest volume first.

        Each entry: ``ticker``, ``label`` (the yes-side subtitle, e.g. "USA
        advances"), ``title``, ``last_price`` (cents), ``volume``,
        ``open_time``, ``close_time``, ``status``.
        """
        event_ticker, _ = parse_market_ref(ref)
        event = self.get_event(event_ticker)
        out = []
        for m in event.get("markets") or []:
            last = m.get("last_price_dollars")
            out.append(
                {
                    "ticker": m["ticker"],
                    "label": m.get("yes_sub_title") or m["ticker"].rsplit("-", 1)[-1],
                    "title": m.get("title", ""),
                    "last_price": float(last) * 100 if last is not None else None,
                    "volume": float(m.get("volume_fp") or 0),
                    "open_time": m.get("open_time"),
                    "close_time": m.get("close_time"),
                    "status": m.get("status", ""),
                }
            )
        out.sort(key=lambda m: -m["volume"])
        return out

    def resolve(self, ref: str) -> MarketRef:
        """Resolve a URL/ticker to a concrete market.

        For an event ref with several nested markets, picks the highest-volume
        one (for head-to-head events like "X vs Y: To Advance" both sides are
        the same market mirrored, so this is the natural default).
        """
        event_ticker, market_ticker = parse_market_ref(ref)
        event = self.get_event(event_ticker)
        markets = event.get("markets") or []
        if not markets:
            raise ValueError(f"Event {event_ticker} has no markets")
        market = None
        if market_ticker:
            market = next((m for m in markets if m["ticker"] == market_ticker), None)
        if market is None:
            market = max(markets, key=lambda m: float(m.get("volume_fp") or 0))
        series_ticker = event.get("series_ticker") or event_ticker.split("-")[0]
        return MarketRef(
            series_ticker=series_ticker,
            event_ticker=event_ticker,
            market_ticker=market["ticker"],
            title=market.get("title", ""),
            subtitle=market.get("yes_sub_title", ""),
        )

    def get_candles(
        self,
        ref: MarketRef,
        start: datetime,
        end: datetime,
        interval: str = "1m",
    ) -> pd.DataFrame:
        """Fetch candlesticks as a tz-aware DataFrame.

        Columns: ``close`` (last trade price, cents), ``volume`` (contracts),
        ``open_interest``; indexed by the candle's end time (UTC). Paginates
        past the 5000-candle response cap.
        """
        minutes = INTERVALS[interval]
        start_ts, end_ts = int(start.timestamp()), int(end.timestamp())

        # Serve repeat preview renders from the short-lived cache.
        key = (ref.market_ticker, interval, start_ts, end_ts // _CACHE_TTL_S)
        hit = _candle_cache.get(key)
        if hit and time.monotonic() - hit[0] < _CACHE_TTL_S:
            return hit[1].copy()

        rows: list[dict] = []
        cursor = start_ts
        while cursor < end_ts:
            chunk_end = min(cursor + _MAX_CANDLES * minutes * 60, end_ts)
            payload = self._get(
                f"/series/{ref.series_ticker}/markets/{ref.market_ticker}/candlesticks",
                params={"start_ts": cursor, "end_ts": chunk_end, "period_interval": minutes},
            )
            rows.extend(payload.get("candlesticks") or [])
            cursor = chunk_end
        df = _candles_to_df(rows)
        if len(_candle_cache) > 32:
            _candle_cache.clear()
        _candle_cache[key] = (time.monotonic(), df.copy())
        return df

    def close(self) -> None:
        self._http.close()


def _candles_to_df(rows: list[dict]) -> pd.DataFrame:
    records = []
    for c in rows:
        price = c.get("price") or {}
        close = price.get("close_dollars")
        records.append(
            {
                "ts": datetime.fromtimestamp(c["end_period_ts"], tz=timezone.utc),
                "close": float(close) * 100 if close is not None else None,
                "volume": float(c.get("volume_fp") or 0),
                "open_interest": float(c.get("open_interest_fp") or 0),
            }
        )
    df = pd.DataFrame.from_records(records)
    if df.empty:
        return df
    df = df.drop_duplicates(subset="ts").set_index("ts").sort_index()
    # Between trades the API reports no close; carry the last trade price.
    df["close"] = df["close"].ffill()
    return df.dropna(subset=["close"])


# ---------------------------------------------------------------- snapshots

def snapshot_path(story_dir: Path, ref: MarketRef, interval: str) -> Path:
    return Path(story_dir) / "data" / f"candles_{ref.market_ticker}_{interval}.json"


def save_snapshot(path: Path, ref: MarketRef, df: pd.DataFrame) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "market": ref.__dict__,
        "fetched_at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
        "candles": [
            {"ts": ts.isoformat(), "close": r.close, "volume": r.volume, "open_interest": r.open_interest}
            for ts, r in df.iterrows()
        ],
    }
    path.write_text(json.dumps(payload))


def load_snapshot(path: Path) -> tuple[MarketRef, pd.DataFrame, str]:
    payload = json.loads(Path(path).read_text())
    ref = MarketRef(**payload["market"])
    df = pd.DataFrame.from_records(payload["candles"])
    df["ts"] = pd.to_datetime(df["ts"])
    df = df.set_index("ts").sort_index()
    return ref, df, payload["fetched_at"]
