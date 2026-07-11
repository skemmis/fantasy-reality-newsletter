import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, inkAlpha} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';

export interface KineticTitleProps {
  /** Title words; each slams in on its own beat. */
  title: string;
  /** 0-based indices of words to render in the accent color. */
  accentWords?: number[];
  accentColor?: string;
  /** Frames between word entrances. */
  stagger?: number;
  kicker?: string;
  background?: string;
}

/**
 * Word-by-word title card: Press Start 2P words slam in with a spring,
 * with a 1-frame hard-shadow offset jitter right after each slam.
 */
export const KineticTitle: React.FC<KineticTitleProps> = ({
  title,
  accentWords = [],
  accentColor = COLORS.magenta,
  stagger = 5,
  kicker,
  background = COLORS.canvas,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const portrait = height > width;

  const words = title.split(/\s+/).filter(Boolean);
  const fontSize = portrait
    ? Math.round(width * 0.075)
    : Math.round(width * 0.045);

  return (
    <AbsoluteFill
      style={{
        background,
        justifyContent: 'center',
        alignItems: 'center',
        padding: portrait ? '0 8%' : '0 10%',
      }}
    >
      {kicker ? (
        <div
          style={{
            fontFamily: MONO_FAMILY,
            fontWeight: 700,
            fontSize: Math.round(fontSize * 0.32),
            letterSpacing: '0.35em',
            color: COLORS.mutedText,
            marginBottom: fontSize * 0.7,
            opacity: frame >= 0 ? 1 : 0,
          }}
        >
          {kicker}
        </div>
      ) : null}
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          columnGap: fontSize * 0.5,
          rowGap: fontSize * 0.75,
          textAlign: 'center',
        }}
      >
        {words.map((w, i) => {
          const start = i * stagger;
          if (frame < start) {
            return <span key={i} style={{width: 0, overflow: 'hidden'}} />;
          }
          const local = frame - start;
          const s = spring({
            frame: local,
            fps,
            config: {damping: 13, stiffness: 300, mass: 0.7},
            durationInFrames: 12,
          });
          const scale = 1.7 - 0.7 * s;
          // 1-frame hard shadow offset jitter right after the slam.
          const jitter = local < 5 ? (local % 2 === 0 ? 3 : -3) : 0;
          const sdx = 8 + jitter;
          const sdy = 8 - jitter;
          const accent = accentWords.includes(i);
          return (
            <span
              key={i}
              style={{
                display: 'inline-block',
                fontFamily: PIXEL_FAMILY,
                fontSize,
                lineHeight: 1.15,
                color: accent ? accentColor : COLORS.ink,
                textShadow: `${sdx}px ${sdy}px 0 ${
                  accent ? inkAlpha(0.9) : inkAlpha(0.16)
                }`,
                transform: `scale(${scale}) rotate(${(1 - s) * (i % 2 === 0 ? -3 : 3)}deg)`,
              }}
            >
              {w.toUpperCase()}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
