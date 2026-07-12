#!/usr/bin/env python3
"""Add a local media file to the video asset library.

Copies a file into ``video/public/assets/<kind>/`` and appends an entry to
``video/public/assets/assets.json``. This is the curation tool for the local
reaction-clip / b-roll library: point it at any file on disk and it becomes a
first-class, referenceable asset.

The written entry keeps the existing asset schema (id, kind, file, alpha,
label, tags, loop, note) and additively includes ``source`` and ``license``
fields. Existing consumers that don't know about those fields simply ignore
them.

Usage:
    python scripts/ingest_asset.py PATH --kind KIND --id ID --tags a,b,c \
        [--label LABEL] [--source SRC] [--license LIC] [--note NOTE]

    KIND is one of: broll | gif | clip | headline | other

Examples:
    python scripts/ingest_asset.py ~/clips/fine.mp4 --kind broll \
        --id this-is-fine-clip --tags fine,fire,calm,react \
        --label "THIS IS FINE" --source giphy --license "fair-use"

    python scripts/ingest_asset.py out/veo-printer.mp4 --kind broll \
        --id veo-printer --tags money,printer,pixel --license generated

Refuses to add an id that already exists in assets.json.
"""
from __future__ import annotations

import argparse
import json
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
ASSETS_DIR = REPO / "video" / "public" / "assets"
ASSETS_JSON = ASSETS_DIR / "assets.json"

KINDS = ("broll", "gif", "clip", "headline", "other")


def load_manifest() -> dict:
    if not ASSETS_JSON.exists():
        return {"assets": []}
    data = json.loads(ASSETS_JSON.read_text())
    data.setdefault("assets", [])
    return data


def main() -> None:
    ap = argparse.ArgumentParser(
        description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter
    )
    ap.add_argument("path", type=Path, help="source media file to ingest")
    ap.add_argument("--kind", required=True, choices=KINDS, help="asset kind")
    ap.add_argument("--id", required=True, help="unique asset id (also the stored filename)")
    ap.add_argument("--tags", required=True, help="comma-separated tags, e.g. money,printer,pixel")
    ap.add_argument("--label", default=None, help="optional on-screen label")
    ap.add_argument("--source", default=None, help="optional provenance, e.g. giphy / veo / url")
    ap.add_argument("--license", default=None, help="optional license, e.g. generated / fair-use / cc0")
    ap.add_argument("--note", default="", help="optional free-text note")
    args = ap.parse_args()

    src = args.path if args.path.is_absolute() else Path.cwd() / args.path
    if not src.is_file():
        print(f"error: source file not found: {src}", file=sys.stderr)
        sys.exit(1)

    manifest = load_manifest()
    if any(a.get("id") == args.id for a in manifest["assets"]):
        print(f"error: id '{args.id}' already exists in {ASSETS_JSON.relative_to(REPO)}", file=sys.stderr)
        sys.exit(1)

    tags = [t.strip() for t in args.tags.split(",") if t.strip()]
    if not tags:
        print("error: --tags produced no tags", file=sys.stderr)
        sys.exit(1)

    # Store under <kind>/<id><ext>; id is unique so filenames never collide.
    kind_dir = ASSETS_DIR / args.kind
    kind_dir.mkdir(parents=True, exist_ok=True)
    rel_file = f"{args.kind}/{args.id}{src.suffix.lower()}"
    dest = ASSETS_DIR / rel_file
    shutil.copy2(src, dest)

    entry = {
        "id": args.id,
        "kind": args.kind,
        "file": rel_file,
        "alpha": None,
        "label": args.label,
        "tags": tags,
        "loop": None,
        "note": args.note,
        "source": args.source,
        "license": args.license,
    }
    manifest["assets"].append(entry)
    ASSETS_JSON.write_text(json.dumps(manifest, indent=2) + "\n")

    print(f"copied {src} -> {dest.relative_to(REPO)}")
    print(f"appended asset '{args.id}' ({args.kind}) to {ASSETS_JSON.relative_to(REPO)}")


if __name__ == "__main__":
    main()
