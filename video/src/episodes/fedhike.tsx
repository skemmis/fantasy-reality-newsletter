import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {EpisodeData} from '../types';
import {sampleEpisode} from '../sample-data';
import {COLORS, tokens, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {MONO_FAMILY} from '../fonts';
import {
  ColdOpenStorm,
  CutFlash,
  DeskShot,
  LiveChip,
  LowerThird,
  PunchChip,
  StatCard,
  makeBeatClock,
  sfx,
  valueAt,
} from './shared';
import {KineticTitle} from '../components/KineticTitle';
import {MarketChartScene} from '../components/MarketChartScene';
import {MemeCutaway} from '../components/MemeCutaway';
import {EndCard} from '../components/EndCard';
import {OddsCounter} from '../components/OddsCounter';
import {VersusCard} from '../components/VersusCard';
import {PropPop} from '../components/PropPop';
import {SpriteLoop} from '../components/SpriteLoop';
import {HeadlineCard} from '../components/HeadlineCard';
import {ArticleZoom} from '../components/ArticleZoom';
import {BigNumber} from '../components/BigNumber';
import {CompareBars} from '../components/CompareBars';
import {DotPlot, DotPlotColumn} from '../components/DotPlot';
import {TickerWipe} from '../components/TickerWipe';
import {BreakingBanner} from '../components/BreakingBanner';
import {HawkDoveMeter} from '../components/HawkDoveMeter';
import {MoneyPrinterBeat} from '../components/MoneyPrinterBeat';
import {ChapterCard} from '../components/ChapterCard';
import {IntroSting} from '../components/IntroSting';
import {AssetEntry, AssetManifest, assetSrc, resolveAsset, resolveMeme} from '../assets';
import {CRTOverlay} from '../fx/CRTOverlay';
import {VHSGlitch} from '../fx/VHSGlitch';
import {FireBorder} from '../fx/FireBorder';
import {ProgressBar} from '../fx/ProgressBar';
import {useScreenShake} from '../fx/useScreenShake';

const FPS = 30;

/**
 * Collage recut (v4). BEATS mirrors public/episodes/fedhike/episode.yaml
 * (ids + `est` second estimates are unchanged so the VO wiring stays
 * drop-in). The chart is now a QUICK REFERENCE — three appearances
 * (fast tape ~11.5s, tariff window ~8.2s, hourly zoom 12s ≈ 32s of 136s);
 * everything else is desk shots, headline slams, stat cards, gauges,
 * memes and Veo b-roll.
 */
export const BEATS = [
  {id: 'cold-open', est: 10},
  {id: 'title', est: 3},
  {id: 'setup', est: 28},
  {id: 'the-tape', est: 14},
  {id: 'move-tariffs', est: 12},
  {id: 'move-jobs', est: 10},
  {id: 'move-fomc', est: 12},
  {id: 'meme-react', est: 3},
  {id: 'zoom', est: 12},
  {id: 'so-what', est: 20},
  {id: 'endcard', est: 12},
] as const;

const CLOCK = makeBeatClock(BEATS, FPS);
const beatStart = CLOCK.start;
const beatFrames = CLOCK.frames;

export const FEDHIKE_DURATION = CLOCK.duration;

/**
 * The episode's headline number, as narrated ("Fifty-one percent.") and in
 * the title. NOTE: data.json's last daily close is 55 — re-export data.json
 * and re-verify this constant the day VO is recorded (script.md TODO).
 */
export const HEADLINE_PCT = 51;

/** Zoom beat: hourly close-up dive + FireBorder as the line rips upward. */
const ZoomScene: React.FC<{
  data: EpisodeData;
  flame: AssetEntry | null;
}> = ({data, flame}) => {
  const FIRE_AT = 100;
  const shake = useScreenShake(FIRE_AT, {amp: 9, rotAmp: 0.8, durationInFrames: 16, seed: 'zoomfire'});
  return (
    <AbsoluteFill style={{background: COLORS.canvas}}>
      <AbsoluteFill style={{translate: shake.translate, rotate: shake.rotate}}>
        <MarketChartScene
          data={data}
          reveal={1}
          zoom={{
            window: {start: '2026-05-15T00:00:00Z', end: '2026-07-11T23:00:00Z'},
            atFrame: 12,
            durationInFrames: 70,
          }}
          showCursor
          showCounter
          showAnnotations
          curve="step"
        />
      </AbsoluteFill>
      <FireBorder flame={flame} appearFrame={FIRE_AT} glow={0.75} seed="zoom-fire" />
      <Sequence from={12} durationInFrames={30} name="Zoom whoosh" layout="none">
        <Audio src={sfx('whoosh-up')} volume={0.45} />
      </Sequence>
      <Sequence from={FIRE_AT} durationInFrames={22} name="Fire alarm" layout="none">
        <Audio src={sfx('alarm')} volume={0.3} />
      </Sequence>
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* Shared shot data                                                    */
/* ------------------------------------------------------------------ */

const TICKER_TAPE =
  'FEDHIKE-26DEC31 ▲51 · KXRATECUT-26 ▼25 · PAYROLLS +172K · CPI 4.1% · 10Y 4.42%';

export const JOBS_HEADLINE = {
  src: 'assets/headlines/jobs-cnbc.png',
  source: 'CNBC',
  date: 'JUN 5 2026',
  headline: 'U.S. payrolls rose by 172,000 in May, much more than expected',
  url: 'https://www.cnbc.com/2026/06/05/jobs-report-may-2026.html',
  aspect: 2880 / 1400,
  // Box over "172,000" — measured on the real 2880x1400 grab.
  highlight: {x: 0.482, y: 0.405, w: 0.155, h: 0.1},
};

export const FOMC_HEADLINE = {
  src: 'assets/headlines/fomc-cnbc.png',
  source: 'CNBC',
  date: 'JUN 17 2026',
  headline: 'Fed holds rates steady, pares down statement to remove cutting bias',
  url: 'https://www.cnbc.com/2026/06/17/fed-interest-rate-decision-june-2026.html',
  aspect: 2880 / 1400,
  // Box over "remove cutting bias".
  highlight: {x: 0.345, y: 0.49, w: 0.36, h: 0.09},
};

/** June 2026 SEP recreation; 9 of 18 at/above 3.875 in 2026 = the hike camp. */
export const DOT_COLUMNS: DotPlotColumn[] = [
  {label: '2026', dots: [3.375, ...Array(8).fill(3.625), ...Array(6).fill(3.875), 4.125, 4.125, 4.375]},
  {label: '2027', dots: [3.125, 3.125, ...Array(4).fill(3.375), ...Array(5).fill(3.625), ...Array(4).fill(3.875), 4.125, 4.125, 4.375]},
  {label: 'LONGER RUN', dots: [...Array(3).fill(2.875), ...Array(9).fill(3.125), ...Array(4).fill(3.375), 3.625, 3.625]},
];

/* ------------------------------------------------------------------ */
/* The episode                                                         */
/* ------------------------------------------------------------------ */

export const FedHikeEpisode: React.FC<{
  data: EpisodeData | null;
  /** Art manifest (public/assets/assets.json); null before it's generated. */
  assets?: AssetManifest | null;
  /** Opt-in retro screen treatment (scanlines/vignette/tears). */
  crt?: boolean;
  /** Opt-in pixel progress bar along the bottom edge. */
  progressBar?: boolean;
}> = ({data, assets = null, crt = false, progressBar = false}) => {
  const episode = data ?? sampleEpisode();
  const market = episode.markets[0];
  const times = useMemo(() => market.points.map((pt) => Date.parse(pt.t)), [market]);
  const tMin = times[0];
  const tMax = times[times.length - 1];

  // ---- art assets (all null-safe; components fall back to placeholders) ----
  const storm = resolveAsset(assets, 'veo-fed-storm');
  const newsdesk = resolveAsset(assets, 'newsdesk-set', 'backdrop');
  const talkLoop = resolveAsset(assets, 'mascot-talk');
  const deadpan = resolveAsset(assets, 'mascot-deadpan') ?? resolveAsset(assets, 'deadpan');
  const crying = resolveAsset(assets, 'mascot-crying');
  const panic = resolveAsset(assets, 'mascot-panic');
  const stingCoin =
    resolveAsset(assets, 'confetti-coin', 'loop') ?? resolveAsset(assets, 'coin-loop', 'loop');
  const hawk = resolveAsset(assets, 'hawk-flap') ?? resolveAsset(assets, 'hawk');
  const dove = resolveAsset(assets, 'dove-flap') ?? resolveAsset(assets, 'dove');
  const tariffCrate = resolveAsset(assets, 'tariff-crate', 'prop');
  const warsh = resolveAsset(assets, 'warsh', 'portrait') ?? resolveAsset(assets, 'warsh');
  const powell = resolveAsset(assets, 'powell', 'portrait') ?? resolveAsset(assets, 'powell');
  const powellWave = resolveAsset(assets, 'powell-wave');
  const bannerArt = resolveAsset(assets, 'breaking-banner');
  const siren = resolveAsset(assets, 'siren-loop', 'loop');
  const thisIsFine = resolveMeme(assets, 'this is fine');
  const flame = resolveAsset(assets, 'flame-loop', 'loop');
  const printer = resolveAsset(assets, 'veo-printer');
  const printerLoop = resolveAsset(assets, 'printer-loop', 'loop');
  const moneyShower = resolveAsset(assets, 'mascot-money-shower') ?? resolveAsset(assets, 'money-shower');
  const rateDial = resolveAsset(assets, 'rate-dial', 'prop');
  const cpiFlame = resolveAsset(assets, 'cpi-flame', 'prop');

  // ---- beat-local cut points (frames, local to each beat) ----
  const SETUP = {wipe: 550, meter: 558};
  const TAPE = {drawStart: 8, drawEnd: 188, wipe: 335, chapter: 345};
  const TARIFF = {meme: 150, back: 264};
  const JOBS = {big: 150, bars: 228};
  const FOMC = {dots: 105, banner: 185, versus: 255};
  const SOWHAT = {calm: 264};

  // ---- absolute frame anchors ----
  const S = {
    coldOpen: beatStart('cold-open'),
    title: beatStart('title'),
    setup: beatStart('setup'),
    tape: beatStart('the-tape'),
    tariffs: beatStart('move-tariffs'),
    jobs: beatStart('move-jobs'),
    fomc: beatStart('move-fomc'),
    meme: beatStart('meme-react'),
    zoom: beatStart('zoom'),
    soWhat: beatStart('so-what'),
    endcard: beatStart('endcard'),
  };
  const STING_FRAMES = 48; // IntroSting; KineticTitle takes the rest of `title`

  // ---- fast-tape odometer milestone ticks (value crosses multiples of 10) ----
  const tapeTicks = useMemo(() => {
    const fracAt = (f: number) =>
      interpolate(f, [TAPE.drawStart, TAPE.drawEnd], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      });
    const val = (f: number) => valueAt(market, tMin + fracAt(f) * (tMax - tMin), times);
    const out: number[] = [];
    let prev = Math.floor(val(TAPE.drawStart) / 10);
    let lastTick = -20;
    for (let f = TAPE.drawStart + 1; f <= TAPE.drawEnd; f++) {
      const d = Math.floor(val(f) / 10);
      if (d !== prev && f - lastTick >= 6) {
        out.push(f);
        lastTick = f;
      }
      prev = d;
    }
    return out.slice(0, 16);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [market, times, tMin, tMax]);

  // Hard cuts (2-frame flash + thud unless the incoming scene slams itself).
  const cuts: Array<{at: number; thud?: boolean}> = [
    {at: S.setup},
    {at: S.tape},
    {at: S.tariffs},
    {at: S.tariffs + TARIFF.meme},
    {at: S.tariffs + TARIFF.back},
    {at: S.jobs, thud: false}, // headline card thuds itself
    {at: S.jobs + JOBS.big, thud: false}, // BigNumber ka-chings itself
    {at: S.jobs + JOBS.bars, thud: false},
    {at: S.fomc, thud: false}, // headline card thuds itself
    {at: S.fomc + FOMC.dots},
    {at: S.fomc + FOMC.versus},
    {at: S.meme},
    {at: S.zoom},
    {at: S.soWhat},
    {at: S.endcard},
  ];

  // "Network bug" goblin: chart scenes only (fast tape + zoom).
  const bugWindows: Array<[number, number]> = [
    [S.tape, S.tape + TAPE.chapter],
    [S.zoom, S.soWhat],
  ];

  return (
    <CRTOverlay intensity={crt ? 0.55 : 0}>
    <AbsoluteFill style={{background: COLORS.canvas}}>
      {/* ---- cold-open: fed-storm b-roll + huge counter ---- */}
      <Sequence durationInFrames={beatFrames('cold-open')} name="Cold open: storm">
        <ColdOpenStorm storm={storm} pct={HEADLINE_PCT} />
      </Sequence>

      {/* ---- title: IntroSting then the kinetic wordmark ---- */}
      <Sequence from={S.title} durationInFrames={STING_FRAMES} name="Intro sting">
        <IntroSting goblin={deadpan} coin={stingCoin} kicker="A KALSHI MARKETS SHOW" />
      </Sequence>
      <Sequence
        from={S.title + STING_FRAMES}
        durationInFrames={beatFrames('title') - STING_FRAMES}
        name="Title"
      >
        <KineticTitle
          title="THE FED... HIKES?"
          accentWords={[2]}
          kicker="EP 01 · FED HIKE WATCH"
          stagger={5}
        />
        {[0, 5, 10].map((f) => (
          <Sequence key={f} from={f} durationInFrames={8} name={`Title blip ${f}`} layout="none">
            <Audio src={sfx('blip')} volume={0.35} />
          </Sequence>
        ))}
      </Sequence>

      {/* ---- setup: anchor goblin at the news desk -> stat cards -> meter ---- */}
      <Sequence from={S.setup} durationInFrames={SETUP.meter} name="Setup: news desk">
        <DeskShot backdrop={newsdesk} sprite={talkLoop} talk>
          <LiveChip />
          <LowerThird
            name="Anchor Goblin"
            sub="definitely a financial professional"
            appearFrame={26}
          />
          <div
            style={{
              position: 'absolute',
              left: '58%',
              top: '20%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 42,
            }}
          >
            <StatCard label="HIKE by Dec 31 2026" value="51%" accent={tokens.yes} appearFrame={330} />
            <StatCard label="CUT by Dec 31 2026" value="25%" accent={tokens.no} appearFrame={430} />
          </div>
          {/* volume gag chip as "$1.2M has settled on: coin flip" lands */}
          <PunchChip text={'$1.2M SAYS: COIN FLIP'} appearFrame={250} x="21%" y="30%" rotate={-3} fontSize={28} />
        </DeskShot>
        <Sequence from={4} durationInFrames={30} name="Setup whoosh" layout="none">
          <Audio src={sfx('whoosh-down')} volume={0.3} />
        </Sequence>
        {[330, 430].map((f) => (
          <Sequence key={f} from={f} durationInFrames={12} name={`Stat pop ${f}`} layout="none">
            <Audio src={sfx('pop-in')} volume={0.4} />
          </Sequence>
        ))}
      </Sequence>
      {/* hawk-dove meter sweeps as "twice as likely up as down" lands */}
      <Sequence
        from={S.setup + SETUP.meter}
        durationInFrames={beatFrames('setup') - SETUP.meter}
        name="Setup: fed vibes meter"
      >
        <HawkDoveMeter
          value={0.67}
          from={0.12}
          sweepAt={20}
          title="FED VIBES"
          label="HIKE 2X AS LIKELY AS CUT"
          hawk={hawk}
          dove={dove}
          appearFrame={0}
        />
      </Sequence>
      <Sequence from={S.setup + SETUP.wipe} durationInFrames={16} name="Setup wipe">
        <TickerWipe text={TICKER_TAPE} direction="down" />
      </Sequence>

      {/* ---- the-tape: QUICK REFERENCE — full tape in 6s, then chapter card ---- */}
      <Sequence from={S.tape} durationInFrames={TAPE.chapter} name="The Tape (quick)">
        <MarketChartScene
          data={episode}
          reveal={{startFrame: TAPE.drawStart, endFrame: TAPE.drawEnd, from: 0, to: 1}}
          showCursor
          showCounter
          showAnnotations
          curve="step"
        />
        {tapeTicks.map((f) => (
          <Sequence key={f} from={f} durationInFrames={6} name={`Tick ${f}`} layout="none">
            <Audio src={sfx('tick')} volume={0.3} />
          </Sequence>
        ))}
      </Sequence>
      <Sequence from={S.tape + TAPE.wipe} durationInFrames={16} name="Tape wipe">
        <TickerWipe text={TICKER_TAPE} direction="up" />
      </Sequence>
      <Sequence
        from={S.tape + TAPE.chapter}
        durationInFrames={beatFrames('the-tape') - TAPE.chapter}
        name="Chapter II"
      >
        <ChapterCard part={2} title="HOW WE GOT HERE" tape={TICKER_TAPE} />
      </Sequence>

      {/* ---- move-tariffs: April 2025 whipsaw window -> crying goblin -> "chose yes" ---- */}
      <Sequence from={S.tariffs} durationInFrames={TARIFF.meme} name="Tariff whipsaw">
        <MarketChartScene
          data={episode}
          reveal="2025-05-15T00:00:00Z"
          zoom={{
            window: {start: '2025-03-22T00:00:00Z', end: '2025-05-20T00:00:00Z'},
            atFrame: 2,
            durationInFrames: 24,
          }}
          showCursor
          showCounter
          showAnnotations
          curve="step"
        />
        <Sequence from={34} durationInFrames={TARIFF.meme - 34} name="Prop: tariff crate">
          <PropPop asset={tariffCrate} label="TARIFFS" x="76%" y="26%" size={230} wobble />
        </Sequence>
        <Sequence from={2} durationInFrames={24} name="Tariff alarm" layout="none">
          <Audio src={sfx('alarm')} volume={0.32} />
        </Sequence>
      </Sequence>
      <Sequence
        from={S.tariffs + TARIFF.meme}
        durationInFrames={TARIFF.back - TARIFF.meme}
        name="Goblin cries"
      >
        <MemeCutaway
          asset={crying}
          caption="prices say HIKE. growth says CUT."
          credit="goblin cam"
        />
      </Sequence>
      <Sequence
        from={S.tariffs + TARIFF.back}
        durationInFrames={beatFrames('move-tariffs') - TARIFF.back}
        name="Market chose yes"
      >
        <MarketChartScene
          data={episode}
          reveal="2025-06-05T00:00:00Z"
          window={{start: '2025-03-22T00:00:00Z', end: '2025-06-10T00:00:00Z'}}
          showCursor
          showCounter
          showAnnotations
          curve="step"
        />
        <PunchChip text="THE MARKET CHOSE: YES" appearFrame={16} x="62%" y="72%" rotate={-2} />
      </Sequence>

      {/* ---- move-jobs: headline slam -> 172,000 zoom -> BigNumber -> bars ---- */}
      <Sequence from={S.jobs} durationInFrames={JOBS.big} name="Jobs headline zoom">
        <ArticleZoom
          src={JOBS_HEADLINE.src}
          source={JOBS_HEADLINE.source}
          date={JOBS_HEADLINE.date}
          headline={JOBS_HEADLINE.headline}
          url={JOBS_HEADLINE.url}
          width={1400}
          aspect={JOBS_HEADLINE.aspect}
          highlight={JOBS_HEADLINE.highlight}
          highlightAt={40}
          appearFrame={2}
          index={0}
          zoomAt={78}
          maxScale={3.2}
        />
      </Sequence>
      <Sequence from={S.jobs + JOBS.big} durationInFrames={JOBS.bars - JOBS.big} name="+172K slam">
        <BigNumber
          value={172}
          prefix="+"
          suffix="K"
          label="Jobs added in May"
          sub="Consensus: +80K"
          kicker="JUN 5 2026 · JOBS DAY"
          sfx="ka-ching"
        />
      </Sequence>
      <Sequence
        from={S.jobs + JOBS.bars}
        durationInFrames={beatFrames('move-jobs') - JOBS.bars}
        name="Jobs vs consensus"
      >
        <CompareBars
          title="Blowout."
          unit="Jobs added · thousands"
          rows={[
            {label: 'May payrolls', value: 172, display: '+172K', slot: 0},
            {label: 'Consensus', value: 80, display: '+80K', slot: 1},
            {label: 'Apr (revised)', value: 139, display: '+139K', slot: 2},
          ]}
          appearFrame={2}
          stagger={10}
        />
      </Sequence>

      {/* ---- move-fomc: headline -> dot plot + BREAKING -> Warsh v Powell ---- */}
      <Sequence from={S.fomc} durationInFrames={FOMC.dots} name="FOMC headline">
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <HeadlineCard
            src={FOMC_HEADLINE.src}
            source={FOMC_HEADLINE.source}
            date={FOMC_HEADLINE.date}
            headline={FOMC_HEADLINE.headline}
            url={FOMC_HEADLINE.url}
            width={1400}
            aspect={FOMC_HEADLINE.aspect}
            highlight={FOMC_HEADLINE.highlight}
            highlightAt={45}
            appearFrame={2}
            index={1}
          />
        </AbsoluteFill>
      </Sequence>
      <Sequence from={S.fomc + FOMC.dots} durationInFrames={FOMC.versus - FOMC.dots} name="Dot plot">
        <DotPlot
          columns={DOT_COLUMNS}
          title="FOMC DOT PLOT · JUN 2026"
          subtitle="Each square = one participant · year-end target midpoint"
          highlight={{column: '2026', min: 3.875}}
          highlightAt={62}
          highlightLabel="9 of 18 see a hike"
          appearFrame={0}
        />
      </Sequence>
      <Sequence from={S.fomc + FOMC.banner} durationInFrames={FOMC.versus - FOMC.banner} name="Breaking banner">
        <BreakingBanner
          banner={bannerArt}
          siren={siren}
          text="BREAKING"
          sub="DOTS FLIP HAWKISH"
          outAfter={52}
          seed="dots-breaking"
        />
      </Sequence>
      <Sequence
        from={S.fomc + FOMC.versus}
        durationInFrames={beatFrames('move-fomc') - FOMC.versus}
        name="Versus: Warsh v Powell"
      >
        <VersusCard
          left={{asset: warsh, label: 'WARSH', stat: '9 OF 18 SEE A HIKE'}}
          right={{asset: powell, label: 'POWELL', stat: 'CUT 3x IN 2025'}}
        />
      </Sequence>

      {/* ---- meme-react ---- */}
      <Sequence from={S.meme} durationInFrames={beatFrames('meme-react')} name="Meme react">
        <MemeCutaway
          asset={thisIsFine}
          src="assets/mascot/v2/panic.png"
          kind="image"
          caption="live look at the bond market"
          credit={thisIsFine ? 'meme desk' : 'mascot cam'}
        />
      </Sequence>

      {/* ---- zoom: hourly close-up + fire ---- */}
      <Sequence from={S.zoom} durationInFrames={beatFrames('zoom')} name="Zoom + fire">
        <ZoomScene data={episode} flame={flame} />
      </Sequence>

      {/* ---- so-what: money printer gag -> calm desk ---- */}
      <Sequence from={S.soWhat} durationInFrames={SOWHAT.calm} name="What the future costs">
        <MoneyPrinterBeat
          printer={printer}
          coin={stingCoin}
          printerLoop={printerLoop}
          goblin={moneyShower}
          caption="WHAT THE FUTURE COSTS"
          coinsAt={14}
          seed="sowhat-printer"
        />
      </Sequence>
      <Sequence
        from={S.soWhat + SOWHAT.calm}
        durationInFrames={beatFrames('so-what') - SOWHAT.calm}
        name="Calm desk"
      >
        <DeskShot backdrop={newsdesk} sprite={deadpan} talk={false} spriteSize={600} spriteTop={205}>
          <LowerThird name="Anchor Goblin" sub="certainty costs extra" appearFrame={16} />
          <Sequence from={60} durationInFrames={170} name="Prop: rate dial">
            <PropPop asset={rateDial} label="RATE DIAL" x="13%" y="30%" size={190} wobble />
          </Sequence>
          <Sequence from={140} durationInFrames={170} name="Prop: cpi flame">
            <PropPop asset={cpiFlame} label="CPI" x="87%" y="28%" size={170} wobble />
          </Sequence>
          <PunchChip
            text={'THE FED\'S JOB IS TO BE BORING.'}
            appearFrame={250}
            x="50%"
            y="24%"
            rotate={-1.5}
            fontSize={30}
          />
        </DeskShot>
      </Sequence>

      {/* ---- endcard: resolution watch + Powell waves goodbye ---- */}
      <Sequence from={S.endcard} durationInFrames={beatFrames('endcard')} name="End card">
        <EndCard
          entries={[
            {
              market: 'FED HIKE BY DEC 31, 2026',
              call: `covered @ ${HEADLINE_PCT}%`,
              status: 'OPEN',
            },
          ]}
        />
        <Sequence from={90} durationInFrames={beatFrames('endcard') - 90} name="Powell waves">
          <PowellWave asset={powellWave} />
        </Sequence>
        <Sequence from={10} durationInFrames={30} name="Ka-ching" layout="none">
          <Audio src={sfx('ka-ching')} volume={0.4} />
        </Sequence>
      </Sequence>

      {/* "network bug" goblin over the chart scenes */}
      {bugWindows.map(([from, to]) => (
        <Sequence key={from} from={from} durationInFrames={to - from} name={`Network bug ${from}`}>
          <AbsoluteFill style={{pointerEvents: 'none'}}>
            <div style={{position: 'absolute', right: 34, bottom: 148, opacity: 0.72}}>
              <SpriteLoop
                asset={panic ?? deadpan}
                fallbackSrc="assets/mascot/v2/deadpan-alpha.png"
                fps={6}
                size={120}
              />
            </div>
          </AbsoluteFill>
        </Sequence>
      ))}

      {/* CAPTIONS PLACEHOLDER: no VO yet. Once vo/words.json exists, mount
          <CaptionLayer timeline={words} /> across the narrated beats. */}

      {/* hard cuts */}
      {cuts.map((c) => (
        <CutFlash key={c.at} at={c.at} thud={c.thud} />
      ))}

      {/* VHS glitch bursts: cold-open -> sting, printer -> calm desk */}
      <Sequence from={S.title - 15} durationInFrames={30} name="Glitch: open">
        <VHSGlitch seed="open" />
      </Sequence>
      <Sequence from={S.soWhat + SOWHAT.calm - 6} durationInFrames={12} name="Glitch: calm">
        <VHSGlitch seed="calm" />
      </Sequence>

      {/* opt-in episode progress bar along the bottom edge */}
      {progressBar ? <ProgressBar bottom={24} /> : null}
    </AbsoluteFill>
    </CRTOverlay>
  );
};

/** Powell waving goodbye in the endcard corner. */
const PowellWave: React.FC<{asset: AssetEntry | null}> = ({asset}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({
    frame,
    fps,
    config: {damping: 12, stiffness: 220, mass: 0.8},
    durationInFrames: 14,
  });
  // Gentle stepped wave bob.
  const bob = Math.floor(frame / 8) % 2 === 0 ? 0 : -6;
  if (!asset) return null;
  return (
    <AbsoluteFill style={{pointerEvents: 'none'}}>
      <div
        style={{
          position: 'absolute',
          left: 46,
          bottom: -12,
          translate: `0px ${((1 - s) * 320 + bob).toFixed(1)}px`,
        }}
      >
        <Img
          src={assetSrc(asset.alpha ?? asset.file)}
          style={{width: 300, height: 300, objectFit: 'contain'}}
        />
        <div
          style={{
            position: 'absolute',
            left: 190,
            top: -34,
            fontFamily: MONO_FAMILY,
            fontWeight: 700,
            fontSize: 21,
            color: COLORS.ink,
            background: COLORS.cream,
            border: pixelBorder(3),
            boxShadow: hardShadow(inkAlpha(0.25)),
            padding: '8px 14px',
            rotate: '-3deg',
            whiteSpace: 'nowrap',
          }}
        >
          THANKS FOR THE MEMORIES
        </div>
      </div>
      <Sequence from={0} durationInFrames={10} name="Wave blip" layout="none">
        <Audio src={sfx('blip')} volume={0.32} />
      </Sequence>
    </AbsoluteFill>
  );
};
