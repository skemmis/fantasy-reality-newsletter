"""Chart builders: price timeline and market close-up.

Both accept either a single candle DataFrame (index: tz-aware UTC timestamps;
columns: ``close`` in cents, ``volume`` in contracts) or an ordered mapping of
``label -> DataFrame`` for multi-series charts, plus a list of ``Event``s.

Dataviz rules honored here: one series -> no legend (the title names it), two
or more -> legend always, colored by the validated palette slots in fixed
order; 2.5px lines; hairline solid grid; volume lives in its own subpanel
(never a second y-axis); text wears ink tokens, never the series color;
values are direct-labeled selectively (endpoints and the annotated moves).
"""
from __future__ import annotations

from zoneinfo import ZoneInfo

import matplotlib.dates as mdates
import matplotlib.pyplot as plt
import pandas as pd

from . import theme
from .events import Event
from ..times import ET, parse_ts


def _as_series(data) -> dict[str, pd.DataFrame]:
    if isinstance(data, pd.DataFrame):
        return {"": data}
    return dict(data)


def _ts(val, tz: ZoneInfo) -> pd.Timestamp:
    """Parse a timestamp (naive = ET) and convert to the display zone."""
    return parse_ts(val).tz_convert(tz)


def _prep(df: pd.DataFrame, tz: ZoneInfo, start=None, end=None,
          price_source: str = "mid") -> pd.DataFrame:
    out = df.copy()
    out.index = out.index.tz_convert(tz)
    if start is not None:
        out = out[out.index >= _ts(start, tz)]
    if end is not None:
        out = out[out.index <= _ts(end, tz)]
    # "mid" (bid/ask midpoint, default) suppresses bid-ask bounce without
    # lagging real repricing; "last" is the raw last-trade print.
    if price_source not in (None, "last", "close") and price_source in out:
        src = out[price_source]
        if src.notna().any():
            out["close"] = src
    return out


_MIN_YSPAN = 6.0  # floor so a near-flat line doesn't zoom to absurd magnification


def _auto_ylim(series: dict[str, pd.DataFrame]) -> tuple[float, float]:
    """Best-guess y-axis: frame the data as 80% of the chart height.

    A 10% buffer sits above and below the data span (10 + 80 + 10 = 100), so
    the line breathes without floating. The buffer is clamped where it would
    run past 0% or 100% — a market that touches 100 keeps a hard ceiling
    rather than inventing headroom that can't exist.
    """
    lo = min(df["close"].min() for df in series.values())
    hi = max(df["close"].max() for df in series.values())
    span = hi - lo
    pad = 0.125 * span  # data at 80% -> total height 1.25*span -> 12.5% each side
    lo, hi = lo - pad, hi + pad
    if hi - lo < _MIN_YSPAN:  # near-flat data: fall back to a readable minimum
        mid = (lo + hi) / 2
        lo, hi = mid - _MIN_YSPAN / 2, mid + _MIN_YSPAN / 2
    return max(0.0, lo), min(100.0, hi)


def _nice_chance_axis(ax, ylim: tuple[float, float]) -> None:
    span = ylim[1] - ylim[0]
    step = next(s for s in (1, 2, 5, 10, 25) if span / s <= 7)
    theme.chance_axis(ax, *ylim, step=step)


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
    """Anchor events on the primary (first) series."""
    for ev in events:
        x = _ts(ev.ts, tz)
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
        theme.callout(ax, (x, y), ev.label, (ev.dx, ev.dy), preset=preset,
                      sprite=ev.sprite, sprite_zoom=ev.zoom)


def _end_markers(ax, series: dict[str, pd.DataFrame], ylim) -> None:
    """Endpoint dot + value per series, nudged apart when endpoints collide."""
    ends = [(label, df.index[-1], float(df["close"].iloc[-1])) for label, df in series.items()]
    min_gap = (ylim[1] - ylim[0]) * 0.045
    placed: list[float] = []
    for i, (label, x, y) in enumerate(ends):
        color = theme.SERIES[i % len(theme.SERIES)]
        label_y = y
        while any(abs(label_y - p) < min_gap for p in placed):
            label_y -= min_gap
        placed.append(label_y)
        theme.end_marker(ax, x, y, f"{y:.0f}%", color=color, label_y=label_y)


def _legend(ax) -> None:
    leg = ax.legend(
        loc="best", prop={"family": theme.FONT_MONO, "size": 12},
        frameon=True, fancybox=False, framealpha=1.0,
        facecolor=theme.CARD, edgecolor=theme.INK, borderpad=0.8,
    )
    leg.get_frame().set_linewidth(1.6)
    leg.set_zorder(8)


def _volume_panel(axv, series: dict[str, pd.DataFrame], events: list[Event], tz: ZoneInfo,
                  per_label: str, n_target: int = 170) -> None:
    """Recessive volume bars (summed across shown series), own panel & axis."""
    vol = pd.concat([df["volume"] for df in series.values()], axis=1).sum(axis=1)
    span_s = (vol.index[-1] - vol.index[0]).total_seconds() or 1
    bucket_s = span_s / n_target
    rule = next((r for r, s in (("1min", 60), ("5min", 300), ("15min", 900), ("1h", 3600),
                                ("4h", 14400), ("1D", 86400)) if bucket_s <= s), "1D")
    binned = vol.resample(rule).sum()

    event_bins = {_ts(ev.ts, tz).floor(rule) for ev in events}
    width = (binned.index[1] - binned.index[0]) * 0.8 if len(binned) > 1 else None
    bars = axv.bar(binned.index, binned.values, width=width, linewidth=0, zorder=3)
    for ts, bar in zip(binned.index, bars):
        emphasized = ts in event_bins
        bar.set_facecolor(theme.YES if emphasized else theme.VOLUME_BAR)
        bar.set_alpha(0.9 if emphasized else 0.22)
    axv.set_ylim(0, (binned.max() or 1) * 1.15)
    axv.yaxis.set_major_formatter(
        lambda v, _: f"{v/1e6:,.1f}M" if v >= 1e6 else (f"{v/1000:,.0f}K" if v >= 1000 else f"{v:.0f}")
    )
    axv.text(0.012, 0.90, f"volume (contracts/{per_label or rule})", transform=axv.transAxes,
             family=theme.FONT_MONO, fontsize=12, color=theme.MUTED_TEXT, va="top")


