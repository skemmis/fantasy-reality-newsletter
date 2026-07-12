import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {AssetEntry} from '../assets';
import {COLORS, hardShadow, inkAlpha, pixelBorder, tokens} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';
import {BIRD_FRAMES, PixelSprite} from '../fx/PixelSprite';
import {SpriteLoop} from './SpriteLoop';

/**
 * The signature Fed gauge: a chunky pixel arc from DOVE (left, cream/teal)
 * to HAWK (right, gold/ink). The needle springs (with overshoot) from
 * `from` to `value` at `sweepAt`, ticking as it crosses each segment; the
 * bird at each end flaps a 2-frame loop (cast/hawk.png + cast/dove.png when
 * the manifest has them, else procedural pixel birds), and the verdict chip
 * slams in under the meter once the needle lands.
 */
export interface HawkDoveMeterProps {
  /** 0 = full dove, 1 = full hawk. */
  value: number;
  /** Needle's resting value before the sweep. Default 0.08. */
  from?: number;
  /** Local frame the sweep fires. Default 12. */
  sweepAt?: number;
  /** Verdict chip, e.g. "FED VIBES: HAWKISH". */
  label?: string;
  title?: string;
  hawk?: AssetEntry | null;
  dove?: AssetEntry | null;
  appearFrame?: number;
  sfx?: boolean;
}

const SEGMENTS = 15;

const DOVE_PALETTE: Record<string, string> = {
  b: '#ffffff',
  w: tokens.yes,
  o: '#17122b',
  l: '#b0761a',
};
const HAWK_PALETTE: Record<string, string> = {
  b: '#8a5a1a',
  w: COLORS.gold,
  o: COLORS.red,
  l: '#17122b',
};

/** Segment color ramp: teal -> cream -> gold -> ink. */
const segColor = (t: number): string => {
  if (t < 1 / 3) return interpolateColors(t, [0, 1 / 3], [tokens.yes, COLORS.cream]);
  if (t < 2 / 3) return interpolateColors(t, [1 / 3, 2 / 3], [COLORS.cream, COLORS.gold]);
  return interpolateColors(t, [2 / 3, 1], [COLORS.gold, COLORS.ink]);
};

const Bird: React.FC<{
  side: 'dove' | 'hawk';
  asset: AssetEntry | null;
  size: number;
  bounce: boolean;
}> = ({side, asset, size, bounce}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const flap = Math.floor((frame * 6) / fps) % 2;
  const pulse = bounce && Math.floor(frame / 4) % 2 === 0 ? 1.14 : 1;
  return (
    <div
      style={{
        scale: String(pulse),
        translate: `0px ${flap === 1 ? -3 : 0}px`,
        filter: `drop-shadow(4px 4px 0 ${inkAlpha(0.25)})`,
      }}
    >
      {asset ? (
        <SpriteLoop asset={asset} fps={6} size={size} />
      ) : (
        <PixelSprite
          bitmap={BIRD_FRAMES[flap]}
          palette={side === 'dove' ? DOVE_PALETTE : HAWK_PALETTE}
          size={size}
          flipX={side === 'hawk'}
        />
      )}
    </div>
  );
};

