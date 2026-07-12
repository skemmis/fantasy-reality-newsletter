# Episode 2 — Research brief: the five-percent AGI declaration

**Topic:** the Kalshi market "Will OpenAI announce the creation of AGI? — Before 2027" and why the crowd prices it at a nickel despite the AI hype cycle.
**Primary ticker:** OAIAGI-26 (event `OAIAGI`, series `KXOAIAGI`). **Companion tickers:** OAIAGI-27 ("Before 2028"), OAIAGI-29 ("Before 2030"). **Color market:** KXLLM1-26DEC31 ("Best AI at the end of 2026").
**Market data fetched:** 2026-07-12T (live from the Kalshi API `api.elections.kalshi.com/trade-api/v2`). Price history in `data.json` (OAIAGI-26 daily midpoint) runs 2025-08-28 → 2026-07-11; the hourly close-up in `agi2027-closeup/data.json` covers Apr 8 – May 2 2026.

> Research brief for the writer. Every factual sentence carries a source URL or points to `data.json`. NO jokes, NO voice, NO editorializing — the writer supplies all of that. **Liquidity caveat:** OAIAGI-26 last traded / was last updated 2026-06-10 (API `updated_time`), and its 24h volume this fetch was **0**. The prices below are the last resting book, not a live tape — re-fetch and re-verify before VO.

## One-paragraph summary

