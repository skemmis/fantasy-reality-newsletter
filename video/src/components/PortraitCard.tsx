import React from 'react';
import {Img, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {AssetEntry, assetSrc} from '../assets';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY} from '../fonts';

export interface PortraitCardProps {
  /** Manifest entry; null renders the house placeholder. */
  asset: AssetEntry | null;
  /** Name-plate text; defaults to the asset's label. */
  label?: string;
  /** "small" = lower-third scale, "large" = feature scale. */
  size?: 'small' | 'large';
  /** Local frame the pop-in starts. */
  appearFrame?: number;
  /** Name-plate background. */
  accent?: string;
  /** Mirror the artwork horizontally (to make portraits "face" each other). */
  flip?: boolean;
}

/**
 * Portrait on a card with a pixel name-plate chip. Spring pop-in
 * (scale + rise). House style: pixel border, hard shadow, zero radius.
 */
export const PortraitCard: React.FC<PortraitCardProps> = ({
  asset,
  label,
  size = 'large',
  appearFrame = 0,
  accent = COLORS.gold,
  flip = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < appearFrame) return null;

  const s = spring({
    frame: frame - appearFrame,
    fps,
    config: {damping: 12, stiffness: 240, mass: 0.8},
    durationInFrames: 14,
  });

  const large = size === 'large';
  const w = large ? 460 : 260;
  const h = large ? 560 : 320;
  const plate = (label ?? asset?.label ?? asset?.id ?? 'UNKNOWN').toUpperCase();

  return (
    <div
      style={{
        position: 'relative',
        width: w,
        height: h,
        transform: `scale(${0.7 + 0.3 * s}) translateY(${(1 - s) * 60}px)`,
        opacity: Math.min(1, s * 2),
      }}
    >
      <div
        style={{
          width: '100%',
          height: '100%',
          background: COLORS.card,
          border: pixelBorder(large ? 6 : 4),
          boxShadow: hardShadow(inkAlpha(0.25), large ? 2 : 1.2),
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {asset ? (
          <Img
            src={assetSrc(asset.file)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              transform: flip ? 'scaleX(-1)' : undefined,
            }}
          />
        ) : (
          // Placeholder: checkerboard + pixel "?" silhouette.
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundImage: `repeating-conic-gradient(${COLORS.cream} 0% 25%, ${COLORS.card} 0% 50%)`,
              backgroundSize: '48px 48px',
            }}
          >
            <span
              style={{
                fontFamily: PIXEL_FAMILY,
                fontSize: large ? 110 : 64,
                color: COLORS.mutedText,
                textShadow: `6px 6px 0 ${inkAlpha(0.15)}`,
              }}
            >
              ?
            </span>
          </div>
        )}
      </div>
      {/* Name-plate chip, overlapping the bottom border. */}
      <div
        style={{
          position: 'absolute',
          bottom: large ? -26 : -18,
          left: '50%',
          transform: 'translateX(-50%)',
          fontFamily: PIXEL_FAMILY,
          fontSize: large ? 30 : 18,
          whiteSpace: 'nowrap',
          color: COLORS.ink,
          background: accent,
          border: pixelBorder(4),
          boxShadow: hardShadow(inkAlpha(0.25)),
          padding: large ? '14px 22px' : '10px 14px',
        }}
      >
        {plate}
      </div>
    </div>
  );
};
