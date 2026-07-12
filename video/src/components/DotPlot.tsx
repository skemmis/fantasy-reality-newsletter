import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';

export interface DotPlotColumn {
  /** Column header, e.g. "2026". */
  label: string;
  /** One entry per participant: the projected rate midpoint, e.g. 3.875. */
  dots: number[];
}

export interface DotPlotHighlight {
  /** Column label to flash. */
  column: string;
  /** Flash dots at or above this rate. */
  min?: number;
  /** Flash dots at or below this rate. */
  max?: number;
}

export interface DotPlotProps {
  columns: DotPlotColumn[];
  title?: string;
  subtitle?: string;
  /** Subset of dots to flash magenta. */
  highlight?: DotPlotHighlight | null;
  /** Local frame the flash starts. */
  highlightAt?: number;
  /** Chip that slams in with the flash, e.g. "9 OF 18 SEE A HIKE". */
  highlightLabel?: string;
  appearFrame?: number;
}

const DOT = 30;
const DOT_GAP = 10;

/**
 * Fed dot-plot recreation: y-axis = rate midpoints, columns = years.
 * Pixel-square dots drop in with a stagger + ticks; `highlight` flashes
 * a subset magenta while the rest dim.
 */
export const DotPlot: React.FC<DotPlotProps> = ({
  columns,
  title = 'FOMC DOT PLOT',
  subtitle,
  highlight = null,
  highlightAt = 80,
  highlightLabel,
  appearFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const local = frame - appearFrame;

  // Rate levels: every 0.25 step across the data's range, top-down.
  const levels = useMemo(() => {
    const all = columns.flatMap((c) => c.dots);
    const lo = Math.min(...all);
    const hi = Math.max(...all);
    const out: number[] = [];
    for (let v = hi; v >= lo - 1e-9; v -= 0.25) out.push(Math.round(v * 1000) / 1000);
    return out;
  }, [columns]);

  // Drop order: per column, bottom level first, one group per (col, level).
  const groups = useMemo(() => {
    const out: Array<{col: number; level: number; count: number; order: number}> = [];
    let order = 0;
    columns.forEach((c, ci) => {
      [...levels].reverse().forEach((lv) => {
        const count = c.dots.filter((d) => Math.abs(d - lv) < 1e-6).length;
        if (count > 0) out.push({col: ci, level: lv, count, order: order++});
      });
    });
    return out;
  }, [columns, levels]);

  const GROUP_STAGGER = 4;

  // ---- layout ----
  const pad = Math.round(width * 0.05);
  const headerH = 108;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2 - headerH;
  const axisW = 150;
  const colFooterH = 74;
  const inset = {left: axisW, right: 40, top: 40, bottom: colFooterH};
  const plotW = cardW - inset.left - inset.right;
  const plotH = cardH - inset.top - inset.bottom;
  const rowH = plotH / levels.length;
  const colW = plotW / columns.length;

  const isHl = (colLabel: string, v: number) =>
    !!highlight &&
    highlight.column === colLabel &&
    (highlight.min === undefined || v >= highlight.min - 1e-9) &&
    (highlight.max === undefined || v <= highlight.max + 1e-9);

  const hlLocal = local - highlightAt;
  const hlActive = !!highlight && hlLocal >= 0;
  // Hard blink 3x, then hold.
  const hlBlinkOn = hlActive ? (hlLocal < 12 ? Math.floor(hlLocal / 2) % 2 === 0 : true) : false;
  const chipS = hlActive
    ? spring({frame: hlLocal, fps, config: {damping: 12, stiffness: 280, mass: 0.7}, durationInFrames: 12})
    : 0;

  if (local < 0) return null;

  // Tick SFX: one per group entrance, capped.
  const tickAts = groups.map((g) => appearFrame + 6 + g.order * GROUP_STAGGER).filter((_, i) => i % 2 === 0).slice(0, 14);

  return (
    <AbsoluteFill style={{background: COLORS.canvas, padding: pad}}>
      {/* header */}
      <div
        style={{
          height: headerH,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 24,
        }}
      >
        <div style={{display: 'flex', alignItems: 'center', gap: 20, minWidth: 0}}>
          <span
            style={{
              fontFamily: PIXEL_FAMILY,
              fontSize: 17,
              background: COLORS.ink,
              color: COLORS.gold,
              padding: '10px 14px',
              letterSpacing: '0.06em',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}
          >
            THE DOTS
          </span>
          <span
            style={{
              fontFamily: PIXEL_FAMILY,
              fontSize: 30,
              color: COLORS.ink,
              textShadow: `5px 5px 0 ${inkAlpha(0.15)}`,
              whiteSpace: 'nowrap',
            }}
          >
            {title.toUpperCase()}
          </span>
        </div>
        {subtitle ? (
          <span
            style={{
              fontFamily: MONO_FAMILY,
              fontWeight: 700,
              fontSize: 19,
              lineHeight: 1.55,
              letterSpacing: '0.08em',
              color: COLORS.mutedText,
              textAlign: 'right',
              paddingTop: 8,
              maxWidth: 560,
              flexShrink: 0,
            }}
          >
            {subtitle.toUpperCase()}
          </span>
        ) : null}
      </div>

      {/* card */}
      <div
        style={{
          width: cardW,
          height: cardH,
          background: COLORS.card,
          border: pixelBorder(4),
          boxShadow: hardShadow(inkAlpha(0.18), 2),
          position: 'relative',
        }}
      >
        {/* y axis: rate levels + gridlines */}
        {levels.map((lv, li) => {
          const y = inset.top + li * rowH + rowH / 2;
          return (
            <React.Fragment key={lv}>
              <div
                style={{
                  position: 'absolute',
                  left: inset.left,
                  right: inset.right,
                  top: y - 1,
                  height: 2,
                  background: COLORS.grid,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  width: axisW - 26,
                  top: y - 14,
                  textAlign: 'right',
                  fontFamily: MONO_FAMILY,
                  fontWeight: 700,
                  fontSize: 23,
                  color: COLORS.mutedText,
                }}
              >
                {lv.toFixed(3).replace(/0+$/, '').replace(/\.$/, '.0')}%
              </div>
            </React.Fragment>
          );
        })}
        {/* column separators + labels */}
        {columns.map((c, ci) => {
          const x0 = inset.left + ci * colW;
          return (
            <React.Fragment key={c.label}>
              {ci > 0 ? (
                <div
                  style={{
                    position: 'absolute',
                    left: x0,
                    top: inset.top - 12,
                    bottom: inset.bottom - 8,
                    width: 3,
                    background: inkAlpha(0.18),
                  }}
                />
              ) : null}
              <div
                style={{
                  position: 'absolute',
                  left: x0,
                  width: colW,
                  bottom: 16,
                  textAlign: 'center',
                  fontFamily: PIXEL_FAMILY,
                  fontSize: 25,
                  color: COLORS.ink,
                }}
              >
                {c.label.toUpperCase()}
              </div>
            </React.Fragment>
          );
        })}

        {/* dots */}
        {groups.map((g) => {
          const gAt = 6 + g.order * GROUP_STAGGER;
          const col = columns[g.col];
          const li = levels.findIndex((lv) => Math.abs(lv - g.level) < 1e-6);
          const y = inset.top + li * rowH + rowH / 2;
          const rowW = g.count * DOT + (g.count - 1) * DOT_GAP;
          const x0 = inset.left + g.col * colW + (colW - rowW) / 2;
          const hlDot = isHl(col.label, g.level);
          return Array.from({length: g.count}).map((_, di) => {
            const dl = local - gAt - di;
            if (dl < 0) return null;
            const ds = spring({
              frame: dl,
              fps,
              config: {damping: 13, stiffness: 320, mass: 0.6},
              durationInFrames: 10,
            });
            const flash = hlActive && hlDot;
            const dimmed = hlActive && !hlDot;
            return (
              <div
                key={`${g.order}-${di}`}
                style={{
                  position: 'absolute',
                  left: x0 + di * (DOT + DOT_GAP),
                  top: y - DOT / 2,
                  width: DOT,
                  height: DOT,
                  background: flash ? (hlBlinkOn ? COLORS.magenta : COLORS.ink) : COLORS.ink,
                  boxShadow: `4px 4px 0 ${inkAlpha(0.22)}`,
                  border: flash ? `3px solid ${COLORS.ink}` : 'none',
                  opacity: (dimmed ? 0.3 : 1) * Math.min(1, ds * 2),
                  transform: `translateY(${(1 - ds) * -46}px) scale(${flash && hlBlinkOn ? 1.22 : 0.6 + 0.4 * ds})`,
                }}
              />
            );
          });
        })}

        {/* highlight chip */}
        {hlActive && highlightLabel ? (
          <div
            style={{
              position: 'absolute',
              right: 44,
              top: 34,
              fontFamily: PIXEL_FAMILY,
              fontSize: 27,
              color: COLORS.card,
              background: COLORS.magenta,
              border: pixelBorder(4),
              boxShadow: hardShadow(inkAlpha(0.3), 1.2),
              padding: '16px 22px',
              transform: `scale(${1.4 - 0.4 * chipS}) rotate(${(1 - chipS) * -3}deg)`,
              opacity: Math.min(1, chipS * 2.5),
            }}
          >
            {highlightLabel.toUpperCase()}
          </div>
        ) : null}
      </div>

      {/* SFX: drop ticks + alarm on the flash */}
      {tickAts.map((f) => (
        <Sequence key={f} from={f} durationInFrames={6} name={`Dot tick ${f}`} layout="none">
          <Audio src={staticFile('assets/sfx/tick.wav')} volume={0.26} />
        </Sequence>
      ))}
      {highlight ? (
        <Sequence
          from={appearFrame + highlightAt}
          durationInFrames={22}
          name="Dot flash"
          layout="none"
        >
          <Audio src={staticFile('assets/sfx/alarm.wav')} volume={0.32} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
