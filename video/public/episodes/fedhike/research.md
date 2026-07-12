# Episode 1 — Research brief: the coin-flip rate hike

**Topic:** the Kalshi market "Will the Federal Reserve hike rates by December 31, 2026?" and the 2026 hike-vs-cut story.
**Primary ticker:** FEDHIKE-26DEC31. **Companion tickers:** FEDHIKE-27DEC31, KXRATECUT-26DEC31, and the KXFED fed-funds-level ladder.
**Market data fetched:** 2026-07-12T12:36Z, live from the Kalshi API (`api.elections.kalshi.com/trade-api/v2`). Price history in `data.json` runs through 2026-07-11.

> This is a research brief for the writer. Every factual sentence carries a source URL or points to `data.json`. NO jokes, NO voice, NO editorializing — the writer supplies all of that. Where a number will be stale on VO day it is flagged; re-fetch before recording.

## One-paragraph summary

A Kalshi contract that pays out if the Federal Reserve raises interest rates before the end of 2026 is trading around a coin flip (last 55¢ on 2026-07-12, up from ~22% as recently as May 2026 — `data.json`). The Fed cut rates three times in late 2025 to a 3.50%–3.75% target and has held there all year ([Fed, Dec 10 2025 statement](https://www.federalreserve.gov/newsevents/pressreleases/monetary20251210a.htm)). Two things then flipped the narrative from "cuts" to "maybe hikes": an energy-driven inflation spike (headline CPI 4.2% in May, its highest since 2023, on Iran-war oil prices — [Axios, Jun 10 2026](https://www.axios.com/2026/06/10/cpi-may-inflation-iran)), and the arrival of a new, hawkish-reputation Fed chair, Kevin Warsh, whose first meeting (Jun 16–17) produced a dot plot in which 9 of 18 projecting officials now see at least one 2026 hike ([CNBC, Jun 17 2026](https://www.cnbc.com/2026/06/17/fed-interest-rate-decision-june-2026.html); [Yahoo Finance, Jun 17 2026](https://finance.yahoo.com/economy/policy/article/fed-dot-plot-almost-half-of-fomc-members-project-at-least-one-interest-rate-hike-this-year-183645064.html)). The June minutes, released Jul 8, showed a committee Warsh himself called a "family fight," evenly split on the year-end path ([CNBC, Jul 8 2026](https://www.cnbc.com/2026/07/08/fed-minutes-june-2026-.html)). The contract now sits near 50/50 because the underlying committee is, too.

---

## The numbers right now

_All fetched 2026-07-12T12:36Z from the Kalshi API. Prices in cents = implied probability. Volume/OI in contracts (each $1 notional)._

| Market | Question | Last | Yes bid/ask | No bid/ask | Volume | Open interest | Settles |
|---|---|---|---|---|---|---|---|
| **FEDHIKE-26DEC31** | Fed hikes by Dec 31, 2026? | **55¢** | 55 / 56 | 44 / 45 | $1,269,475 | 525,891 | 2026-12-31 |
| **FEDHIKE-27DEC31** | Fed hikes by Dec 31, 2027? | 77¢ | 75 / 77 | 23 / 25 | $54,115 | 21,364 | 2027-12-31 |
| **KXRATECUT-26DEC31** | Fed cuts at least once in 2026? | 25.6¢ | 22.1 / 24.9 | 75.1 / 77.9 | $704,099 | 379,578 | 2026-12-31 |

- FEDHIKE-26DEC31 resolution rule (verbatim from API): _"If the Federal Reserve hikes again by Dec 31, 2026, then the market resolves to Yes."_ Previous-day close was 56¢; it has been the more heavily-traded of the pair.
- KXRATECUT-26DEC31 rule (verbatim): _"If the Federal Reserve cuts its target federal funds rate range at least once between February 26, 2026 and December 31, 2026, then the market resolves to Yes."_ Note: hike (55¢) and cut (26¢) are **not** complementary — "hold all year" is the residual ~19¢, so the two markets can and do both trade below 50.
- **Cross-check from Kalshi's own fed-funds ladder** (`KXFED-26DEC`, the "what is the rate after the Dec 9 meeting" event): the "Above 3.75%" bucket — i.e. a hike has happened by year-end — last traded 59¢ (bid/ask 57/59). That is internally consistent with FEDHIKE at 55¢. Near-term the same ladder prices a hike as much less likely: `KXFED-26JUL` "Above 3.75%" 21¢, `KXFED-26SEP` "Above 3.75%" 36¢. (All fetched 2026-07-12.)

**Change vs. the retired script:** the old cold open opens on "fifty-one percent" (verified 2026-07-11). The live number is now **55¢**, and `data.json`'s last point (2026-07-11) is 55.0. Update the headline number on VO day.

---

## Timeline of the tape

_Moves are from `data.json` (FEDHIKE-26DEC31 daily midpoint). Largest single-day swings are catalogued in `moves.md`._

**2025-03-19/22 — Market opens.** Contract created 2025-03-19, first trades 2025-03-22 at ~50.5¢ (`data.json`; API `created_time` 2025-03-19). It opens as a genuine coin flip on no news.

**2025-04-02 — "Liberation Day" tariffs.** Odds whipsaw 49→30→49→30 over several sessions (`data.json` Mar 31–Apr 3; `annotations.json`). Mechanism: tariffs are simultaneously inflationary (argues hike) and growth-negative (argues cut), and the market could not decide. Source: [CBS, tariffs & inflation, Mar 2026 CPI retro](https://www.cbsnews.com/news/cpi-report-today-march-2026-inflation-iran-war-trump/) (background on the tariff-inflation channel).

**2025-09 / 10-29 / 12-10 — Three rate CUTS.** The Fed cut 25 bp in September, again on Oct 29 (to 3.75%–4.00%), and again on Dec 10 2025 (to **3.50%–3.75%**), the December vote 9–3 (Miran wanted 50 bp; Schmid and Goolsbee wanted a hold). Hike odds drift into the teens through late 2025 (`data.json` lows of 12–18¢ in Dec 2025–Jan 2026). Sources: [CNBC, Oct 29 2025](https://www.cnbc.com/2025/10/29/fed-rate-decision-october-2025.html); [Fed statement, Dec 10 2025](https://www.federalreserve.gov/newsevents/pressreleases/monetary20251210a.htm); [Chase recap, Dec 2025](https://www.chase.com/personal/investments/learning-and-insights/article/fed-meeting-december-2025).

**2026-03 → 05 — Slow drift up.** From ~11–12¢ in early March, the market climbs steadily to the 30s–40s by late May as energy prices and tariffs feed inflation fear (`data.json`; e.g. May 13 31.5¢, May 23 45.5¢). The Iran-war energy shock is the through-line (see CPI entries below).

**2026-06-05 — May jobs report (strong).** +172,000 payrolls vs. an 80,000 Dow Jones consensus; unemployment held at 4.3%; prior two months revised up +93K. Hike odds jump 38.5→48.5 into Jun 6 (`data.json`). Sources: [BLS TED, May 2026](https://www.bls.gov/opub/ted/2026/total-nonfarm-payroll-employment-increased-by-172000-in-may-2026.htm); [Bloomberg, Jun 5 2026](https://www.bloomberg.com/news/articles/2026-06-05/us-adds-172-000-jobs-in-may-beating-all-economists-estimates). (Headline screenshot sidecar: `assets/headlines/jobs-cnbc.json` → cnbc.com/2026/06/05/jobs-report-may-2026.html.)

**2026-06-10 — May CPI (hot headline, cooler core).** Headline CPI **+4.2% y/y** (up from 3.8% in April; highest since April 2023), **+0.5% m/m**. **Core CPI +2.9% y/y** (up from 2.8%) — materially below headline. The gap is energy: gasoline +7% m/m and ~40% above January on the Iran war. Sources: [Axios, Jun 10 2026](https://www.axios.com/2026/06/10/cpi-may-inflation-iran); [CBS, May 2026 CPI](https://www.cbsnews.com/news/cpi-report-today-may-2026-inflation-iran-war-trump/); [BLS CPI release](https://www.bls.gov/news.release/cpi.nr0.htm). **Writer flag:** "inflation back above 4%" is true only of headline; core is 2.9%.

**2026-06-17 — FOMC, Warsh's first meeting (the big move).** Rates held **unanimously** at 3.50%–3.75%. The dot plot flipped hawkish: of the **18** participants who submitted projections (Warsh did not publish his dot, leaving 18 rather than 19), **9 project at least one 2026 hike**, 6 of them multiple; the other half favored hold-or-cut. The 2026 PCE inflation forecast was raised to **3.6%** (from 2.7%), and the statement was shortened and stripped of its easing-bias language. Hike odds gap **35.5→57.5** the next day (+22, the single largest move in the series — `moves.md`). Sources: [CNBC, Jun 17 2026](https://www.cnbc.com/2026/06/17/fed-interest-rate-decision-june-2026.html); [Yahoo Finance dot-plot, Jun 17 2026](https://finance.yahoo.com/economy/policy/article/fed-dot-plot-almost-half-of-fomc-members-project-at-least-one-interest-rate-hike-this-year-183645064.html); [Chase takeaways](https://www.chase.com/personal/investments/learning-and-insights/article/kevin-warsh-june-2026-federal-reserve-meeting-key-takeaways). (Headline sidecar: `assets/headlines/fomc-cnbc.json` → cnbc.com/2026/06/17/fed-interest-rate-decision-june-2026.html.)

**2026-06-30 → 07-05 — Retracement.** Odds fall from the high-50s toward the low-40s (Jun 29 55.5 → Jul 5 42.5 — `data.json`). Contributing: the **June jobs report (Jul 2) was weak** — only +57,000 payrolls vs. ~115,000 consensus, with April/May revised down a combined 74,000 (unemployment ticked to 4.2% on a falling participation rate). A cooling labor market cuts against the hike thesis. Sources: [Yahoo Finance, Jul 2 2026](https://finance.yahoo.com/economy/articles/u-jobs-report-june-2026-123456841.html); [CNBC, Jul 2 2026](https://www.cnbc.com/amp/2026/07/02/jobs-report-june-2026-.html).

**2026-07-08 — June minutes ("family fight").** Minutes from the June meeting confirmed a committee split down the middle on the year-end path; Warsh had characterized the debate at his June presser as a "family fight." Bloomberg reported only **"a few"** officials saw an actual case for a June hike (distinct from the 9/18 who project a hike by year-end). Odds pop 48.5→56.5 into Jul 9 (`data.json`). Sources: [CNBC, Jul 8 2026](https://www.cnbc.com/2026/07/08/fed-minutes-june-2026-.html); [CNBC "family fight," Jul 8 2026](https://www.cnbc.com/2026/07/08/with-minutes-due-feds-family-fight-over-interest-rates-could-drag-on.html); [Bloomberg, Jul 8 2026](https://www.bloomberg.com/news/articles/2026-07-08/fed-minutes-show-a-few-officials-saw-case-for-june-rate-hike).

**2026-07-12 — Current.** 55¢ live (last), 55/56 bid-ask, ~$1.27M cumulative volume (API, this fetch).

---

## Context the script needs

### Who is Kevin Warsh, and how he got the chair
- **Confirmation:** the Senate confirmed Warsh as a Fed **governor** on May 12, 2026, then as **Chair** on May 13, 2026, by **54–45** — described as the closest modern-era vote for the post; only Sen. John Fetterman crossed party lines to support him. Sources: [CNBC, May 13 2026](https://www.cnbc.com/2026/05/13/kevin-warsh-wins-senate-confirmation-as-the-next-federal-reserve-chair.html); [NPR, May 13 2026](https://www.npr.org/2026/05/13/nx-s1-5816235/kevin-warsh-federal-reserve-chair-jerome-powell); [C-SPAN, 54–45](https://www.c-span.org/clip/us-senate/senate-confirms-kevin-warsh-as-fed-chair-54-45/5200274).
- **Powell handoff:** Jerome Powell's term as Chair expired the Friday after the vote (mid-May 2026); Powell remains on the Board as a governor (two years left on that term). Source: CNBC/NPR above.
- **Hawkish record:** Warsh was a Fed governor 2006–2011 and was regarded as hawkish; he resigned in 2011 partly over discomfort with Bernanke's quantitative easing, warned that low rates/QE would stoke inflation, and publicly criticized QE2 in a 2010 WSJ op-ed even though he voted for it. He has **never formally dissented** from an FOMC decision. In a 2025 CNBC interview he called for "regime change" at the Fed. President Trump has publicly expected Warsh to lower rates. Sources: [Wikipedia (record/QE2/resignation)](https://en.wikipedia.org/wiki/Kevin_Warsh); [PBS NewsHour profile](https://www.pbs.org/newshour/economy/3-things-to-know-about-kevin-warsh-trumps-pick-for-fed-chair); [Washington Times, "hawk or dove," Jun 9 2026](https://www.washingtontimes.com/news/2026/jun/9/kevin-warsh-hawk-dove/). **Writer flag:** the "hawk" label is contested — he's voted for easing and never dissented; the profiles debate it. Do not assert "lifelong hawk" flatly.

### The Wall-Street-vs-market "divergence" — verdict: PARTIAL, do not state a clean single number
- **What Kalshi says:** ~55% chance of **any** hike by Dec 31, 2026 (FEDHIKE-26DEC31); Kalshi's own fed-funds ladder corroborates at ~59% (`KXFED-26DEC` "Above 3.75%").
- **What CME FedWatch (fed funds futures) says:** as of ~Jul 8 2026, ~70% probability the Fed **holds** at the next meeting, and only low-single-digit odds of a hike at the immediate July meeting. Source: [CME FedWatch](https://www.cmegroup.com/markets/interest-rates/cme-fedwatch-tool.html) (summary via search, Jul 8 2026); [centralbank.watch 2026 odds](https://centralbank.watch/federal-reserve/).
- **Why you cannot cleanly say "futures price X% vs Kalshi 55%":** FedWatch publishes **per-meeting** hike/hold/cut odds, not a single cumulative "any hike by year-end 2026" figure. Kalshi's 55% is cumulative across all remaining meetings. Comparing the low per-meeting hike odds to Kalshi's cumulative 55% is apples-to-oranges. A directional divergence is real (futures treat a near-term hike as unlikely; Kalshi treats a hike sometime in 2026 as a coin flip), but **there is no verified single CME percentage to place next to 55%.** Mark any on-screen "CME says N%" as UNAVAILABLE unless re-derived on VO day. **This is the trap that made the old research's cut-divergence claim go stale — handle with care.**

### The inflation mechanics (energy + tariffs), one line each, sourced
- **Energy/Iran:** the 2026 inflation spike is primarily an oil/gasoline shock from the Iran war — gasoline +7% m/m in May and ~40% above January, energy the dominant driver of the 4.2% headline. Source: [Axios, Jun 10 2026](https://www.axios.com/2026/06/10/cpi-may-inflation-iran). (A supply-driven energy spike is exactly the kind of inflation the Fed often "looks through," which is part of why the committee is split.)
- **Tariffs:** tariffs are the two-way force — inflationary via import prices, contractionary via growth — which is why the tariff news whipsawed rather than trended the market. Source: [CBS, Mar 2026 CPI/tariffs](https://www.cbsnews.com/news/cpi-report-today-march-2026-inflation-iran-war-trump/).

### What "the market" structurally is here
- **Binary contract:** each FEDHIKE-26DEC31 share is a $1-notional claim that pays $1 if the Fed hikes by Dec 31 2026 and $0 otherwise; the price in cents (1–99) is read directly as the implied probability. It resolves off the actual FOMC decision, with an early-close provision (per API `early_close_condition`).
- **Size:** cumulative volume ~$1.27M and open interest ~526,000 contracts (API, 2026-07-12). For scale, its 24h volume this fetch was ~4,500 contracts — the big volume is accumulated over 16 months, not a hot tape today. **Writer flag:** whether $1.27M is "big for a Kalshi non-sports market" is **not independently verified** here; state the raw figure, not a superlative. The companion cut market (KXRATECUT) has ~$704K volume and the 2027 hike market only ~$54K, so within this Fed cluster the 2026 hike market is clearly the most-traded.

---

## What's next (dated catalysts before Dec 31 settlement)

| Date (2026) | Event | Why it can move FEDHIKE |
|---|---|---|
| **Jul 14** | June CPI release, 8:30am ET | First inflation print since the hawkish turn; core vs. headline gap is the tell. [BLS schedule](https://www.bls.gov/schedule/2026/07_sched.htm) |
| **Jul 28–29** | FOMC meeting (no SEP/dot plot) | First decision since the June flip; a hike here would resolve the market early. [Fed calendar](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) |
| **Aug 7** | July jobs report | Labor-market read after the weak June print. [BLS schedule](https://www.bls.gov/schedule/news_release/empsit.htm) |
| **Aug ~12** | July CPI release | (Date approximate; confirm on BLS schedule.) |
| **Aug 27–29** | Jackson Hole symposium; Warsh keynote **Fri Aug 28** | Chair's first Jackson Hole; theme "Financial Innovation." [KC Fed](https://www.kansascityfed.org/research/jackson-hole-economic-symposium/) |
| **Sep 15–16** | FOMC meeting **with SEP** (new dot plot) | Updated dots; last projections before the final quarter. [Fed calendar](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm) |
| **Oct 27–28** | FOMC meeting (no SEP) | — |
| **Dec 8–9** | FOMC meeting **with SEP** | **Last FOMC before the market settles Dec 31** — the decisive catalyst. |
| Monthly | CPI + jobs reports through year-end | Each print reprices the odds. |

---

## Could NOT verify (do not assert these)

1. **A clean CME/futures percentage for a 2026 hike** to place beside Kalshi's 55% — FedWatch is per-meeting; no cumulative "any hike by year-end" number was found. (See divergence section.)
2. **June CPI actuals** — the June report publishes Jul 14 2026, after this brief. The "4.2% headline" figure is the **May** report (released Jun 10).
3. **Whether $1.27M volume is "large" for a Kalshi non-sports market** — raw figure verified; the ranking/superlative is not.
4. **Warsh's exact dot** in the June SEP — he did not publish one; only 18 of 19 dots are visible ([CNBC, Jun 17](https://www.cnbc.com/2026/06/17/fed-interest-rate-decision-june-2026.html)).
5. **The precise real-time cause of every minor daily wiggle** — annotations cover only the four largest, well-sourced moves (`annotations.json`).
6. **"Every economist on TV says cuts are coming"** (old-script line) — this is now dated; post-June, the consensus is genuinely split and some now price hikes. Do not reuse without re-sourcing.
7. **The July jobs report and any July CPI reaction** — not yet released as of this brief.

---

## Beat-sheet skeleton (neutral — writer supplies voice)

Visual kit refs: `MarketChartScene` (the animated tape), `HeadlineCard` (real-article screenshot + source chip), `BigNumber`, `DotPlot`, `VersusCard`, `HawkDoveMeter`, `MoneyPrinterBeat`, `EndCard`.

1. **COLD OPEN — the number.** Fact: FEDHIKE-26DEC31 last **55¢** = market-implied probability the Fed *raises* rates in 2026 (API, 2026-07-12). Visual: `BigNumber` 55% + `MarketChartScene` cold cursor on the tip. Evidence: `data.json`, API fetch. _[writer: hook]_
2. **What this market is.** Fact: Kalshi binary contract, price-in-cents = probability, resolves on the actual FOMC decision, ~$1.27M volume / ~526K OI accumulated since Mar 2025. Visual: `HeadlineCard`/explainer card. Evidence: API rules + volume fields.
3. **The baseline everyone forgets.** Fact: the Fed *cut* three times in late 2025 (Sep/Oct/Dec) to 3.50%–3.75% and has held there all of 2026; the last actual move was **down**. Visual: `MarketChartScene` zoomed to late-2025 lows + `BigNumber` 3.50–3.75%. Evidence: [Fed Dec 10 2025](https://www.federalreserve.gov/newsevents/pressreleases/monetary20251210a.htm).
4. **Hike vs. cut, side by side.** Fact: same crowd prices a 2026 *cut* at ~26¢ (KXRATECUT) vs. hike ~55¢ — and "hold" is the ~19¢ residual, so they aren't opposites. Visual: `VersusCard` hike 55 / cut 26. Evidence: API, both tickers. _[writer: transition]_
5. **THE TAPE — tariffs whipsaw.** Fact: Apr 2 2025 "Liberation Day" tariffs sent odds 49→30→49→30 (inflationary vs. growth-negative). Visual: `MarketChartScene` annotation `move-tariffs`. Evidence: `annotations.json`, `data.json`.
6. **The energy spike.** Fact: May CPI headline **4.2%** (highest since 2023) on Iran-war oil — but **core only 2.9%.** Visual: `HeadlineCard` (Axios Jun 10) + `BigNumber` 4.2% with a smaller 2.9% core callout. Evidence: [Axios Jun 10 2026](https://www.axios.com/2026/06/10/cpi-may-inflation-iran). _[writer: land the core-vs-headline nuance]_
7. **Strong jobs.** Fact: May jobs (Jun 5) +172K vs 80K consensus; odds 38.5→48.5. Visual: `BigNumber` +172K vs 80K + `HeadlineCard` (`jobs-cnbc.json`). Evidence: [BLS TED](https://www.bls.gov/opub/ted/2026/total-nonfarm-payroll-employment-increased-by-172000-in-may-2026.htm).
8. **New chair enters.** Fact: Kevin Warsh confirmed Chair May 13 2026, 54–45 (closest modern vote); hawkish reputation but never dissented. Visual: `VersusCard` Powell→Warsh portraits + `HawkDoveMeter`. Evidence: [CNBC May 13](https://www.cnbc.com/2026/05/13/kevin-warsh-wins-senate-confirmation-as-the-next-federal-reserve-chair.html), [Wikipedia](https://en.wikipedia.org/wiki/Kevin_Warsh). _[writer: keep the hawk label hedged]_
9. **THE decisive move — the dot plot flips.** Fact: Jun 17 FOMC held rates, but 9 of 18 dots now see a 2026 hike, PCE forecast raised to 3.6%; odds gap +22 in a day (largest in series). Visual: `DotPlot` animation + `MarketChartScene` annotation `move-fomc`. Evidence: [Yahoo dot-plot](https://finance.yahoo.com/economy/policy/article/fed-dot-plot-almost-half-of-fomc-members-project-at-least-one-interest-rate-hike-this-year-183645064.html), `moves.md`.
10. **The "family fight."** Fact: Jul 8 minutes show a committee evenly split; Warsh's own word was "family fight"; only "a few" saw a June-hike case. Visual: `HawkDoveMeter` at dead center / split committee graphic. Evidence: [CNBC Jul 8](https://www.cnbc.com/2026/07/08/with-minutes-due-feds-family-fight-over-interest-rates-could-drag-on.html), [Bloomberg Jul 8](https://www.bloomberg.com/news/articles/2026-07-08/fed-minutes-show-a-few-officials-saw-case-for-june-rate-hike). _[writer: this is why it's a coin flip]_
11. **What's next.** Fact: catalysts before Dec 31 settlement — Jul 14 CPI, Jul 28–29 & Sep 15–16 & Oct 27–28 & **Dec 8–9** FOMC, Aug 28 Warsh at Jackson Hole. Visual: `MarketChartScene` extending into a dated future strip. Evidence: [Fed calendar](https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm). _[writer: transition to close]_
12. **END — Resolution Watch.** Fact: market settles Dec 31 2026; the channel tracks the call vs. the outcome. Visual: `EndCard` / Resolution Watch scoreboard + disclaimers (informational, not financial advice, 18+). Evidence: API `close_time` 2027-01-01. _[writer: sign-off]_
