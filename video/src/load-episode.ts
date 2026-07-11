import {CalculateMetadataFunction, staticFile} from 'remotion';
import {EpisodeData} from './types';
import {sampleEpisode} from './sample-data';

/**
 * Fetch an episode's data.json from public/episodes/<slug>/.
 * Falls back to the deterministic sample series when the file
 * does not exist yet (the Python exporter may not have run).
 */
export const fetchEpisodeData = async (slug: string): Promise<EpisodeData> => {
  try {
    const res = await fetch(staticFile(`episodes/${slug}/data.json`));
    if (!res.ok) {
      throw new Error(`episodes/${slug}/data.json -> HTTP ${res.status}`);
    }
    const data = (await res.json()) as EpisodeData;
    return normalizeEpisode(data);
  } catch {
    return sampleEpisode();
  }
};

/** Guarantee the fields the scenes rely on; synthesize annotations if missing. */
export const normalizeEpisode = (data: EpisodeData): EpisodeData => {
  const markets = (data.markets ?? []).filter((m) => m.points?.length > 1);
  if (markets.length === 0) return sampleEpisode();

  let annotations = data.annotations ?? [];
  if (annotations.length === 0) {
    // Dummy annotations off the primary series: biggest up-move,
    // biggest down-move, and the last point.
    const pts = markets[0].points;
    let up = 1;
    let down = 1;
    for (let i = 1; i < pts.length; i++) {
      const d = pts[i].p - pts[i - 1].p;
      if (d > pts[up].p - pts[up - 1].p) up = i;
      if (d < pts[down].p - pts[down - 1].p) down = i;
    }
    annotations = [
      {t: pts[Math.min(up, down)].t, label: 'something happened\n(annotate me)', dy: -90},
      {t: pts[Math.max(up, down)].t, label: 'and then this', dy: 80},
      {t: pts[Math.max(2, Math.floor(pts.length * 0.9))].t, label: 'the plot thickens', dy: -110, dx: -140},
    ];
  }

  return {...data, markets, annotations};
};

export type EpisodeProps = {
  data: EpisodeData | null;
} & Record<string, unknown>;

/**
 * calculateMetadata factory: resolves episode data before render so every
 * scene receives it as a plain prop (no per-frame delayRender needed).
 */
export const makeEpisodeMetadata =
  (slug: string): CalculateMetadataFunction<EpisodeProps> =>
  async ({props}) => {
    if (props.data) return {props};
    const data = await fetchEpisodeData(slug);
    return {props: {...props, data}};
  };
