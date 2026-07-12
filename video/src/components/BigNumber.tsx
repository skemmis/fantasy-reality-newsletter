import React from 'react';
import {
  AbsoluteFill,
  Easing,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';
import {DigitWheels, snapWheelValue} from './OddsCounter';
import {useScreenShake} from '../fx/useScreenShake';

export type BigNumberSfx = 'ka-ching' | 'alarm' | 'none';

export interface BigNumberProps {
  /** Final integer value, e.g. 172. */
  value: number;
  /** e.g. "+". */
  prefix?: string;
  /** e.g. "K". */
  suffix?: string;
  /** Line under the number, e.g. "JOBS ADDED IN MAY". */
  label: string;
  /** Muted comparison, e.g. "CONSENSUS: +80K". */
  sub?: string;
  /** Eyebrow chip, e.g. "JOBS DAY · JUN 5 2026". */
  kicker?: string;
  color?: string;
  accent?: string;
  sfx?: BigNumberSfx;
  /** Frames the odometer takes to roll up. */
  rollFrames?: number;
  appearFrame?: number;
  /** Digit font size. */
  size?: number;
}

/**
 * Full-frame stat slam: huge Press Start 2P number rolls up odometer-style
 * (same digit wheels as OddsCounter), label + muted comparison under it.
 */
export const BigNumber: React.FC<BigNumberProps> = ({
  value,
  prefix,
  suffix,
  label,
  sub,
  kicker,
  color = COLORS.ink,
  accent = COLORS.gold,
  sfx = 'ka-ching',
  rollFrames = 12,
  appearFrame = 0,
  size = 210,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const local = frame - appearFrame;

  const target = Math.max(0, Math.round(value));
  const wheels = Math.max(1, String(target).length);

  // Odometer roll: sweep the value up over ~rollFrames, snapped to wheels.
  const raw = interpolate(local, [2, 2 + rollFrames], [Math.max(0, target * 0.12), target], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const v = snapWheelValue(raw);

  // Whole-block slam.
  const s =
    local < 0
      ? 0
      : spring({
          frame: local,
          fps,
          config: {damping: 13, stiffness: 280, mass: 0.8},
          durationInFrames: 12,
        });
  const scale = 1.6 - 0.6 * s;

  // Accent bar sweeps in once the roll lands.
  const barS =
    local < rollFrames
      ? 0
      : spring({
          frame: local - rollFrames,
          fps,
          config: {damping: 14, stiffness: 200, mass: 0.7},
          durationInFrames: 12,
        });

  // Screen shake on the slam impact (as the spring lands) and again,
  // smaller, when the odometer roll tops out.
  const shake = useScreenShake([appearFrame + 3, appearFrame + 2 + rollFrames], {
    amp: 11,
    rotAmp: 0.9,
    durationInFrames: 14,
    seed: 'bignumber',
  });

  if (local < 0) return null;

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
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          transform: `scale(${scale})`,
          translate: shake.translate,
          rotate: shake.rotate,
          opacity: Math.min(1, s * 2.5),
        }}
      >
        {kicker ? (
          <div
            style={{
              fontFamily: MONO_FAMILY,
              fontWeight: 700,
              fontSize: 27,
              letterSpacing: '0.3em',
              color: COLORS.ink,
              background: COLORS.cream,
              border: pixelBorder(3),
              boxShadow: hardShadow(inkAlpha(0.2), 0.7),
              padding: '10px 22px',
              marginBottom: 58,
            }}
          >
            {kicker.toUpperCase()}
          </div>
        ) : null}
        {/* the number */}
        <div style={{display: 'flex', alignItems: 'center'}}>
          {prefix ? (
            <span
              style={{
                fontFamily: PIXEL_FAMILY,
                fontSize: size * 0.72,
                color,
                lineHeight: 1,
                marginRight: size * 0.12,
                textShadow: `10px 10px 0 ${inkAlpha(0.14)}`,
              }}
            >
              {prefix}
            </span>
          ) : null}
          <div style={{textShadow: `12px 12px 0 ${inkAlpha(0.14)}`}}>
            <DigitWheels value={v} wheels={wheels} size={size} color={color} />
          </div>
          {suffix ? (
            <span
              style={{
                fontFamily: PIXEL_FAMILY,
                fontSize: size * 0.72,
                color,
                lineHeight: 1,
                marginLeft: size * 0.1,
                textShadow: `10px 10px 0 ${inkAlpha(0.14)}`,
              }}
            >
              {suffix}
            </span>
          ) : null}
        </div>
        {/* accent bar */}
        <div
          style={{
            marginTop: 34,
            width: `${Math.round(barS * 100)}%`,
            minWidth: 2,
            height: 20,
            background: accent,
            border: barS > 0.05 ? pixelBorder(4) : 'none',
            boxShadow: barS > 0.05 ? hardShadow(inkAlpha(0.22)) : 'none',
            opacity: barS > 0.02 ? 1 : 0,
          }}
        />
        <div
          style={{
            marginTop: 46,
            fontFamily: PIXEL_FAMILY,
            fontSize: 40,
            lineHeight: 1.5,
            color: COLORS.ink,
            textAlign: 'center',
            textShadow: `6px 6px 0 ${inkAlpha(0.14)}`,
          }}
        >
          {label.toUpperCase()}
        </div>
        {sub ? (
          <div
            style={{
              marginTop: 30,
              fontFamily: MONO_FAMILY,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: '0.14em',
              color: COLORS.mutedText,
            }}
          >
            {sub.toUpperCase()}
          </div>
        ) : null}
      </div>
      {/* SFX: slam hit + roll ticks */}
      {sfx !== 'none' ? (
        <Sequence from={appearFrame} durationInFrames={30} name="BigNumber hit" layout="none">
          <Audio src={staticFile(`assets/sfx/${sfx}.wav`)} volume={0.45} />
        </Sequence>
      ) : null}
      {[3, 7, 11].map((f) => (
        <Sequence
          key={f}
          from={appearFrame + f}
          durationInFrames={6}
          name={`Roll tick ${f}`}
          layout="none"
        >
          <Audio src={staticFile('assets/sfx/tick.wav')} volume={0.28} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
