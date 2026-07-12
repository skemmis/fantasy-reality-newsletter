#!/usr/bin/env python3
"""Screenshot a news article headline for use as a video source-card.

Opens a URL in headless Chromium (Playwright), waits for the page to settle,
makes a best-effort attempt to dismiss cookie/consent banners, then saves a
screenshot plus a small JSON sidecar describing what was captured.

Usage:
    python scripts/grab_headline.py --url URL --slug SLUG [--selector CSS] [--out DIR]

Examples:
    # top-of-page crop (default 1440x700)
    python scripts/grab_headline.py \
        --url https://www.cnbc.com/2026/06/05/jobs-report-may-2026.html \
        --slug jobs-cnbc

    # screenshot a specific element instead of the top crop
    python scripts/grab_headline.py --url URL --slug fomc-cnbc --selector "h1"

Output (default dir video/public/assets/headlines):
    <slug>.png    the screenshot
    <slug>.json   {url, title, fetched_at, [selector], [clip]}

Notes:
    Playwright's bundled-browser version may not match the pip package; this
    script auto-locates a Chromium build under $PLAYWRIGHT_BROWSERS_PATH and
    launches it via executable_path. Set SSL_CERT_FILE for the proxy CA.
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

REPO = Path(__file__).resolve().parent.parent
DEFAULT_OUT = REPO / "video" / "public" / "assets" / "headlines"

DESKTOP_UA = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 "
    "(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36"
)

VIEWPORT = {"width": 1440, "height": 900}
CROP_W, CROP_H = 1440, 700

# Common consent/cookie dismiss buttons. Tried in order; failures are ignored.
COOKIE_SELECTORS = [
    "#onetrust-accept-btn-handler",
    "button#truste-consent-button",
    "button[aria-label='Accept all']",
    "button[aria-label='Accept All']",
    "button[title='Accept all']",
    ".onetrust-close-btn-handler",
]
# Text-based fallbacks (case-insensitive substring on button/role=button).
COOKIE_TEXTS = [
    "Accept All",
    "Accept all",
    "I Accept",
    "I agree",
    "Agree",
    "Got it",
    "Allow all",
    "Continue",
]


def find_chromium() -> str | None:
    """Locate a Chromium executable under $PLAYWRIGHT_BROWSERS_PATH.

    The pip playwright package pins a browser build that may not be the one
    preinstalled in the image, so we search for any chromium-*/chrome binary
    (full Chrome preferred; headless_shell as fallback) and return its path.
    Returns None to let Playwright use its own default resolution.
    """
    root = os.environ.get("PLAYWRIGHT_BROWSERS_PATH")
    if not root or not Path(root).is_dir():
        return None
    base = Path(root)
    # Prefer full chrome (better rendering / element screenshots).
    for pat in ("chromium-*/chrome-linux/chrome", "chromium-*/chrome-linux/headless_shell"):
        hits = sorted(base.glob(pat), reverse=True)
        if hits:
            return str(hits[0])
    for pat in ("chromium_headless_shell-*/chrome-linux/headless_shell",):
        hits = sorted(base.glob(pat), reverse=True)
        if hits:
            return str(hits[0])
    return None


def dismiss_cookies(page) -> bool:
    """Best-effort dismissal of a cookie/consent banner. Never raises."""
    for sel in COOKIE_SELECTORS:
        try:
            loc = page.locator(sel).first
            if loc.count() and loc.is_visible():
                loc.click(timeout=1500)
                page.wait_for_timeout(400)
                return True
        except Exception:
            pass
    for text in COOKIE_TEXTS:
        try:
            loc = page.get_by_role("button", name=text, exact=False).first
            if loc.count() and loc.is_visible():
                loc.click(timeout=1500)
                page.wait_for_timeout(400)
                return True
        except Exception:
            pass
    return False


def grab(url: str, slug: str, selector: str | None, out_dir: Path) -> dict:
    out_dir.mkdir(parents=True, exist_ok=True)
    png_path = out_dir / f"{slug}.png"
    json_path = out_dir / f"{slug}.json"

    exe = find_chromium()
    # --no-sandbox: we run as root in the container.
    # --ssl-version-max=tls1.2: the agent proxy re-terminates TLS but resets on
    #   Chromium's large TLS-1.3 post-quantum ClientHello; capping at 1.2 avoids
    #   the reset. Cert verification stays ON (proxy CA is in the system store).
    chromium_args = [
        "--no-sandbox",
        "--disable-gpu",
        "--ssl-version-max=tls1.2",
    ]
    launch_kwargs = {"headless": True, "args": chromium_args}
    if exe:
        launch_kwargs["executable_path"] = exe

    # Outbound HTTPS must traverse the agent proxy; Chromium needs it explicitly.
    proxy_url = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
    if proxy_url:
        launch_kwargs["proxy"] = {"server": proxy_url}

    with sync_playwright() as p:
        browser = p.chromium.launch(**launch_kwargs)
        context = browser.new_context(
            user_agent=DESKTOP_UA,
            viewport=VIEWPORT,
            device_scale_factor=2,
        )
        page = context.new_page()
        page.goto(url, wait_until="load", timeout=60000)
        page.wait_for_timeout(2000)

        dismissed = dismiss_cookies(page)
        if dismissed:
            page.wait_for_timeout(600)

        # Some sites (e.g. CNBC) render a "Loading ..." placeholder <title> that
        # JS swaps for the real one; poll briefly so the sidecar is accurate.
        title = page.title()
        for _ in range(10):
            if title and not title.lower().startswith("loading"):
                break
            page.wait_for_timeout(500)
            title = page.title()

        meta = {
            "url": url,
            "title": title,
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

        if selector:
            loc = page.locator(selector).first
            loc.wait_for(state="visible", timeout=15000)
            loc.scroll_into_view_if_needed(timeout=5000)
            page.wait_for_timeout(400)
            loc.screenshot(path=str(png_path))
            meta["selector"] = selector
        else:
            clip = {"x": 0, "y": 0, "width": CROP_W, "height": CROP_H}
            page.screenshot(path=str(png_path), clip=clip)
            meta["clip"] = clip

        meta["cookie_banner_dismissed"] = dismissed

        context.close()
        browser.close()

    json_path.write_text(json.dumps(meta, indent=2) + "\n")
    return meta


def main() -> None:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("--url", required=True, help="article URL")
    ap.add_argument("--slug", required=True, help="output basename, e.g. jobs-cnbc")
    ap.add_argument("--selector", default=None, help="CSS selector to screenshot instead of top crop")
    ap.add_argument("--out", type=Path, default=DEFAULT_OUT, help=f"output dir (default {DEFAULT_OUT})")
    args = ap.parse_args()

    try:
        meta = grab(args.url, args.slug, args.selector, args.out)
    except Exception as exc:  # surface a clean error for the pipeline
        print(f"FAILED {args.slug}: {type(exc).__name__}: {exc}", file=sys.stderr)
        sys.exit(1)

    out_dir = args.out
    print(f"wrote {out_dir / (args.slug + '.png')}")
    print(f"wrote {out_dir / (args.slug + '.json')}")
    print(f"  title: {meta['title']!r}")
    print(f"  cookie banner dismissed: {meta['cookie_banner_dismissed']}")


if __name__ == "__main__":
    main()
