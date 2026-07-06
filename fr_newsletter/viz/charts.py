"""Chart builders: price timeline and market close-up.

Both take a candle DataFrame (index: tz-aware UTC timestamps; columns:
``close`` in cents, ``volume`` in contracts) and a list of ``Event``s, and
return a matplotlib Figure styled by ``theme``.

Dataviz rules honored here: single series -> no legend (the title names it);
2px line; hairline solid grid; volume lives in its own subpanel (never a
second y-axis); text wears ink tokens, never the series color; values are
direct-labeled selectively (the endpoint and the event moves).
"""
from __future__ import annotations

from datetime import datetime
from zoneinfo import ZoneInfo

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import pandas as pd

from . import theme
from .events import Event

ET = ZoneInfo("America/New_York")


def _prep(df: pd.DataFrame, tz: ZoneInfo, start=None, end=None) -> pd.DataFrame:
    out = df.copy()
    out.index = out.index.tz_convert(tz)
    if start is not None:
        out = out[out.index >= pd.Timestamp(start).tz_convert(tz)]
    if end is not None:
        out = out[out.index <= pd.Timestamp(end).tz_convert(tz)]
    return out


def _day_axis(ax, tz: ZoneInfo) -> None:
    ax.xaxis.set_major_locator(mdates.DayLocator(tz=tz))
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%b %-d", tz=tz))
    ax.tick_params(axis="x", length=0, pad=8)


def _time_axis(ax, tz: ZoneInfo, span_hours: float) -> None:
    if span_hours <= 8:
        locator = mdates.MinuteLocator(byminute=[0, 30], tz=tz)
    else:
        locator = mdates.AutoDateLocator(tz=tz, minticks=4, maxticks=8)
    ax.xaxis.set_major_locator(locator)
    ax.xaxis.set_major_formatter(mdates.DateFormatter("%-I:%M %p", tz=tz))
    ax.tick_params(axis="x", length=0, pad=8)


def _annotate_events(ax, df: pd.DataFrame, events: list[Event], preset: str, tz: ZoneInfo) -> None:
    for ev in events:
        x = pd.Timestamp(ev.ts).tz_convert(tz)
        if ev.line:
            theme.event_line(ax, x)
        if ev.anchor == "top":
            y = ax.get_ylim()[1]
        elif ev.anchor == "bottom":
            y = ax.get_ylim()[0]
        else:
            idx = df.index.searchsorted(x)
            idx = min(max(idx, 0), len(df) - 1)
            y = df["close"].iloc[idx]
        theme.callout(ax, (x, y), ev.label, (ev.dx, ev.dy), preset=preset, sprite=ev.sprite)


def _source_line(ref_ticker: str, as_of: str | None, tz_label: str = "ET") -> str:
    src = f"Source: Kalshi · {ref_ticker}"
    if as_of:
        ts = pd.Timestamp(as_of).tz_convert(ET)
        src += f" · as of {ts.strftime('%b %-d, %-I:%M %p')} {tz_label}"
    return src


def price_timeline(
    df: pd.DataFrame,
    events: list[Event],
    *,
    title: str,
    subtitle: str | None = None,
    preset: str = "editorial",
    ticker: str = "",
    as_of: str | None = None,
    yes_label: str | None = None,
    start=None,
    end=None,
    ylim: tuple[float, float] = (0, 100),
    resample: str | None = None,
    tz: ZoneInfo = ET,
) -> plt.Figure:
    """The saga chart: price over days, annotated with the story's beats.

    No area fill and no resampling by default: a probability line reads
    cleanest bare, and resampling can silently erase the short-lived spikes
    that are usually the story.
    """
    theme.apply()
    data = _prep(df, tz, start, end)
    if resample:
        data = data.resample(resample).agg({"close": "last", "volume": "sum"}).dropna(subset=["close"])

    fig = plt.figure(figsize=(14.56, 8.6))
    ax = fig.add_axes([0.06, 0.11, 0.88, 0.64])
    theme.pixel_shadow(fig, ax)

    ax.plot(data.index, data["close"], color=theme.YES, zorder=3)

    theme.cents_axis(ax, *ylim, step=10 if (ylim[1] - ylim[0]) <= 50 else 25)
    _day_axis(ax, tz)
    ax.set_xlim(data.index[0], data.index[-1] + (data.index[-1] - data.index[0]) * 0.05)

    _annotate_events(ax, data, events, preset, tz)

    last_x, last_y = data.index[-1], data["close"].iloc[-1]
    theme.end_marker(ax, last_x, last_y, f"{last_y:.0f}¢")

    if yes_label:
        ax.text(0.012, 0.965, yes_label, transform=ax.transAxes, family=theme.FONT_MONO,
                fontsize=9.5, color=theme.MUTED_TEXT, va="top")

    theme.title_block(fig, title, subtitle, preset=preset)
    theme.footer(fig, _source_line(ticker, as_of))
    return fig


