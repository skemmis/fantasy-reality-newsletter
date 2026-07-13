import React from 'react';
import {
  AbsoluteFill,
  Img,
  Loop,
  OffthreadVideo,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
  Easing,
} from 'remotion';
import {Audio} from '@remotion/media';
import {Market} from '../types';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';
import {OddsCounter} from '../components/OddsCounter';
import {SpriteLoop} from '../components/SpriteLoop';
import {AssetEntry, assetSrc} from '../assets';

/**
 * Episode-agnostic beat-scene builders and plumbing shared by every
 * episode composition (fedhike, agi2027, shutdown, the Shorts cuts).
 * Episode files own only their data: BEATS table, headlines, dot columns,
 * asset picks, and the <Sequence> assembly.
 */

/* ------------------------------------------------------------------ */
/* Beat clock: BEATS table -> absolute frame anchors                   */
/* ------------------------------------------------------------------ */

export interface Beat<Id extends string = string> {
  readonly id: Id;
  readonly est: number; // seconds, mirrors episode.yaml
  /**
   * Manual timing knob (episode.yaml `nudge:`): shift THIS beat's start by
   * ±N frames after VO/est timing is computed. Does NOT cascade — the
   * neighbouring beats' anchors are untouched; this beat and its predecessor
   * absorb the shift in their durations (beats keep tiling with no gaps).
   * Never changes total episode duration. Default 0.
   */
  readonly nudge?: number;
  /**
   * Manual timing knob (episode.yaml `hold:`): extend THIS beat by N extra
   * frames. DOES cascade — every subsequent beat starts `hold` frames later
   * and the total composition duration grows by `hold`. Default 0.
   */
  readonly hold?: number;
}

/**
 * Turn a BEATS table (`[{id, est, nudge?, hold?}, ...]` — ids + second
 * estimates mirroring public/episodes/<slug>/episode.yaml) into frame helpers:
 *   start(id)  absolute frame the beat begins (nominal anchor + its nudge)
 *   frames(id) the beat's length in frames (beats always tile: a beat ends
 *              exactly where the next beat's possibly-nudged start is)
 *   duration   total composition length in frames (est + holds; nudges
 *              never change it)
 */
export const makeBeatClock = <Id extends string>(
  beats: ReadonlyArray<Beat<Id>>,
  fps: number,
) => {
  // Nominal anchor: preceding beats' est frames + their cascading holds.
  const anchor = (id: Id): number => {
    let at = 0;
    for (const b of beats) {
      if (b.id === id) return at;
      at += b.est * fps + (b.hold ?? 0);
    }
    return at;
  };
  const start = (id: Id): number =>
    anchor(id) + (beats.find((b) => b.id === id)?.nudge ?? 0);
  const frames = (id: Id): number => {
    const i = beats.findIndex((b) => b.id === id);
    if (i < 0) return 0;
    const b = beats[i];
    const next = beats[i + 1];
    // Own length (est + hold), minus own nudge (start moved, end anchored),
    // plus the next beat's nudge (our end follows its nudged start).
    return b.est * fps + (b.hold ?? 0) - (b.nudge ?? 0) + (next?.nudge ?? 0);
  };
  const duration = beats.reduce((a, b) => a + b.est * fps + (b.hold ?? 0), 0);
  return {start, frames, duration};
};

/* ------------------------------------------------------------------ */
/* Overlay cues: beat-local frame offsets with an optional ±nudge      */
/* ------------------------------------------------------------------ */

/**
 * An overlay cue (episode.yaml `overlays[].at` + optional `nudge:`): the
 * beat-local frame an overlay fires at, shiftable by ±N frames without
 * touching anything else (a nudge moves only its own overlay).
 */
export type Cue = number | {readonly at: number; readonly nudge?: number};

/** Resolve a Cue to its effective beat-local frame. */
export const cueFrame = (c: Cue): number =>
  typeof c === 'number' ? c : c.at + (c.nudge ?? 0);

/** Resolve a table of Cues to plain frame numbers (`cues({wipe: {at: 550}})`). */
export const cues = <K extends string>(table: Record<K, Cue>): Record<K, number> => {
  const out = {} as Record<K, number>;
  for (const k in table) out[k] = cueFrame(table[k]);
  return out;
};

/** staticFile URL for a named one-shot in public/assets/sfx/. */
export const sfx = (name: string) => staticFile(`assets/sfx/${name}.wav`);

