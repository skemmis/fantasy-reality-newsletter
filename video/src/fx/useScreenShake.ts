import {random, useCurrentFrame} from 'remotion';

/**
 * Frame-based decaying screen shake. Deterministic: every offset comes from
 * remotion's seeded random(), never Math.random(), so renders are stable.
 *
 * Usage:
 *   const shake = useScreenShake(slamFrame, {amp: 14});
 *   <div style={{translate: shake.translate, rotate: shake.rotate}} />
 */
export interface ScreenShakeOptions {
  /** Peak translation in px. Default 12. */
  amp?: number;
  /** Peak rotation in degrees. Default 1.2. */
  rotAmp?: number;
  /** Frames until the shake fully dies. Default 18. */
  durationInFrames?: number;
  /** Change the offset every N frames (stepped, retro). Default 1. */
  step?: number;
  /** Seed namespace so co-mounted shakes differ. */
  seed?: string | number;
}

export interface ScreenShake {
  x: number;
  y: number;
  rot: number;
  /** 1 at the trigger, 0 when dead — for tying other FX to the shake. */
  energy: number;
  /** Ready-made CSS `translate` value, e.g. "4px -3px". */
  translate: string;
  /** Ready-made CSS `rotate` value, e.g. "0.8deg". */
  rotate: string;
}

const DEAD: ScreenShake = {x: 0, y: 0, rot: 0, energy: 0, translate: '0px 0px', rotate: '0deg'};

/**
 * Pure version for places that already have the frame (or need several
 * triggers): returns the shake state of `frame` for a shake fired at `at`.
 */
export const screenShakeAt = (
  frame: number,
  at: number,
  options: ScreenShakeOptions = {},
): ScreenShake => {
  const {amp = 12, rotAmp = 1.2, durationInFrames = 18, step = 1, seed = 'shake'} = options;
  const t = frame - at;
  if (t < 0 || t >= durationInFrames) return DEAD;
  // Quadratic decay reads punchier than linear.
  const energy = (1 - t / durationInFrames) ** 2;
  const k = Math.floor(t / Math.max(1, step));
  const r = (salt: string) => random(`${seed}-${at}-${k}-${salt}`) * 2 - 1;
  const x = r('x') * amp * energy;
  const y = r('y') * amp * energy;
  const rot = r('r') * rotAmp * energy;
  return {
    x,
    y,
    rot,
    energy,
    translate: `${x.toFixed(2)}px ${y.toFixed(2)}px`,
    rotate: `${rot.toFixed(3)}deg`,
  };
};

/** Strongest of several shakes (e.g. repeated slams in one scene). */
export const combineShakes = (...shakes: ScreenShake[]): ScreenShake =>
  shakes.reduce((a, b) => (b.energy > a.energy ? b : a), DEAD);

/**
 * Hook form: shake triggered at local frame `at` (or several `at`s).
 * Pass Infinity / an empty array for "never".
 */
export const useScreenShake = (
  at: number | number[],
  options: ScreenShakeOptions = {},
): ScreenShake => {
  const frame = useCurrentFrame();
  const ats = Array.isArray(at) ? at : [at];
  return combineShakes(...ats.map((a) => screenShakeAt(frame, a, options)));
};
