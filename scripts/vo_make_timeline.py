#!/usr/bin/env python3
"""Turn a narration script (+ audio) into a word-timed timeline for Remotion.

Two modes, one output shape (``video/public/episodes/<slug>/vo/words.json``):

  --tts     Synthesize each narration line with ElevenLabs *eleven_v3*
            ``/with-timestamps`` (character-level timing), concatenate to
            ``vo.mp3``, and fold the char timings into word timings. Needs
            ELEVENLABS_API_KEY and a voice (``--voice`` or ELEVENLABS_VOICE_ID).

  --align   Take a human-recorded ``--audio`` file and force-align it to the
            script with whisperx. Requires ``pip install whisperx`` (not a repo
            dependency); exits with instructions if it isn't importable.

Script format (markdown):
  - lines starting with ``#``          -> ignored (headers / comments)
  - lines inside ``` fenced blocks     -> ignored
  - ``[beat:some-id]``                 -> a beat marker for the FOLLOWING line
  - every other non-empty line         -> one narration line

See docs/video/PLAN.md §3 (Voiceover) — the timestamps drive CaptionLayer.

Usage:
    python scripts/vo_make_timeline.py --tts   --slug fedhike --script script.md
    python scripts/vo_make_timeline.py --align --slug fedhike --script script.md --audio take.wav
    python scripts/vo_make_timeline.py --dry-run --script script.md     # parser smoke test
"""
from __future__ import annotations

import argparse
import base64
import json
import os
import re
import subprocess
import sys
from dataclasses import dataclass
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent

ELEVEN_BASE = "https://api.elevenlabs.io"
ELEVEN_MODEL = "eleven_v3"
# Deadpan news read (see PLAN.md §3): steady, moderately expressive.
VOICE_SETTINGS = {"stability": 0.55, "similarity_boost": 0.75, "style": 0.3}

_BEAT_RE = re.compile(r"^\[beat:([A-Za-z0-9_\-]+)\]\s*$")


# --------------------------------------------------------------- script parse

@dataclass
class Line:
    i: int
    text: str
    beat: str | None


def parse_script(text: str) -> list[Line]:
    """Extract ordered narration lines, tagging each with the beat marker (if
    any) that immediately preceded it."""
    lines: list[Line] = []
    pending_beat: str | None = None
    in_fence = False
    for raw in text.splitlines():
        line = raw.strip()
        if line.startswith("```"):
            in_fence = not in_fence
            continue
        if in_fence or not line or line.startswith("#"):
            continue
        m = _BEAT_RE.match(line)
        if m:
            pending_beat = m.group(1)
            continue
        lines.append(Line(i=len(lines), text=line, beat=pending_beat))
        pending_beat = None
    return lines


# ------------------------------------------------------------- shared writer

def _norm(w: str) -> str:
    return re.sub(r"[^a-z0-9]", "", w.lower())


def build_line_spans(script_lines: list[Line], words: list[dict]) -> list[dict]:
    """Derive per-line start/end from the assigned word timings."""
    out = []
    for ln in script_lines:
        ws = [w for w in words if w["line"] == ln.i]
        out.append(
            {
                "i": ln.i,
                "text": ln.text,
                "start": ws[0]["start"] if ws else None,
                "end": ws[-1]["end"] if ws else None,
                "beat": ln.beat,
            }
        )
    return out


def write_timeline(out_dir: Path, audio_name: str, duration: float,
                   words: list[dict], script_lines: list[Line]) -> Path:
    out_dir.mkdir(parents=True, exist_ok=True)
    payload = {
        "audio": audio_name,
        "duration": round(float(duration), 3),
        "words": words,
        "lines": build_line_spans(script_lines, words),
    }
    path = out_dir / "words.json"
    path.write_text(json.dumps(payload, indent=2) + "\n")
    return path


# ---------------------------------------------------------------- tts (v3)

