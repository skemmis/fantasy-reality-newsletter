import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {EpisodeData} from './types';
import {sampleEpisode} from './sample-data';
import {COLORS} from './theme/theme';
import {KineticTitle} from './components/KineticTitle';
import {MarketChartScene} from './components/MarketChartScene';
import {annotationFracs, buildBeatReveal} from './reveal';

const DAY = 24 * 60 * 60 * 1000;

/**
 * ~20s @ 30fps proving composition:
 *   0-2s    KineticTitle
 *   2s-...  MarketChartScene beat-paced draw-on: fast ease to each
 *           annotation, ~1.3s hold while the callout is read, continue.
 *   then    zoom into the last 60 days.
 */
export const TestChart: React.FC<{data: EpisodeData | null}> = ({data}) => {
  const episode = data ?? sampleEpisode();
  const market = episode.markets[0];
  const last = market.points[market.points.length - 1];
  const first = market.points[0];
  const end = Date.parse(last.t);
  const zoomWindow = {
    start: new Date(end - 60 * DAY).toISOString(),
    end: new Date(end + 2 * DAY).toISOString(),
  };

  // Mirror the scene's internal reveal plan to schedule the zoom after it.
  const beatSpec = {beats: true as const, startFrame: 12, drawFrames: 220, holdFrames: 40};
  const plan = buildBeatReveal(
    annotationFracs(
      episode.annotations
        .filter((a) => !a.market || a.market === market.ticker)
        .map((a) => a.t),
      Date.parse(first.t),
      end,
    ),
    beatSpec,
  );

  return (
    <AbsoluteFill style={{background: COLORS.canvas}}>
      <Sequence durationInFrames={60} name="Title">
        <KineticTitle
          title={`THE MARKET SAYS ${Math.round(last.p)}%`}
          accentWords={[3]}
          kicker="THE TAPE · KALSHI"
          stagger={6}
        />
      </Sequence>
      <Sequence from={60} name="The Tape">
        <MarketChartScene
          data={episode}
          reveal={beatSpec}
          zoom={{window: zoomWindow, atFrame: plan.endFrame + 20, durationInFrames: 80}}
          showCursor
          showCounter
          curve="step"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