/** Linear-interpolated series value at time t (ms). `times` = parsed point timestamps. */
export const valueAt = (market: Market, tms: number, times: number[]): number => {
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

/** 2-frame hard white flash (+ optional thud) at a cut point. */
export const CutFlash: React.FC<{at: number; thud?: boolean}> = ({at, thud = true}) => (
  <>
    <Sequence from={at} durationInFrames={2} name="Cut flash">
      <AbsoluteFill style={{background: '#ffffff'}} />
    </Sequence>
    {thud ? (
      <Sequence from={at} durationInFrames={14} name="Cut thud" layout="none">
        <Audio src={sfx('thud')} volume={0.45} />
      </Sequence>
    ) : null}
  </>
);

/** Setup-beat stat card (accent value plate + mono label, e.g. "51% | HIKE by Dec 31 2026"). */
export const StatCard: React.FC<{
  label: string;
  value: string;
  accent: string;
  appearFrame: number;
}> = ({label, value, accent, appearFrame}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < appearFrame) return null;
  const s = spring({
    frame: frame - appearFrame,
    fps,
    config: {damping: 12, stiffness: 240, mass: 0.7},
    durationInFrames: 12,
  });
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'stretch',
        background: COLORS.cream,
        border: pixelBorder(4),
        boxShadow: hardShadow(inkAlpha(0.3), 1.4),
        scale: String(0.7 + 0.3 * s),
        opacity: s,
      }}
    >
      <span
        style={{
          fontFamily: PIXEL_FAMILY,
          fontSize: 44,
          color: COLORS.card,
          background: accent,
          padding: '20px 22px',
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {value}
      </span>
      <span
        style={{
          fontFamily: MONO_FAMILY,
          fontWeight: 700,
          fontSize: 28,
          color: COLORS.ink,
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </span>
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Cold open: Veo b-roll full-frame under the huge odds counter.       */
/* Portrait-aware (also opens the Shorts cut).                         */
/* ------------------------------------------------------------------ */

export const ColdOpenStorm: React.FC<{
  storm: AssetEntry | null;
  pct: number;
  question?: string;
}> = ({storm, pct, question = 'ODDS THE FED HIKES BY DEC 31, 2026'}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const portrait = height > width;

  const rolled = interpolate(frame, [10, 68], [Math.max(0, pct - 28), pct], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.16, 1, 0.3, 1),
  });
  const panelS = spring({
    frame: frame - 6,
    fps,
    config: {damping: 13, stiffness: 260, mass: 0.8},
    durationInFrames: 12,
  });

  return (
    <AbsoluteFill style={{background: COLORS.ink}}>
      {storm ? (
        <Loop durationInFrames={239} name="Storm broll loop">
          <OffthreadVideo
            src={assetSrc(storm.file)}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
            muted
          />
        </Loop>
      ) : (
        <AbsoluteFill style={{background: COLORS.ink}} />
      )}
      {/* ink wash + house frame for contrast */}
      <AbsoluteFill style={{background: inkAlpha(0.34)}} />
      <AbsoluteFill style={{border: `12px solid ${COLORS.ink}`, pointerEvents: 'none'}} />

      <AbsoluteFill
        style={{justifyContent: 'center', alignItems: 'center', gap: portrait ? 54 : 44}}
      >
        <div
          style={{
            fontFamily: MONO_FAMILY,
            fontWeight: 700,
            fontSize: portrait ? 28 : 30,
            letterSpacing: '0.32em',
            color: COLORS.ink,
            background: COLORS.cream,
            border: pixelBorder(3),
            boxShadow: hardShadow(inkAlpha(0.4)),
            padding: '10px 26px 10px 32px',
          }}
        >
          RIGHT NOW ON KALSHI
        </div>
        {/* the counter panel */}
        <div
          style={{
            background: COLORS.card,
            border: pixelBorder(6),
            boxShadow: hardShadow(inkAlpha(0.55), 2),
            padding: portrait ? '30px 44px' : '26px 60px',
            scale: String(0.7 + 0.3 * panelS),
            opacity: Math.min(1, panelS * 2.5),
          }}
        >
          <OddsCounter value={rolled} size={portrait ? 190 : 220} color={COLORS.ink} />
        </div>
        <div
          style={{
            fontFamily: PIXEL_FAMILY,
            fontSize: portrait ? 26 : 30,
            lineHeight: 1.7,
            color: COLORS.ink,
            background: COLORS.gold,
            border: pixelBorder(4),
            boxShadow: hardShadow(inkAlpha(0.45), 1.2),
            padding: '18px 30px',
            maxWidth: '80%',
            textAlign: 'center',
          }}
        >
          {question}
        </div>
      </AbsoluteFill>
      {/* SFX: slam + roll ticks */}
      <Sequence from={6} durationInFrames={14} name="Panel thud" layout="none">
        <Audio src={sfx('thud')} volume={0.5} />
      </Sequence>
      {[20, 34, 48].map((f) => (
        <Sequence key={f} from={f} durationInFrames={8} name={`Roll tick ${f}`} layout="none">
          <Audio src={sfx('tick')} volume={0.3} />
        </Sequence>
      ))}
    </AbsoluteFill>
  );
};

/* ------------------------------------------------------------------ */
/* News desk: backdrop + goblin composited BEHIND the desk (a slice    */
/* of the backdrop is re-drawn over the sprite's lower body).          */
/* ------------------------------------------------------------------ */

export const DESK_SLICE_TOP = 0.585; // fraction of frame height where the desk re-draw starts

export const DeskShot: React.FC<{
  backdrop: AssetEntry | null;
  /** Talking-head loop entry (talk beat) or a static mascot entry. */
  sprite: AssetEntry | null;
  /** Cycle the sprite's loop frames (anchor talking) vs hold frame 1. */
  talk?: boolean;
  spriteSize?: number;
  spriteTop?: number;
  children?: React.ReactNode;
}> = ({backdrop, sprite, talk = true, spriteSize = 640, spriteTop = 175, children}) => {
  const {width, height} = useVideoConfig();
  const bg = backdrop ? assetSrc(backdrop.file) : null;
  const sliceTop = Math.round(DESK_SLICE_TOP * height);
  const staticSprite =
    sprite && !talk ? (
      <Img
        src={assetSrc(sprite.alpha ?? sprite.file)}
        style={{width: spriteSize, height: spriteSize, objectFit: 'contain'}}
      />
    ) : (
      <SpriteLoop asset={sprite} fps={6} size={spriteSize} />
    );
  return (
    <AbsoluteFill style={{background: COLORS.canvas}}>
      {bg ? (
        <Img src={bg} style={{width, height, objectFit: 'fill'}} />
      ) : (
        <AbsoluteFill style={{background: COLORS.cream}} />
      )}
      {/* the anchor, seated behind the desk */}
      <div style={{position: 'absolute', left: '50%', top: spriteTop, translate: '-50% 0'}}>
        {staticSprite}
      </div>
      {/* re-draw the desk over the sprite's lower body */}
      {bg ? (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: sliceTop,
            bottom: 0,
            overflow: 'hidden',
          }}
        >
          <Img
            src={bg}
            style={{position: 'absolute', left: 0, top: -sliceTop, width, height, objectFit: 'fill'}}
          />
        </div>
      ) : null}
      {children}
    </AbsoluteFill>
  );
};