def chars_to_words(chars: list[str], starts: list[float], ends: list[float],
                   offset: float, line_i: int) -> tuple[list[dict], float]:
    """Fold a line's character timings into word timings (offset by ``offset``
    seconds so concatenated lines share a single timeline)."""
    words: list[dict] = []
    cur, cur_start, cur_end = "", None, None
    for ch, s, e in zip(chars, starts, ends):
        if ch.isspace():
            if cur:
                words.append({"w": cur, "start": round(cur_start + offset, 3),
                              "end": round(cur_end + offset, 3), "line": line_i})
                cur, cur_start, cur_end = "", None, None
            continue
        if not cur:
            cur_start = s
        cur += ch
        cur_end = e
    if cur:
        words.append({"w": cur, "start": round(cur_start + offset, 3),
                      "end": round(cur_end + offset, 3), "line": line_i})
    seg_dur = (max(ends) if ends else 0.0)
    return words, seg_dur


def _concat_audio(segments: list[bytes], out_mp3: Path) -> None:
    """Concatenate per-line MP3 bytes into one file (pydub, else ffmpeg)."""
    try:
        from io import BytesIO

        from pydub import AudioSegment  # type: ignore

        combined = AudioSegment.empty()
        for seg in segments:
            combined += AudioSegment.from_file(BytesIO(seg), format="mp3")
        combined.export(out_mp3, format="mp3")
        return
    except ImportError:
        pass
    # ffmpeg concat demuxer over the raw segment files.
    tmp = out_mp3.parent / "_segments"
    tmp.mkdir(exist_ok=True)
    parts = []
    for i, seg in enumerate(segments):
        p = tmp / f"part_{i:04d}.mp3"
        p.write_bytes(seg)
        parts.append(p)
    listing = tmp / "list.txt"
    listing.write_text("".join(f"file '{p.name}'\n" for p in parts))
    subprocess.run(
        ["ffmpeg", "-y", "-f", "concat", "-safe", "0", "-i", str(listing),
         "-c", "copy", str(out_mp3)],
        check=True, cwd=tmp,
    )
    for p in parts:
        p.unlink()
    listing.unlink()
    tmp.rmdir()


def run_tts(script_lines: list[Line], out_dir: Path, voice_id: str,
            api_key: str) -> None:
    import httpx

    words: list[dict] = []
    segments: list[bytes] = []
    offset = 0.0
    with httpx.Client(base_url=ELEVEN_BASE, timeout=120.0) as http:
        for ln in script_lines:
            r = http.post(
                f"/v1/text-to-speech/{voice_id}/with-timestamps",
                headers={"xi-api-key": api_key},
                json={"text": ln.text, "model_id": ELEVEN_MODEL,
                      "voice_settings": VOICE_SETTINGS},
            )
            r.raise_for_status()
            body = r.json()
            segments.append(base64.b64decode(body["audio_base64"]))
            al = body.get("alignment") or body.get("normalized_alignment") or {}
            line_words, seg_dur = chars_to_words(
                al.get("characters", []),
                al.get("character_start_times_seconds", []),
                al.get("character_end_times_seconds", []),
                offset, ln.i,
            )
            words.extend(line_words)
            offset += seg_dur
            print(f"line {ln.i}: {len(line_words)} words, +{seg_dur:.2f}s")

    out_mp3 = out_dir / "vo.mp3"
    out_dir.mkdir(parents=True, exist_ok=True)
    _concat_audio(segments, out_mp3)
    path = write_timeline(out_dir, "vo.mp3", offset, words, script_lines)
    print(f"wrote {out_mp3} and {path}")


# ---------------------------------------------------------------- align mode

