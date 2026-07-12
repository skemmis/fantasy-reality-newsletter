import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {COLORS, inkAlpha} from '../theme/theme';
import {MONO_FAMILY} from '../fonts';

export interface TickerWipeProps {
  /** Tape copy, e.g. "FEDHIKE-26DEC31 ▲51 · KXRATECUT ▼25". Repeated to fill. */
  text: string;
  /** Sweep direction. */
  direction?: 'down' | 'up';
  /** Scroll speed of the tape text, px/frame. */
  scrollSpeed?: number;
  sfxOn?: boolean;
}

/**
 * Full-width scene transition: an ink ticker-tape band (scrolling Space
 * Mono tape) sweeps vertically across the frame over the sequence's
 * duration (~12-16 frames). Mount as a <Sequence> overlay spanning a cut;
 * the band covers frame-center at the sequence midpoint — put the scene
 * swap there.
 */
export const TickerWipe: React.FC<TickerWipeProps> = ({
  text,
  direction = 'down',
  scrollSpeed = 26,
  sfxOn = true,
}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();

  const bandH = Math.round(height * 0.36);
  const p = interpolate(frame, [0, durationInFrames - 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.55, 0, 0.45, 1),
  });
  const travel = height + bandH * 2;
  const top =
    direction === 'down' ? -bandH + p * travel - bandH : height + bandH - p * travel;

  // Tape: repeat the copy enough to always overflow, scroll continuously.
  const unit = ` ${text.toUpperCase()} · `;
  const reps = Math.max(4, Math.ceil((width * 2.5) / (unit.length * 30)));
  const tape = unit.repeat(reps);
  const scroll = -((frame * scrollSpeed) % (width * 1.2));

  const rowStyle = (size: number, color: string, speedMul: number): React.CSSProperties => ({
    fontFamily: MONO_FAMILY,
    fontWeight: 700,
    fontSize: size,
    letterSpacing: '0.08em',
    color,
    whiteSpace: 'nowrap',
    transform: `translateX(${scroll * speedMul}px)`,
  });

  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: -20,
          right: -20,
          top,
          height: bandH,
          background: COLORS.ink,
          borderTop: `10px solid ${COLORS.gold}`,
          borderBottom: `10px solid ${COLORS.gold}`,
          boxShadow: `0 14px 0 ${inkAlpha(0.3)}`,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 18,
          overflow: 'hidden',
        }}
      >
        <div style={rowStyle(30, COLORS.gold, 0.7)}>{tape}</div>
        <div style={rowStyle(52, COLORS.card, 1)}>{tape}</div>
        <div style={rowStyle(30, COLORS.magenta, 1.35)}>{tape}</div>
      </div>
      {/* leading-edge stripe */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: direction === 'down' ? top + bandH + 18 : top - 30,
          height: 12,
          background: COLORS.magenta,
        }}
      />
      {sfxOn ? (
        <Sequence from={0} durationInFrames={Math.min(20, durationInFrames)} name="Wipe whoosh" layout="none">
          <Audio src={staticFile('assets/sfx/whoosh-down.wav')} volume={0.45} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
