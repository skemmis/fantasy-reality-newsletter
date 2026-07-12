import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {COLORS} from './theme/theme';
import {HeadlineCard} from './components/HeadlineCard';
import {ArticleZoom} from './components/ArticleZoom';
import {BigNumber} from './components/BigNumber';
import {CompareBars} from './components/CompareBars';
import {DotPlot} from './components/DotPlot';
import {PostCard} from './components/PostCard';
import {TickerWipe} from './components/TickerWipe';
import {KineticTitle} from './components/KineticTitle';

const FPS = 30;

export type ShotReelProps = {
  /**
   * public/-relative path of the real jobs headline screenshot, resolved by
   * calculateMetadata when the file exists; null renders the generated
   * placeholder shot.
   */
  headlineSrc: string | null;
} & Record<string, unknown>;

export const HEADLINE_SHOT = 'assets/headlines/jobs-cnbc.png';

/**
 * Shot vocabulary reel for the June-5 jobs beat:
 * HeadlineCard -> ArticleZoom -> BigNumber -> CompareBars -> DotPlot ->
 * PostCard, stitched with TickerWipe sweeps. ~35s @ 1920x1080/30.
 */

// ---- timeline ----
const S = {
  headline: 0,
  zoom: 150,
  bignum: 270,
  bars: 390,
  dots: 560,
  post: 780,
  closer: 950,
  end: 1050,
} as const;
export const SHOT_REEL_DURATION = S.end;

const WIPE_LEN = 16;
// Each wipe brackets a scene boundary: starts 10 frames before the cut.
const wipeAt = (cut: number) => cut - 10;

const HEADLINE = {
  source: 'CNBC',
  date: 'JUN 5 2026',
  headline: 'Payrolls rose 172,000 in May, more than double what Wall Street expected',
  url: 'https://www.cnbc.com/2026/06/05/jobs-report-may-2026.html',
};
// Box over "172,000" — measured on the real 2880x1400 CNBC grab vs the
// generated placeholder (different headline layout).
const HL_REAL = {x: 0.482, y: 0.405, w: 0.155, h: 0.1};
const HL_PLACEHOLDER = {x: 0.425, y: 0.295, w: 0.235, h: 0.115};
// The real grab is a 1440x700 viewport clip @2x.
const REAL_ASPECT = 2880 / 1400;

const TICKER =
  'FEDHIKE-26DEC31 ▲51 · KXRATECUT-26 ▼25 · PAYROLLS +172K · UNEMP 4.1% · 10Y 4.42%';

const DOT_COLUMNS = [
  // 18 FOMC participants; 9 of 18 at or above 3.875 = the hike camp.
  {label: '2026', dots: [3.375, ...Array(8).fill(3.625), ...Array(6).fill(3.875), 4.125, 4.125, 4.375]},
  {label: '2027', dots: [3.125, 3.125, ...Array(4).fill(3.375), ...Array(5).fill(3.625), ...Array(4).fill(3.875), 4.125, 4.125, 4.375]},
  {label: 'LONGER RUN', dots: [...Array(3).fill(2.875), ...Array(9).fill(3.125), ...Array(4).fill(3.375), 3.625, 3.625]},
];

const FED_BODY =
  'Job gains have **accelerated** in recent months, and the unemployment rate has remained low. Inflation remains **somewhat elevated**. The Committee judges that upside risks to inflation have **increased**.';

export const ShotReel: React.FC<ShotReelProps> = ({headlineSrc}) => {
  const highlight = headlineSrc ? HL_REAL : HL_PLACEHOLDER;
  const aspect = headlineSrc ? REAL_ASPECT : 1.6;
  const cardWidth = headlineSrc ? 1400 : 1240;
  return (
    <AbsoluteFill style={{background: COLORS.canvas}}>
      {/* 1 · HeadlineCard: slam + magenta highlight on the number */}
      <Sequence durationInFrames={S.zoom} name="HeadlineCard">
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <HeadlineCard
            src={headlineSrc}
            source={HEADLINE.source}
            date={HEADLINE.date}
            headline={HEADLINE.headline}
            url={HEADLINE.url}
            width={cardWidth}
            aspect={aspect}
            highlight={highlight}
            highlightAt={64}
            appearFrame={4}
            index={0}
          />
        </AbsoluteFill>
      </Sequence>

      {/* 2 · ArticleZoom: same card, dive into the number */}
      <Sequence from={S.zoom} durationInFrames={S.bignum - S.zoom} name="ArticleZoom">
        <ArticleZoom
          src={headlineSrc}
          source={HEADLINE.source}
          date={HEADLINE.date}
          headline={HEADLINE.headline}
          url={HEADLINE.url}
          width={cardWidth}
          aspect={aspect}
          highlight={highlight}
          highlightAt={6}
          appearFrame={0}
          index={0}
          silent
          zoomAt={34}
        />
      </Sequence>

      {/* 3 · BigNumber: +172K odometer slam */}
      <Sequence from={S.bignum} durationInFrames={S.bars - S.bignum} name="BigNumber">
        <BigNumber
          value={172}
          prefix="+"
          suffix="K"
          label="Jobs added in May"
          sub="Consensus: +80K"
          kicker="JOBS DAY · JUN 5 2026"
          sfx="ka-ching"
        />
      </Sequence>

      {/* 4 · CompareBars: report vs consensus vs prior */}
      <Sequence from={S.bars} durationInFrames={S.dots - S.bars} name="CompareBars">
        <CompareBars
          title="Blowout."
          unit="Jobs added · thousands"
          rows={[
            {label: 'May payrolls', value: 172, display: '+172K', slot: 0},
            {label: 'Consensus', value: 80, display: '+80K', slot: 1},
            {label: 'Apr (revised)', value: 139, display: '+139K', slot: 2},
          ]}
          appearFrame={8}
          stagger={14}
        />
      </Sequence>

      {/* 5 · DotPlot: the June SEP dots, hike camp flashed */}
      <Sequence from={S.dots} durationInFrames={S.post - S.dots} name="DotPlot">
        <DotPlot
          columns={DOT_COLUMNS}
          title="FOMC dot plot · Jun 2026"
          subtitle="Each square = one participant · year-end target midpoint"
          highlight={{column: '2026', min: 3.875}}
          highlightAt={112}
          highlightLabel="9 of 18 see a hike"
          appearFrame={4}
        />
      </Sequence>

      {/* 6 · PostCard: re-typeset statement excerpt */}
      <Sequence from={S.post} durationInFrames={S.closer - S.post} name="PostCard">
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <PostCard
            name="Federal Reserve"
            handle="FOMC statement · June meeting"
            body={FED_BODY}
            timestamp="Jun 17 2026 · 2:00 PM ET"
            source="federalreserve.gov"
            accent={COLORS.magenta}
            appearFrame={6}
          />
        </AbsoluteFill>
      </Sequence>

      {/* 7 · closer */}
      <Sequence from={S.closer} durationInFrames={S.end - S.closer} name="Closer">
        <KineticTitle
          title="THE MARKET SAYS"
          accentWords={[1]}
          kicker="SHOT REEL · PILOT VOCABULARY"
          stagger={5}
        />
      </Sequence>

      {/* TickerWipe sweeps over every cut */}
      {[S.zoom, S.bignum, S.bars, S.dots, S.post, S.closer].map((cut, i) => (
        <Sequence key={cut} from={wipeAt(cut)} durationInFrames={WIPE_LEN} name={`Wipe ${i}`}>
          <TickerWipe text={TICKER} direction={i % 2 === 0 ? 'down' : 'up'} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
