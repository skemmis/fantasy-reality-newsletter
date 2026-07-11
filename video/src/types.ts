/** A single price observation. `t` is an ISO timestamp, `p` is percent 0-100. */
export interface PricePoint {
  t: string;
  p: number;
}

/** A single volume observation. `t` is an ISO timestamp, `v` is USD volume. */
export interface VolumePoint {
  t: string;
  v: number;
}

export interface Market {
  ticker: string;
  name: string;
  slot: number;
  points: PricePoint[];
  volume: VolumePoint[];
}

export interface Annotation {
  /** ISO timestamp the callout points at. */
  t: string;
  /** Label text; `\n` allowed for multi-line callouts. */
  label: string;
  /** Optional pixel offset of the callout box from its anchor point. */
  dx?: number;
  dy?: number;
  /** Optional market ticker this annotation belongs to (defaults to the first market). */
  market?: string;
}

export interface EpisodeMeta {
  title: string;
  generated_at: string;
  interval: string;
  last_price_pct: number;
  volume_usd: number;
}

export interface EpisodeData {
  slug: string;
  markets: Market[];
  annotations: Annotation[];
  meta: EpisodeMeta;
}

/** One transcribed word from the VO, with absolute times in seconds. */
export interface TimedWord {
  w: string;
  start: number;
  end: number;
  /** Index of the script line this word belongs to. */
  line: number;
}

/** One script line / beat. */
export interface TimedLine {
  i: number;
  text: string;
  start: number;
  end: number;
  /** Beat tag, e.g. "hook", "joke", "chart-zoom". */
  beat: string;
}

export interface WordsTimeline {
  /** staticFile-relative path of the VO audio. */
  audio: string;
  /** Total duration in seconds. */
  duration: number;
  words: TimedWord[];
  lines: TimedLine[];
}
