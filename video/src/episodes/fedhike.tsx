import React from 'react';
import {AbsoluteFill, Sequence} from 'remotion';
import {EpisodeData, WordsTimeline} from '../types';
import {sampleEpisode} from '../sample-data';
import {COLORS} from '../theme/theme';
import {IntroCam} from '../components/IntroCam';
import {KineticTitle} from '../components/KineticTitle';
import {MarketChartScene} from '../components/MarketChartScene';
import {MemeCutaway} from '../components/MemeCutaway';
import {EndCard} from '../components/EndCard';
import {CaptionLayer} from '../components/CaptionLayer';

const DAY = 24 * 60 * 60 * 1000;

/**
 * Pilot episode skeleton. Segment lengths are placeholders — once the VO is
 * recorded, replace SEGMENTS with times derived from words.json and feed the
 * real WordsTimeline into CaptionLayer.
 */
export const SEGMENTS = {
  introCam: 120, // 4s
  title: 75, // 2.5s
  tape: 420, // 14s
  meme: 75, // 2.5s
  endCard: 150, // 5s
} as const;

export const FEDHIKE_DURATION = Object.values(SEGMENTS).reduce((a, b) => a + b, 0);

/** Placeholder VO timeline (seconds are local to the Tape segment). */
const placeholderWords = (): WordsTimeline => {
  const text =
    'the market says four percent the fed hikes this year and that number is doing something weird';
  const words = text.split(' ');
  const per = 0.34;
  return {
    audio: 'episodes/fedhike/vo.mp3',
    duration: words.length * per,
    words: words.map((w, i) => ({
      w,
      start: i * per,
      end: (i + 1) * per - 0.04,
      line: Math.floor(i / 6),
    })),
    lines: [
      {i: 0, text, start: 0, end: words.length * per, beat: 'hook'},
    ],
  };
};

export const FedHikeEpisode: React.FC<{data: EpisodeData | null}> = ({data}) => {
  const episode = data ?? sampleEpisode();
  const market = episode.markets[0];
  const last = market.points[market.points.length - 1];
  const end = Date.parse(last.t);

  const s = SEGMENTS;
  let at = 0;
  const starts = {
    introCam: (at = 0),
    title: (at += s.introCam),
    tape: (at += s.title),
    meme: (at += s.tape),
    endCard: (at += s.meme),
  };

  return (
    <AbsoluteFill style={{background: COLORS.canvas}}>
      <Sequence durationInFrames={s.introCam} name="IntroCam">
        <IntroCam name="SAM" tagline="definitely a financial professional" />
      </Sequence>

      <Sequence from={starts.title} durationInFrames={s.title} name="Title">
        <KineticTitle
          title={`THE FED WILL NOT HIKE. PROBABLY. ${Math.round(last.p)}%`}
          accentWords={[6]}
          kicker="THE MARKET SAYS · EP 001"
          stagger={5}
        />
      </Sequence>

      <Sequence from={starts.tape} durationInFrames={s.tape} name="The Tape">
        <MarketChartScene
          data={episode}
          reveal={{startFrame: 10, endFrame: 330}}
          zoom={{
            window: {
              start: new Date(end - 60 * DAY).toISOString(),
              end: new Date(end + 2 * DAY).toISOString(),
            },
            atFrame: 345,
            durationInFrames: 60,
          }}
          curve="step"
        />
        {/* Captions ride on top of the chart; swap in the real words.json later. */}
        <CaptionLayer timeline={placeholderWords()} />
      </Sequence>

      <Sequence from={starts.meme} durationInFrames={s.meme} name="MemeCutaway">
        <MemeCutaway caption="the fed, allegedly" credit="meme library slot" />
      </Sequence>

      <Sequence from={starts.endCard} durationInFrames={s.endCard} name="EndCard">
        <EndCard
          entries={[
            {
              market: market.name.toUpperCase(),
              call: `covered @ ${Math.round(last.p)}%`,
              status: 'OPEN',
            },
            {market: 'OPENAI AGI BY 2027', call: 'on the docket', status: 'OPEN'},
            {market: 'GOVT SHUTDOWN OCT', call: 'covered @ 62%', status: 'YES'},
          ]}
        />
      </Sequence>
    </AbsoluteFill>
  );
};
