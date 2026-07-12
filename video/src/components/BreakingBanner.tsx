import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {AssetEntry, assetSrc} from '../assets';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';
import {useScreenShake} from '../fx/useScreenShake';
import {SpriteLoop} from './SpriteLoop';

/**
 * Full-width "BREAKING" slam. Red ribbon (props/breaking-banner.png art when
 * the manifest has it, else a typeset ribbon) crashes in with a screen
 * shake, siren lamps flash at both ends (loops/siren-* when present, else
 * procedural pixel lamps), hazard stripes crawl beneath, alarm blares, and
 * the whole thing auto-exits after `outAfter` frames.
 *
 * Overlay component: mount it in a <Sequence> over the running scene. To
 * also shake the scene underneath, fire useScreenShake(bannerStart) on the
 * scene container.
 */
export interface BreakingBannerProps {
  text?: string;
  /** Mono sub-line under the ribbon, e.g. "FED HIKES RATES +25BPS". */
  sub?: string;
  /** Manifest entry for props/breaking-banner.png. */
  banner?: AssetEntry | null;
  /** Manifest loop entry for loops/siren-*. */
  siren?: AssetEntry | null;
  /** Local frame the slide-out starts. Default 75. */
  outAfter?: number;
  /** Vertical center of the ribbon in % of frame height. Default 44. */
  y?: number;
  sfx?: boolean;
  seed?: string | number;
}

/** Procedural flashing siren lamp (fallback when no siren sprite exists). */
const PixelSiren: React.FC<{size: number; phase: 0 | 1}> = ({size, phase}) => {
  const frame = useCurrentFrame();
  const on = (Math.floor(frame / 4) + phase) % 2 === 0;
  const domeColor = on ? '#ff5a4a' : '#8f1f2b';
  return (
    <div style={{width: size, height: size, position: 'relative'}}>
      {/* glow */}
      {on ? (
        <div
          style={{
            position: 'absolute',
            inset: -size * 0.3,
            background: `radial-gradient(circle, rgba(255, 90, 74, 0.55) 0%, transparent 65%)`,
          }}
        />
      ) : null}
      {/* dome */}
      <div
        style={{
          position: 'absolute',
          left: size * 0.18,
          top: size * 0.08,
          width: size * 0.64,
          height: size * 0.52,
          background: domeColor,
          border: pixelBorder(4),
        }}
      />
      {/* highlight pixel */}
      <div
        style={{
          position: 'absolute',
          left: size * 0.28,
          top: size * 0.16,
          width: size * 0.14,
          height: size * 0.14,
          background: on ? '#ffd2c8' : '#c26a63',
        }}
      />
      {/* base */}
      <div
        style={{
          position: 'absolute',
          left: size * 0.06,
          top: size * 0.56,
          width: size * 0.88,
          height: size * 0.26,
          background: COLORS.ink,
          border: pixelBorder(4),
        }}
      />
    </div>
  );
};

