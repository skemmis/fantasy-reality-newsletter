import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {AssetEntry} from '../assets';
import {COLORS, hardShadow, hardTextShadow, inkAlpha, pixelBorder, tokens} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';
import {PortraitCard} from './PortraitCard';

export interface VersusSide {
  asset: AssetEntry | null;
  label: string;
  /** Stat line under the portrait, e.g. "9 OF 18 SEE A HIKE". */
  stat: string;
  accent?: string;
}

export interface VersusCardProps {
  left: VersusSide;
  right: VersusSide;
  /** Center badge text. */
  vs?: string;
}

const StatLine: React.FC<{text: string; appearFrame: number; accent: string}> = ({
  text,
  appearFrame,
  accent,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < appearFrame) return null;
  const s = spring({
    frame: frame - appearFrame,
    fps,
    config: {damping: 13, stiffness: 260, mass: 0.7},
    durationInFrames: 12,
  });
  return (
    <div
      style={{
        fontFamily: MONO_FAMILY,
        fontWeight: 700,
        fontSize: 30,
        letterSpacing: '0.02em',
        color: COLORS.card,
        background: accent,
        border: pixelBorder(4),
        boxShadow: hardShadow(inkAlpha(0.25)),
        padding: '12px 22px',
        whiteSpace: 'nowrap',
        transform: `scale(${0.75 + 0.25 * s})`,
        opacity: s,
      }}
    >
      {text.toUpperCase()}
    </div>
  );
};

/**
 * Full-frame face-off: two PortraitCards over the canvas, big pixel "VS"
 * in the middle with a continuous 2-frame shake, stat chips below each
 * side. Left enters first, right 8 frames later, VS slams in after both.
 */
export const VersusCard: React.FC<VersusCardProps> = ({left, right, vs = 'VS'}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const L_AT = 0;
  const R_AT = 8;
  const VS_AT = 16;

  const vsSpring =
    frame < VS_AT
      ? 0
      : spring({
          frame: frame - VS_AT,
          fps,
          config: {damping: 11, stiffness: 320, mass: 0.7},
          durationInFrames: 12,
        });
  // Continuous hard shake: stepped every 2 frames, no smoothing.
  const jx = ((frame >> 1) % 2 === 0 ? 1 : -1) * 4;
  const jr = ((frame >> 1) % 2 === 0 ? -1 : 1) * 2;

  const leftAccent = left.accent ?? tokens.yes;
  const rightAccent = right.accent ?? tokens.no;

  return (
    <AbsoluteFill style={{background: COLORS.canvas}}>
      {/* subtle split shading so the halves read as opposing corners */}
      <AbsoluteFill
        style={{
          background: `linear-gradient(90deg, ${inkAlpha(0.05)} 0%, transparent 38%, transparent 62%, ${inkAlpha(0.05)} 100%)`,
        }}
      />
      <AbsoluteFill
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '0 9%',
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 64}}>
          <PortraitCard
            asset={left.asset}
            label={left.label}
            size="large"
            appearFrame={L_AT}
            accent={leftAccent}
            flip
          />
          <StatLine text={left.stat} appearFrame={L_AT + 12} accent={leftAccent} />
        </div>
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 64}}>
          <PortraitCard
            asset={right.asset}
            label={right.label}
            size="large"
            appearFrame={R_AT}
            accent={rightAccent}
          />
          <StatLine text={right.stat} appearFrame={R_AT + 12} accent={rightAccent} />
        </div>
      </AbsoluteFill>
      {/* center VS badge */}
      {frame >= VS_AT ? (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <div
            style={{
              fontFamily: PIXEL_FAMILY,
              fontSize: 150,
              color: COLORS.magenta,
              textShadow: hardTextShadow(inkAlpha(0.9), 2.4),
              transform: `scale(${2 - vsSpring}) translate(${jx}px, 0) rotate(${jr}deg)`,
            }}
          >
            {vs}
          </div>
        </AbsoluteFill>
      ) : null}
      {/* SFX: pop per side, blip on the VS slam */}
      {[L_AT, R_AT].map((f) => (
        <Sequence key={f} from={f} durationInFrames={12} name={`VS pop ${f}`} layout="none">
          <Audio src={staticFile('assets/sfx/pop-in.wav')} volume={0.4} />
        </Sequence>
      ))}
      <Sequence from={VS_AT} durationInFrames={10} name="VS blip" layout="none">
        <Audio src={staticFile('assets/sfx/blip.wav')} volume={0.4} />
      </Sequence>
    </AbsoluteFill>
  );
};
