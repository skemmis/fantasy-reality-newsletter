# Research: AI voiceover (agent 1, Opus) — mid-2026

## Best models
- **ElevenLabs Eleven v3** (GA Feb 2026) — TOP PICK. Inline audio tags: [sarcastic] [deadpan] [whispers] [laughs] [pause] [rushed] [drawn out] [emphasized] [stress on next word]. Multi-speaker, 70+ langs. ~5,000-char cap/request. Instant + Professional voice cloning; 5,000+ library voices incl. snarky/sarcastic/explainer categories. NOT real-time (fine). v3 consumes more credits/char (80% discount expired June 2026). Pricing: Creator $22/mo = 121k credits (~100k v2-chars), overage $0.30/1k; Pro $99/mo = 500k credits, overage $0.24/1k; Scale $0.18/1k; Business $0.12/1k. Commercial use included Creator+.
- **OpenAI gpt-4o-mini-tts** — cheap fallback/retake workhorse. Natural-language `instructions` param ("fast, deadpan, snarky tech narrator"). 13 voices, no public cloning. ~$0.015/min of audio ($0.60/1M text in + $12/1M audio out tokens). No inline mid-sentence tags.
- **Hume Octave 2** — best emotion modeling; steerable prosody params (happiness/intensity) + plain-English delivery instructions. Worth A/B for sarcasm beats. Cloning + API, pay-per-use.
- **Cartesia Sonic-3/3.5** — latency king (~40-90ms), expressiveness below ElevenLabs for long-form; ~3-4x cheaper. Latency irrelevant here → skip.
- **MiniMax Speech-02-HD / 2.5-2.8** — emotion params, 10-sec cloning ~99% similarity, ~$0.10/1k chars; less proven English comedic timing.
- **Fish Audio** — #1 TTS-Arena2, 50+ emotion tags, cheap; less battle-tested for English comedic explainer.
- PlayHT Play 3.0, Google Chirp/Gemini TTS: credible, not standout. Open-source: behind on expressive English prosody, not recommended.
- Model choice is per-shot not per-project — keep 2 services, pick per line.

## Human-sounding techniques
- Chunk small: generate per sentence/clause; re-roll each line 5-10x, keep funniest read; splice best micro-takes.
- Direction via tags (v3) or instructions (OpenAI); lower ElevenLabs Stability for more expressive variation.
- Post: cut 2-4 kHz mids, 3:1-4:1 soft-knee compression, subtle pitch mod, room tone at −50..−60 dB, insert breath samples.
- Sound design/music pacing masks synthetic stiffness more than any TTS setting — cut VO tight to a driving bed, SFX stingers on emphasis words.

## YouTube policy 2026
- Jan 2026: mandatory "altered or synthetic content" disclosure in Studio for synthetic voice.
- "Repetitious content" → "Inauthentic content"; 3-strike system targets zero-effort TTS-over-slideshow. Original research/script/editing + AI voice = explicitly monetizable.

## Recommendation & cost
- Primary: ElevenLabs v3 (snarky library voice or Professional clone), tags for delivery. Retakes on gpt-4o-mini-tts (pennies). Optionally test Hume.
- 4 videos/mo × 600 words ≈ 72k-144k chars/mo with 5-10x retakes → ~$22-25/mo (Creator + OpenAI retakes) or $99/mo (Pro, all-v3 abundant retakes).
