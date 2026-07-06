"""Sprite generation via Nano Banana (Google's Gemini image model).

Hand-drawing pixel art in code doesn't scale past a red card — for the fun
annotation art (crying referees, presidential phones, golden boots) we call
Nano Banana with a house-style prompt wrapper, then post-process the result
into a chart-ready sprite: background made transparent, downscaled on a
nearest-neighbor grid so it stays crisply pixelated when the chart scales it
back up.

Requires ``GEMINI_API_KEY`` (Google AI Studio key) in the environment.
Generated sprites land in ``fr_newsletter/assets/sprites/<name>.png`` and are
referenced from story events by name, exactly like the built-in ``red_card``.
"""
from __future__ import annotations

import base64
import io
import os
from pathlib import Path

import httpx

ASSETS = Path(__file__).resolve().parent.parent / "assets"
SPRITE_DIR = ASSETS / "sprites"

GEMINI_MODEL = "gemini-2.5-flash-image"
GEMINI_URL = (
    "https://generativelanguage.googleapis.com/v1beta/models/"
    f"{GEMINI_MODEL}:generateContent"
)

STYLE_WRAPPER = (
    "A 16-bit pixel-art game sprite of {subject}. Hyper Light Drifter inspired "
    "palette: deep indigo (#17122b) outlines, magenta (#c8327a), teal (#2ea890), "
    "cream (#fff3d6), red (#e24050), coin gold (#ffc37a). Flat colors, chunky "
    "visible pixels, 2px dark outline around the silhouette. A single centered "
    "object on a plain solid pure-white background. No text, no ground shadow, "
    "no gradients."
)


def generate_sprite(
    name: str,
    subject: str,
    *,
    out_dir: Path | None = None,
    api_key: str | None = None,
    max_px: int = 56,
    force: bool = False,
) -> Path:
    """Generate ``<out_dir>/<name>.png`` from a subject description.

    Skips the API call if the sprite already exists (unless ``force``).
    """
    out_dir = Path(out_dir or SPRITE_DIR)
    out = out_dir / f"{name}.png"
    if out.exists() and not force:
        return out

    api_key = api_key or os.environ.get("GEMINI_API_KEY")
    if not api_key:
        raise RuntimeError(
            f"Sprite {name!r} doesn't exist and GEMINI_API_KEY isn't set — "
            "set the key (Railway variable / GitHub Actions secret) or use an existing sprite name."
        )

    resp = httpx.post(
        GEMINI_URL,
        headers={"x-goog-api-key": api_key},
        json={"contents": [{"parts": [{"text": STYLE_WRAPPER.format(subject=subject)}]}]},
        timeout=120,
    )
    resp.raise_for_status()
    png = _extract_image(resp.json())
    sprite = _to_sprite(png, max_px=max_px)
    out_dir.mkdir(parents=True, exist_ok=True)
    out.write_bytes(sprite)
    return out


def _extract_image(payload: dict) -> bytes:
    for cand in payload.get("candidates", []):
        for part in (cand.get("content") or {}).get("parts", []):
            inline = part.get("inlineData") or part.get("inline_data")
            if inline and inline.get("data"):
                return base64.b64decode(inline["data"])
    raise RuntimeError(f"No image in Nano Banana response: {str(payload)[:400]}")


def _to_sprite(png: bytes, max_px: int = 56, white_thresh: int = 242) -> bytes:
    """White background -> transparent; downscale to a crisp pixel grid."""
    from PIL import Image

    img = Image.open(io.BytesIO(png)).convert("RGBA")

    # Knock out the near-white background.
    data = img.getdata()
    img.putdata([
        (r, g, b, 0) if r >= white_thresh and g >= white_thresh and b >= white_thresh else (r, g, b, a)
        for r, g, b, a in data
    ])

    # Trim transparent margins, keep aspect, snap to a small grid.
    bbox = img.getbbox()
    if bbox:
        img = img.crop(bbox)
    scale = max_px / max(img.size)
    if scale < 1:
        img = img.resize(
            (max(1, round(img.width * scale)), max(1, round(img.height * scale))),
            Image.NEAREST,
        )

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()
