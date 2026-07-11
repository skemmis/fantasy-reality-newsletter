import React, {useMemo} from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {scaleLinear, scaleTime} from 'd3-scale';
import {line, curveStepAfter, curveLinear} from 'd3-shape';
import {evolvePath, getLength, getPointAtLength} from '@remotion/paths';
import {EpisodeData, Market} from '../types';
import {COLORS, tokens, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';
import {OddsCounter} from './OddsCounter';
import {AnnotationCallout, calloutBox} from './AnnotationCallout';
import {buildBeatReveal, BeatRevealPlan} from '../reveal';

export type RevealSpec =
  | number // static fraction of the full series, 0-1
  | string // static ISO timestamp
  | {startFrame: number; endFrame: number; from?: number; to?: number}
  | {
      // Beat-paced: draw fast to each annotation, hold while the callout
      // is read, continue. See src/reveal.ts.
      beats: true;
      startFrame: number;
      drawFrames: number;
      holdFrames?: number;
      from?: number;
      to?: number;
    };

export interface ChartWindow {
  start: string;
  end: string;
}

export interface ZoomSpec {
  window: ChartWindow;
  atFrame: number;
  durationInFrames: number;
}

export interface MarketChartSceneProps {
  data: EpisodeData;
  marketTicker?: string;
  window?: ChartWindow;
  reveal?: RevealSpec;
  showCursor?: boolean;
  showCounter?: boolean;
  showAnnotations?: boolean;
  curve?: 'step' | 'linear';
  zoom?: ZoomSpec;
}

const DAY = 24 * 60 * 60 * 1000;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const fmtDayLabel = (ms: number) => {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
};
const fmtFullDate = (ms: number) => {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()} ${d.getUTCFullYear()}`;
};
const fmtVol = (v: number) =>
  v >= 1e6 ? `$${(v / 1e6).toFixed(1)}M` : v >= 1e3 ? `$${Math.round(v / 1e3)}K` : `$${v}`;

/** Linear-interpolated series value at time t (ms). */
const valueAt = (market: Market, tms: number, times: number[]): number => {
  const pts = market.points;
  if (tms <= times[0]) return pts[0].p;
  if (tms >= times[times.length - 1]) return pts[pts.length - 1].p;
  let lo = 0;
  let hi = times.length - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (times[mid] <= tms) lo = mid;
    else hi = mid;
  }
  const f = (tms - times[lo]) / (times[hi] - times[lo]);
  return pts[lo].p + f * (pts[hi].p - pts[lo].p);
};

/**
 * X ticks: quarterly (JAN/APR/JUL/OCT, labeled with year) for long spans,
 * monthly for mid spans, ~biweekly day labels for zoomed windows.
 */
const xTicksFor = (d0: number, d1: number): Array<{t: number; label: string}> => {
  const spanDays = (d1 - d0) / DAY;
  const out: Array<{t: number; label: string}> = [];
  if (spanDays <= 100) {
    const step = spanDays <= 40 ? 7 : 14;
    let t = Math.ceil(d0 / DAY) * DAY;
    for (; t <= d1; t += step * DAY) {
      out.push({t, label: fmtDayLabel(t)});
    }
    return out;
  }
  const stepMonths = spanDays > 330 ? 3 : 1;
  const d = new Date(d0);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  while (d.getUTCMonth() % stepMonths !== 0 || d.getTime() < d0) {
    d.setUTCMonth(d.getUTCMonth() + 1);
  }
  while (d.getTime() <= d1) {
    const m = d.getUTCMonth();
    out.push({
      t: d.getTime(),
      label:
        stepMonths === 3 || m === 0
          ? `${MONTHS[m]} ${d.getUTCFullYear()}`
          : MONTHS[m],
    });
    d.setUTCMonth(m + stepMonths);
  }
  return out;
};

interface PlacedCallout {
  key: number;
  ax: number;
  ay: number;
  bx: number;
  by: number;
  w: number;
  h: number;
  label: string;
  frac: number;
  accent: string;
}

const intersects = (
  a: {bx: number; by: number; w: number; h: number},
  b: {bx: number; by: number; w: number; h: number},
  margin = 12,
) =>
  a.bx - margin < b.bx + b.w &&
  a.bx + a.w + margin > b.bx &&
  a.by - margin < b.by + b.h &&
  a.by + a.h + margin > b.by;

export const MarketChartScene: React.FC<MarketChartSceneProps> = ({
  data,
  marketTicker,
  window: chartWindow,
  reveal = 1,
  showCursor = true,
  showCounter = true,
  showAnnotations = true,
  curve = 'step',
  zoom,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const portrait = height > width;

  const market =
    data.markets.find((m) => m.ticker === marketTicker) ?? data.markets[0];
  const times = useMemo(() => market.points.map((pt) => Date.parse(pt.t)), [market]);
  const tMin = times[0];
  const tMax = times[times.length - 1];

  const annList = useMemo(
    () => data.annotations.filter((a) => !a.market || a.market === market.ticker),
    [data.annotations, market.ticker],
  );

  // ---- reveal fraction of the FULL series -------------------------------
  const beatPlan: BeatRevealPlan | null = useMemo(() => {
    if (typeof reveal === 'object' && 'beats' in reveal) {
      const fracs = annList.map((a) => (Date.parse(a.t) - tMin) / (tMax - tMin));
      return buildBeatReveal(fracs, reveal);
    }
    return null;
  }, [reveal, annList, tMin, tMax]);

  let revealFrac: number;
  let revealFrameFor: (frac: number) => number; // frame at which reveal passes frac
  if (beatPlan) {
    revealFrac = beatPlan.fracAt(frame);
    revealFrameFor = beatPlan.frameFor;
  } else if (typeof reveal === 'number') {
    revealFrac = reveal;
    revealFrameFor = (frac) => (frac <= reveal ? 0 : Infinity);
  } else if (typeof reveal === 'string') {
    const f = (Date.parse(reveal) - tMin) / (tMax - tMin);
    revealFrac = f;
    revealFrameFor = (frac) => (frac <= f ? 0 : Infinity);
  } else if ('beats' in reveal) {
    // Unreachable: the beats variant is handled by beatPlan above.
    revealFrac = 0;
    revealFrameFor = () => Infinity;
  } else {
    const {startFrame, endFrame, from = 0, to = 1} = reveal;
    revealFrac = interpolate(frame, [startFrame, endFrame], [from, to], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
    revealFrameFor = (frac) =>
      frac <= from
        ? startFrame
        : frac > to
          ? Infinity
          : startFrame + ((frac - from) / (to - from)) * (endFrame - startFrame);
  }
  revealFrac = Math.max(0, Math.min(1, revealFrac));
  const revealT = tMin + revealFrac * (tMax - tMin);

  // Which annotation hold (if any) is running, and its 0->1->0 ramp.
  const holdIndex = beatPlan ? beatPlan.holdAt(frame) : null;
  const holdRamp = beatPlan ? beatPlan.holdRamp(frame) : 0;

  // ---- x/y domains (with animated zoom) ---------------------------------
  const baseDomain: [number, number] = chartWindow
    ? [Date.parse(chartWindow.start), Date.parse(chartWindow.end)]
    : [tMin, tMax];

  const yExtentFor = (d0: number, d1: number): [number, number] => {
    let lo = 100;
    let hi = 0;
    for (let i = 0; i < times.length; i++) {
      if (times[i] >= d0 - 1 && times[i] <= d1 + 1) {
        lo = Math.min(lo, market.points[i].p);
        hi = Math.max(hi, market.points[i].p);
      }
    }
    if (lo > hi) [lo, hi] = [0, 100];
    return [Math.max(0, Math.floor(lo / 10) * 10 - 5), Math.min(100, Math.ceil(hi / 10) * 10 + 5)];
  };

  let xDomain: [number, number] = baseDomain;
  let yDomain = yExtentFor(baseDomain[0], baseDomain[1]);
  if (zoom) {
    const zp = spring({
      frame: frame - zoom.atFrame,
      fps,
      config: {damping: 200, stiffness: 60, mass: 1},
      durationInFrames: zoom.durationInFrames,
    });
    const z0 = Date.parse(zoom.window.start);
    const z1 = Date.parse(zoom.window.end);
    const zy = yExtentFor(z0, z1);
    xDomain = [
      interpolate(zp, [0, 1], [baseDomain[0], z0]),
      interpolate(zp, [0, 1], [baseDomain[1], z1]),
    ];
    yDomain = [
      interpolate(zp, [0, 1], [yDomain[0], zy[0]]),
      interpolate(zp, [0, 1], [yDomain[1], zy[1]]),
    ];
  }

  // ---- layout ------------------------------------------------------------
  const pad = Math.round(width * (portrait ? 0.06 : 0.042));
  const headerH = portrait ? Math.round(height * 0.185) : 185;
  const footerH = 54;
  const gap = 30;
  const cardW = width - pad * 2;
  const cardH = height - pad * 2 - headerH - footerH - gap * 2;
  const inset = {
    left: portrait ? 84 : 96,
    right: portrait ? 36 : 48,
    top: 44,
    bottom: 64,
  };
  const plotW = cardW - inset.left - inset.right - 8; // 8 = border x2
  const plotH = cardH - inset.top - inset.bottom - 8;

  const x = scaleTime().domain([new Date(xDomain[0]), new Date(xDomain[1])]).range([0, plotW]);
  const y = scaleLinear().domain(yDomain).range([plotH, 0]);

  // ---- paths -------------------------------------------------------------
  const mkLine = line<number>()
    .x((i) => x(times[i]))
    .y((i) => y(market.points[i].p))
    .curve(curve === 'step' ? curveStepAfter : curveLinear);

  const allIdx = times.map((_, i) => i);
  const fullPath = mkLine(allIdx) ?? '';

  const tipValue = valueAt(market, revealT, times);
  const stepTipValue =
    curve === 'step'
      ? market.points[Math.max(0, times.findLastIndex((t) => t <= revealT))].p
      : tipValue;
  const tipX = x(revealT);
  const tipY = y(stepTipValue);

  // Partial path (prefix of fullPath) to derive an exact evolution fraction.
  const revealedIdx = allIdx.filter((i) => times[i] <= revealT);
  let evolution = 0;
  if (revealedIdx.length > 0 && fullPath && revealFrac > 0) {
    const prefix = mkLine(revealedIdx) ?? '';
    const prefixWithTip =
      revealT > times[revealedIdx[revealedIdx.length - 1]]
        ? `${prefix} L ${tipX} ${tipY}`
        : prefix;
    const total = getLength(fullPath);
    evolution = total > 0 ? Math.min(1, getLength(prefixWithTip) / total) : 0;
  }
  const evolved = evolvePath(evolution, fullPath);
  const tip =
    fullPath && evolution > 0
      ? getPointAtLength(fullPath, getLength(fullPath) * evolution)
      : {x: x(tMin), y: y(market.points[0].p)};

  // ---- ticks -------------------------------------------------------------
  const yStep = yDomain[1] - yDomain[0] > 45 ? 20 : 10;
  const yTicks: number[] = [];
  for (let v = Math.ceil(yDomain[0] / yStep) * yStep; v <= yDomain[1]; v += yStep) {
    yTicks.push(v);
  }
  const xTicks = xTicksFor(xDomain[0], xDomain[1]).filter(
    ({t}) => x(t) >= 24 && x(t) <= plotW - 24,
  );
  const has50 = yDomain[0] < 50 && yDomain[1] > 50;

  // ---- annotation callout layout (clamp + collision nudging) -------------
  // Boxes must stay inside the plot, never sit on the series line (which
  // also keeps them off the riding tip cursor), and never overlap each
  // other. Placement is derived from the domain only, so boxes are stable
  // while the line draws on.
  const placed: PlacedCallout[] = [];
  const lineYAtPx = (px: number) =>
    y(valueAt(market, (x.invert(px) as Date).getTime(), times));
  const overlapsLine = (r: {bx: number; by: number; w: number; h: number}) => {
    const x0 = Math.max(0, r.bx - 8);
    const x1 = Math.min(plotW, r.bx + r.w + 8);
    for (let sx = x0; sx <= x1; sx += 18) {
      const ly = lineYAtPx(sx);
      if (ly > r.by - 14 && ly < r.by + r.h + 14) return true;
    }
    return false;
  };
  if (showAnnotations) {
    annList.forEach((a, i) => {
      const at = Date.parse(a.t);
      const ax = x(at);
      if (ax < 8 || ax > plotW - 8) return;
      const ay = y(valueAt(market, at, times));
      const {w, h} = calloutBox(a.label);
      const dx = a.dx ?? 0;
      const dy = a.dy ?? -40;
      // dy < 0: box floats above the anchor; dy >= 0: below.
      const clampX = (v: number) => Math.max(10, Math.min(plotW - w - 10, v));
      const clampY = (v: number) => Math.max(10, Math.min(plotH - h - 10, v));
      const bx0 = clampX(ax + dx - w / 2);
      const by0 = clampY(dy < 0 ? ay + dy - h - 20 : ay + dy + 20);
      const clearAt = (bx: number, by: number) => {
        const r = {bx, by, w, h};
        return !overlapsLine(r) && !placed.some((o) => intersects(r, o));
      };
      let bx = bx0;
      let by = by0;
      let found = false;
      // Sweep vertically (up first), then widen horizontally.
      for (let hx = 0; hx <= 6 && !found; hx++) {
        for (const candX of hx === 0 ? [bx0] : [bx0 - hx * 60, bx0 + hx * 60]) {
          const cx2 = clampX(candX);
          for (let step = 0; step <= 14 && !found; step++) {
            for (const candY of step === 0 ? [by0] : [by0 - step * 26, by0 + step * 26]) {
              if (candY < 10 || candY > plotH - h - 10) continue;
              if (clearAt(cx2, candY)) {
                bx = cx2;
                by = candY;
                found = true;
                break;
              }
            }
          }
          if (found) break;
        }
      }
      placed.push({
        key: i,
        ax,
        ay,
        bx,
        by,
        w,
        h,
        label: a.label,
        frac: (at - tMin) / (tMax - tMin),
        accent: i % 2 === 0 ? COLORS.magenta : COLORS.red,
      });
    });
  }
  const activeCallout =
    holdIndex !== null && beatPlan
      ? placed.find((p) => Math.abs(p.frac - beatPlan.stops[holdIndex].frac) < 1e-6) ?? null
      : null;

  // ---- counter / delta ---------------------------------------------------
  const firstValue = market.points[0].p;
  const delta = tipValue - firstValue;
  const deltaUp = delta >= 0;

  // Cursor blink slows + dims while a hold is running.
  const blinkPeriod = holdIndex !== null ? 24 : 8;
  const cursorBlink = Math.floor(frame / blinkPeriod) % 2 === 0;
  const seriesColor = tokens.series[market.slot % tokens.series.length];

  const counterSize = portrait ? 96 : 116;
  const atToday = revealFrac >= 0.995;

  // Prefer the episode question over a terse slot name; size to fit.
  const headline = (
    data.meta.title?.length > market.name.length ? data.meta.title : market.name
  )
    .replace(/\?$/, '?')
    .toUpperCase();
  const headlineSize = portrait
    ? headline.length > 36
      ? 21
      : 26
    : headline.length > 44
      ? 27
      : 34;

  const dimOpacity = 0.15 * holdRamp;

  return (
    <AbsoluteFill style={{background: COLORS.canvas, padding: pad}}>
      {/* ---------- header ---------- */}
      <div
        style={{
          height: headerH,
          display: 'flex',
          flexDirection: portrait ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: portrait ? 'flex-start' : 'flex-end',
          gap: portrait ? 26 : 0,
          marginBottom: gap,
        }}
      >
        <div style={{display: 'flex', flexDirection: 'column', gap: 22}}>
          <div style={{display: 'flex', gap: 14, alignItems: 'center'}}>
            <span
              style={{
                fontFamily: PIXEL_FAMILY,
                fontSize: 17,
                background: COLORS.ink,
                color: COLORS.gold,
                padding: '10px 14px',
                letterSpacing: '0.06em',
              }}
            >
              THE TAPE
            </span>
            <span
              style={{
                fontFamily: MONO_FAMILY,
                fontWeight: 700,
                fontSize: 22,
                background: COLORS.cream,
                border: pixelBorder(3),
                color: COLORS.ink,
                padding: '6px 12px',
              }}
            >
              KALSHI:{market.ticker}
            </span>
          </div>
          <div
            style={{
              fontFamily: PIXEL_FAMILY,
              fontSize: headlineSize,
              lineHeight: 1.55,
              color: COLORS.ink,
              maxWidth: portrait ? cardW : cardW - 640,
            }}
          >
            {headline}
          </div>
        </div>
        {showCounter ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: portrait ? 'flex-start' : 'flex-end',
              gap: 12,
            }}
          >
            <OddsCounter value={tipValue} size={counterSize} color={COLORS.ink} />
            <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
              {/* Date readout: which point of history the odometer shows. */}
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontWeight: 700,
                  fontSize: 22,
                  letterSpacing: '0.1em',
                  color: atToday ? COLORS.ink : COLORS.mutedText,
                  background: atToday ? COLORS.gold : COLORS.cream,
                  border: pixelBorder(3),
                  boxShadow: hardShadow(inkAlpha(0.2), 0.5),
                  padding: '4px 12px',
                }}
              >
                {atToday ? 'TODAY' : fmtFullDate(revealT)}
              </span>
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontWeight: 700,
                  fontSize: 22,
                  color: COLORS.card,
                  background: deltaUp ? tokens.yes : tokens.no,
                  border: pixelBorder(3),
                  boxShadow: hardShadow(inkAlpha(0.2), 0.5),
                  padding: '4px 12px',
                }}
              >
                {deltaUp ? '+' : ''}
                {delta.toFixed(1)}
              </span>
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontWeight: 700,
                  fontSize: 20,
                  letterSpacing: '0.12em',
                  color: COLORS.mutedText,
                }}
              >
                YES ODDS
              </span>
            </div>
          </div>
        ) : null}
      </div>

      {/* ---------- chart card ---------- */}
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
        <svg
          width={cardW - 8}
          height={cardH - 8}
          style={{display: 'block'}}
        >
          <defs>
            <clipPath id="plot-clip">
              <rect x={0} y={-6} width={plotW + 12} height={plotH + 12} />
            </clipPath>
          </defs>
          <g transform={`translate(${inset.left}, ${inset.top})`}>
            {/* grid */}
            {yTicks.map((t) => (
              <g key={`y${t}`}>
                <line
                  x1={0}
                  x2={plotW}
                  y1={y(t)}
                  y2={y(t)}
                  stroke={COLORS.grid}
                  strokeWidth={2}
                  shapeRendering="crispEdges"
                />
                <text
                  x={-18}
                  y={y(t) + 8}
                  textAnchor="end"
                  fontFamily={MONO_FAMILY}
                  fontWeight={700}
                  fontSize={22}
                  fill={t === 50 ? COLORS.ink : COLORS.mutedText}
                >
                  {t}%
                </text>
              </g>
            ))}
            {xTicks.map(({t, label}) => (
              <g key={`x${t}`}>
                <line
                  x1={x(t)}
                  x2={x(t)}
                  y1={0}
                  y2={plotH}
                  stroke={COLORS.grid}
                  strokeWidth={2}
                  shapeRendering="crispEdges"
                />
                <text
                  x={x(t)}
                  y={plotH + 40}
                  textAnchor="middle"
                  fontFamily={MONO_FAMILY}
                  fontWeight={700}
                  fontSize={22}
                  fill={COLORS.mutedText}
                  letterSpacing="0.05em"
                >
                  {label}
                </text>
              </g>
            ))}
            {/* 50% reference: the coin-flip line */}
            {has50
              ? (() => {
                  const tagW = 238;
                  // Dodge callout boxes: try right-above, right-below,
                  // left-above, left-below; take the first clear slot.
                  const midX = Math.round((plotW - tagW) / 2);
                  const slots = [
                    {x: plotW - 14 - tagW, yOff: -36},
                    {x: plotW - 14 - tagW, yOff: 8},
                    {x: midX, yOff: -36},
                    {x: midX, yOff: 8},
                    {x: 14, yOff: -36},
                    {x: 14, yOff: 8},
                  ];
                  const slot =
                    slots.find((s) => {
                      const r = {bx: s.x, by: y(50) + s.yOff, w: tagW, h: 30};
                      return (
                        !placed.some((p) => intersects(r, p, 6)) && !overlapsLine(r)
                      );
                    }) ??
                    slots.find(
                      (s) =>
                        !placed.some((p) =>
                          intersects({bx: s.x, by: y(50) + s.yOff, w: tagW, h: 30}, p, 6),
                        ),
                    ) ??
                    slots[0];
                  const tagX = slot.x;
                  const tagYOff = slot.yOff;
                  return (
                    <g>
                      <line
                        x1={0}
                        x2={plotW}
                        y1={y(50)}
                        y2={y(50)}
                        stroke={inkAlpha(0.4)}
                        strokeWidth={3}
                        strokeDasharray="12 9"
                        shapeRendering="crispEdges"
                      />
                      <g transform={`translate(${tagX}, ${y(50) + tagYOff + 36})`}>
                        <rect
                          x={0}
                          y={-36}
                          width={tagW}
                          height={30}
                          fill={COLORS.card}
                          stroke={inkAlpha(0.4)}
                          strokeWidth={2}
                          shapeRendering="crispEdges"
                        />
                        <text
                          x={tagW / 2}
                          y={-14}
                          textAnchor="middle"
                          fontFamily={MONO_FAMILY}
                          fontWeight={700}
                          fontSize={17}
                          letterSpacing="0.06em"
                          fill={COLORS.mutedText}
                        >
                          50% — COIN FLIP
                        </text>
                      </g>
                    </g>
                  );
                })()
              : null}
            {/* plot frame */}
            <rect
              x={0}
              y={0}
              width={plotW}
              height={plotH}
              fill="none"
              stroke={COLORS.ink}
              strokeWidth={3}
              shapeRendering="crispEdges"
            />

            <g clipPath="url(#plot-clip)">
              {/* line shadow (hard offset, no blur) */}
              <g transform="translate(5, 6)" opacity={0.14}>
                <path
                  d={fullPath}
                  fill="none"
                  stroke={COLORS.ink}
                  strokeWidth={7}
                  strokeDasharray={evolved.strokeDasharray}
                  strokeDashoffset={evolved.strokeDashoffset}
                />
              </g>
              {/* the line */}
              <path
                d={fullPath}
                fill="none"
                stroke={seriesColor}
                strokeWidth={7}
                strokeLinejoin="miter"
                strokeLinecap="square"
                strokeDasharray={evolved.strokeDasharray}
                strokeDashoffset={evolved.strokeDashoffset}
              />
              {/* non-active annotations (dimmed under the wash during holds) */}
              {placed
                .filter((p) => p !== activeCallout)
                .map((p) => (
                  <AnnotationCallout
                    key={p.key}
                    x={p.ax}
                    y={p.ay}
                    boxX={p.bx}
                    boxY={p.by}
                    boxW={p.w}
                    boxH={p.h}
                    label={p.label}
                    frame={frame}
                    appearFrame={revealFrameFor(p.frac)}
                    accent={p.accent}
                  />
                ))}
              {/* now-cursor: pixel square riding the tip */}
              {showCursor && revealFrac > 0 ? (
                <g transform={`translate(${tip.x}, ${tip.y})`} opacity={1 - 0.3 * holdRamp}>
                  <rect
                    x={-13}
                    y={-13}
                    width={26}
                    height={26}
                    fill={cursorBlink ? COLORS.gold : COLORS.card}
                    stroke={COLORS.ink}
                    strokeWidth={4}
                    shapeRendering="crispEdges"
                  />
                  <rect
                    x={-5}
                    y={-5}
                    width={10}
                    height={10}
                    fill={COLORS.ink}
                    shapeRendering="crispEdges"
                  />
                </g>
              ) : null}
              {/* dim wash while a callout hold runs; active callout above it */}
              {dimOpacity > 0.004 ? (
                <rect
                  x={-6}
                  y={-6}
                  width={plotW + 12}
                  height={plotH + 12}
                  fill={COLORS.card}
                  opacity={dimOpacity}
                />
              ) : null}
              {activeCallout ? (
                <AnnotationCallout
                  x={activeCallout.ax}
                  y={activeCallout.ay}
                  boxX={activeCallout.bx}
                  boxY={activeCallout.by}
                  boxW={activeCallout.w}
                  boxH={activeCallout.h}
                  label={activeCallout.label}
                  frame={frame}
                  appearFrame={revealFrameFor(activeCallout.frac)}
                  accent={activeCallout.accent}
                  active
                />
              ) : null}
            </g>
          </g>
        </svg>
      </div>

      {/* ---------- footer ---------- */}
      <div
        style={{
          height: footerH,
          marginTop: gap,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          fontFamily: MONO_FAMILY,
          fontWeight: 700,
          fontSize: 21,
          letterSpacing: '0.1em',
          color: COLORS.mutedText,
        }}
      >
        <span>
          VOL {fmtVol(data.meta.volume_usd)} · INTERVAL {data.meta.interval.toUpperCase()}
        </span>
        <span>DATA: KALSHI · NOT FINANCIAL ADVICE</span>
      </div>
    </AbsoluteFill>
  );
};
