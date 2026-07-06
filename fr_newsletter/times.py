"""One timestamp convention for the whole toolkit.

Humans think in ET, so **naive timestamps are Eastern Time** everywhere a
person types one (wizard fields, story JSON, annotation times). Explicit
zones are always respected:

- ``2026-07-05 13:01``        -> 1:01 PM ET
- ``2026-07-05 13:01 ET``     -> 1:01 PM ET (EST/EDT resolved by date)
- ``2026-07-05 17:01 UTC``    -> same instant
- ``2026-07-05T17:01:00Z``    -> same instant (ISO)
"""
from __future__ import annotations

from zoneinfo import ZoneInfo

import pandas as pd

ET = ZoneInfo("America/New_York")
UTC = ZoneInfo("UTC")

_SUFFIXES = {"ET": ET, "EST": ET, "EDT": ET, "UTC": UTC, "GMT": UTC}


def parse_ts(val) -> pd.Timestamp:
    """Parse to a tz-aware Timestamp; naive input is Eastern Time."""
    if isinstance(val, str):
        val = val.strip()
        parts = val.rsplit(" ", 1)
        if len(parts) == 2 and parts[1].upper() in _SUFFIXES:
            return pd.Timestamp(parts[0]).tz_localize(_SUFFIXES[parts[1].upper()])
    ts = pd.Timestamp(val)
    if ts.tzinfo is None:
        ts = ts.tz_localize(ET)
    return ts
