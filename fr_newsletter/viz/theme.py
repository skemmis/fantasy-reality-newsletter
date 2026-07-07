"""Fantasy Reality chart theme for matplotlib.

Translates the Fantasy Reality design system (Hyper Light Drifter palette,
Press Start 2P headers, Space Mono body, zero radius, hard offset shadows)
into matplotlib rcParams plus drawing helpers.

The categorical palette is NOT eyeballed: it was run through the dataviz
six-checks validator (lightness band, chroma floor, CVD separation, contrast)
against the card surface — all checks pass. See ``fr_newsletter/assets/palette.md``
for the derivation from the app's CSS tokens.
"""
from __future__ import annotations

from pathlib import Path

import matplotlib
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.patches import Rectangle

ASSETS = Path(__file__).resolve().parent.parent / "assets"

# ------------------------------------------------------------- brand tokens
# Source: Fantasy-Reality client/src/index.css (:root)
INK = "#17122b"          # indigo ink — text, borders
CANVAS = "#e9e5dd"       # warm page background
CARD = "#f9f7f0"         # chart surface (near-white warm card)
CREAM = "#fff3d6"
MAGENTA = "#c8327a"      # brand primary — accents/wordmark, never a series
RED = "#e24050"          # destructive — red card sprite only
GOLD = "#ffc37a"         # coin gold — accents only (fails contrast as a mark)
MUTED_TEXT = "#544a6b"   # muted ink for secondary text
GRID = "#e7e2d6"         # hairline grid, one step off CARD
SHADOW = (0, 0, 0, 0.15) # hard pixel shadow, no blur

# ------------------------------------- categorical series (validator: PASS)
# Slots snapped from app tokens to pass all six checks on CARD:
#   yes-teal 2ea890->128a72 · no-pink e84581 (exact) · blue-teal 2b6f97->2470ad
#   coin-gold->b0761a · muted-purple 543776->7050a0 · no-strong a9324a (exact)
SERIES = ["#128a72", "#e84581", "#2470ad", "#b0761a", "#7050a0", "#a9324a"]
YES, NO = SERIES[0], SERIES[1]   # outcome pair, same semantics as the app
VOLUME_BAR = INK                  # drawn at low alpha — recessive magnitude

FONT_PIXEL = "Press Start 2P"
FONT_MONO = "Space Mono"

_fonts_registered = False


def register_fonts() -> None:
    global _fonts_registered
    if _fonts_registered:
        return
    for ttf in sorted((ASSETS / "fonts").glob("*.ttf")):
        font_manager.fontManager.addfont(str(ttf))
    _fonts_registered = True


def apply() -> None:
    """Apply the Fantasy Reality rcParams. Call once before building figures."""
    register_fonts()
    matplotlib.rcParams.update(
        {
            "figure.facecolor": CANVAS,
            "savefig.facecolor": CANVAS,
            "axes.facecolor": CARD,
            "axes.edgecolor": INK,
            "axes.linewidth": 2.0,            # the app's 2px pixel border
            "axes.axisbelow": True,
            "axes.grid": True,
            "grid.color": GRID,
            "grid.linewidth": 1.0,            # hairline, solid, recessive
            "grid.linestyle": "-",
            "axes.prop_cycle": plt.cycler(color=SERIES),
            "font.family": FONT_MONO,
            "text.color": INK,
            "axes.labelcolor": MUTED_TEXT,
            "xtick.color": MUTED_TEXT,
            "ytick.color": MUTED_TEXT,
            "xtick.labelsize": 13,
            "ytick.labelsize": 13,
            "lines.linewidth": 2.5,
            "lines.solid_capstyle": "round",
            "lines.solid_joinstyle": "round",
            "figure.dpi": 100,
            "savefig.dpi": 100,
        }
    )


# ------------------------------------------------------------------ helpers

def px_to_fig(fig, px: float) -> tuple[float, float]:
    """Convert a pixel offset to figure-fraction (dx, dy)."""
    w, h = fig.get_size_inches() * fig.dpi
    return px / w, px / h


def pixel_shadow(fig, ax, offset_px: float = 6.0) -> None:
    """The app's ``shadow-pixel`` — a hard offset shadow behind the axes panel."""
    pos = ax.get_position()
    dx, dy = px_to_fig(fig, offset_px)
    fig.patches.append(
        Rectangle(
            (pos.x0 + dx, pos.y0 - dy), pos.width, pos.height,
            transform=fig.transFigure, facecolor=SHADOW, edgecolor="none", zorder=0.5,
        )
    )


