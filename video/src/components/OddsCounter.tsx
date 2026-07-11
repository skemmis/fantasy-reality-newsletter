import React from 'react';
import {COLORS} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';

/**
 * Big Press Start 2P percentage with mechanical per-digit slot roll.
 * `value` is a continuous percent (0-100); each digit wheel rolls like an
 * odometer: the ones wheel tracks continuously, higher wheels only roll
 * while the wheel below wraps 9 -> 0.
 */
export const OddsCounter: React.FC<{
  value: number;
  size?: number; // digit font size in px
  color?: string;
  label?: string;
}> = ({value, size = 120, color = COLORS.ink, label}) => {
  const raw = Math.max(0, Math.min(100, value));
  // Snap wheels: show a crisp integer for most of each unit and roll
  // quickly through the last quarter, so fractional values (holds,
  // static reveals) never freeze the odometer between digits.
  const fracPart = raw % 1;
  const v = Math.floor(raw) + (fracPart < 0.75 ? 0 : (fracPart - 0.75) / 0.25);

  const digitH = size * 1.15;
  const digitW = size * 1.05;

  // Odometer wheel positions.
  const wheels: number[] = [];
  const numWheels = v >= 99.5 ? 3 : v >= 9.5 ? 2 : 1;
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

  const strip = [...Array(11).keys()]; // 0..9 then 0 again for wrap

  return (
    <div style={{display: 'flex', alignItems: 'baseline', gap: size * 0.12}}>
      <div style={{display: 'flex'}}>
        {wheels.map((pos, i) => (
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
              {strip.map((d, j) => (
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
