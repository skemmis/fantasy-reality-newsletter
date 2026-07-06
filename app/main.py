"""Chart generator web UI.

A small FastAPI app so charts can be made from a browser (no terminal):
paste a Kalshi market URL, pick a chart type and preset, list the events,
get a publish-ready PNG.
"""
from __future__ import annotations

import base64
import io
from datetime import datetime, timedelta, timezone
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402
from fastapi import FastAPI, Form, Request  # noqa: E402
from fastapi.responses import HTMLResponse  # noqa: E402
from fastapi.templating import Jinja2Templates  # noqa: E402

import json  # noqa: E402

from fr_newsletter.data.kalshi import KalshiClient  # noqa: E402
from fr_newsletter.story import render_story  # noqa: E402
from fr_newsletter.viz import Event, market_closeup, price_timeline  # noqa: E402
from fr_newsletter.viz.sprites import generate_sprite  # noqa: E402

app = FastAPI(title="Fantasy Reality chart generator")
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))

BUILDERS = {"timeline": price_timeline, "closeup": market_closeup}


def parse_events(text: str) -> list[Event]:
    """One event per line: ``ISO timestamp | label | sprite | dx | dy | line``.

    Only timestamp and label are required; ``\\n`` in a label makes a line
    break. Example::

        2026-07-05 17:01 UTC | FIFA suspends\\nthe suspension | red_card | -40 | 95
    """
    events = []
    for raw in (text or "").splitlines():
        raw = raw.strip()
        if not raw or raw.startswith("#"):
            continue
        parts = [p.strip() for p in raw.split("|")]
        if len(parts) < 2:
            continue
        d: dict = {"ts": parts[0], "label": parts[1].replace("\\n", "\n")}
        if len(parts) > 2 and parts[2]:
            d["sprite"] = parts[2]
        if len(parts) > 3 and parts[3]:
            d["dx"] = float(parts[3])
        if len(parts) > 4 and parts[4]:
            d["dy"] = float(parts[4])
        if len(parts) > 5 and parts[5]:
            d["line"] = parts[5].lower() not in ("false", "no", "0")
        events.append(Event.from_dict(d))
    return events


def _ctx(**overrides) -> dict:
    ctx = {"png": None, "pngs": [], "sprite_png": None, "error": None, "form": {}, "story_json": ""}
    ctx.update(overrides)
    return ctx


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse(request, "index.html", _ctx())


@app.get("/health")
def health():
    return {"ok": True}


@app.post("/chart", response_class=HTMLResponse)
def make_chart(
    request: Request,
    market: str = Form(...),
    chart_type: str = Form("timeline"),
    preset: str = Form("editorial"),
    title: str = Form(""),
    subtitle: str = Form(""),
    data_start: str = Form(""),
    start: str = Form(""),
    end: str = Form(""),
    ylim: str = Form(""),
    events: str = Form(""),
):
    form = dict(market=market, chart_type=chart_type, preset=preset, title=title,
                subtitle=subtitle, data_start=data_start, start=start, end=end,
                ylim=ylim, events=events)
    try:
        client = KalshiClient()
        ref = client.resolve(market)
        fetch_start = (
            pd.Timestamp(data_start).tz_localize("UTC") if data_start and pd.Timestamp(data_start).tzinfo is None
            else pd.Timestamp(data_start) if data_start
            else pd.Timestamp(datetime.now(timezone.utc) - timedelta(days=7))
        )
        now = datetime.now(timezone.utc)
        df = client.get_candles(ref, fetch_start.to_pydatetime(), now)
        if df.empty:
            raise ValueError("No trades found for that market/time range.")

        kwargs: dict = dict(
            title=title or ref.title,
            subtitle=subtitle.replace("\\n", "\n") or None,
            preset=preset,
            ticker=ref.market_ticker,
            as_of=now.isoformat(),
        )
        for key, val in (("start", start), ("end", end)):
            if val:
                ts = pd.Timestamp(val)
                kwargs[key] = ts.tz_localize("UTC") if ts.tzinfo is None else ts
        if ylim:
            lo, hi = (float(v) for v in ylim.replace(",", " ").split())
            kwargs["ylim"] = (lo, hi)

        fig = BUILDERS[chart_type](df, parse_events(events), **kwargs)
        return templates.TemplateResponse(request, "index.html", _ctx(png=_fig_b64(fig), form=form))
    except Exception as exc:  # surface the problem in the page, keep the form filled
        return templates.TemplateResponse(request, "index.html", _ctx(error=str(exc), form=form))


def _fig_b64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode()


@app.post("/story", response_class=HTMLResponse)
def story_mode(request: Request, story_json: str = Form(...)):
    """Render every chart in a pasted story JSON (same shape as stories/*.json)."""
    try:
        story = json.loads(story_json)
        pngs = [
            {"name": Path(chart.get("output", f"chart-{i}.png")).name, "b64": _fig_b64(fig)}
            for i, (chart, fig) in enumerate(render_story(story))
        ]
        if not pngs:
            raise ValueError("Story has no charts.")
        return templates.TemplateResponse(request, "index.html", _ctx(pngs=pngs, story_json=story_json))
    except Exception as exc:
        return templates.TemplateResponse(request, "index.html", _ctx(error=str(exc), story_json=story_json))


@app.post("/sprite", response_class=HTMLResponse)
def sprite_mode(request: Request, sprite_name: str = Form(...), sprite_subject: str = Form(...)):
    """Generate a Nano Banana sprite into the sprite library (needs GEMINI_API_KEY)."""
    try:
        path = generate_sprite(sprite_name.strip(), sprite_subject.strip(), force=True)
        b64 = base64.b64encode(path.read_bytes()).decode()
        return templates.TemplateResponse(request, "index.html", _ctx(sprite_png=b64))
    except Exception as exc:
        return templates.TemplateResponse(request, "index.html", _ctx(error=str(exc)))
