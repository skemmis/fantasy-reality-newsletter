"""Chart generator web UI.

A three-step wizard (no terminal needed):

1. Paste a Kalshi EVENT or market URL — the event's markets are listed and the
   tool best-guesses the axes and title.
2. Adjust the frame: markets to overlay, chart type, preset, x-window, y-axis,
   volume panel, YES/NO, titles.
3. Add annotations and generate sprites for them.

The preview re-renders the real PNG after every change; save downloads the PNG
and the story JSON that reproduces it (commit that to ``stories/`` to make it
permanent).
"""
from __future__ import annotations

import base64
import io
import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt  # noqa: E402
import pandas as pd  # noqa: E402
from fastapi import Body, FastAPI, Form, Request  # noqa: E402
from fastapi.responses import HTMLResponse, JSONResponse  # noqa: E402
from fastapi.templating import Jinja2Templates  # noqa: E402

from fr_newsletter.data.kalshi import KalshiClient  # noqa: E402
from fr_newsletter.story import render_story  # noqa: E402
from fr_newsletter.viz.charts import _auto_ylim, _prep, ET  # noqa: E402
from fr_newsletter.viz.sprites import generate_sprite  # noqa: E402

app = FastAPI(title="Fantasy Reality chart generator")
templates = Jinja2Templates(directory=str(Path(__file__).parent / "templates"))


def _fig_b64(fig) -> str:
    buf = io.BytesIO()
    fig.savefig(buf, format="png")
    plt.close(fig)
    return base64.b64encode(buf.getvalue()).decode()


@app.get("/", response_class=HTMLResponse)
def index(request: Request):
    return templates.TemplateResponse(
        request, "index.html", {"pngs": [], "error": None, "story_json": ""}
    )


@app.get("/health")
def health():
    return {"ok": True}


# ------------------------------------------------------------------ JSON API

@app.post("/api/resolve")
def api_resolve(payload: dict = Body(...)):
    """Event URL/ticker -> market list + best-guess config for the wizard."""
    try:
        ref = str(payload.get("ref", "")).strip()
        client = KalshiClient()
        primary = client.resolve(ref)
        markets = client.list_markets(ref)

        now = datetime.now(timezone.utc)
        open_time = next(
            (m["open_time"] for m in markets if m["ticker"] == primary.market_ticker), None
        )
        data_start = now - timedelta(days=14)
        if open_time:
            opened = pd.Timestamp(open_time).to_pydatetime()
            if opened > now - timedelta(days=30):
                data_start = opened

        df = client.get_candles(primary, data_start, now)
        ylim = _auto_ylim({"": _prep(df, ET)}) if not df.empty else (0, 100)

        def et_local(dt) -> str:  # value for a datetime-local input, in ET
            return pd.Timestamp(dt).tz_convert(ET).strftime("%Y-%m-%dT%H:%M")

        return {
            "event_ticker": primary.event_ticker,
            "primary": primary.market_ticker,
            "markets": markets,
            "suggest": {
                "data_start": et_local(data_start),
                "title": primary.title,
                "subtitle": "",
                "ylim": list(ylim),
            },
            "ranges": {
                "since_open": et_local(data_start),
                "last_24h": et_local(now - timedelta(hours=24)),
                "last_6h": et_local(now - timedelta(hours=6)),
            },
        }
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=400)


@app.post("/api/render")
def api_render(story: dict = Body(...)):
    """Render a (mini) story dict — same shape as stories/*.json — to PNG(s)."""
    try:
        pngs = [_fig_b64(fig) for _, fig in render_story(story)]
        if not pngs:
            raise ValueError("Story has no charts.")
        return {"pngs": pngs}
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=400)


@app.post("/api/sprite")
def api_sprite(payload: dict = Body(...)):
    """Generate a Nano Banana sprite into the library (needs GEMINI_API_KEY)."""
    try:
        name = str(payload.get("name", "")).strip()
        subject = str(payload.get("subject", "")).strip()
        if not name or not subject:
            raise ValueError("Both sprite name and subject are required.")
        path = generate_sprite(name, subject, force=bool(payload.get("force", True)))
        return {"name": name, "png": base64.b64encode(path.read_bytes()).decode()}
    except Exception as exc:
        return JSONResponse({"error": str(exc)}, status_code=400)


# ------------------------------------------- story mode (server-side, no JS)

@app.post("/story", response_class=HTMLResponse)
def story_mode(request: Request, story_json: str = Form(...)):
    """Render every chart in a pasted story JSON (fallback for the JS-averse)."""
    try:
        story = json.loads(story_json)
        pngs = [
            {"name": Path(chart.get("output", f"chart-{i}.png")).name, "b64": _fig_b64(fig)}
            for i, (chart, fig) in enumerate(render_story(story))
        ]
        return templates.TemplateResponse(
            request, "index.html", {"pngs": pngs, "error": None, "story_json": story_json}
        )
    except Exception as exc:
        return templates.TemplateResponse(
            request, "index.html", {"pngs": [], "error": str(exc), "story_json": story_json}
        )
