import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {COLORS} from '../theme/theme';

/**
 * 4-6 frame VHS transition burst. Mount as a <Sequence> spanning a hard
 * cut (like CutFlash / TickerWipe) — it fully covers the swap:
 *
 *   <Sequence from={cut - 3} durationInFrames={6}><VHSGlitch /></Sequence>
 *
 * Layers: white-noise static (deterministic feTurbulence seed per frame),
 * horizontal slice bars shoved left/right, red/cyan chroma-split bands, and
 * a 1-frame white pop at the midpoint. glitch.wav + static.wav fire at
 * frame 0. All randomness comes from remotion's seeded random().
 */
export interface VHSGlitchProps {
  /** Extra seed so simultaneous glitches differ. */
  seed?: string | number;
  sfxOn?: boolean;
  /** 0-1 overall strength. Default 1 — it IS the transition. */
  intensity?: number;
}

const SLICES = 7;

export const VHSGlitch: React.FC<VHSGlitchProps> = ({seed = 'vhs', sfxOn = true, intensity = 1}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();

  // Triangle envelope across the burst: 0 -> 1 (mid) -> 0.
  const mid = (durationInFrames - 1) / 2;
  const env = Math.max(0, 1 - Math.abs(frame - mid) / (mid + 0.0001)) * intensity;
  const r = (salt: string) => random(`${seed}-${frame}-${salt}`);

  // Displaced slice bars: deterministic per frame.
  const slices = Array.from({length: SLICES}, (_, i) => {
    const y = r(`y${i}`) * height;
    const h = (0.015 + r(`h${i}`) * 0.06) * height;
    const dx = (r(`dx${i}`) * 2 - 1) * width * 0.12 * env;
    const tone = r(`t${i}`);
    const color =
      tone < 0.4 ? COLORS.ink : tone < 0.7 ? COLORS.cream : tone < 0.88 ? COLORS.magenta : '#ffffff';
    return {y, h, dx, color, alpha: 0.5 + 0.45 * r(`a${i}`)};
  });

  // Chroma-split bands: one red, one cyan, opposite shear.
  const chromaY = r('cy') * height * 0.8;
  const chromaH = height * (0.1 + 0.14 * r('ch'));
  const chromaDx = (10 + 26 * r('cd')) * env;

  const whitePop = Math.abs(frame - mid) < 0.75;

  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {/* dark scrim so the noise + slices read against light scenes */}
      <AbsoluteFill style={{background: `rgba(23, 18, 43, ${(0.3 * env).toFixed(3)})`}} />
      {/* static: deterministic turbulence, new seed every frame */}
      <svg
        width={width}
        height={height}
        style={{position: 'absolute', inset: 0, opacity: 0.68 * env + 0.25 * intensity}}
      >
        <filter id="vhs-noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.82"
            numOctaves={2}
            seed={Math.floor(r('noise') * 1000)}
            stitchTiles="stitch"
          />
          <feColorMatrix type="saturate" values="0" />
          <feComponentTransfer>
            <feFuncA type="linear" slope={1.6} intercept={-0.2} />
          </feComponentTransfer>
        </filter>
        <rect width="100%" height="100%" filter="url(#vhs-noise)" />
      </svg>
      {/* shoved slice bars */}
      {slices.map((s, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: -width * 0.2 + s.dx,
            width: width * 1.4,
            top: s.y,
            height: s.h,
            background: s.color,
            opacity: s.alpha * env,
          }}
        />
      ))}
      {/* chroma split */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: chromaY,
          height: chromaH,
          translate: `${chromaDx.toFixed(1)}px 0px`,
          background: 'rgba(255, 30, 60, 0.35)',
          mixBlendMode: 'screen',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: chromaY + chromaH * 0.4,
          height: chromaH,
          translate: `${(-chromaDx).toFixed(1)}px 0px`,
          background: 'rgba(30, 220, 255, 0.35)',
          mixBlendMode: 'screen',
        }}
      />
      {/* midpoint white pop */}
      {whitePop ? <AbsoluteFill style={{background: `rgba(255,255,255,${0.85 * intensity})`}} /> : null}
      {sfxOn ? (
        <>
          <Sequence from={0} durationInFrames={durationInFrames + 6} name="Glitch sfx" layout="none">
            <Audio src={staticFile('assets/sfx/glitch.wav')} volume={0.5} />
          </Sequence>
          <Sequence from={0} durationInFrames={durationInFrames + 4} name="Static sfx" layout="none">
            <Audio src={staticFile('assets/sfx/static.wav')} volume={0.32} />
          </Sequence>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
