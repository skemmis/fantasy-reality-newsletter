# Research: meme/GIF/clip sourcing (agent 4, Opus) — July 2026

## APIs
- **Tenor API DEAD** — Google decommissioned June 30, 2026. Do not build on it.
- **Giphy** — paid, ToS restricts to personal/non-commercial; embedding into monetized video is outside license. AVOID unless direct commercial content license.
- **Klipy (api.klipy.com)** — the Tenor migration target; GIF/Sticker/Meme/Clip/AI-emoji APIs; test key 100 calls/hr, production "limitless"; powers Canva/Figma/Outlook. Friendly to commercial users but MUST confirm in writing that baking assets into monetized rendered MP4s is licensed (most GIF APIs license in-app pickers, not redistribution). Pull MP4/WebM renditions, not .gif, for HD.
- **Imgflip API** — best programmatic captioned memes. Free: get_memes (top 100) + caption_image. Premium $9.99/mo: search_memes, automeme, ai_meme; caption_gif $0.02/creation after 50/mo. LLM picks template + caption → hosted image URL. Templates are user-uploaded (some copyrighted stills).
- Know Your Meme: no asset API; use for tagging vocabulary only.

## AI-recreated memes
- Recreate meme FORMATS (distracted boyfriend, Drake) with original characters via image models — sidesteps the underlying photo's copyright (formats/ideas unprotectable; specific images are). Pure AI output has no copyright (no human authorship). Good copyright-safe hedge at volume.

## Movie/TV clips
- Discovery tools (not licenses): getyarn.io, PlayPhrase.me, clip.cafe, Vlipsy (has API + some licensed content — Sony/Aardman/Discovery partnerships), Morbotron/Frinkiac.
- Content ID flags even 1-3s clips; a claim redirects that video's ad revenue (not a strike). 2026 "inauthentic content" rules: commentary <30% of runtime → channel-level demonetization risk.
- Practice: unlicensed clips sub-2s, transformed (zoom/caption), under dominant original VO/graphics; never load-bearing; be willing to swap claimed clips. Fireship actually leans on self-made graphics/screencaps/stock with sparse cutaways.

## Clean stock
- Pexels & Pixabay video APIs: free, commercial-OK, no attribution, no indemnification.
- Storyblocks: unlimited sub + $20k indemnification; GOTCHA — consumer tiers lose rights to published content on cancel; need Enterprise/API for perpetual.
- Envato Elements: license survives cancellation for works published while subscribed (better). Artgrid: cinematic.
- None have true movie-reaction memes — AI recreation fills that gap.

## Asset library strategy
- Local tagged library: folder + JSON/SQLite manifest {id, file, tags[], emotion, source, license, duration, alpha}. Curate MP4/WebM-with-alpha.
- LLM pipeline: script LLM emits `meme_intent` per scene → resolver matches local library (embeddings/keywords) → fallback Klipy/Imgflip fetch → timeline insert.
- Note: **remotion-fireship template exists** (wcandillon/remotion-fireship; brightcoding tutorial Feb 2026) reproducing the Fireship look; Remotion-Lambda + n8n common for LLM→asset→timeline orchestration.

## Recommendation
1. Imgflip API ($9.99/mo) primary meme workhorse; 2. AI-recreated formats; 3. Klipy for GIF/clips (after written commercial confirmation); 4. Pexels/Pixabay free + Envato for B-roll; 5. self-made graphics as backbone.
- Keep original VO/graphics >50-70% of runtime. Avoid Giphy/Tenor/raw film rips.