export const BreakingBanner: React.FC<BreakingBannerProps> = ({
  text = 'BREAKING',
  sub,
  banner = null,
  siren = null,
  outAfter = 75,
  y = 44,
  sfx = true,
  seed = 'breaking',
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();

  const inS = spring({
    frame,
    fps,
    config: {damping: 11, stiffness: 300, mass: 0.9},
    durationInFrames: 12,
  });
  const shake = useScreenShake(0, {amp: 16, rotAmp: 1.6, durationInFrames: 20, seed});

  // Slide-out: accelerate up and off.
  const outT = Math.max(0, frame - outAfter);
  const outY = -((outT / 8) ** 2) * height * 0.6;
  if (outT > 14) return null;

  const bandH = Math.round(height * 0.2);
  const stripeH = Math.round(height * 0.045);
  const scroll = (frame * 9) % 80;
  const sirenSize = bandH * 0.62;

  const hazard = (flip: boolean): React.CSSProperties => ({
    position: 'absolute',
    left: -80,
    right: -80,
    height: stripeH,
    background: `repeating-linear-gradient(${flip ? -45 : 45}deg, ${COLORS.ink} 0 20px, ${COLORS.gold} 20px 40px)`,
    backgroundPositionX: `${flip ? -scroll : scroll}px`,
    borderTop: pixelBorder(4),
    borderBottom: pixelBorder(4),
  });

  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: `${y}%`,
          translate: `${shake.x.toFixed(1)}px ${(outY + shake.y).toFixed(1)}px`,
          rotate: shake.rotate,
        }}
      >
        <div
          style={{
            position: 'relative',
            marginTop: -bandH / 2,
            scale: String(1.7 - 0.7 * inS),
            opacity: Math.min(1, inS * 3),
          }}
        >
          {/* hazard stripes above + below the ribbon */}
          <div style={{...hazard(false), top: -stripeH - 10}} />
          <div style={{...hazard(true), top: bandH + 10}} />
          {/* the ribbon */}
          <div
            style={{
              position: 'relative',
              height: bandH,
              background: COLORS.red,
              borderTop: pixelBorder(6),
              borderBottom: pixelBorder(6),
              boxShadow: `0 14px 0 ${inkAlpha(0.3)}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
            }}
          >
            {banner ? (
              <Img
                src={assetSrc(banner.file)}
                style={{width: '100%', height: '100%', objectFit: 'cover'}}
              />
            ) : (
              <>
                {/* subtle darker inner band for depth */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 10,
                    border: `4px solid ${inkAlpha(0.28)}`,
                  }}
                />
                <span
                  style={{
                    fontFamily: PIXEL_FAMILY,
                    fontSize: bandH * 0.42,
                    letterSpacing: '0.08em',
                    color: '#ffffff',
                    textShadow: `8px 8px 0 ${inkAlpha(0.85)}`,
                    // 2-frame hard blink on the text while the alarm runs.
                    opacity: frame < 40 && Math.floor(frame / 3) % 4 === 3 ? 0.55 : 1,
                  }}
                >
                  {text.toUpperCase()}
                </span>
              </>
            )}
          </div>
          {/* sirens at both ends, over the ribbon */}
          <div style={{position: 'absolute', left: width * 0.025, top: bandH / 2 - sirenSize / 2}}>
            {siren ? (
              <SpriteLoop asset={siren} fps={8} size={sirenSize} />
            ) : (
              <PixelSiren size={sirenSize} phase={0} />
            )}
          </div>
          <div style={{position: 'absolute', right: width * 0.025, top: bandH / 2 - sirenSize / 2}}>
            {siren ? (
              <SpriteLoop asset={siren} fps={8} size={sirenSize} />
            ) : (
              <PixelSiren size={sirenSize} phase={1} />
            )}
          </div>
          {/* sub-line chip */}
          {sub && frame >= 8 ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: bandH + stripeH + 26,
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontWeight: 700,
                  fontSize: 34,
                  letterSpacing: '0.12em',
                  color: COLORS.ink,
                  background: COLORS.cream,
                  border: pixelBorder(4),
                  boxShadow: hardShadow(inkAlpha(0.25)),
                  padding: '12px 28px',
                }}
              >
                {sub.toUpperCase()}
              </span>
            </div>
          ) : null}
        </div>
      </div>
      {sfx ? (
        <>
          <Sequence from={0} durationInFrames={40} name="Breaking alarm" layout="none">
            <Audio src={staticFile('assets/sfx/alarm.wav')} volume={0.45} />
          </Sequence>
          <Sequence from={0} durationInFrames={12} name="Breaking thud" layout="none">
            <Audio src={staticFile('assets/sfx/thud.wav')} volume={0.5} />
          </Sequence>
          <Sequence from={outAfter} durationInFrames={16} name="Breaking out whoosh" layout="none">
            <Audio src={staticFile('assets/sfx/whoosh-up.wav')} volume={0.3} />
          </Sequence>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
