/**
 * Beat-paced reveal: instead of one continuous draw-on, the chart draws
 * quickly (ease-out) to each annotation timestamp, HOLDS there while the
 * callout pops and the viewer reads it, then continues to the next stop.
 *
 * Pure math, no React — usable both inside MarketChartScene and from
 * episode files that need to schedule SFX / zooms off the same timeline.
 */

export interface BeatRevealSpec {
  /** Frame (local to the scene) the draw starts. */
  startFrame: number;
  /** Total frames spent actually drawing (excludes holds). */
  drawFrames: number;
  /** Frames paused at each stop while the callout is read. Default 45 (~1.5s). */
  holdFrames?: number;
  /** Reveal fraction range of the full series. Defaults 0 -> 1. */
  from?: number;
  to?: number;
}

interface DrawSegment {
  kind: 'draw';
  f0: number;
  f1: number;
  a: number; // frac at f0
  b: number; // frac at f1
}

interface HoldSegment {
  kind: 'hold';
  f0: number;
  f1: number;
  frac: number;
  /** Index into the stops array (annotation order). */
  stop: number;
}

type Segment = DrawSegment | HoldSegment;

export interface BeatRevealPlan {
  /** Reveal fraction of the full series at a given frame. */
  fracAt: (frame: number) => number;
  /** First frame at which the reveal reaches `frac` (Infinity if never). */
  frameFor: (frac: number) => number;
  /** Index of the stop currently holding at `frame`, or null. */
  holdAt: (frame: number) => number | null;
  /** 0->1->0 ramp inside the current hold (for dimming), 0 outside. */
  holdRamp: (frame: number) => number;
  /** Frame the whole reveal (incl. holds) finishes. */
  endFrame: number;
  /** One entry per stop: the hold window + its fraction. */
  stops: Array<{startFrame: number; endFrame: number; frac: number}>;
}

const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;

/**
 * Build a piecewise reveal curve from annotation fractions.
 * `stopFracs` are fractions of the FULL series (0-1); stops outside
 * (from, to) are dropped; duplicates collapse.
 */
export const buildBeatReveal = (
  stopFracs: number[],
  spec: BeatRevealSpec,
): BeatRevealPlan => {
  const {startFrame, drawFrames, holdFrames = 45, from = 0, to = 1} = spec;

  const stops = [...new Set(stopFracs)]
    .filter((f) => f > from + 1e-6 && f < to - 1e-6)
    .sort((a, b) => a - b);

  // Waypoints from -> s0 -> s1 ... -> to; draw frames proportional to the
  // fraction span with a floor so tiny spans still get a visible dash.
  const waypoints = [from, ...stops, to];
  const weights: number[] = [];
  for (let i = 0; i < waypoints.length - 1; i++) {
    weights.push(Math.max(0.035, waypoints[i + 1] - waypoints[i]));
  }
  const wSum = weights.reduce((a, b) => a + b, 0) || 1;

  const segments: Segment[] = [];
  let cursor = startFrame;
  for (let i = 0; i < waypoints.length - 1; i++) {
    const frames = Math.max(4, Math.round((drawFrames * weights[i]) / wSum));
    segments.push({
      kind: 'draw',
      f0: cursor,
      f1: cursor + frames,
      a: waypoints[i],
      b: waypoints[i + 1],
    });
    cursor += frames;
    if (i < stops.length) {
      segments.push({kind: 'hold', f0: cursor, f1: cursor + holdFrames, frac: stops[i], stop: i});
      cursor += holdFrames;
    }
  }
  const endFrame = cursor;

  const fracAt = (frame: number): number => {
    if (frame <= startFrame) return from;
    if (frame >= endFrame) return to;
    for (const s of segments) {
      if (frame < s.f1) {
        if (s.kind === 'hold') return s.frac;
        const t = (frame - s.f0) / (s.f1 - s.f0);
        return s.a + (s.b - s.a) * easeOutCubic(t);
      }
    }
    return to;
  };

  const frameFor = (frac: number): number => {
    if (frac <= from) return startFrame;
    if (frac > to) return Infinity;
    for (const s of segments) {
      if (s.kind === 'draw' && frac <= s.b + 1e-9) {
        const t = s.b === s.a ? 1 : (frac - s.a) / (s.b - s.a);
        // Invert the ease-out cubic.
        const tf = 1 - (1 - Math.max(0, Math.min(1, t))) ** (1 / 3);
        return s.f0 + tf * (s.f1 - s.f0);
      }
    }
    return endFrame;
  };

  const holdAt = (frame: number): number | null => {
    for (const s of segments) {
      if (s.kind === 'hold' && frame >= s.f0 && frame < s.f1) return s.stop;
    }
    return null;
  };

  const holdRamp = (frame: number): number => {
    for (const s of segments) {
      if (s.kind === 'hold' && frame >= s.f0 && frame < s.f1) {
        const inRamp = Math.min(1, (frame - s.f0) / 7);
        const outRamp = Math.min(1, (s.f1 - frame) / 7);
        return Math.min(inRamp, outRamp);
      }
    }
    return 0;
  };

  return {
    fracAt,
    frameFor,
    holdAt,
    holdRamp,
    endFrame,
    stops: segments
      .filter((s): s is HoldSegment => s.kind === 'hold')
      .map((s) => ({startFrame: s.f0, endFrame: s.f1, frac: s.frac})),
  };
};

/** Annotation timestamps -> fractions of a series spanning [tMin, tMax] ms. */
export const annotationFracs = (
  annotationTimes: string[],
  tMin: number,
  tMax: number,
): number[] =>
  annotationTimes
    .map((t) => (Date.parse(t) - tMin) / (tMax - tMin))
    .filter((f) => f > 0 && f < 1);
