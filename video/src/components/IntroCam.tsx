import React from 'react';
import {
  AbsoluteFill,
  OffthreadVideo,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';

export interface IntroCamProps {
  /** Path relative to public/ of the recorded talking-head clip. */
  src?: string;
  name?: string;
  tagline?: string;
}

/**
 * Placeholder frame for a human talking-head intro clip: pixel-border card
 * over the canvas with a lower-third name plate. Drop a recorded clip into
 * public/ and pass `src` later.
 */
export const IntroCam: React.FC<IntroCamProps> = ({
  src,
  name = 'SAM',
  tagline = 'definitely a financial professional',
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const portrait = height > width;

  const camW = width * (portrait ? 0.88 : 0.66);
  const camH = portrait ? camW * (9 / 16) : height * 0.72;

  const plate = spring({
    frame: frame - 10,
    fps,
    config: {damping: 13, stiffness: 220, mass: 0.7},
    durationInFrames: 14,
  });

  return (
    <AbsoluteFill
      style={{
        background: COLORS.canvas,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          width: camW,
          height: camH,
          background: COLORS.ink,
          border: pixelBorder(8),
          boxShadow: hardShadow(inkAlpha(0.2), 2.5),
          position: 'relative',
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {src ? (
          <OffthreadVideo
            src={staticFile(src)}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
          />
        ) : (
          <div style={{textAlign: 'center'}}>
            <div
              style={{
                fontFamily: PIXEL_FAMILY,
                fontSize: 34,
                color: COLORS.gold,
                lineHeight: 1.8,
              }}
            >
              INTRO CAM
            </div>
            <div
              style={{
                fontFamily: MONO_FAMILY,
                fontWeight: 700,
                fontSize: 22,
                color: COLORS.canvas,
                opacity: 0.7,
                letterSpacing: '0.12em',
                marginTop: 10,
              }}
            >
              RECORDED CLIP DROPS IN HERE
            </div>
            {/* fake REC dot, hard blink */}
            <div
              style={{
                position: 'absolute',
                top: 26,
                left: 30,
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                opacity: Math.floor(frame / 15) % 2 === 0 ? 1 : 0.25,
              }}
            >
              <div style={{width: 18, height: 18, background: COLORS.red}} />
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontWeight: 700,
                  fontSize: 22,
                  color: COLORS.canvas,
                  letterSpacing: '0.2em',
                }}
              >
                REC
              </span>
            </div>
          </div>
        )}
        {/* lower-third name plate */}
        <div
          style={{
            position: 'absolute',
            left: 28,
            bottom: 28,
            transform: `translateY(${(1 - plate) * 120}px)`,
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              fontFamily: PIXEL_FAMILY,
              fontSize: 26,
              color: COLORS.ink,
              background: COLORS.gold,
              border: pixelBorder(4),
              boxShadow: hardShadow(inkAlpha(0.35), 0.8),
              padding: '12px 18px',
              alignSelf: 'flex-start',
            }}
          >
            {name.toUpperCase()}
          </div>
          <div
            style={{
              fontFamily: MONO_FAMILY,
              fontWeight: 700,
              fontStyle: 'italic',
              fontSize: 21,
              color: COLORS.ink,
              background: COLORS.card,
              border: pixelBorder(3),
              padding: '6px 14px',
              alignSelf: 'flex-start',
              marginTop: -3,
              marginLeft: 14,
            }}
          >
            {tagline}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};
