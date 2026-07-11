import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {EpisodeData} from './types';
import {sampleEpisode} from './sample-data';
import {COLORS} from './theme/theme';
import {KineticTitle} from './components/KineticTitle';
import {MarketChartScene} from './components/MarketChartScene';

const DAY = 24 * 60 * 60 * 1000;

/**
 * ~20s @ 30fps proving composition:
 *   0-2s   KineticTitle
 *   2-16s  MarketChartScene draw-on with cursor + counter + annotations
 *   16-20s hold + zoom into the last 60 days
 */
export const TestChart: React.FC<{data: EpisodeData | null}> = ({data}) => {
  const episode = data ?? sampleEpisode();
  const market = episode.markets[0];
  const last = market.points[market.points.length - 1];
  const end = Date.parse(last.t);
  const zoomWindow = {
    start: new Date(end - 60 * DAY).toISOString(),
    end: new Date(end + 2 * DAY).toISOString(),
  };

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
          reveal={{startFrame: 12, endFrame: 400}}
          zoom={{window: zoomWindow, atFrame: 430, durationInFrames: 90}}
          showCursor
          showCounter
          curve="step"
        />
      </Sequence>
    </AbsoluteFill>
  );
};