def run_align(script_lines: list[Line], out_dir: Path, audio: Path) -> None:
    try:
        import whisperx  # type: ignore
    except ImportError:
        raise SystemExit(
            "--align needs whisperx, which is not a repo dependency.\n"
            "Install it in your environment first:\n"
            "    pip install whisperx\n"
            "then re-run with --align --audio <file>."
        )

    device = os.environ.get("WHISPERX_DEVICE", "cpu")
    compute = os.environ.get("WHISPERX_COMPUTE", "int8")
    model = whisperx.load_model("base", device, compute_type=compute)
    audio_data = whisperx.load_audio(str(audio))
    result = model.transcribe(audio_data)
    align_model, meta = whisperx.load_align_model(
        language_code=result["language"], device=device)
    aligned = whisperx.align(result["segments"], align_model, meta,
                             audio_data, device)

    # Flatten aligned words, then assign each to a script line by walking the
    # script's tokens in order (greedy match on normalized text).
    hyp = [w for w in aligned.get("word_segments", [])
           if w.get("start") is not None]
    script_tokens = [(ln.i, _norm(tok)) for ln in script_lines
                     for tok in ln.text.split()]
    words: list[dict] = []
    ti = 0
    duration = 0.0
    for w in hyp:
        nw = _norm(w.get("word", ""))
        line_i = script_tokens[min(ti, len(script_tokens) - 1)][0] if script_tokens else 0
        # advance the script pointer past matching (or skipped) tokens
        if ti < len(script_tokens) and script_tokens[ti][1] == nw:
            line_i = script_tokens[ti][0]
            ti += 1
        elif ti + 1 < len(script_tokens) and script_tokens[ti + 1][1] == nw:
            ti += 2
            line_i = script_tokens[ti - 1][0]
        words.append({"w": w["word"], "start": round(float(w["start"]), 3),
                      "end": round(float(w["end"]), 3), "line": line_i})
        duration = max(duration, float(w["end"]))

    path = write_timeline(out_dir, audio.name, duration, words, script_lines)
    print(f"aligned {len(words)} words -> {path}")


# --------------------------------------------------------------------- cli

def main() -> None:
    p = argparse.ArgumentParser(description=__doc__,
                                formatter_class=argparse.RawDescriptionHelpFormatter)
    mode = p.add_mutually_exclusive_group(required=True)
    mode.add_argument("--tts", action="store_true", help="synthesize via ElevenLabs v3")
    mode.add_argument("--align", action="store_true", help="align a recorded --audio")
    mode.add_argument("--dry-run", action="store_true",
                      help="parse the script and print lines/beats, no audio")
    p.add_argument("--script", type=Path, required=True, help="narration markdown")
    p.add_argument("--slug", help="episode slug (output dir); required unless --dry-run")
    p.add_argument("--audio", type=Path, help="recorded audio file (--align)")
    p.add_argument("--voice", help="ElevenLabs voice id (else ELEVENLABS_VOICE_ID)")
    args = p.parse_args()

    script_lines = parse_script(args.script.read_text())

    if args.dry_run:
        print(f"{len(script_lines)} narration lines:")
        for ln in script_lines:
            tag = f"[beat:{ln.beat}] " if ln.beat else ""
            print(f"  {ln.i:>3}: {tag}{ln.text}")
        return

    if not args.slug:
        raise SystemExit("--slug is required for --tts/--align")
    out_dir = REPO / "video" / "public" / "episodes" / args.slug / "vo"

    if args.tts:
        api_key = os.environ.get("ELEVENLABS_API_KEY")
        if not api_key:
            raise SystemExit(
                "--tts needs ELEVENLABS_API_KEY in the environment (not set).")
        voice_id = args.voice or os.environ.get("ELEVENLABS_VOICE_ID")
        if not voice_id:
            raise SystemExit(
                "--tts needs a voice: pass --voice or set ELEVENLABS_VOICE_ID.")
        run_tts(script_lines, out_dir, voice_id, api_key)
    else:  # --align
        if not args.audio:
            raise SystemExit("--align needs --audio <file>.")
        run_align(script_lines, out_dir, args.audio)


if __name__ == "__main__":
    main()
