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
import {AnnotationCallout} from './AnnotationCallout';

export type RevealSpec =
  | number // static fraction of the full series, 0-1
  | string // static ISO timestamp
  | {startFrame: number; endFrame: number; from?: number; to?: number};

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
  curve?: 'step' | 'linear';
  zoom?: ZoomSpec;
}

const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
const fmtDate = (ms: number) => {
  const d = new Date(ms);
  return `${MONTHS[d.getUTCMonth()]} ${d.getUTCDate()}`;
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

export const MarketChartScene: React.FC<MarketChartSceneProps> = ({
  data,
  marketTicker,
  window: chartWindow,
  reveal = 1,
  showCursor = true,
  showCounter = true,
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

  // ---- reveal fraction of the FULL series -------------------------------
  let revealFrac: number;
  let revealFrameFor: (frac: number) => number; // frame at which reveal passes frac
  if (typeof reveal === 'number') {
    revealFrac = reveal;
    revealFrameFor = (frac) => (frac <= reveal ? 0 : Infinity);
  } else if (typeof reveal === 'string') {
    const f = (Date.parse(reveal) - tMin) / (tMax - tMin);
    revealFrac = f;
    revealFrameFor = (frac) => (frac <= f ? 0 : Infinity);
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
  if (revealedIdx.length > 0 && fullPath) {
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
  const yTicks = y.ticks(portrait ? 4 : 5);
  const xTicks = x.ticks(portrait ? 4 : 6).map((d) => d.getTime());

  // ---- counter / delta ---------------------------------------------------
  const firstValue = market.points[0].p;
  const delta = tipValue - firstValue;
  const deltaUp = delta >= 0;

  const cursorBlink = Math.floor(frame / 8) % 2 === 0;
  const seriesColor = tokens.series[market.slot % tokens.series.length];

  const counterSize = portrait ? 96 : 116;

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
              gap: 14,
            }}
          >
            <OddsCounter value={tipValue} size={counterSize} color={COLORS.ink} />
            <div style={{display: 'flex', gap: 12, alignItems: 'center'}}>
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
                  fill={COLORS.mutedText}
                >
                  {t}%
                </text>
              </g>
            ))}
            {xTicks.map((t) => (
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
                  y={plotH + 38}
                  textAnchor="middle"
                  fontFamily={MONO_FAMILY}
                  fontWeight={700}
                  fontSize={21}
                  fill={COLORS.mutedText}
                  letterSpacing="0.06em"
                >
                  {fmtDate(t)}
                </text>
              </g>
            ))}
            {/* 50% reference */}
            {yDomain[0] < 50 && yDomain[1] > 50 ? (
              <line
                x1={0}
                x2={plotW}
                y1={y(50)}
                y2={y(50)}
                stroke={inkAlpha(0.25)}
                strokeWidth={2}
                strokeDasharray="10 8"
                shapeRendering="crispEdges"
              />
            ) : null}
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
              {/* annotations */}
              {data.annotations
                .filter((a) => !a.market || a.market === market.ticker)
                .map((a, i) => {
                  const at = Date.parse(a.t);
                  const ax = x(at);
                  if (ax < 8 || ax > plotW - 8) return null;
                  const frac = (at - tMin) / (tMax - tMin);
                  return (
                    <AnnotationCallout
                      key={i}
                      x={ax}
                      y={y(valueAt(market, at, times))}
                      dx={a.dx}
                      dy={a.dy}
                      label={a.label}
                      frame={frame}
                      appearFrame={revealFrameFor(frac)}
                      accent={i % 2 === 0 ? COLORS.magenta : COLORS.red}
                    />
                  );
                })}
              {/* now-cursor: pixel square riding the tip */}
              {showCursor ? (
                <g transform={`translate(${tip.x}, ${tip.y})`}>
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
