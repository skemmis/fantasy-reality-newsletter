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
import {AssetEntry, assetSrc} from '../assets';

/**
 * Text composited onto a blank region of the meme art (e.g. the button
 * label on panic-button.png). Positioned in % of the image card.
 */
export interface MemeOverlay {
  text: string;
  /** Center of the overlay, in % of the card (0-100). */
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  /** Omit for bare text straight on the art. */
  background?: string;
  rotate?: number;
}

export interface MemeCutawayProps {
  /**
   * Manifest entry (preferred): resolve via resolveMeme(manifest, intent)
   * or resolveAsset(manifest, id) in the episode and pass it here.
   * Takes precedence over `src` when present.
   */
  asset?: AssetEntry | null;
  /** Path relative to public/, e.g. "assets/mascot/v2/panic.png". */
  src?: string;
  kind?: 'image' | 'video';
  caption?: string;
  /** Optional attribution / source line, small. */
  credit?: string;
  /** Text composited onto blank regions of the art. */
  overlays?: MemeOverlay[];
}

/**
 * Full-frame meme cutaway: asset on a card with a chunky pixel border and a
 * caption slot. Enters and exits in 2-3 hard frames — no soft fades.
 */
export const MemeCutaway: React.FC<MemeCutawayProps> = ({
  asset,
  src,
  kind = 'image',
  caption,
  credit,
  overlays,
}) => {
  const frame = useCurrentFrame();
  const {width, height, durationInFrames} = useVideoConfig();
  const portrait = height > width;

  // Manifest asset wins; then the explicit src; then the checkerboard slot.
  const resolvedSrc = asset ? assetSrc(asset.file) : src ? staticFile(src) : null;

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
            position: 'relative',
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
          {resolvedSrc ? (
            kind === 'video' ? (
              <OffthreadVideo
                src={resolvedSrc}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
                muted
              />
            ) : (
              <Img
                src={resolvedSrc}
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
          {/* text composited onto blank regions of the art */}
          {(overlays ?? []).map((o, i) => (
            <span
              key={i}
              style={{
                position: 'absolute',
                left: `${o.x}%`,
                top: `${o.y}%`,
                transform: `translate(-50%, -50%) rotate(${o.rotate ?? 0}deg)`,
                fontFamily: PIXEL_FAMILY,
                fontSize: o.fontSize ?? 26,
                lineHeight: 1.5,
                textAlign: 'center',
                color: o.color ?? COLORS.ink,
                background: o.background,
                border: o.background ? pixelBorder(3) : undefined,
                padding: o.background ? '8px 12px' : undefined,
                whiteSpace: 'pre-wrap',
                maxWidth: '46%',
              }}
            >
              {o.text.toUpperCase()}
            </span>
          ))}
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
