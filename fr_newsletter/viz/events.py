"""Timestamped chart annotations."""
from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime

import pandas as pd


@dataclass
class Event:
    """One annotated moment on a chart.

    ``dx``/``dy`` position the label relative to the anchor point, in points —
    tune per chart so callouts never collide with the line or each other.
    """

    ts: datetime
    label: str
    sprite: str | None = None   # e.g. "red_card"
    dx: float = 0.0
    dy: float = 60.0
    anchor: str = "price"       # "price" (on the line) or "top"/"bottom"
    line: bool = True           # draw the vertical event hairline (off for states)

    @classmethod
    def from_dict(cls, d: dict) -> "Event":
        d = dict(d)
        d["ts"] = pd.Timestamp(d["ts"]).to_pydatetime()
        if d["ts"].tzinfo is None:
            d["ts"] = d["ts"].replace(tzinfo=__import__("datetime").timezone.utc)
        return cls(**d)
