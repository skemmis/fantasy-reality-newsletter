import React from 'react';
import {CalculateMetadataFunction, Composition, staticFile} from 'remotion';
import {TestChart} from './TestChart';
import {FedHikeEpisode, FEDHIKE_DURATION} from './episodes/fedhike';
import {makeEpisodeMetadata, EpisodeProps} from './load-episode';
import {fetchAssetManifest, makeEpisodeAssetsMetadata, EpisodeAssetsProps} from './assets';
import {HEADLINE_SHOT, SHOT_REEL_DURATION, ShotReel, ShotReelProps} from './ShotReel';
import {SHOT_REEL2_DURATION, ShotReel2, ShotReel2Props} from './ShotReel2';
import {
  INTRO_STING_DURATION,
  IntroStingStandalone,
  IntroStingStandaloneProps,
} from './components/IntroSting';

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

/** IntroSting only needs the art manifest. */
const stingMetadata: CalculateMetadataFunction<IntroStingStandaloneProps> = async ({props}) => ({
  props: {...props, assets: props.assets ?? (await fetchAssetManifest())},
});

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
        defaultProps={
          {data: null, assets: null, crt: true, progressBar: true} satisfies EpisodeAssetsProps
        }
        calculateMetadata={makeEpisodeAssetsMetadata('fedhike')}
      />
      <Composition
        id="ShotReel"
        component={ShotReel}
        durationInFrames={SHOT_REEL_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{headlineSrc: null, crt: true} satisfies ShotReelProps}
        calculateMetadata={shotReelMetadata}
      />
      <Composition
        id="ShotReel2"
        component={ShotReel2}
        durationInFrames={SHOT_REEL2_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{data: null, assets: null} satisfies ShotReel2Props}
        calculateMetadata={makeEpisodeAssetsMetadata('fedhike')}
      />
      <Composition
        id="IntroSting"
        component={IntroStingStandalone}
        durationInFrames={INTRO_STING_DURATION}
        fps={FPS}
        width={1920}
        height={1080}
        defaultProps={{assets: null} satisfies IntroStingStandaloneProps}
        calculateMetadata={stingMetadata}
      />
    </>
  );
};