A Kalshi contract that pays out if OpenAI announces it has attained AGI before Jan 1, 2027 trades at about a nickel (last trade **4.1¢**; the on-screen counter reads the chart's last midpoint, **5.5**, from `data.json` 2026-07-11). The market opened around 20% in late August 2025 and peaked at **24.5% on 2025-09-23** (`data.json`) — "peak faith." It then fell in two steps that were both about a *contract*, not about model capability: the Oct 28 2025 OpenAI restructuring, which moved the power to declare AGI from OpenAI's board to an independent expert panel that must *verify* any declaration ([Microsoft blog, Oct 28 2025](https://blogs.microsoft.com/blog/2025/10/28/the-next-chapter-of-the-microsoft-openai-partnership/); [CNBC, Oct 28 2025](https://www.cnbc.com/2025/10/28/open-ai-for-profit-microsoft.html)); and the Apr 27 2026 amendment that killed the "AGI clause" entirely, so declaring AGI no longer severs Microsoft's rights ([the-decoder, Apr 2026](https://the-decoder.com/openai-and-microsoft-rewrite-their-deal-no-more-exclusivity-no-more-agi-clause/); [Simon Willison, Apr 27 2026](https://simonwillison.net/2026/Apr/27/now-deceased-agi-clause/)). The market prices ~5% not because AI progress stalled — GPT-5.6 shipped in June 2026 ([scriptbyai timeline](https://www.scriptbyai.com/timeline-of-chatgpt/)) — but because a *formal OpenAI AGI declaration* now has no commercial trigger, an independent panel must sign off, and even Sam Altman calls "AGI" "not a super useful term" ([CNBC, Aug 11 2025](https://www.cnbc.com/2025/08/11/sam-altman-says-agi-is-a-pointless-term-experts-agree.html)).

---

## The numbers right now

_All fetched 2026-07-12 from the Kalshi API. Prices in cents = implied probability. Volume/OI in contracts (each $1 notional). **All three markets last updated 2026-06-10 — thin, stale books.**_

| Market | Question | Last | Yes bid/ask | No bid/ask | Volume | Open interest | Settles |
|---|---|---|---|---|---|---|---|
| **OAIAGI-26** | OpenAI declares AGI before 2027? | **4.1¢** | 4.2 / 6.8 | 93.2 / 95.8 | 232,886 | 118,668 | 2027-01-01 |
| **OAIAGI-27** | …before 2028? | 25.7¢ | 20.6 / 24.1 | 75.9 / 79.4 | 203,725 | 93,572 | 2028-01-01 |
| **OAIAGI-29** | …before 2030? | 36.0¢ | 36.1 / 39.9 | 60.1 / 63.9 | 151,807 | 62,546 | 2030-01-01 |

- OAIAGI-26 resolution rule (verbatim, API): _"If OpenAI announces that they have attained AGI by Dec 31, 2026, then the market resolves to Yes."_ Binary, $1 notional, price-in-cents = probability, early-close provision (`can_close_early: true`). Created 2025-08-25, first data point 2025-08-28.
- **The horizon ladder is monotonic and gentle:** ~5% by 2027, ~26% by 2028, ~36% by 2029/2030 (`yes_sub_title` labels say "Before 2027/2028/2030"). The crowd does not think an OpenAI AGI *declaration* is near-term or even more-likely-than-not by decade's end — it climbs only to about a third by 2030. Use this ladder as the "it's the deadline, not the robot" beat (matches `episode.yaml` CompareBars 5/26/36).
- **On-screen number vs. last trade:** the counter/`data.json` last point is **5.5** (the 4.2/6.8 book midpoint on 2026-07-11); the last *executed* trade was **4.1¢**. Both are defensible; the script uses "five percent." Keep them consistent on VO day.

### Color market — "Best AI at the end of 2026" (KXLLM1-26DEC31), fetched 2026-07-12
Same crowd, adjacent question, *much* more liquid (Claude leg volume ~1.66M contracts vs. OAIAGI-26's ~233K). Resolves off the LMArena leaderboard standing at year-end.

| Model | Last | Volume |
|---|---|---|
| Claude (Anthropic) | **62.9¢** | 1,664,820 |
| ChatGPT (OpenAI) | 17.7¢ | 1,318,140 |
| Gemini (Google) | 12.9¢ | 1,162,930 |
| Grok (xAI) | 6.9¢ | 951,607 |
| Muse Spark (Meta) | 4.0¢ | 757,122 |

Use as color for the "the market rates *products*, not *declarations*" point: the crowd will happily price which lab is on top (Claude ~63% vs. Gemini ~13% vs. ChatGPT ~18%), yet prices a formal AGI *announcement* at ~5%. **Writer flag:** "Claude leads / overtook Gemini" is verified as of this fetch ([Deadspin, 2026](https://deadspin.com/prediction-markets/trending/claude-overtakes-gemini-in-2026-best-ai-prize-prediction-market/); [covers.com](https://www.covers.com/entertainment/best-ai-prediction-markets)); leaderboards move — re-fetch before use.

---

## Timeline of the tape

_Moves from `data.json` (OAIAGI-26 daily midpoint); largest single-day swings in `moves.md` (daily) and `agi2027-closeup/moves.md` (hourly)._

**2025-08-25 / 08-28 — Market opens ~20%.** Contract created 2025-08-25 (API `created_time`); first `data.json` point 2025-08-28 at 19.5%.

**2025-09-23 — Peak faith, 24.5%.** The series high (`data.json`). Late-September optimism; no single dated catalyst is attached — narrate as regime, not event.

**2025-10-01 — Biggest one-day drop, 23.0 → 15.5 (−7.5).** The single largest daily move in the series (`moves.md` #1) — but it lands **27 days before** the Oct 28 restructuring and has **no clean, dated catalyst** in the reporting reviewed. Narrate at the October-regime level, do NOT pin it to a specific announcement. (See "Could NOT verify.")

**2025-10-28 — OpenAI restructures; AGI declaration now must be *verified*.** OpenAI completed its recapitalization: the nonprofit (OpenAI Foundation) holds a stake in the for-profit **OpenAI Group PBC**; Microsoft holds ~27% (~$135B). Crucially, the joint terms state that once OpenAI declares AGI, that declaration is **verified by an independent expert panel** — the call no longer sits with OpenAI's board alone. Odds bleed from the low-20s toward ~11% through November (`data.json`). Sources: [Microsoft blog, Oct 28 2025](https://blogs.microsoft.com/blog/2025/10/28/the-next-chapter-of-the-microsoft-openai-partnership/); [CNBC, Oct 28 2025](https://www.cnbc.com/2025/10/28/open-ai-for-profit-microsoft.html); [TechRadar (expert-panel verification)](https://www.techradar.com/ai-platforms-assistants/chatgpt/microsoft-says-once-agi-is-declared-by-openai-it-will-be-verified-by-independent-experts-heres-why-thats-a-big-deal); [Fortune, Oct 28 2025](https://fortune.com/2025/10/28/openai-restructure-for-profit-microsoft-pbc-long-term-gains-agi/). **Writer flag:** the panel is described as jointly established and autonomous; **its membership is NOT public** (see "Could NOT verify").

**2025-11-14/15 — Post-restructure chop.** +5.0 then −5.5 on consecutive days (`moves.md` #7, #6) as the market settles into the ~10–15% range.

**2026-04-16 → 04-26 — The clause-death whipsaw.** Around the Apr 27 amendment the market convulsed: the daily tape shows +6.8 / −6.1 / +5.9 / −5.8 on Apr 16/17/24/26 (`moves.md` #2–#5); the hourly close-up (`agi2027-closeup/data.json`, Apr 8 – May 2) shows the intraday argument in finer grain. Mechanism: once declaring AGI triggers *nothing*, traders repriced the incentive to declare at all.

**2026-04-27 — The AGI clause dies.** OpenAI and Microsoft amended the deal: **no more AGI clause, no more Azure exclusivity.** Microsoft gets a non-exclusive license to OpenAI models/products through **2032** regardless of capability; OpenAI models appeared on AWS Bedrock the next day. Sources: [the-decoder, Apr 2026](https://the-decoder.com/openai-and-microsoft-rewrite-their-deal-no-more-exclusivity-no-more-agi-clause/); [Simon Willison, Apr 27 2026 (history of the clause)](https://simonwillison.net/2026/Apr/27/now-deceased-agi-clause/); [Spyglass](https://spyglass.org/the-openai-microsoft-agi-clause/).

**2026-06-10 — Last trade / last book update.** After April the market drifts to ~5% and goes quiet; API `updated_time` is 2026-06-10 and 24h volume is 0 this fetch.

**2026-07-11 — Current.** `data.json` last midpoint 5.5; last executed trade 4.1¢.

---

## Context the script needs

### What the OpenAI–Microsoft "AGI clause" actually WAS
- Origin: the 2019 partnership included a clause giving OpenAI the right to **cut Microsoft off** from OpenAI's most advanced technology once OpenAI's board declared it had reached AGI — a guard against a big-tech firm getting exclusive access to AGI. Declaring AGI was therefore a contractual "nuclear option," not a press release. Sources: [Spyglass](https://spyglass.org/the-openai-microsoft-agi-clause/); [Year 2049, "The AGI Clause explained"](https://year2049.substack.com/p/the-agi-clause-explained); [Simon Willison](https://simonwillison.net/2026/Apr/27/now-deceased-agi-clause/).
- OpenAI's own reported internal bar for "AGI" has been framed financially — a system that can generate ~$100B in profits (widely reported from a 2024 OpenAI/Microsoft document). **Writer flag:** the `episode.yaml` "$100B" stat card cites "The Information, Dec 2024"; treat the exact figure as reported-not-official and keep the attribution on screen.
- Two-step demolition: **Oct 28 2025** moved the *decision* to an independent verifying panel (harder to declare unilaterally); **Apr 27 2026** removed the *consequence* (declaring AGI no longer severs Microsoft). After April, an OpenAI AGI declaration triggers essentially nothing contractually — which is the market's core reason for ~5%.

### The independent expert panel — what is and isn't public
- **Public:** both companies say that once OpenAI declares AGI, an **independent expert panel** verifies it; the panel is described as jointly established, autonomous, and operating "with transparency." Sources: [Microsoft blog, Oct 28 2025](https://blogs.microsoft.com/blog/2025/10/28/the-next-chapter-of-the-microsoft-openai-partnership/); [TechRadar](https://www.techradar.com/ai-platforms-assistants/chatgpt/microsoft-says-once-agi-is-declared-by-openai-it-will-be-verified-by-independent-experts-heres-why-thats-a-big-deal).
- **Not public / do not assert:** the panel's members, its size, its criteria, or whether it has ever convened. No roster was found. State "an independent expert panel" — not names.

### Why ~5% despite the AI hype cycle
- The market is **not** a referendum on model capability. GPT-5.6 (Sol/Terra/Luna tiers) reached limited preview 2026-06-27 ([scriptbyai](https://www.scriptbyai.com/timeline-of-chatgpt/)), yet the declaration market sits at ~5%. The gap is the point: a *formal OpenAI AGI announcement* is (a) contractually pointless post-April, (b) subject to independent verification, and (c) semantically discouraged even by OpenAI's CEO.
- Altman: asked whether GPT-5 moved the world closer to AGI, he said "I think it's **not a super useful term**," citing competing definitions ([CNBC, Aug 11 2025](https://www.cnbc.com/2025/08/11/sam-altman-says-agi-is-a-pointless-term-experts-agree.html)). **CORRECTION for `episode.yaml`:** the PostCard tags this quote "PUBLIC REMARKS · 2026" — it is from **August 2025** (CNBC "Squawk Box"). Fix the timestamp or drop the year.

### What the market structurally is
- Binary $1-notional contract; cents = probability; resolves on whether OpenAI *announces* AGI by the deadline (not on any third-party judgment of whether AGI exists). OAIAGI-26 cumulative volume ~233K contracts, OI ~119K (API). **Writer flag:** `data.json` meta lists `volume_usd` 29,377 — i.e. dollar turnover is small; this is a low-liquidity market. Do not call it "heavily traded." The KXLLM1 best-AI market is ~7× more liquid.

---

## What's next (dated catalysts before the 2027-01-01 settlement)

| Date (2026) | Event | Why it can move OAIAGI-26 |
|---|---|---|
| **Sep 29** | OpenAI DevDay 2026, San Francisco | Flagship product event; any "AGI"-adjacent framing could move the term back into play. [OpenAI DevDay 2026](https://openai.com/index/devday-2026/) |
| **Q4 2026** | DevDay Exchange global tour (Tokyo, London, Paris, etc.) | Follow-on announcements. [OpenAI DevDay 2026](https://openai.com/index/devday-2026/) |
| Rolling | GPT-5.6 wide rollout / any GPT-6 signal | Capability news; note it historically does NOT move the *declaration* market much. [scriptbyai timeline](https://www.scriptbyai.com/timeline-of-chatgpt/) |
| **Dec 31** | Settlement | Resolves No unless OpenAI formally declares AGI first. |

**Writer flag:** the honest catalyst story is that with the clause dead, there is little left that *would* move this market toward Yes — that emptiness is the story.

---

## Could NOT verify (do not assert these)

1. **The expert panel's membership, size, or criteria** — only its existence and mandate are public (see context).
2. **A dated catalyst for the 2025-10-01 −7.5 drop** — the largest daily move has no clean news peg; narrate at regime level, not pinned to Oct 1.
3. **The exact "$100B profit" AGI definition as official OpenAI policy** — it is reported (The Information, 2024), not a published OpenAI threshold.
4. **Whether OAIAGI-26's ~233K-contract volume is "large"** — raw figure verified; it is dollar-small (~$29K turnover) and stale since Jun 10. No superlative.
5. **Altman "AGI not a super useful term" as a 2026 remark** — it is **Aug 2025**. Fix the `episode.yaml` timestamp.
6. **Any live intraday number** — the book has not updated since 2026-06-10; re-fetch on VO day.
7. **Claude/Gemini/ChatGPT best-AI ordering as stable** — a 2026-07-12 snapshot off LMArena; re-fetch before airing.

---

## Beat-sheet skeleton (neutral — writer supplies voice)

Visual kit refs: `MarketChartScene` (the tape + hourly close-up), `HeadlineCard` (real-article screenshot + source chip), `BigNumber`, `KineticTitle`, `MemeCutaway`, `PostCard` (re-typeset quote), `CompareBars`, `EndCard`.

1. **COLD OPEN — the number.** Fact: OAIAGI-26 reads ~**5%** (counter/`data.json` 5.5; last trade 4.1¢) = crowd-implied probability OpenAI *declares* AGI before 2027 (API, 2026-07-12). Visual: `BigNumber` 5% + frozen `MarketChartScene`. Evidence: `data.json`, API. _[writer: hook]_
2. **TITLE.** `KineticTitle` "THE MARKET SAYS · ep 02."
3. **What this market is (the twist).** Fact: it was never a science question — declaring AGI was a *contract* event that could sever Microsoft's rights (reported ~$100B-profit internal bar). Visual: `BigNumber` $100B + `MoneyPrinter`. Evidence: [Spyglass](https://spyglass.org/the-openai-microsoft-agi-clause/), [Year 2049](https://year2049.substack.com/p/the-agi-clause-explained). _[writer: reframe]_
4. **THE TAPE.** Fact: opened ~20% Aug 2025, peak **24.5% Sep 23 2025** ("peak faith"). Visual: `MarketChartScene` reveal to the peak. Evidence: `data.json`, `moves.md`.
5. **Move 1 — the panel.** Fact: Oct 28 2025 restructuring hands AGI verification to an independent expert panel; 24% → ~11%. Visual: `HeadlineCard` (Microsoft/CNBC Oct 28 2025). Evidence: [Microsoft blog](https://blogs.microsoft.com/blog/2025/10/28/the-next-chapter-of-the-microsoft-openai-partnership/), [CNBC](https://www.cnbc.com/2025/10/28/open-ai-for-profit-microsoft.html). _[writer: keep panel unnamed]_
6. **Move 2 — the clause dies.** Fact: Apr 27 2026 amendment kills the AGI clause and Azure exclusivity; Microsoft licensed through 2032 regardless of capability; declaring AGI now triggers nothing. Visual: `HeadlineCard` (the-decoder / Unite.AI Apr 2026). Evidence: [the-decoder](https://the-decoder.com/openai-and-microsoft-rewrite-their-deal-no-more-exclusivity-no-more-agi-clause/), [Simon Willison](https://simonwillison.net/2026/Apr/27/now-deceased-agi-clause/).
7. **The whipsaw / MEME.** Fact: the April tape convulsed +6.8/−6.1/+5.9/−5.8 (`moves.md`) — the market arguing with itself, then giving up. Visual: `MemeCutaway` "the button is unplugged." Evidence: `moves.md`, `agi2027-closeup/data.json`.
8. **ZOOM.** Fact: hourly close-up Apr 8 – May 2 2026 shows the intraday fight. Visual: `MarketChartScene` window on `agi2027-closeup/data.json`. Evidence: closeup data.
9. **So what — it's the deadline, not the robot.** Fact: same crowd prices *capability* readily (Claude ~63% best-AI, GPT-5.6 shipped Jun 2026) but the *declaration* at ~5%. Visual: `PostCard` Altman "not a super useful term" (**tag Aug 2025**) + `CompareBars` 5/26/36 horizon ladder. Evidence: [CNBC Aug 11 2025](https://www.cnbc.com/2025/08/11/sam-altman-says-agi-is-a-pointless-term-experts-agree.html), API horizon markets. _[writer: land the nuance]_
10. **The horizon ladder.** Fact: Before 2027 ~5%, Before 2028 ~26%, Before 2030 ~36% (API). Visual: `CompareBars`. Evidence: OAIAGI-26/27/29 last prices.
11. **What's next.** Fact: DevDay Sep 29 2026 is the main dated event before settlement; with the clause dead, little left would push it toward Yes. Visual: `MarketChartScene` extending to a dated strip. Evidence: [OpenAI DevDay 2026](https://openai.com/index/devday-2026/). _[writer: transition]_
12. **END — Resolution Watch.** Fact: settles 2027-01-01; No unless OpenAI formally declares AGI. Visual: `EndCard` scoreboard + disclaimers (informational, not financial advice, 18+). Evidence: API `close_time`. _[writer: sign-off]_
