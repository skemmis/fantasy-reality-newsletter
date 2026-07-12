import React from 'react';
import {COLORS} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';

/**
 * Mechanical odometer digit logic, shared by OddsCounter (percent) and
 * BigNumber (arbitrary stats). Each digit wheel rolls like an odometer:
 * the ones wheel tracks continuously, higher wheels only roll while the
 * wheel below wraps 9 -> 0.
 */

/**
 * Snap a continuous value so wheels show a crisp integer for most of each
 * unit and roll quickly through the last quarter — fractional values
 * (holds, static reveals) never freeze the odometer between digits.
 */
export const snapWheelValue = (raw: number): number => {
  const v = Math.max(0, raw);
  const fracPart = v % 1;
  return Math.floor(v) + (fracPart < 0.75 ? 0 : (fracPart - 0.75) / 0.25);
};

/** Wheel positions (most significant first) for a snapped value. */
export const wheelPositions = (v: number, numWheels: number): number[] => {
  const wheels: number[] = [];
  for (let k = 0; k < numWheels; k++) {
    const pow = 10 ** k;
    if (k === 0) {
      wheels.push(v % 10);
    } else {
      const base = Math.floor(v / pow) % 10;
      // Roll only during the final unit of the lower wheels.
      const lower = v % pow;
      const frac = Math.max(0, (lower - (pow - 1)) / 1);
      wheels.push(base + Math.min(1, frac));
    }
  }
  wheels.reverse(); // most significant first
  return wheels;
};

const STRIP = [...Array(11).keys()]; // 0..9 then 0 again for wrap

/**
 * The rolling digit block: Press Start 2P wheels in overflow-hidden slots.
 * `value` must already be snapped (see snapWheelValue).
 */
export const DigitWheels: React.FC<{
  value: number;
  wheels: number;
  size: number;
  color?: string;
}> = ({value, wheels, size, color = COLORS.ink}) => {
  const digitH = size * 1.15;
  const digitW = size * 1.05;
  const positions = wheelPositions(value, wheels);
  return (
    <div style={{display: 'flex'}}>
      {positions.map((pos, i) => (
        <div
          key={i}
          style={{
            height: digitH,
            width: digitW,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              transform: `translateY(${-(pos % 10) * digitH}px)`,
            }}
          >
            {STRIP.map((d, j) => (
              <div
                key={j}
                style={{
                  height: digitH,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: PIXEL_FAMILY,
                  fontSize: size,
                  color,
                  lineHeight: 1,
                }}
              >
                {d % 10}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/**
 * Big Press Start 2P percentage with mechanical per-digit slot roll.
 * `value` is a continuous percent (0-100).
 */
export const OddsCounter: React.FC<{
  value: number;
  size?: number; // digit font size in px
  color?: string;
  label?: string;
}> = ({value, size = 120, color = COLORS.ink, label}) => {
  const raw = Math.max(0, Math.min(100, value));
  const v = snapWheelValue(raw);
  const numWheels = v >= 99.5 ? 3 : v >= 9.5 ? 2 : 1;

  return (
    <div style={{display: 'flex', alignItems: 'baseline', gap: size * 0.12}}>
      <DigitWheels value={v} wheels={numWheels} size={size} color={color} />
      <span
        style={{
          fontFamily: PIXEL_FAMILY,
          fontSize: size * 0.45,
          color,
          lineHeight: 1,
        }}
      >
        %
      </span>
      {label ? (
        <span
          style={{
            fontFamily: MONO_FAMILY,
            fontWeight: 700,
            fontSize: size * 0.22,
            color: COLORS.mutedText,
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginLeft: size * 0.1,
          }}
        >
          {label}
        </span>
      ) : null}
    </div>
  );
};
