import {EpisodeData, PricePoint, VolumePoint} from './types';

/** Deterministic PRNG so renders are reproducible. */
const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

const DAY = 24 * 60 * 60 * 1000;

/**
 * Fallback episode: a plausible 100-point daily random walk between
 * 40 and 60 percent, used until the real fedhike data.json exists.
 */
export const sampleEpisode = (): EpisodeData => {
  const rand = mulberry32(0xfed);
  const n = 100;
  const end = Date.parse('2026-07-10T12:00:00Z');
  const start = end - (n - 1) * DAY;

  const points: PricePoint[] = [];
  const volume: VolumePoint[] = [];
  let p = 52;
  for (let i = 0; i < n; i++) {
    const t = new Date(start + i * DAY).toISOString();
    // Random walk with occasional news-shock jumps.
    const shock = rand() < 0.06 ? (rand() - 0.5) * 14 : 0;
    p += (rand() - 0.5) * 2.6 + shock;
    // Soft pull toward the 40-60 band.
    if (p > 60) p -= (p - 60) * 0.5;
    if (p < 40) p += (40 - p) * 0.5;
    p = Math.min(64, Math.max(36, p));
    points.push({t, p: Math.round(p * 10) / 10});
    volume.push({t, v: Math.round(20000 + rand() * 180000 + Math.abs(shock) * 60000)});
  }

  const last = points[points.length - 1];

  return {
    slug: 'fedhike',
    markets: [
      {
        ticker: 'FEDHIKE-26',
        name: 'Fed rate hike in 2026?',
        slot: 0,
        points,
        volume,
      },
    ],
    annotations: [
      {
        t: points[22].t,
        label: 'CPI comes in hot\nmarket jumps',
        dx: -40,
        dy: -90,
      },
      {
        t: points[55].t,
        label: 'Powell: "no urgency"',
        dx: 20,
        dy: 80,
      },
      {
        t: points[86].t,
        label: 'jobs report whiffs\nodds slide',
        dx: -160,
        dy: -110,
      },
    ],
    meta: {
      title: 'THE MARKET SAYS: FED HIKE?',
      generated_at: new Date(end).toISOString(),
      interval: '1d',
      last_price_pct: last.p,
      volume_usd: volume.reduce((a, b) => a + b.v, 0),
    },
  };
};