def _source_line(ref_ticker: str, as_of: str | None, tz_label: str = "ET") -> str:
    src = f"Source: Kalshi · {ref_ticker}"
    if as_of:
        ts = pd.Timestamp(as_of).tz_convert(ET)
        src += f" · as of {ts.strftime('%b %-d, %-I:%M %p')} {tz_label}"
    return src


def price_timeline(
    data,
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
    ylim: tuple[float, float] | None = None,
    resample: str | None = None,
    show_volume: bool = False,
    price_source: str = "mid",
    tz: ZoneInfo = ET,
) -> plt.Figure:
    """The saga chart: price over days, annotated with the story's beats.

    ``ylim=None`` best-guesses the y-axis from the data (padded, snapped to
    5¢); pass an explicit pair to override. ``show_volume`` adds a recessive
    volume subpanel. No resampling by default — resampling can silently erase
    the short-lived spikes that are usually the story. ``price_source``:
    "mid" (default, no bid-ask bounce) or "last" (raw trade prints).
    """
    theme.apply()
    series = {k: _prep(df, tz, start, end, price_source) for k, df in _as_series(data).items()}
    series = {k: df for k, df in series.items() if not df.empty}
    if not series:
        raise ValueError("No data in the selected window.")
    if resample:
        series = {
            k: df.resample(resample).agg({"close": "last", "volume": "sum"}).dropna(subset=["close"])
            for k, df in series.items()
        }

    if show_volume:
        fig = plt.figure(figsize=(14.56, 9.6))
        ax = fig.add_axes([0.06, 0.345, 0.88, 0.435])
        axv = fig.add_axes([0.06, 0.115, 0.88, 0.18], sharex=ax)
        theme.pixel_shadow(fig, axv)
    else:
        fig = plt.figure(figsize=(14.56, 8.6))
        ax, axv = fig.add_axes([0.06, 0.11, 0.88, 0.64]), None
    theme.pixel_shadow(fig, ax)

    for i, (label, df) in enumerate(series.items()):
        ax.plot(df.index, df["close"], color=theme.SERIES[i % len(theme.SERIES)],
                zorder=3, label=label or None)

    if ylim is None:
        ylim = _auto_ylim(series)
    _nice_chance_axis(ax, ylim)

    lo_x = min(df.index[0] for df in series.values())
    hi_x = max(df.index[-1] for df in series.values())
    ax.set_xlim(lo_x, hi_x + (hi_x - lo_x) * 0.05)

    primary = next(iter(series.values()))
    _annotate_events(ax, primary, events, preset, tz)
    _end_markers(ax, series, ylim)
    if len(series) > 1:
        _legend(ax)

    if axv is not None:
        plt.setp(ax.get_xticklabels(), visible=False)
        ax.tick_params(axis="x", length=0)
        _volume_panel(axv, series, events, tz, per_label="")
        _day_axis(axv, tz)
    else:
        _day_axis(ax, tz)

    if yes_label:
        ax.text(0.012, 0.965, yes_label, transform=ax.transAxes, family=theme.FONT_MONO,
                fontsize=12, color=theme.MUTED_TEXT, va="top")

    theme.title_block(fig, title, subtitle, preset=preset)
    theme.footer(fig, _source_line(ticker, as_of))
    return fig


def market_closeup(
    data,
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
    price_source: str = "mid",
    tz: ZoneInfo = ET,
) -> plt.Figure:
    """Minute-level zoom on one moment: stepped price + volume subpanel."""
    theme.apply()
    series = {k: _prep(df, tz, start, end, price_source) for k, df in _as_series(data).items()}
    series = {k: df for k, df in series.items() if not df.empty}
    if not series:
        raise ValueError("No data in the selected window.")

    fig = plt.figure(figsize=(14.56, 9.6))
    ax = fig.add_axes([0.06, 0.345, 0.88, 0.435])
    axv = fig.add_axes([0.06, 0.115, 0.88, 0.18], sharex=ax)
    theme.pixel_shadow(fig, ax)
    theme.pixel_shadow(fig, axv)

    for i, (label, df) in enumerate(series.items()):
        color = theme.SERIES[i % len(theme.SERIES)]
        ax.step(df.index, df["close"], where="post", color=color, zorder=3, label=label or None)
        if len(series) == 1:
            ax.fill_between(df.index, 0, df["close"], step="post", color=color,
                            alpha=0.08, zorder=2)

    if ylim is None:
        ylim = _auto_ylim(series)
    _nice_chance_axis(ax, ylim)
    plt.setp(ax.get_xticklabels(), visible=False)
    ax.tick_params(axis="x", length=0)

    span_h = (max(df.index[-1] for df in series.values())
              - min(df.index[0] for df in series.values())).total_seconds() / 3600
    _volume_panel(axv, series, events, tz, per_label="min", n_target=400)
    _time_axis(axv, tz, span_h)

    primary = next(iter(series.values()))
    _annotate_events(ax, primary, events, preset, tz)
    _end_markers(ax, series, ylim)
    if len(series) > 1:
        _legend(ax)

    theme.title_block(fig, title, subtitle, preset=preset)
    theme.footer(fig, _source_line(ticker, as_of))
    return fig
