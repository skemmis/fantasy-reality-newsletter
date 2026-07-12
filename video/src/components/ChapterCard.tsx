import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {COLORS, inkAlpha} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';

/**
 * 1s chapter interstitial: full-frame ink card, gold roman numeral slams
 * in, "PART n: TITLE" beside it, and a live ticker-tape underline crawling
 * beneath. Mount in a ~30-45 frame <Sequence>.
 */
export interface ChapterCardProps {
  /** 1-based part number -> roman numeral. */
  part: number;
  title: string;
  /** Tape copy for the underline crawl. */
  tape?: string;
  sfx?: boolean;
}

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X'];

export const ChapterCard: React.FC<ChapterCardProps> = ({
  part,
  title,
  tape = 'THE MARKET SAYS · NOT INVESTMENT ADVICE · PRICES = PROBABILITIES',
  sfx = true,
}) => {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();

  const numeral = ROMANS[Math.max(0, Math.min(ROMANS.length - 1, part - 1))];

  const numS = spring({frame, fps, config: {damping: 11, stiffness: 300, mass: 0.8}, durationInFrames: 10});
  const titleS =
    frame < 4
      ? 0
      : spring({frame: frame - 4, fps, config: {damping: 13, stiffness: 260, mass: 0.7}, durationInFrames: 10});

  const scroll = -((frame * 14) % (width * 0.8));
  const tapeUnit = ` ${tape.toUpperCase()} ·`;
  const tapeText = tapeUnit.repeat(6);

  return (
    <AbsoluteFill style={{background: COLORS.ink, justifyContent: 'center', alignItems: 'center'}}>
      {/* faint grid texture */}
      <AbsoluteFill
        style={{
          backgroundImage: `repeating-linear-gradient(to bottom, rgba(249, 247, 240, 0.04) 0 2px, transparent 2px 44px), repeating-linear-gradient(to right, rgba(249, 247, 240, 0.04) 0 2px, transparent 2px 44px)`,
        }}
      />
      <div style={{display: 'flex', alignItems: 'center', gap: 70}}>
        <span
          style={{
            fontFamily: PIXEL_FAMILY,
            fontSize: 190,
            color: COLORS.gold,
            textShadow: `12px 12px 0 rgba(255, 195, 122, 0.22)`,
            scale: String(2 - numS),
            rotate: `${((1 - numS) * -6).toFixed(2)}deg`,
            opacity: Math.min(1, numS * 3),
            lineHeight: 1,
          }}
        >
          {numeral}
        </span>
        <div style={{display: 'flex', flexDirection: 'column', gap: 26, opacity: Math.min(1, titleS * 2.5)}}>
          <span
            style={{
              fontFamily: MONO_FAMILY,
              fontWeight: 700,
              fontSize: 30,
              letterSpacing: '0.4em',
              color: 'rgba(249, 247, 240, 0.55)',
              translate: `${((1 - titleS) * 40).toFixed(1)}px 0px`,
            }}
          >
            PART {part}
          </span>
          <span
            style={{
              fontFamily: PIXEL_FAMILY,
              fontSize: 74,
              color: COLORS.card,
              textShadow: `8px 8px 0 ${inkAlpha(0.9)}`,
              translate: `${((1 - titleS) * 70).toFixed(1)}px 0px`,
            }}
          >
            {title.toUpperCase()}
          </span>
        </div>
      </div>
      {/* ticker-tape underline */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '68%',
          height: 54,
          borderTop: `4px solid ${COLORS.gold}`,
          borderBottom: `4px solid ${COLORS.gold}`,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
        }}
      >
        <span
          style={{
            fontFamily: MONO_FAMILY,
            fontWeight: 700,
            fontSize: 24,
            letterSpacing: '0.14em',
            color: COLORS.gold,
            whiteSpace: 'nowrap',
            translate: `${scroll}px 0px`,
          }}
        >
          {tapeText}
        </span>
      </div>
      {sfx ? (
        <>
          <Sequence from={0} durationInFrames={12} name="Chapter thud" layout="none">
            <Audio src={staticFile('assets/sfx/thud.wav')} volume={0.45} />
          </Sequence>
          <Sequence from={4} durationInFrames={8} name="Chapter blip" layout="none">
            <Audio src={staticFile('assets/sfx/blip.wav')} volume={0.35} />
          </Sequence>
        </>
      ) : null}
    </AbsoluteFill>
  );
};
