import React from 'react';
import {Composition} from 'remotion';
import {TestChart} from './TestChart';
import {FedHikeEpisode, FEDHIKE_DURATION} from './episodes/fedhike';
import {makeEpisodeMetadata, EpisodeProps} from './load-episode';

const FPS = 30;

export const Root: React.FC = () => {
  return (
    <>
      <Composition
        id="TestChart"
        component={TestChart}
        durationInFrames={20 * FPS}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{data: null} satisfies EpisodeProps}
        calculateMetadata={makeEpisodeMetadata('fedhike')}
      />
      <Composition
        id="TestChartVertical"
        component={TestChart}
        durationInFrames={20 * FPS}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{data: null} satisfies EpisodeProps}
        calculateMetadata={makeEpisodeMetadata('fedhike')}
      />
      <Composition
        id="PilotFedHike"
        component={FedHikeEpisode}
        durationInFrames={FEDHIKE_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{data: null} satisfies EpisodeProps}
        calculateMetadata={makeEpisodeMetadata('fedhike')}
      />
    </>
  );
};
