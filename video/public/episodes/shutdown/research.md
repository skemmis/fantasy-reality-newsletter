# Episode 3 — Research brief: the 43-day shutdown scoreboard (RETRO)

**Topic:** the fall-2025 US government shutdown, scored after the fact against what the Kalshi "shutdown length" market priced vs. what pundits said — plus the live forward-looking shutdown risk.
**Primary ticker (retro):** KXGOVSHUTLENGTH-26JAN01-40D ("More than 40 days"; event `KXGOVSHUTLENGTH-26JAN01`, series `KXGOVSHUTLENGTH`). **Forward market (live):** `KXSHUTDOWNBY` / `KXGOVSHUT` series (see "What's next" — data caveat).
**Market data:** the retro tape is in `data.json` (KXGOVSHUTLENGTH-26JAN01-40D daily midpoint, Oct 4 – Nov 11 2025, recovered from Kalshi's historical store; `meta.volume_usd` 5,292,323). **API caveat (fetched 2026-07-12):** the settled retro market returns `not_found` from the live API, and the forward "Government shutdown in 2026?" event (`KXSHUTDOWNBY-26DEC31`) returns **zero active markets** in this environment — no live forward price is retrievable here. See "What's next" and "Could NOT verify."

> Research brief for the writer. Every factual sentence carries a source URL or points to `data.json`. NO jokes, NO voice, NO editorializing. This is a RETRO episode — the outcome is known.

## One-paragraph summary

The fall-2025 US government shutdown ran **Oct 1 – Nov 12 2025 = 43 days**, the longest in US history, breaking the 35-day 2018–19 record ([NPR, Nov 13 2025](https://www.npr.org/2025/11/13/); [Wikipedia](https://en.wikipedia.org/wiki/2025_United_States_federal_government_shutdown)). It became the longest ever on day 35, **Nov 5 2025**. The cause: Senate Democrats withheld votes for a House continuing resolution over expiring ACA subsidies, and the funding bill failed roughly 14 times before the Senate advanced a deal 60–40 on ~Nov 9–10; the House passed it and President Trump signed on **Nov 12**, funding most agencies through **Jan 30 2026** ([ASCO](https://www.asco.org/news-initiatives/policy-news-analysis/federal-government-open-with-funding-through-january-30); [Husch Blackwell](https://www.huschblackwell.com/newsandinsights/congress-ends-shutdown-what-the-new-funding-law-means-for-major-industries)). The retro hook is the market-vs-pundit scorecard: as early as Oct 6, Kalshi/Polymarket traders were pricing the shutdown to "drag on for weeks" while DC forecast a quick deal ([Fox Business, Amanda Macias, Oct 6 2025](https://www.foxbusiness.com/politics/hopes-dim-prediction-markets-traders-bet-government-shutdown-drag-weeks)), and the specific "More than 40 days" contract crossed 50% around **Oct 18** — weeks before the Nov 12 end (`data.json`). **Important 2026 update the old script misses:** "will it happen again?" already resolved — the government shut down **twice more in 2026** (Jan 31–Feb 3, and a record 76-day partial shutdown Feb 14 – Apr 30) ([Wikipedia, 2026 shutdowns](https://en.wikipedia.org/wiki/2026_United_States_federal_government_shutdowns)); the truly forward question now is the **Oct 1 2026 FY2027 deadline**.

---

## The numbers — the retro tape (from `data.json`)

_The forward markets could not be priced from the API in this environment (caveat above). The retro tape below is the settled KXGOVSHUTLENGTH-26JAN01-40D "More than 40 days" contract, daily midpoint. Prices in cents = implied probability._

| Date | 40D "More than 40 days" | Note |
|---|---|---|
| 2025-10-04 | **11.5** | first tape point; shutdown day 3 |
| 2025-10-06 | 17.5 | Fox Business piece publishes this day |
| 2025-10-18 | **53.5** | first close above 50% — market now expects 40+ days |
| 2025-11-04 | 68.5 | |
| 2025-11-05 | 72.5 | day 35 — ties/breaks the all-time record |
| 2025-11-06 | **90.5** | **+18.0, biggest single-day jump** (`moves.md` #1) |
| 2025-11-11 | **99.0** | last tape point; reopens Nov 12 → resolves YES |

- Settlement: the contract resolved **YES** — 43 days > 40. Cumulative dollar volume on this leg ~**$5.29M** (`data.json` `meta.volume_usd`); daily contract volume peaked ~2.6M contracts on 2025-11-10 (`data.json` volume series), the day the deal cleared the Senate.
- Biggest daily moves (`moves.md`): +18.0 on Nov 6, then a cluster of ±10–13 through mid-to-late October (Oct 16 +12, Oct 21 −13, Oct 22 +10, Oct 24 +11) as each CR vote failed or a deal rumor flared. Annotations for the three narrated beats are in `annotations.json` (begins Oct 4, record Nov 5, ends Nov 11).
- **Framing precision (writer flag):** on **Oct 6**, this specific "40+ days" leg was only ~17.5% — the Fox piece's "drag on for weeks" refers to a *different, shorter* threshold (Kalshi ~64% for "just over 21 days"; Polymarket 72% "at least two weeks" — [Fox Business, Oct 6 2025](https://www.foxbusiness.com/politics/hopes-dim-prediction-markets-traders-bet-government-shutdown-drag-weeks)). The market's *40-day* call firmed up around **Oct 18–24**, still ~3–4 weeks before the Nov 12 end. So "the market called 40+ days weeks early" is TRUE from mid-October — do not back-date it to Oct 6.

---

## Timeline of the tape

_Prices from `data.json`; events dated to reporting._

**2025-10-01 — Shutdown begins.** Funding lapses at midnight; FY2026 has no appropriations. Roughly **42M Americans** were warned SNAP food aid could stop if the lapse continued (search, Nov 2025; see context). Sources: [Wikipedia](https://en.wikipedia.org/wiki/2025_United_States_federal_government_shutdown); [CRFB shutdown Q&A](https://www.crfb.org/papers/government-shutdowns-qa-everything-you-should-know).

**2025-10-06 — Pundits vs. market, in print.** Fox Business (Amanda Macias): Kalshi traders give ~64% that the shutdown lasts "just over 21 days" (~$2.5M wagered); Polymarket 72% for "at least two weeks" — "waning confidence in a near-term deal" while DC negotiations were "at a standstill." Source: [Fox Business, Oct 6 2025](https://www.foxbusiness.com/politics/hopes-dim-prediction-markets-traders-bet-government-shutdown-drag-weeks). (Headline sidecar referenced by `episode.yaml`: `assets/headlines/shutdown-market-fox-h1.png`.)

**2025-10-18 — The 40-day call crosses 50%.** The "More than 40 days" leg closes at 53.5 for the first time (`data.json`) — the market now formally expects a record-length shutdown, weeks before it happened.

**2025-10-16 → 10-24 — CR-vote chop.** The House CR failed repeatedly (reported ~14 times over the shutdown); each failed cloture vote and each collapsed "deal is close" rumor shows up as ±10–13 daily swings (`moves.md` #2–#5). Source: [Wikipedia](https://en.wikipedia.org/wiki/2025_United_States_federal_government_shutdown).

**2025-11-05 — Longest ever, day 35.** The shutdown ties then breaks the 2018–19 record; tape at 72.5 (`data.json`; `annotations.json` id `record`). Sources: [NPR/Axios/NBC, Nov 5 2025 coverage](https://www.npr.org/2025/11/13/).

**2025-11-06 — +18 in a day, to 90.5.** Largest single-day jump (`moves.md` #1) as a resolution slips further out and the record is broken.

**2025-11-09/10 — Senate advances the deal 60–40.** Cloture cleared; contract to 98.5→99.5 (`data.json`); daily volume spikes ~2.6M contracts on Nov 10. Source: [Husch Blackwell](https://www.huschblackwell.com/newsandinsights/congress-ends-shutdown-what-the-new-funding-law-means-for-major-industries).

**2025-11-12 — Reopens, 43 days.** House passes, Trump signs; funds most agencies through **Jan 30 2026**. Tape resolves YES. Sources: [ASCO](https://www.asco.org/news-initiatives/policy-news-analysis/federal-government-open-with-funding-through-january-30); [NACo](https://www.naco.org/news/congress-votes-end-longest-federal-government-shutdown-history). (`data.json` last point is Nov 11 at 99.0; actual reopen is Nov 12.)

---

## Context the script needs

### What the market priced vs. what pundits said (with dated examples)
- **Pundit side:** the recurring DC line was that a deal was "days away" / "close." The Oct 6 Fox Business piece is the on-the-record artifact that a betting market was already discounting that optimism ("Hopes dim in prediction markets…"). Source: [Fox Business, Oct 6 2025](https://www.foxbusiness.com/politics/hopes-dim-prediction-markets-traders-bet-government-shutdown-drag-weeks).
- **Market side, precisely:** by Oct 18 the *40+ day* contract was above 50%, and it never looked back (`data.json`). So the crowd's central estimate migrated to "record-length" three-plus weeks before it resolved. **Writer flag:** keep the two thresholds straight — "weeks" (Oct 6, the short market) vs. "40+ days" (Oct 18, the leg this episode tracks). The `episode.yaml` CompareBars "KALSHI 40+ DAYS vs DC 'DAYS AWAY'" is fair for mid-October onward, not for Oct 6.

### How "length bracket" markets work
- The `KXGOVSHUTLENGTH` event is a **ladder of bracket contracts** (e.g. ">35 days", ">40 days", ">60 days", ">90 days"), each a binary $1-notional YES/NO on whether the shutdown exceeds that threshold. Traders read the ladder as a distribution: the price of each rung is the implied probability of clearing it. The episode tracks the **>40-day rung** as the single clean "will it be historic?" line. (Rung structure confirmed by the Feb-2026 pricing example below: 35d YES 61¢, 40d YES 55¢, 60d NO 82¢, 90d NO 91¢ — [Action Network, Feb 26 2026](https://www.actionnetwork.com/politics/government-shutdown-kalshi-odds-market-analysis).)

### The human stakes — SNAP / 42M
- On/around day one, roughly **42 million Americans** who receive SNAP were warned benefits could be interrupted if the lapse dragged into November (the program's contingency funding is finite). Use as the `move-begins` stakes beat. Source: contemporaneous Nov-2025 reporting; [CRFB shutdown Q&A](https://www.crfb.org/papers/government-shutdowns-qa-everything-you-should-know). **Writer flag:** "warned it *could* stop," not "did stop" — frame as risk on day one.

### The scoreboard claim, stated safely
- Verified: 43 days; longest ever; record broken Nov 5; the 40+ contract was >50% by Oct 18; it resolved YES. That is enough for "the crowd called it." Do NOT claim the market predicted the *exact* 43 or beat every pundit on every day — it whipsawed (Oct 21 −13, etc.). The honest claim is directional and early, not precise.

---

## What's next (the LIVE forward market + FY2027 deadlines)

**Key correction to the old script.** The retired `script.md`/`episode.yaml` point viewers to "an open market on whether it all happens again before the end of 2026" (`KXSHUTDOWNBY-26DEC31`). That question **has already resolved YES** — the government shut down **twice more in 2026**:
- **Jan 31 – Feb 3 2026 (4 days)** — a procedural lapse after the Jan 30 funding cliff. [Wikipedia, 2026 shutdowns](https://en.wikipedia.org/wiki/2026_United_States_federal_government_shutdowns).
- **Feb 14 – Apr 30 2026 (76 days)** — a record-length *partial* (DHS) shutdown over immigration-enforcement reforms following the Jan 24 2026 killing of Alex Pretti by CBP agents; ended when H.R. 7147 was signed Apr 30 2026, funding through Sept 30 2026. [Wikipedia](https://en.wikipedia.org/wiki/2026_United_States_federal_government_shutdowns); [FedTools](https://www.fedtools.com/blog/government-shutdown-october-2026).

**So the real forward market is the FY2027 / Oct 1 2026 deadline:**

| Date (2026) | Event | Why it matters |
|---|---|---|
| **Sep 30** | FY2026 funding (the Apr 30 package) **expires**; FY2027 begins Oct 1 | The next shutdown cliff. As of Jul 1, only **2 of 12** FY2027 House bills had passed and the Senate zero — a continuing resolution is the base case, but three lapses totaling ~123 days occurred in the prior 12 months. [FedTools, Jul 2026](https://www.fedtools.com/blog/government-shutdown-october-2026); [CRFB Appropriations Watch FY2027](https://www.crfb.org/blogs/appropriations-watch-fy-2027) |
| **Nov 2026** | Midterm elections | Cited as the political "wild card" over the FY2027 fight. [FedTools](https://www.fedtools.com/blog/government-shutdown-october-2026) |

**DATA CAVEAT (verify on VO day):** the live Kalshi forward markets (`KXSHUTDOWNBY`, `KXGOVSHUT`) returned no active, priced markets from the API in this environment on 2026-07-12 — the "Government shutdown in 2026?" event exists but has **zero markets** attached here, and there was no retrievable Oct-1-2026 contract. If a live FY2027/Oct-1 market is trading on VO day, fetch its price and use it; otherwise state the qualitative setup (Sept 30 deadline, 2-of-12 bills) and do NOT invent a number. **Do not reuse the "will it happen again in 2026" framing — it already did, twice.**

---

## Could NOT verify (do not assert these)

1. **A live forward shutdown-market price** — the API returned zero active `KXSHUTDOWNBY`/`KXGOVSHUT` markets in this environment; no current % is available. Re-fetch on VO day.
2. **The exact number of failed CR votes** — reported "~14 times"; treat as approximate.
3. **Exact Nov 9 vs Nov 10 cloture timing / vote count** — advanced ~60–40 around Nov 9–10; keep the date range unless re-sourced.
4. **That the market predicted "exactly 43 days"** — it tracked the *40+ threshold*, not a point estimate. The claim is "called 40+, early," not "nailed 43."
5. **SNAP: that benefits actually lapsed** — 42M were *warned*; frame as risk, not a completed cutoff.
6. **Oct 6 = the 40-day call** — on Oct 6 the 40+ leg was ~17.5%; the 50%+ call is Oct 18. Keep thresholds distinct.
7. **`data.json` showing the Nov 12 reopen** — the tape ends Nov 11 at 99.0; the reopen date (Nov 12) comes from reporting, not the tape.

---

## Beat-sheet skeleton (neutral — writer supplies voice)

Visual kit refs: `BigNumber`, `KineticTitle`, `HeadlineCard` (real-article screenshot + source chip), `CompareBars`, `MemeCutaway`, `MarketChartScene` (the recovered tape), `EndCard`.

1. **COLD OPEN — 43 days.** Fact: the shutdown ran Oct 1 – Nov 12 2025 = **43 days**, the longest ever. Visual: `BigNumber` 43 DAYS. Evidence: [NPR Nov 13 2025](https://www.npr.org/2025/11/13/), [Wikipedia](https://en.wikipedia.org/wiki/2025_United_States_federal_government_shutdown). _[writer: hook — "and a market called it"]_
2. **TITLE.** `KineticTitle` "THE MARKET SAYS · ep 03 · retro."
3. **Refresher.** Fact: Oct 1 lapse; Democrats withheld votes over expiring ACA subsidies; the CR failed ~14 times. Visual: `HeadlineCard` (NPR "ends after 43 days") + stat cards. Evidence: [Wikipedia](https://en.wikipedia.org/wiki/2025_United_States_federal_government_shutdown).
4. **THE BET — who called it.** Fact: while DC said "days away," the 40+ contract crossed 50% by **Oct 18** and stayed there (`data.json`); the Oct 6 Fox piece already flagged the market's pessimism. Visual: `CompareBars` (KALSHI 40+ vs DC "days away") + `HeadlineCard` (Fox Oct 6) + `MarketChartScene` insert. Evidence: `data.json`, [Fox Business](https://www.foxbusiness.com/politics/hopes-dim-prediction-markets-traders-bet-government-shutdown-drag-weeks). _[writer: keep the threshold nuance]_
5. **THE TAPE.** Fact: 11.5% Oct 4 → 53.5% Oct 18 → 72.5% Nov 5 → **90.5% (+18) Nov 6** → 99% Nov 11 (`data.json`, `moves.md`). Visual: `MarketChartScene` full reveal with `annotations.json`. Evidence: `data.json`.
6. **Day-one stakes.** Fact: ~**42M** Americans warned SNAP could stop. Visual: `BigNumber` 42M. Evidence: [CRFB](https://www.crfb.org/papers/government-shutdowns-qa-everything-you-should-know). _[writer: frame as risk]_
7. **Record breaks — Nov 5.** Fact: day 35, longest ever; the +18 jump follows Nov 6. Visual: `HeadlineCard` (Axios "breaks record") + `MemeCutaway` "this is fine." Evidence: `annotations.json`, [NPR](https://www.npr.org/2025/11/13/).
8. **The payoff.** Fact: Senate advances 60–40 (~Nov 9–10); House passes, Trump signs **Nov 12**; 43 days; contract resolves YES; funds through Jan 30 2026. Visual: `BigNumber` 43 DAYS (gold) "the market's number." Evidence: [ASCO](https://www.asco.org/news-initiatives/policy-news-analysis/federal-government-open-with-funding-through-january-30). _[writer: bookend]_
9. **So what — and it kept happening.** Fact: the "will it happen again in 2026?" question already resolved YES — two more shutdowns in 2026 (4 days in Feb; a record **76-day** partial Feb 14 – Apr 30). Visual: `MarketChartScene`/`HeadlineCard` on the 2026 shutdowns. Evidence: [Wikipedia 2026 shutdowns](https://en.wikipedia.org/wiki/2026_United_States_federal_government_shutdowns). _[writer: update the old "still open" line]_
10. **The live board now.** Fact: government funded through **Sept 30 2026**; FY2027 cliff is **Oct 1 2026**; only 2 of 12 bills passed as of July; CR is the base case. Visual: `MarketChartScene` future strip to Sep 30 2026. Evidence: [FedTools](https://www.fedtools.com/blog/government-shutdown-october-2026), [CRFB FY2027](https://www.crfb.org/blogs/appropriations-watch-fy-2027). _[writer: the new "go check" market — verify a live price on VO day]_
11. **Why trust the crowd.** Fact: the crowd's directional, early call beat the "days away" consensus — but it whipsawed (Oct 21 −13), so the claim is "early and directional," not "precise." Visual: `CompareBars`. Evidence: `moves.md`. _[writer: the honest version]_
12. **END — Resolution Watch.** Fact: 2025 shutdown resolved YES (43 days); FY2027 market OPEN (verify price). Visual: `EndCard` scoreboard + disclaimers (informational, not financial advice, 18+). Evidence: settlement + API. _[writer: sign-off]_