/** Blinking LIVE chip, top-left. */
export const LiveChip: React.FC<{text?: string}> = ({text = 'LIVE · KALSHI WATCH'}) => {
  const frame = useCurrentFrame();
  const on = Math.floor(frame / 8) % 2 === 0;
  return (
    <div
      style={{
        position: 'absolute',
        top: 44,
        left: 48,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        background: COLORS.cream,
        border: pixelBorder(3),
        boxShadow: hardShadow(inkAlpha(0.3)),
        padding: '10px 18px',
      }}
    >
      <div style={{width: 18, height: 18, background: on ? COLORS.red : inkAlpha(0.25)}} />
      <span
        style={{
          fontFamily: MONO_FAMILY,
          fontWeight: 700,
          fontSize: 24,
          letterSpacing: '0.18em',
          color: COLORS.ink,
        }}
      >
        {text}
      </span>
    </div>
  );
};

/** Broadcast lower-third: name plate + snark line. */
export const LowerThird: React.FC<{name: string; sub: string; appearFrame?: number}> = ({
  name,
  sub,
  appearFrame = 0,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < appearFrame) return null;
  const s = spring({
    frame: frame - appearFrame,
    fps,
    config: {damping: 13, stiffness: 240, mass: 0.7},
    durationInFrames: 12,
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: 64,
        bottom: 96,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        translate: `${(1 - s) * -60}px 0px`,
        opacity: Math.min(1, s * 2),
      }}
    >
      <div
        style={{
          fontFamily: PIXEL_FAMILY,
          fontSize: 34,
          color: COLORS.ink,
          background: COLORS.gold,
          border: pixelBorder(4),
          boxShadow: hardShadow(inkAlpha(0.3)),
          padding: '14px 24px',
        }}
      >
        {name.toUpperCase()}
      </div>
      <div
        style={{
          fontFamily: MONO_FAMILY,
          fontWeight: 700,
          fontSize: 23,
          letterSpacing: '0.05em',
          color: COLORS.ink,
          background: COLORS.cream,
          border: pixelBorder(3),
          boxShadow: hardShadow(inkAlpha(0.25)),
          padding: '8px 18px',
          marginTop: -4,
          marginLeft: 18,
        }}
      >
        {sub.toUpperCase()}
      </div>
    </div>
  );
};

/** Gold statement chip that slams in (used on chart + calm-desk shots). */
export const PunchChip: React.FC<{
  text: string;
  appearFrame?: number;
  x?: string;
  y?: string;
  rotate?: number;
  fontSize?: number;
}> = ({text, appearFrame = 0, x = '50%', y = '78%', rotate = -2, fontSize = 34}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < appearFrame) return null;
  const s = spring({
    frame: frame - appearFrame,
    fps,
    config: {damping: 11, stiffness: 300, mass: 0.7},
    durationInFrames: 12,
  });
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        transform: `translate(-50%, -50%) scale(${1.5 - 0.5 * s}) rotate(${rotate}deg)`,
        opacity: Math.min(1, s * 2.5),
        fontFamily: PIXEL_FAMILY,
        fontSize,
        lineHeight: 1.6,
        color: COLORS.ink,
        background: COLORS.gold,
        border: pixelBorder(5),
        boxShadow: hardShadow(inkAlpha(0.3), 1.2),
        padding: '18px 28px',
        textAlign: 'center',
        whiteSpace: 'nowrap',
      }}
    >
      {text.toUpperCase()}
    </div>
  );
};
