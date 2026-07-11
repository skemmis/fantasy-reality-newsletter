import React from 'react';
import {
  Img,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {AssetEntry, assetFile, assetSrc} from '../assets';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY} from '../fonts';

export interface PropPopProps {
  /** Manifest entry; null renders a small placeholder chip. */
  asset: AssetEntry | null;
  /** Placeholder / accessibility text when the asset is missing. */
  label?: string;
  /** CSS left/top of the prop's center (px or %). */
  x: number | string;
  y: number | string;
  /** Square bounding size in px. */
  size?: number;
  /** Gentle stepped rock while held on screen. */
  wobble?: boolean;
  /** Play the blip SFX on pop (default true). */
  sfx?: boolean;
  volume?: number;
}

/**
 * Small prop that spring-pops in at a position, optionally wobbles while
 * held, and hard-steps out over the last 2 frames of its Sequence.
 * Mount inside a <Sequence from={...} durationInFrames={...}>.
 */
export const PropPop: React.FC<PropPopProps> = ({
  asset,
  label = 'PROP',
  x,
  y,
  size = 150,
  wobble = false,
  sfx = true,
  volume = 0.35,
}) => {
  const frame = useCurrentFrame();
  const {fps, durationInFrames} = useVideoConfig();

  const s = spring({
    frame,
    fps,
    config: {damping: 10, stiffness: 280, mass: 0.6},
    durationInFrames: 12,
  });
  // Hard 2-frame out: 1 -> 0.9 -> gone.
  const leftFrames = durationInFrames - frame;
  const outScale = leftFrames <= 1 ? 0 : leftFrames === 2 ? 0.9 : 1;
  // Stepped wobble (quantized so it keeps the pixel feel).
  const rock = wobble && frame > 14 ? Math.round(Math.sin(frame * 0.28) * 2) * 2 : 0;

  if (outScale === 0) return null;

  return (
    <>
      <div
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          marginLeft: -size / 2,
          marginTop: -size / 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transform: `scale(${(0.3 + 0.7 * s) * outScale}) rotate(${rock}deg)`,
          opacity: Math.min(1, s * 2),
        }}
      >
        {asset ? (
          <Img
            src={assetSrc(assetFile(asset, true))}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'contain',
              filter: `drop-shadow(6px 6px 0 ${inkAlpha(0.2)})`,
            }}
          />
        ) : (
          <div
            style={{
              fontFamily: PIXEL_FAMILY,
              fontSize: Math.max(12, Math.round(size * 0.11)),
              lineHeight: 1.5,
              textAlign: 'center',
              color: COLORS.mutedText,
              background: COLORS.cream,
              border: pixelBorder(4),
              boxShadow: hardShadow(inkAlpha(0.2)),
              padding: '12px 10px',
              maxWidth: size,
            }}
          >
            {label.toUpperCase()}
          </div>
        )}
      </div>
      {sfx ? (
        <Sequence from={0} durationInFrames={8} name="Prop blip" layout="none">
          <Audio src={staticFile('assets/sfx/blip.wav')} volume={volume} />
        </Sequence>
      ) : null}
    </>
  );
};
