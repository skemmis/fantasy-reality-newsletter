import React from 'react';
import {
  AbsoluteFill,
  Img,
  OffthreadVideo,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';

export interface MemeCutawayProps {
  /** Path relative to public/, e.g. "memes/this-is-fine.mp4". */
  src?: string;
  kind?: 'image' | 'video';
  caption?: string;
  /** Optional attribution / source line, small. */
  credit?: string;
}

/**
 * Full-frame meme cutaway: asset on a card with a chunky pixel border and a
 * caption slot. Enters and exits in 2-3 hard frames — no soft fades.
 */
export const MemeCutaway: React.FC<MemeCutawayProps> = ({
  src,
  kind = 'image',
  caption,
  credit,
}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  const portrait = height > width;

  // Hard stepped entrance / exit: 0.92 -> 1.02 -> 1.0 over 3 frames.
  const inScale = frame === 0 ? 0.92 : frame === 1 ? 1.02 : 1;
  const outScale = durationInFrames - frame <= 1 ? 0.96 : 1;
  const scale = inScale * outScale;

  const cardW = width * (portrait ? 0.86 : 0.62);
  const cardH = height * (portrait ? 0.52 : 0.66);

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
          transform: `scale(${scale})`,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 34,
        }}
      >
        <div
          style={{
            width: cardW,
            height: cardH,
            background: COLORS.card,
            border: pixelBorder(8),
            boxShadow: hardShadow(inkAlpha(0.2), 2.5),
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {src ? (
            kind === 'video' ? (
              <OffthreadVideo
                src={staticFile(src)}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                muted
              />
            ) : (
              <Img
                src={staticFile(src)}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            )
          ) : (
            // Placeholder: pixel checkerboard + slot label.
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundImage: `repeating-conic-gradient(${COLORS.cream} 0% 25%, ${COLORS.card} 0% 50%)`,
                backgroundSize: '64px 64px',
              }}
            >
              <span
                style={{
                  fontFamily: PIXEL_FAMILY,
                  fontSize: 30,
                  lineHeight: 1.7,
                  color: COLORS.mutedText,
                  background: COLORS.card,
                  border: pixelBorder(4),
                  padding: '22px 30px',
                }}
              >
                MEME SLOT
              </span>
            </div>
          )}
        </div>
        {caption ? (
          <div
            style={{
              fontFamily: MONO_FAMILY,
              fontWeight: 700,
              fontSize: portrait ? 40 : 36,
              color: COLORS.ink,
              background: COLORS.gold,
              border: pixelBorder(4),
              boxShadow: hardShadow(inkAlpha(0.25)),
              padding: '14px 26px',
              maxWidth: cardW,
              textAlign: 'center',
            }}
          >
            {caption}
          </div>
        ) : null}
        {credit ? (
          <div
            style={{
              fontFamily: MONO_FAMILY,
              fontSize: 20,
              letterSpacing: '0.1em',
              color: COLORS.mutedText,
            }}
          >
            {credit.toUpperCase()}
          </div>
        ) : null}
      </div>
    </AbsoluteFill>
  );
};
