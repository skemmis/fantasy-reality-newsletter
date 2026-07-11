# Research: Fireship formula + content strategy (agent 5, Opus) — July 2026

## Fireship formula
- Two archetypes: evergreen "X in 100 Seconds"; timely "The Code Report" (~3-5 min, trend-jacking). Mix stabilizes channel.
- Cold open: no intro, mid-thought hook, payoff in first 2-3s.
- Pacing: ~180-220 WPM, hard cut/new visual every 1-3s, zero dead air.
- Humor: (1) niche in-group jokes, (2) visual gags/meme stills/clips (faceless → memes carry personality), (3) self-deprecating deadpan "coworker" voice. Joke beat every 10-20s, one-liner + meme cut landing together.
- Visual grammar: heavy STATIC well-designed stills (underrated), code snippets, punch-in zooms, captions/labels, animated arrows, chart/logo montages, kinetic typography.
- Sound: snappy whooshes/pops on cuts, signature ding/keyboard SFX, sparse lo-fi bed.
- Titles: short punchy contrarian ("X is dead"). Thumbnails: bold minimal, logo/object + few huge words, no face.
- Signatures to AVOID: "in 100 Seconds" naming, "Code Report" sign-in line, sponsor cadence, code-syntax "Like & Subscribe" gag, his VO persona.

## Differentiation format ideas
1. **"The Market Says"** recurring segment — cold-open on live odds ("The market says 63% — here's why that's insane").
2. **"The Tape"** — animated market-price replay as pixel ticker, VO narrates what moved each spike (native dataviz gimmick, genuinely differentiated).
3. **Pixel mascot** — 8-bit Oracle/gambler-goblin reacting to odds swings (ownable personality device).
4. **"Smart Money vs. You"** — crowd vibe vs. what traders price.
5. **"Resolution Watch"** end-card — scoreboard of past covered predictions vs. outcomes (return-viewer hook + credibility).
- Pixel-art house style = hard visual fork from Fireship's flat-vector/neon. Lean in.

## Landscape 2026
- No dominant Kalshi explainer channel; space = sponsored integrations, finance channels, clip farms. Polymarket sponsored 101+ videos/90 days, Kalshi 140+. Content Rewards (Whop) pays per-view for prediction-market clips (Forbes Apr 2026). Sports ≈ 90% of Kalshi activity. **Gap: polished funny dataviz explainer lane is open.**
- Kalshi referral program: 20% rev share, monthly PayPal; but Kalshi pulled affiliate badges from X early 2026 (tightening promo landscape).
- **YouTube gambling policy (Nov 2025+, expanded 2026): significant.** No directing viewers to non-Google-certified gambling sites — bans spoken promos, links, logos, screenshots, even casual references to non-certified operators. Simulated gambling content age-restricted 18+. Kalshi = CFTC-regulated gray zone; enforcement broad/inconsistent. → Frame as news/analysis, no in-video signup CTAs, referral links in description only, 18+/NFA disclaimers, expect possible age restriction. Recreate odds in house style rather than screenshotting Kalshi UI (also dodges logo risk).

## Kalshi API
- Free for verified users; REST: markets, order book, trades, candlesticks (OHLC + bid/ask + volume + OI; intervals 1min/1hr/1day). Candlestick endpoint appears no-auth; general reads use API key.
- 2026-02-19 split: settled/aged data at GET /historical/markets/{ticker}/candlesticks — plan two code paths (live vs historical).
- Rate limits: Basic tier ≈ 20 req/s — ample.
- No official embed/press kit — recreate odds in-house style.

## Format recommendation
- 2-4 min flagship explainers, 2-3×/week; batch evergreen "how prediction markets work" pieces.
- YouTube home; cut 30-60s vertical clips (odds-swing + punchline) for Shorts/TikTok; Content Rewards can pay for clip volume.
- Titles contrarian + number-driven; pixel thumbnail with one huge odds %.

## 5 example concepts (hot mid-2026 markets)
1. Fed cut divergence: Kalshi ~60% vs CME futures ~27% (KXFED/KXRATECUT).
2. "Market thinks OpenAI declares AGI before 2027" (KXOAIAGI/KXAGICO, KXGPT5; Claude best-AI market spiked ~66.7% on Mythos rollout).
3. "Kalshi trader caught 500,000 fake Spotify streams" (July 2026 Earrings/Malcolm Todd story).
4. "Betting on a government shutdown" (KXSHUTDOWNBY; fall-2025 40-day shutdown retro).
5. "Who's going public next?" — Kalshi IPO markets (SpaceX/OpenAI).
