import React from 'react';
import {Img, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {AssetEntry, assetFile, assetSrc} from '../assets';
import {COLORS, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY} from '../fonts';

export interface SpriteLoopProps {
  /** Manifest entry; uses its `loop` frames when present, else its file. */
  asset: AssetEntry | null;
  /**
   * public/-relative path used when the manifest has no match but a file is
   * known to exist on disk (e.g. "assets/mascot/v2/deadpan-alpha.png").
   */
  fallbackSrc?: string;
  /** Frame-cycle rate in fps — hard steps, no interpolation. Default 6. */
  fps?: number;
  /** Square bounding size in px. */
  size?: number;
  scale?: number;
  style?: React.CSSProperties;
}

/**
 * Cycles a loop's frames at a fixed sprite fps (stepped, never tweened).
 * Falls back to the entry's static file, then to `fallbackSrc`, then to a
 * tiny house-style placeholder chip.
 */
export const SpriteLoop: React.FC<SpriteLoopProps> = ({
  asset,
  fallbackSrc,
  fps = 6,
  size = 140,
  scale = 1,
  style,
}) => {
  const frame = useCurrentFrame();
  const {fps: videoFps} = useVideoConfig();

  const frames = asset?.loop ?? null;
  let src: string | null = null;
  if (frames && frames.length > 0) {
    const idx = Math.floor((frame * fps) / videoFps) % frames.length;
    src = assetSrc(frames[idx]);
  } else if (asset) {
    src = assetSrc(assetFile(asset, true));
  } else if (fallbackSrc) {
    src = staticFile(fallbackSrc);
  }

  return (
    <div
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: scale === 1 ? undefined : `scale(${scale})`,
        ...style,
      }}
    >
      {src ? (
        <Img
          src={src}
          style={{width: '100%', height: '100%', objectFit: 'contain'}}
        />
      ) : (
        <div
          style={{
            fontFamily: PIXEL_FAMILY,
            fontSize: Math.max(10, Math.round(size * 0.1)),
            color: COLORS.mutedText,
            background: COLORS.cream,
            border: pixelBorder(3, inkAlpha(0.5)),
            padding: '8px 10px',
          }}
        >
          SPRITE
        </div>
      )}
    </div>
  );
};
