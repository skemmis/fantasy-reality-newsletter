import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import {Audio} from '@remotion/media';
import {EpisodeData, Market} from '../types';
import {sampleEpisode} from '../sample-data';
import {COLORS, tokens, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';
import {KineticTitle} from '../components/KineticTitle';
import {MarketChartScene} from '../components/MarketChartScene';
import {MemeCutaway} from '../components/MemeCutaway';
import {EndCard} from '../components/EndCard';
import {OddsCounter} from '../components/OddsCounter';
import {VersusCard} from '../components/VersusCard';
import {PropPop} from '../components/PropPop';
import {SpriteLoop} from '../components/SpriteLoop';
import {AssetManifest, resolveAsset, resolveMeme} from '../assets';
import {annotationFracs, buildBeatReveal} from '../reveal';

const FPS = 30;

/**
 * BEATS mirrors public/episodes/fedhike/episode.yaml (scene order + `est`
 * second estimates). NOTE: these timings are pre-VO estimates — once
 * vo/words.json exists, derive each beat's start from the start of its
 * first narration line and feed the real WordsTimeline into CaptionLayer.
 *
 * `cut` marks a hard scene cut (2-frame white flash + thud). The four
 * chart move-beats run as ONE continuous MarketChartScene so the line
 * draws through them without resets; their ids are kept for bookkeeping.
 */
export const BEATS = [
  {id: 'cold-open', est: 10, cut: false},
  {id: 'title', est: 3, cut: true},
  {id: 'setup', est: 28, cut: true},
  {id: 'the-tape', est: 14, cut: true},
  {id: 'move-tariffs', est: 12, cut: false},
  {id: 'move-jobs', est: 10, cut: false},
  {id: 'move-fomc', est: 12, cut: false},
  {id: 'meme-react', est: 3, cut: true},
  {id: 'zoom', est: 12, cut: true},
  {id: 'so-what', est: 20, cut: true},
  {id: 'endcard', est: 12, cut: true},
] as const;

type BeatId = (typeof BEATS)[number]['id'];

const beatStart = (id: BeatId): number => {
  let at = 0;
  for (const b of BEATS) {
    if (b.id === id) return at;
    at += b.est * FPS;
  }
  return at;
};
const beatFrames = (id: BeatId): number =>
  (BEATS.find((b) => b.id === id)?.est ?? 0) * FPS;

export const FEDHIKE_DURATION = BEATS.reduce((a, b) => a + b.est * FPS, 0);

// The tape block: the-tape + the three move beats, one continuous scene.
const TAPE_START = beatStart('the-tape');
const TAPE_FRAMES =
  beatFrames('the-tape') +
  beatFrames('move-tariffs') +
  beatFrames('move-jobs') +
  beatFrames('move-fomc');

const sfx = (name: string) => staticFile(`assets/sfx/${name}.wav`);

/** Linear-interpolated series value at time t (ms). */
const valueAt = (market: Market, tms: number, times: number[]): number => {
  const pts = market.points;
  if (tms <= times[0]) return pts[0].p;
  if (tms >= times[times.length - 1]) return pts[pts.length - 1].p;
  let lo = 0;
  let hi = times.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= tms) lo = mid;
    else hi = mid;
  }
  const f = (tms - times[lo]) / (times[hi] - times[lo]);
  return pts[lo].p + f * (pts[hi].p - pts[lo].p);
};

/** 2-frame hard white flash + thud at a cut point. */
const CutFlash: React.FC<{at: number}> = ({at}) => (
  <>
    <Sequence from={at} durationInFrames={2} name="Cut flash">
      <AbsoluteFill style={{background: '#ffffff'}} />
    </Sequence>
    <Sequence from={at} durationInFrames={14} name="Cut thud" layout="none">
      <Audio src={sfx('thud')} volume={0.45} />
    </Sequence>
  </>
);

/** Setup-beat stat card ("HIKE by Dec 31 2026 — 51%"). */
const StatCard: React.FC<{
  label: string;
  value: string;
  accent: string;
  appearFrame: number;
}> = ({label, value, accent, appearFrame}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < appearFrame) return null;
  const s = spring({
    frame: frame - appearFrame,
    fps,
    config: {damping: 12, stiffness: 240, mass: 0.7},
    durationInFrames: 12,
  });
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: COLORS.cream,
        border: pixelBorder(4),
        boxShadow: hardShadow(inkAlpha(0.25), 1.4),
        scale: String(0.7 + 0.3 * s),
        opacity: s,
      }}
    >
      <span
        style={{
          fontFamily: PIXEL_FAMILY,
          fontSize: 44,
          color: COLORS.card,
          background: accent,
          padding: '20px 22px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: MONO_FAMILY,
          fontWeight: 700,
          fontSize: 30,
          color: COLORS.ink,
          padding: '20px 26px',
          display: 'flex',
          alignItems: 'center',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
    </div>
  );
};

