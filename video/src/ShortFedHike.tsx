import React from 'react';
import {AbsoluteFill, Sequence, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig, Easing} from 'remotion';
import {Audio} from '@remotion/media';
import {EpisodeData} from './types';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from './theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from './fonts';
import {AssetManifest, resolveAsset, resolveMeme} from './assets';
import {ColdOpenStorm, HEADLINE_PCT, DOT_COLUMNS} from './episodes/fedhike';
import {BigNumber} from './components/BigNumber';
import {DotPlot} from './components/DotPlot';
import {HawkDoveMeter} from './components/HawkDoveMeter';
import {MemeCutaway} from './components/MemeCutaway';
import {OddsCounter} from './components/OddsCounter';
import {CRTOverlay} from './fx/CRTOverlay';
import {VHSGlitch} from './fx/VHSGlitch';
import {ProgressBar} from './fx/ProgressBar';

const FPS = 30;

/** Vertical cut beats (frames). ~45s total. */
const V = {
  coldOpen: 0, // 8s storm + counter
  jobs: 240, // 7s BigNumber
  dots: 450, // 9s DotPlot highlight
  meter: 720, // 8s HawkDoveMeter sweep
  meme: 960, // 5s this-is-fine
  slate: 1110, // 8s end slate
  end: 1350,
};

export const SHORT_FEDHIKE_DURATION = V.end;

const sfx = (name: string) => staticFile(`assets/sfx/${name}.wav`);

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

/** End slate: huge 51% + THE MARKET SAYS wordmark. */
const EndSlate: React.FC<{pct: number}> = ({pct}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame, fps, config: {damping: 12, stiffness: 240, mass: 0.8}, durationInFrames: 14});
  const rolled = interpolate(frame, [4, 40], [Math.max(0, pct - 20), pct], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const wordS = spring({
    frame: frame - 20,
    fps,
    config: {damping: 13, stiffness: 220, mass: 0.8},
    durationInFrames: 14,
  });
  return (
    <AbsoluteFill style={{background: COLORS.ink, justifyContent: 'center', alignItems: 'center', gap: 70}}>
      <div
        style={{
          fontFamily: MONO_FAMILY,
          fontWeight: 700,
          fontSize: 30,
          letterSpacing: '0.3em',
          color: COLORS.ink,
          background: COLORS.cream,
          border: pixelBorder(3),
          boxShadow: hardShadow(inkAlpha(0.5)),
          padding: '10px 24px 10px 32px',
        }}
      >
        FED HIKE BY DEC 31
      </div>
      <div
        style={{
          background: COLORS.card,
          border: pixelBorder(6),
          boxShadow: hardShadow(inkAlpha(0.6), 2),
          padding: '40px 54px',
          scale: String(0.7 + 0.3 * s),
          opacity: Math.min(1, s * 2.5),
        }}
      >
        <OddsCounter value={rolled} size={230} color={COLORS.ink} />
      </div>
      <div
        style={{
          fontFamily: PIXEL_FAMILY,
          fontSize: 52,
          lineHeight: 1.6,
          color: COLORS.ink,
          background: COLORS.gold,
          border: pixelBorder(5),
          boxShadow: hardShadow(inkAlpha(0.55), 1.4),
          padding: '26px 36px',
          textAlign: 'center',
          transform: `scale(${1.4 - 0.4 * Math.min(1, wordS)}) rotate(-2deg)`,
          opacity: Math.min(1, wordS * 2.5),
        }}
      >
        THE MARKET SAYS
      </div>
      <Sequence from={4} durationInFrames={30} name="Slate ka-ching" layout="none">
        <Audio src={sfx('ka-ching')} volume={0.4} />
      </Sequence>
    </AbsoluteFill>
  );
};

export type ShortFedHikeProps = {
  data: EpisodeData | null;
  assets?: AssetManifest | null;
} & Record<string, unknown>;

/**
 * ~45s 9:16 vertical cut: storm cold-open -> jobs stat slam -> dot plot ->
 * hawk/dove meter -> this-is-fine -> end slate. All components are
 * useVideoConfig-driven; DotPlot gets only two columns so 1080w stays legible.
 */
export const ShortFedHike: React.FC<ShortFedHikeProps> = ({data: _data, assets = null}) => {
  const storm = resolveAsset(assets, 'veo-fed-storm');
  const hawk = resolveAsset(assets, 'hawk-flap') ?? resolveAsset(assets, 'hawk');
  const dove = resolveAsset(assets, 'dove-flap') ?? resolveAsset(assets, 'dove');
  const thisIsFine = resolveMeme(assets, 'this is fine');

  return (
    <CRTOverlay intensity={0.55}>
      <AbsoluteFill style={{background: COLORS.canvas}}>
        <Sequence durationInFrames={V.jobs} name="Cold open: storm">
          <ColdOpenStorm storm={storm} pct={HEADLINE_PCT} question="ODDS THE FED HIKES BY DEC 31, 2026" />
        </Sequence>

        <Sequence from={V.jobs} durationInFrames={V.dots - V.jobs} name="+172K slam">
          <BigNumber
            value={172}
            prefix="+"
            suffix="K"
            label="Jobs added in May"
            sub="Consensus: +80K"
            kicker="JUN 5 2026 · JOBS DAY"
            sfx="ka-ching"
            size={150}
          />
        </Sequence>

        <Sequence from={V.dots} durationInFrames={V.meter - V.dots} name="Dot plot">
          <DotPlot
            columns={[DOT_COLUMNS[0], DOT_COLUMNS[1]]}
            title="FOMC DOT PLOT · JUN 2026"
            subtitle="Each square = one participant"
            highlight={{column: '2026', min: 3.875}}
            highlightAt={110}
            highlightLabel="9 of 18 see a hike"
            appearFrame={0}
          />
        </Sequence>

        <Sequence from={V.meter} durationInFrames={V.meme - V.meter} name="Fed vibes meter">
          <HawkDoveMeter
            value={0.67}
            from={0.12}
            sweepAt={18}
            title="FED VIBES"
            label="HIKE 2X AS LIKELY AS CUT"
            hawk={hawk}
            dove={dove}
            appearFrame={0}
          />
        </Sequence>

        <Sequence from={V.meme} durationInFrames={V.slate - V.meme} name="Meme react">
          <MemeCutaway
            asset={thisIsFine}
            src="assets/mascot/v2/panic.png"
            kind="image"
            caption="live look at the bond market"
            credit={thisIsFine ? 'meme desk' : 'mascot cam'}
          />
        </Sequence>

        <Sequence from={V.slate} durationInFrames={V.end - V.slate} name="End slate">
          <EndSlate pct={HEADLINE_PCT} />
        </Sequence>

        {/* hard cuts + a glitch into the slate */}
        {[V.jobs, V.dots, V.meter, V.meme].map((at) => (
          <CutFlash key={at} at={at} />
        ))}
        <Sequence from={V.slate - 8} durationInFrames={16} name="Glitch: slate">
          <VHSGlitch seed="short-slate" />
        </Sequence>

        <ProgressBar bottom={20} />
      </AbsoluteFill>
    </CRTOverlay>
  );
};
