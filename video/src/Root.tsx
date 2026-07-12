import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {TestChart} from './TestChart';
import {FedHikeEpisode, FEDHIKE_DURATION} from './episodes/fedhike';
import {makeEpisodeMetadata, EpisodeProps} from './load-episode';
import {makeEpisodeAssetsMetadata, EpisodeAssetsProps} from './assets';
import {HEADLINE_SHOT, SHOT_REEL_DURATION, ShotReel, ShotReelProps} from './ShotReel';

const FPS = 30;

/**
 * Use the real jobs-headline screenshot when the art pipeline has produced
 * it by render time; otherwise ShotReel draws its generated placeholder.
 */
const shotReelMetadata: CalculateMetadataFunction<ShotReelProps> = async ({props}) => {
  if (typeof props.headlineSrc === 'string') return {props};
  try {
    const res = await fetch(staticFile(HEADLINE_SHOT));
    return {props: {...props, headlineSrc: res.ok ? HEADLINE_SHOT : null}};
  } catch {
    return {props: {...props, headlineSrc: null}};
  }
};

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
        defaultProps={{data: null, assets: null} satisfies EpisodeAssetsProps}
        calculateMetadata={makeEpisodeAssetsMetadata('fedhike')}
      />
      <Composition
        id="ShotReel"
        component={ShotReel}
        durationInFrames={SHOT_REEL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{headlineSrc: null} satisfies ShotReelProps}
        calculateMetadata={shotReelMetadata}
      />
    </>
  );
};