def title_block(fig, title: str, subtitle: str | None = None, *, preset: str = "editorial",
                x: float = 0.06, y: float = 0.955) -> None:
    """Press Start 2P headline + Space Mono deck, top-left aligned."""
    size = 21 if preset == "meme" else 18
    fig.text(x, y, title.upper(), family=FONT_PIXEL, fontsize=size, color=INK,
             ha="left", va="top", linespacing=1.9)
    if subtitle:
        n_lines = title.count("\n") + 1
        dy = (size * 1.9 * n_lines + 16) / (fig.get_size_inches()[1] * fig.dpi)
        fig.text(x, y - dy, subtitle, family=FONT_MONO, fontsize=14,
                 color=MUTED_TEXT, ha="left", va="top", linespacing=1.3)


def footer(fig, source: str, *, x: float = 0.06) -> None:
    """Brand wordmark left, data source right."""
    fig.text(x, 0.022, "FANTASY REALITY", family=FONT_PIXEL, fontsize=10,
             color=MAGENTA, ha="left", va="bottom")
    fig.text(1 - x + 0.0, 0.022, source, family=FONT_MONO, fontsize=11,
             color=MUTED_TEXT, ha="right", va="bottom")


def chance_axis(ax, lo: float = 0, hi: float = 100, step: float = 25) -> None:
    """Probability y axis (% chance; Kalshi cents map 1:1), with an
    emphasized 50% toss-up line."""
    import math

    import numpy as np
    ax.set_ylim(lo, hi)
    ticks = np.arange(math.ceil(lo / step) * step, hi + 0.1, step)
    ax.set_yticks(ticks)
    ax.set_yticklabels([f"{int(t)}%" for t in ticks])
    if lo < 50 < hi:
        ax.axhline(50, color=MUTED_TEXT, linewidth=1.0, alpha=0.55, zorder=1.2)


def end_marker(ax, x, y, label: str, color: str = YES, label_y=None) -> None:
    """>=8px end dot with a 2px surface ring + direct value label.

    ``label_y`` places the text at a different height than the dot (collision
    nudging for converging multi-series endpoints).
    """
    ax.scatter([x], [y], s=130, color=color, edgecolor=CARD, linewidth=2, zorder=6,
               clip_on=False)
    ax.annotate(label, (x, label_y if label_y is not None else y), xytext=(12, 0),
                textcoords="offset points",
                family=FONT_MONO, fontweight="bold", fontsize=17, color=INK,
                va="center", ha="left", zorder=6, annotation_clip=False)


def callout(ax, xy, text: str, xytext, *, preset: str = "editorial",
            sprite: str | None = None, color: str = INK, fontsize: float | None = None,
            sprite_zoom: float = 3.0):
    """Event annotation.

    ``editorial`` — quiet Space Mono label with a thin leader line.
    ``meme``      — Press Start 2P text in a card box with a hard pixel shadow.
    """
    from matplotlib import patheffects

    if preset == "meme":
        t = ax.annotate(
            text.upper(), xy, xytext=xytext, textcoords="offset points",
            family=FONT_PIXEL, fontsize=fontsize or 9, color=color, linespacing=2.1,
            ha="center", va="center", zorder=7,
            bbox=dict(boxstyle="square,pad=0.75", facecolor=CARD, edgecolor=INK, linewidth=1.6),
            arrowprops=dict(arrowstyle="-", color=INK, linewidth=1.2,
                            shrinkA=8, shrinkB=4),
        )
        t.get_bbox_patch().set_path_effects(
            [patheffects.SimplePatchShadow(offset=(3, -3), shadow_rgbFace="black",
                                           alpha=0.15, rho=1.0),
             patheffects.Normal()]
        )
    else:
        t = ax.annotate(
            text, xy, xytext=xytext, textcoords="offset points",
            family=FONT_MONO, fontsize=fontsize or 13, color=INK, linespacing=1.4,
            ha="center", va="center", zorder=7,
            arrowprops=dict(arrowstyle="-", color=MUTED_TEXT, linewidth=1.0,
                            shrinkA=6, shrinkB=3),
        )
    if sprite:
        add_sprite(ax, sprite, xy=xy, xytext=xytext, owner=t, zoom=sprite_zoom)
    return t


def add_sprite(ax, name: str, *, xy, xytext, owner=None, zoom: float = 3.0) -> None:
    """Drop a pixel-art sprite (nearest-neighbor scaled) above a callout."""
    import matplotlib.image as mimage
    from matplotlib.offsetbox import AnnotationBbox, OffsetImage

    path = ASSETS / "sprites" / f"{name}.png"
    if not path.exists():
        return
    img = mimage.imread(str(path))
    box = OffsetImage(img, zoom=zoom, interpolation="nearest")
    # Place the sprite just above the callout text/box.
    pad = 80 if owner is not None and owner.get_bbox_patch() is not None else 18
    ab = AnnotationBbox(box, xy, xybox=(xytext[0], xytext[1] + pad),
                        boxcoords="offset points", frameon=False, zorder=8,
                        annotation_clip=False)
    ax.add_artist(ab)


def event_line(ax, x, color: str = INK) -> None:
    """Solid hairline marking an event instant."""
    ax.axvline(x, color=color, linewidth=1.0, alpha=0.45, zorder=1.5)