def market_closeup(
    df: pd.DataFrame,
    events: list[Event],
    *,
    title: str,
    subtitle: str | None = None,
    preset: str = "meme",
    ticker: str = "",
    as_of: str | None = None,
    start=None,
    end=None,
    ylim: tuple[float, float] | None = None,
    tz: ZoneInfo = ET,
) -> plt.Figure:
    """Minute-level zoom on one moment: stepped price + volume subpanel."""
    theme.apply()
    data = _prep(df, tz, start, end)

    fig = plt.figure(figsize=(14.56, 9.6))
    ax = fig.add_axes([0.06, 0.36, 0.88, 0.46])
    axv = fig.add_axes([0.06, 0.115, 0.88, 0.185], sharex=ax)
    theme.pixel_shadow(fig, ax)
    theme.pixel_shadow(fig, axv)

    ax.step(data.index, data["close"], where="post", color=theme.YES, zorder=3)
    ax.fill_between(data.index, 0, data["close"], step="post", color=theme.YES,
                    alpha=0.08, zorder=2)

    if ylim is None:
        lo = max(0, 5 * ((data["close"].min() - 2) // 5))
        hi = min(100, 5 * -((-(data["close"].max() + 2)) // 5))
        ylim = (float(lo), float(hi))
    span = ylim[1] - ylim[0]
    step = next(s for s in (1, 2, 5, 10, 25) if span / s <= 6)
    theme.cents_axis(ax, *ylim, step=step)
    plt.setp(ax.get_xticklabels(), visible=False)
    ax.tick_params(axis="x", length=0)

    # Volume: magnitude in its own recessive panel — never a dual axis.
    # Emphasis form: the minute(s) belonging to annotated events wear the
    # series teal; everything else stays context-gray.
    event_minutes = {pd.Timestamp(ev.ts).tz_convert(tz).floor("min") for ev in events}
    colors = [theme.YES if ts.floor("min") in event_minutes else theme.VOLUME_BAR
              for ts in data.index]
    alphas = [0.9 if ts.floor("min") in event_minutes else 0.22 for ts in data.index]
    width = (data.index[1] - data.index[0]) * 0.8 if len(data) > 1 else None
    bars = axv.bar(data.index, data["volume"], width=width, linewidth=0, zorder=3)
    for bar, c, a in zip(bars, colors, alphas):
        bar.set_facecolor(c)
        bar.set_alpha(a)
    axv.set_ylim(0, data["volume"].max() * 1.15 or 1)
    axv.yaxis.set_major_formatter(lambda v, _: f"{v/1000:,.0f}K" if v >= 1000 else f"{v:.0f}")
    axv.text(0.012, 0.90, "volume (contracts/min)", transform=axv.transAxes,
             family=theme.FONT_MONO, fontsize=9, color=theme.MUTED_TEXT, va="top")
    span_h = (data.index[-1] - data.index[0]).total_seconds() / 3600
    _time_axis(axv, tz, span_h)

    _annotate_events(ax, data, events, preset, tz)

    last_x, last_y = data.index[-1], data["close"].iloc[-1]
    theme.end_marker(ax, last_x, last_y, f"{last_y:.0f}¢")

    theme.title_block(fig, title, subtitle, preset=preset)
    theme.footer(fig, _source_line(ticker, as_of))
    return fig
