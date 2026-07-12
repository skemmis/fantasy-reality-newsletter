import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {COLORS, tokens, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';

export interface CompareBarRow {
  /** Left label, e.g. "MAY PAYROLLS". */
  label: string;
  /** Numeric magnitude that sets the bar length. */
  value: number;
  /** Right-side readout, e.g. "+172K". */
  display: string;
  /** tokens.series color slot; defaults to the row index. */
  slot?: number;
}

export interface CompareBarsProps {
  rows: CompareBarRow[];
  /** e.g. "JOBS ADDED · THOUSANDS". */
  unit?: string;
  /** e.g. "REPORT VS FORECAST". */
  title?: string;
  /** Frames between row entrances. */
  stagger?: number;
  appearFrame?: number;
  /** Scale max; defaults to the largest row value. */
  max?: number;
}

/**
 * Two/three horizontal pixel bars that grow with springs, labels left,
 * Press Start 2P values at the bar tip, staggered entrances.
 */
export const CompareBars: React.FC<CompareBarsProps> = ({
  rows,
  unit,
  title,
  stagger = 12,
  appearFrame = 0,
  max,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const local = frame - appearFrame;

  const scaleMax = max ?? Math.max(...rows.map((r) => r.value), 1);
  const pad = Math.round(width * 0.075);
  const labelW = 400;
  const barH = 92;
  const trackW = width - pad * 2 - labelW - 48;

  if (local < 0) return null;

  return (
    <AbsoluteFill style={{background: COLORS.canvas, justifyContent: 'center'}}>
      <div style={{padding: `0 ${pad}px`, display: 'flex', flexDirection: 'column'}}>
        {(title || unit) ? (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 74,
            }}
          >
            {title ? (
              <span
                style={{
                  fontFamily: PIXEL_FAMILY,
                  fontSize: 44,
                  color: COLORS.ink,
                  textShadow: `6px 6px 0 ${inkAlpha(0.15)}`,
                }}
              >
                {title.toUpperCase()}
              </span>
            ) : (
              <span />
            )}
            {unit ? (
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontWeight: 700,
                  fontSize: 24,
                  letterSpacing: '0.16em',
                  color: COLORS.mutedText,
                }}
              >
                {unit.toUpperCase()}
              </span>
            ) : null}
          </div>
        ) : null}

        <div style={{display: 'flex', flexDirection: 'column', gap: 56}}>
          {rows.map((r, i) => {
            const at = i * stagger;
            const rl = local - at;
            const grow =
              rl < 0
                ? 0
                : spring({
                    frame: rl,
                    fps,
                    config: {damping: 14, stiffness: 150, mass: 0.9},
                    durationInFrames: 20,
                  });
            const barW = Math.max(10, (r.value / scaleMax) * trackW * grow);
            const color = tokens.series[(r.slot ?? i) % tokens.series.length];
            const chipIn = rl >= 0 && grow > 0.55;
            const chipS = chipIn
              ? spring({
                  frame: rl - 8,
                  fps,
                  config: {damping: 12, stiffness: 260, mass: 0.7},
                  durationInFrames: 10,
                })
              : 0;
            // Long bars: the readout rides INSIDE the bar so it never
            // clips at the frame edge (Press Start 2P is ~1em per glyph).
            const chipW = r.display.length * 34 + 30;
            const chipInside = (r.value / scaleMax) * trackW + chipW > trackW - 6;
            return (
              <div key={i} style={{display: 'flex', alignItems: 'center', gap: 34, opacity: rl < 0 ? 0 : 1}}>
                <div
                  style={{
                    width: labelW,
                    textAlign: 'right',
                    fontFamily: MONO_FAMILY,
                    fontWeight: 700,
                    fontSize: 30,
                    letterSpacing: '0.03em',
                    color: COLORS.ink,
                    flexShrink: 0,
                  }}
                >
                  {r.label.toUpperCase()}
                </div>
                <div
                  style={{
                    position: 'relative',
                    width: trackW,
                    height: barH,
                    flexShrink: 0,
                  }}
                >
                  {/* track */}
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      background: COLORS.card,
                      border: `3px solid ${inkAlpha(0.3)}`,
                    }}
                  />
                  {/* bar */}
                  <div
                    style={{
                      position: 'absolute',
                      left: 0,
                      top: 0,
                      width: barW,
                      height: barH,
                      background: color,
                      border: pixelBorder(4),
                      boxShadow: hardShadow(inkAlpha(0.25), 1.2),
                    }}
                  />
                  {/* value chip at the tip (inside the bar when it's long) */}
                  {chipIn ? (
                    <div
                      style={{
                        position: 'absolute',
                        left: chipInside ? barW - 26 : barW + 26,
                        top: '50%',
                        transform: `translateY(-50%) ${chipInside ? 'translateX(-100%)' : ''} scale(${0.7 + 0.3 * chipS})`,
                        opacity: chipS,
                        fontFamily: PIXEL_FAMILY,
                        fontSize: 34,
                        color: chipInside ? COLORS.card : COLORS.ink,
                        whiteSpace: 'nowrap',
                        textShadow: `5px 5px 0 ${inkAlpha(chipInside ? 0.45 : 0.16)}`,
                      }}
                    >
                      {r.display.toUpperCase()}
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* SFX: pop per row */}
      {rows.map((_, i) => (
        <Sequence
          key={i}
          from={appearFrame + i * stagger}
          durationInFrames={12}
          name={`Bar pop ${i}`}
          layout="none"
        >
          <Audio src={staticFile('assets/sfx/pop-in.wav')} volume={0.38} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};
