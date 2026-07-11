# Research: AI video/image generation + platforms (agent 2, Fable) — July 2026

## Video models
- **Veo 3.1** (current; Veo 2/3 shut down June 30 2026; no Veo 4). Gemini API: 4/6/8s clips, 24fps, 720p/1080p/4K(8s only), 16:9 & 9:16, native audio. Tiers: Standard $0.40/s ($0.60 4K); **Fast $0.10/s** 720p, $0.12 1080p, $0.30 4K; **Lite $0.05/s** 720p, $0.08 1080p. i2v from starting frame, up to 3 reference images for style/character consistency, first/last-frame interpolation, scene extension to 148s (720p, not Lite).
- **Sora: AVOID** — consumer app discontinued Apr 26 2026; Videos API deprecated, removed Sept 24 2026.
- **Runway Gen-4.5**: API ~$0.15/s; best camera/motion control; priciest, photoreal-oriented.
- **Kling 3.0**: ~$0.075/s (audio ~5x); Kling O1 unified gen/edit; via fal.ai/Replicate.
- **Hailuo 2.3 (MiniMax)**: ~$0.07/s; stylization presets incl. anime/illustration/game-CG — most relevant closed model for retro look. Plans from $9.99/mo.
- **Pika 2.5**: $8-76/mo; API via fal.ai (2.2). Meme-effect suite (Pikaffects/Pikadditions/Pikaswaps) — purpose-built gag effects on input images.
- Open: Wan 2.2+ (Apache), HunyuanVideo 1.5, LTX-2.3 (fast on 4090, i2v/keyframes/V2V). Pixel-art: AnimateDiff/motion-LoRA on pixel-art SD checkpoint = only true art-direction control. Local break-even ~500+ clips/mo → not worth it at 4 videos/mo.
- **No general model holds a strict pixel grid.** Best: i2v seeded with Nano Banana pixel stills + reference images, then post-quantize frames in Python (downscale + palette-quantize + nearest-neighbor upscale) to restore aesthetic. Backgrounds/transitions better done programmatically.

## Image gen
- **Keep Gemini**: Nano Banana 2 = Gemini 3.1 Flash Image $0.045-0.151/img; Nano Banana Pro = Gemini 3 Pro Image $0.134-0.24/img; original 2.5 Flash Image $0.039. Imagen 4 deprecated (dies Aug 17 2026). Strengths: conversational editing, multi-image composition, character consistency, grounding gets tickers/odds text right.
- **GPT Image 2**: tops arena (Elo 1339), near-perfect typography; ~$0.006/$0.053/$0.211 per image (low/med/high). Second tool for dense text-in-image meme frames.
- Flux 2 (open, typography), Recraft V4.1 (vector/SVG brand assets), Ideogram 4.0 (meh now). **PixelLab (pixellab.ai)**: text-to-pixel at exact grid sizes, sprite-sheet export, skeleton animation rigging — better than general models for animated sprites.
- Always pipe through Python quantize-to-grid step for true pixel fidelity.

## Third-party platforms
- KEEP: **Descript** ($24-35/mo Creator; media-minutes + AI credits since Sept 2025) — text-based editing, filler-word removal, Underlord; fit = VO cleanup + captions, not final assembly. **Remotion** — free ≤3 people/<$1M ARR; Jan 2026 "Remotion Skills" integrates with Claude Code (describe scene → agent writes comp); strongest match for code-driven pipeline. **Opus Clip** ($29/mo) or **Reap** ($9.99/mo, #1 in Apr 2026 benchmark, public API/MCP) — only for repurposing to Shorts later.
- IGNORE: Argil, HeyGen, Synthesia (avatars), Creatify/Revid (UGC ads), InVideo/Fliki (stock slideshows).

## Realistic role of gen video
- Format = writing + static graphics + fast cuts + light motion graphics. For a 3-min video: ~70% animated charts/kinetic text (Python/Remotion), ~20% static memes/sprites, ~10% generative clips (3-8 cutaways × 4-8s as punchlines). Gen video is seasoning; chart pipeline is the meal. Real meme templates often land better than generated ones.

## Recommendation & cost (4 videos/mo)
- Images: Nano Banana 2/Pro primary, GPT Image 2 backup for text-dense frames, PixelLab if animated sprite sheets recur. ~200-300 img/mo ≈ $10-30.
- Video: Veo 3.1 Fast primary ($0.10/s, i2v from house-style stills), Lite for throwaways; Pika (fal.ai) or Hailuo for meme effects. ~6 kept clips × 8s × 3x retries ≈ $15/video → ~$60/mo ($30-100).
- Assembly: matplotlib + Remotion, final cut DaVinci Resolve (free)/CapCut; Descript optional $24/mo.
- **Total ~$95-155/mo** vs $500+ via Runway/avatar platforms.