export const HawkDoveMeter: React.FC<HawkDoveMeterProps> = ({
  value,
  from = 0.08,
  sweepAt = 12,
  label,
  title = 'HAWK-DOVE METER',
  hawk = null,
  dove = null,
  appearFrame = 0,
  sfx = true,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const local = frame - appearFrame;

  const cardS =
    local < 0
      ? 0
      : spring({frame: local, fps, config: {damping: 13, stiffness: 260, mass: 0.8}, durationInFrames: 12});

  // Needle sweep: springy, slight overshoot.
  const vAt = (f: number): number => {
    const t = f - sweepAt;
    if (t < 0) return from;
    const s = spring({frame: t, fps, config: {damping: 10.5, stiffness: 120, mass: 1}, durationInFrames: 40});
    return from + (value - from) * s;
  };
  const v = vAt(local);
  const needleDeg = -90 + Math.max(0, Math.min(1, v)) * 180;

  // Tick frames: needle crossing segment boundaries (deterministic).
  const tickFrames: number[] = [];
  if (sfx) {
    let prevSeg = Math.floor(vAt(sweepAt) * SEGMENTS);
    let lastTick = -10;
    for (let f = sweepAt + 1; f <= sweepAt + 46; f++) {
      const seg = Math.floor(Math.max(0, Math.min(0.999, vAt(f))) * SEGMENTS);
      if (seg !== prevSeg && f - lastTick >= 2) {
        tickFrames.push(f);
        lastTick = f;
      }
      prevSeg = seg;
    }
  }

  // ---- geometry ----
  const cardW = Math.min(1300, width * 0.72);
  const cardH = Math.min(800, height * 0.74);
  const R = cardW * 0.295;
  const segSize = R * 0.152;
  const cx = cardW / 2;
  const cy = cardH * 0.66;
  const birdSize = cardW * 0.115;

  const settled = local > sweepAt + 24;
  const hawkWins = value >= 0.5;
  const chipAt = sweepAt + 28;
  const chipS =
    local < chipAt
      ? 0
      : spring({frame: local - chipAt, fps, config: {damping: 12, stiffness: 280, mass: 0.7}, durationInFrames: 12});

  if (local < 0) return null;

  return (
    <AbsoluteFill style={{background: COLORS.canvas, justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          position: 'relative',
          width: cardW,
          height: cardH,
          background: COLORS.card,
          border: pixelBorder(6),
          boxShadow: hardShadow(inkAlpha(0.2), 2),
          scale: String(0.8 + 0.2 * cardS),
          opacity: Math.min(1, cardS * 2.5),
        }}
      >
        {/* title plate */}
        <div
          style={{
            position: 'absolute',
            top: 34,
            left: 0,
            right: 0,
            display: 'flex',
            justifyContent: 'center',
          }}
        >
          <span
            style={{
              fontFamily: PIXEL_FAMILY,
              fontSize: 34,
              color: COLORS.gold,
              background: COLORS.ink,
              padding: '14px 26px',
              boxShadow: hardShadow(inkAlpha(0.25)),
              letterSpacing: '0.06em',
            }}
          >
            {title.toUpperCase()}
          </span>
        </div>

        {/* arc segments (chunky squares along the semicircle) */}
        {Array.from({length: SEGMENTS}, (_, i) => {
          const t = (i + 0.5) / SEGMENTS;
          const a = Math.PI + t * Math.PI; // 180° -> 360°
          const x = cx + R * Math.cos(a);
          const yy = cy + R * Math.sin(a);
          const lit = v * SEGMENTS >= i + 0.5;
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - segSize / 2,
                top: yy - segSize / 2,
                width: segSize,
                height: segSize,
                background: segColor(t),
                border: pixelBorder(4),
                boxShadow: `4px 4px 0 ${inkAlpha(0.18)}`,
                opacity: lit ? 1 : 0.32,
                scale: lit ? '1.06' : '1',
              }}
            />
          );
        })}
        {/* minor tick marks inside the arc */}
        {Array.from({length: SEGMENTS + 1}, (_, i) => {
          const a = Math.PI + (i / SEGMENTS) * Math.PI;
          const x = cx + R * 0.78 * Math.cos(a);
          const yy = cy + R * 0.78 * Math.sin(a);
          return (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: x - 4,
                top: yy - 4,
                width: 8,
                height: 8,
                background: inkAlpha(i % 5 === 0 ? 0.55 : 0.25),
              }}
            />
          );
        })}

        {/* needle: chunky tapered pointer, pivot at (cx, cy) */}
        <div
          style={{
            position: 'absolute',
            left: cx - 14,
            top: cy - R * 0.88,
            width: 28,
            height: R * 0.88,
            transformOrigin: `14px ${R * 0.88}px`,
            rotate: `${needleDeg.toFixed(2)}deg`,
          }}
        >
          {/* shaft */}
          <div
            style={{
              position: 'absolute',
              left: 6,
              top: R * 0.16,
              width: 16,
              height: R * 0.72,
              background: COLORS.ink,
              boxShadow: `5px 5px 0 ${inkAlpha(0.2)}`,
            }}
          />
          {/* tip */}
          <div style={{position: 'absolute', left: 0, top: R * 0.02, width: 28, height: R * 0.16, background: COLORS.magenta, border: pixelBorder(4)}} />
        </div>
        {/* hub */}
        <div
          style={{
            position: 'absolute',
            left: cx - 26,
            top: cy - 26,
            width: 52,
            height: 52,
            background: COLORS.gold,
            border: pixelBorder(5),
            boxShadow: hardShadow(inkAlpha(0.25)),
          }}
        />
        {/* readout under the hub */}
        <div
          style={{
            position: 'absolute',
            left: cx - 120,
            top: cy + 44,
            width: 240,
            textAlign: 'center',
            fontFamily: MONO_FAMILY,
            fontWeight: 700,
            fontSize: 30,
            letterSpacing: '0.18em',
            color: COLORS.mutedText,
          }}
        >
          {Math.round(Math.max(0, Math.min(1, v)) * 100)}% HAWK
        </div>

        {/* birds + end labels: perched OUTSIDE the arc ends, chips below */}
        {(['dove', 'hawk'] as const).map((side) => {
          const isDove = side === 'dove';
          const centerX = cx + (isDove ? -1 : 1) * (R + segSize + birdSize * 0.52);
          return (
            <div
              key={side}
              style={{
                position: 'absolute',
                left: centerX - birdSize / 2 - 20,
                top: cy - birdSize * 1.28,
                width: birdSize + 40,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <Bird
                side={side}
                asset={isDove ? dove : hawk}
                size={birdSize}
                bounce={settled && (isDove ? !hawkWins : hawkWins)}
              />
              <span
                style={{
                  fontFamily: PIXEL_FAMILY,
                  fontSize: 23,
                  color: isDove ? tokens.yes : '#8a5a1a',
                  background: COLORS.cream,
                  border: pixelBorder(3),
                  boxShadow: `4px 4px 0 ${inkAlpha(0.18)}`,
                  padding: '8px 12px',
                }}
              >
                {side.toUpperCase()}
              </span>
            </div>
          );
        })}

        {/* verdict chip */}
        {label && chipS > 0 ? (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 40,
              display: 'flex',
              justifyContent: 'center',
            }}
          >
            <span
              style={{
                fontFamily: PIXEL_FAMILY,
                fontSize: 32,
                color: COLORS.card,
                background: hawkWins ? COLORS.magenta : tokens.yes,
                border: pixelBorder(5),
                boxShadow: hardShadow(inkAlpha(0.3), 1.2),
                padding: '18px 30px',
                scale: String(1.5 - 0.5 * chipS),
                rotate: `${((1 - chipS) * -4).toFixed(2)}deg`,
                opacity: Math.min(1, chipS * 2.5),
              }}
            >
              {label.toUpperCase()}
            </span>
          </div>
        ) : null}
      </div>

      {/* SFX: ticks along the sweep, blip when the chip lands */}
      {tickFrames.map((f) => (
        <Sequence key={f} from={appearFrame + f} durationInFrames={5} name={`Meter tick ${f}`} layout="none">
          <Audio src={staticFile('assets/sfx/tick.wav')} volume={0.32} />
        </Sequence>
      ))}
      {sfx && label ? (
        <Sequence from={appearFrame + chipAt} durationInFrames={10} name="Verdict blip" layout="none">
          <Audio src={staticFile('assets/sfx/blip.wav')} volume={0.4} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