/** Cold open: dimmed chart card, line hidden, huge odometer with the last price. */
const ColdOpen: React.FC<{data: EpisodeData; lastPrice: number}> = ({data, lastPrice}) => {
  const frame = useCurrentFrame();
  const rolled = interpolate(frame, [8, 64], [Math.max(0, lastPrice - 28), lastPrice], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  return (
    <AbsoluteFill>
      <MarketChartScene
        data={data}
        reveal={0}
        showCursor={false}
        showCounter={false}
        showAnnotations={false}
        curve="step"
      />
      {/* dim the card; the counter is the only thing alive */}
      <AbsoluteFill style={{background: 'rgba(233, 229, 221, 0.62)'}} />
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', gap: 44}}>
        <div
          style={{
            fontFamily: MONO_FAMILY,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: '0.32em',
            color: COLORS.mutedText,
          }}
        >
          RIGHT NOW ON KALSHI
        </div>
        <OddsCounter value={rolled} size={230} color={COLORS.ink} />
        <div
          style={{
            fontFamily: PIXEL_FAMILY,
            fontSize: 30,
            lineHeight: 1.7,
            color: COLORS.ink,
            background: COLORS.gold,
            border: pixelBorder(4),
            boxShadow: hardShadow(inkAlpha(0.25), 1.2),
            padding: '18px 30px',
            maxWidth: '72%',
            textAlign: 'center',
          }}
        >
          ODDS THE FED HIKES BY DEC 31, 2026
        </div>
      </AbsoluteFill>
      {[20, 34, 48].map((f) => (
        <Sequence key={f} from={f} durationInFrames={8} name={`Roll tick ${f}`} layout="none">
          <Audio src={sfx('tick')} volume={0.3} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/** So-what: full tape, frozen, with a slow ken-burns-ish drift. */
const SoWhat: React.FC<{data: EpisodeData}> = ({data}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  return (
    <AbsoluteFill style={{overflow: 'hidden', background: COLORS.canvas}}>
      <AbsoluteFill
        style={{
          scale: String(interpolate(frame, [0, durationInFrames], [1.02, 1.09])),
          translate: `${interpolate(frame, [0, durationInFrames], [10, -26])}px ${interpolate(frame, [0, durationInFrames], [6, -14])}px`,
        }}
      >
        <MarketChartScene
          data={data}
          reveal={1}
          showCursor
          showCounter
          showAnnotations
          curve="step"
        />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

export const FedHikeEpisode: React.FC<{
  data: EpisodeData | null;
  /** Art manifest (public/assets/assets.json); null before it's generated. */
  assets?: AssetManifest | null;
}> = ({data, assets = null}) => {
  const episode = data ?? sampleEpisode();
  const market = episode.markets[0];
  const last = market.points[market.points.length - 1];
  const times = useMemo(() => market.points.map((pt) => Date.parse(pt.t)), [market]);
  const tMin = times[0];
  const tMax = times[times.length - 1];

  // ---- the tape block's beat-paced reveal plan (also drives SFX cues) ----
  const fomcEnd = (Date.parse('2026-06-20T00:00:00Z') - tMin) / (tMax - tMin);
  const revealTo = Math.min(1, Math.max(0.3, fomcEnd));
  const tapeSpec = {
    beats: true as const,
    startFrame: 10,
    // ~4 annotation holds of 3s each; the rest is drawing time.
    drawFrames: TAPE_FRAMES - 10 - 4 * 90 - 60,
    holdFrames: 90,
    to: revealTo,
  };
  const tapePlan = useMemo(
    () =>
      buildBeatReveal(
        annotationFracs(
          episode.annotations
            .filter((a) => !a.market || a.market === market.ticker)
            .map((a) => a.t),
          tMin,
          tMax,
        ),
        tapeSpec,
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [episode, market.ticker, tMin, tMax],
  );

  // Counter milestone ticks: frames (tape-local) where the odometer
  // crosses a multiple of 10.
  const tickFrames = useMemo(() => {
    const out: number[] = [];
    const val = (f: number) => valueAt(market, tMin + tapePlan.fracAt(f) * (tMax - tMin), times);
    let prev = Math.floor(val(0) / 10);
    let lastTick = -20;
    for (let f = 1; f <= TAPE_FRAMES; f++) {
      const d = Math.floor(val(f) / 10);
      if (d !== prev && f - lastTick >= 12) {
        out.push(f);
        lastTick = f;
      }
      prev = d;
    }
    return out.slice(0, 24);
  }, [market, times, tMin, tMax, tapePlan]);

  const zoomWindow = {start: '2026-05-15T00:00:00Z', end: '2026-07-11T23:00:00Z'};

  // ---- art assets (all resolve to null until assets.json is generated;
  //      components then render their house placeholders) ----
  const warsh = resolveAsset(assets, 'warsh', 'portrait') ?? resolveAsset(assets, 'warsh');
  const powell = resolveAsset(assets, 'powell', 'portrait') ?? resolveAsset(assets, 'powell');
  const thisIsFine = resolveMeme(assets, 'this is fine');
  const rateDial = resolveAsset(assets, 'rate-dial', 'prop') ?? resolveAsset(assets, 'rate-dial');
  const cpiFlame = resolveAsset(assets, 'cpi-flame', 'prop') ?? resolveAsset(assets, 'cpi-flame');
  const goblinBug =
    resolveAsset(assets, 'goblin-deadpan') ?? resolveAsset(assets, 'deadpan');

  // move-fomc face-off: cut in after the last annotation lands, hold ~3s,
  // hard-cut back to the chart. (Tape-local frames.)
  const VS_FRAMES = 90;
  const fomcStop = tapePlan.stops[tapePlan.stops.length - 1];
  const vsFrom = Math.min(
    fomcStop ? Math.round(fomcStop.startFrame) + 45 : TAPE_FRAMES - VS_FRAMES - 30,
    TAPE_FRAMES - VS_FRAMES - 10,
  );

  // "Network bug" goblin watermark: visible through chart scenes only —
  // skips title, the VS cutaway, meme-react and the endcard.
  const bugWindows: Array<[number, number]> = [
    [0, beatFrames('cold-open')],
    [beatStart('setup'), TAPE_START + vsFrom],
    [TAPE_START + vsFrom + VS_FRAMES, beatStart('meme-react')],
    [beatStart('zoom'), beatStart('endcard')],
  ];

  return (
    <AbsoluteFill style={{background: COLORS.canvas}}>
      {/* ---- cold-open: dimmed card, huge counter, line hidden ---- */}
      <Sequence durationInFrames={beatFrames('cold-open')} name="Cold open">
        <ColdOpen data={episode} lastPrice={last.p} />
      </Sequence>

      {/* ---- title ---- */}
      <Sequence from={beatStart('title')} durationInFrames={beatFrames('title')} name="Title">
        <KineticTitle
          title="THE MARKET SAYS"
          accentWords={[1]}
          kicker="EP 01 · FED HIKE WATCH"
          stagger={5}
        />
        {[0, 5, 10].map((f) => (
          <Sequence key={f} from={f} durationInFrames={8} name={`Title blip ${f}`} layout="none">
            <Audio src={sfx('blip')} volume={0.35} />
          </Sequence>
        ))}
      </Sequence>

      {/* ---- setup: chart at low reveal + the two stat cards ---- */}
      <Sequence from={beatStart('setup')} durationInFrames={beatFrames('setup')} name="Setup">
        <MarketChartScene
          data={episode}
          reveal={{startFrame: 6, endFrame: 76, from: 0, to: 0.15}}
          showCursor
          showCounter
          showAnnotations={false}
          curve="step"
        />
        <AbsoluteFill
          style={{
            justifyContent: 'center',
            alignItems: 'flex-start',
            paddingLeft: '44%',
            gap: 46,
          }}
        >
          <StatCard
            label="HIKE by Dec 31 2026"
            value="51%"
            accent={tokens.yes}
            appearFrame={100}
          />
          <StatCard label="CUT by Dec 31 2026" value="25%" accent={tokens.no} appearFrame={160} />
        </AbsoluteFill>
        <Sequence from={4} durationInFrames={30} name="Setup whoosh" layout="none">
          <Audio src={sfx('whoosh-down')} volume={0.3} />
        </Sequence>
        {[100, 160].map((f) => (
          <Sequence key={f} from={f} durationInFrames={12} name={`Stat pop ${f}`} layout="none">
            <Audio src={sfx('pop-in')} volume={0.4} />
          </Sequence>
        ))}
      </Sequence>

      {/* ---- the-tape -> move-tariffs -> move-jobs -> move-fomc ----
           One continuous beat-paced draw: ease fast to each annotation,
           hold 3s while its callout is active, continue. */}
      <Sequence from={TAPE_START} durationInFrames={TAPE_FRAMES} name="The Tape (moves)">
        <MarketChartScene
          data={episode}
          reveal={tapeSpec}
          showCursor
          showCounter
          showAnnotations
          curve="step"
        />
        {/* annotation pops: alarm for the tariff whipsaw, pop-in for the rest */}
        {tapePlan.stops.map((s, i) => (
          <Sequence
            key={i}
            from={Math.round(s.startFrame)}
            durationInFrames={20}
            name={`Annotation sfx ${i}`}
            layout="none"
          >
            <Audio src={sfx(i === 0 ? 'alarm' : 'pop-in')} volume={i === 0 ? 0.35 : 0.45} />
          </Sequence>
        ))}
        {/* odometer milestone ticks */}
        {tickFrames.map((f) => (
          <Sequence key={f} from={f} durationInFrames={6} name={`Tick ${f}`} layout="none">
            <Audio src={sfx('tick')} volume={0.3} />
          </Sequence>
        ))}
        {/* move-fomc face-off: WARSH vs POWELL, then back to the chart */}
        <Sequence from={vsFrom} durationInFrames={VS_FRAMES} name="Versus: Warsh v Powell">
          <VersusCard
            left={{asset: warsh, label: 'WARSH', stat: '9 OF 18 SEE A HIKE'}}
            right={{asset: powell, label: 'POWELL', stat: 'CUT 3x IN 2025'}}
          />
        </Sequence>
        {/* hard 2-frame flashes bracketing the cutaway */}
        <CutFlash at={vsFrom} />
        <Sequence from={vsFrom + VS_FRAMES} durationInFrames={2} name="VS out flash">
          <AbsoluteFill style={{background: '#ffffff'}} />
        </Sequence>
      </Sequence>

      {/* ---- meme-react ---- */}
      <Sequence
        from={beatStart('meme-react')}
        durationInFrames={beatFrames('meme-react')}
        name="Meme react"
      >
        <MemeCutaway
          asset={thisIsFine}
          src="assets/mascot/v2/panic.png"
          kind="image"
          caption="live look at the bond market"
          credit={thisIsFine ? 'meme desk' : 'mascot cam'}
        />
      </Sequence>

      {/* ---- zoom: last two months ---- */}
      <Sequence from={beatStart('zoom')} durationInFrames={beatFrames('zoom')} name="Zoom">
        <MarketChartScene
          data={episode}
          reveal={1}
          zoom={{window: zoomWindow, atFrame: 12, durationInFrames: 70}}
          showCursor
          showCounter
          showAnnotations
          curve="step"
        />
        <Sequence from={12} durationInFrames={30} name="Zoom whoosh" layout="none">
          <Audio src={sfx('whoosh-up')} volume={0.45} />
        </Sequence>
      </Sequence>

      {/* ---- so-what: full tape, slow drift ---- */}
      <Sequence from={beatStart('so-what')} durationInFrames={beatFrames('so-what')} name="So what">
        <SoWhat data={episode} />
        {/* mid-beat prop pops at the chart's edges — small, off the line */}
        <Sequence from={170} durationInFrames={220} name="Prop: rate dial">
          <PropPop asset={rateDial} label="RATE DIAL" x="8%" y="77%" size={140} wobble />
        </Sequence>
        <Sequence from={300} durationInFrames={200} name="Prop: cpi flame">
          <PropPop asset={cpiFlame} label="CPI" x="94%" y="33%" size={120} wobble />
        </Sequence>
      </Sequence>

      {/* ---- endcard: resolution watch ---- */}
      <Sequence from={beatStart('endcard')} durationInFrames={beatFrames('endcard')} name="End card">
        <EndCard
          entries={[
            {
              market: 'FED HIKE BY DEC 31, 2026',
              call: `covered @ ${Math.round(last.p)}%`,
              status: 'OPEN',
            },
          ]}
        />
        <Sequence from={10} durationInFrames={30} name="Ka-ching" layout="none">
          <Audio src={sfx('ka-ching')} volume={0.4} />
        </Sequence>
      </Sequence>

      {/* "network bug" goblin watermark over the chart scenes */}
      {bugWindows.map(([from, to]) => (
        <Sequence key={from} from={from} durationInFrames={to - from} name={`Network bug ${from}`}>
          <AbsoluteFill style={{pointerEvents: 'none'}}>
            {/* Sits above the footer band (pad 81 + footer 54 = 135px from
                the bottom at 1080p) so it never crowds the disclaimer. */}
            <div style={{position: 'absolute', right: 34, bottom: 148, opacity: 0.72}}>
              <SpriteLoop
                asset={goblinBug}
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

      {/* hard cuts: 2-frame white flash + thud at each scene boundary */}
      {BEATS.filter((b) => b.cut).map((b) => (
        <CutFlash key={b.id} at={beatStart(b.id)} />
      ))}
    </AbsoluteFill>
  );
};
