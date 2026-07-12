import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {AssetEntry, AssetManifest, assetSrc, resolveAsset} from '../assets';
import {COLORS, inkAlpha} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';
import {COIN_FRAMES, PixelSprite} from '../fx/PixelSprite';

/**
 * 1.6s channel sting: "THE MARKET SAYS" slams in word-by-word over canvas,
 * the goblin pops deadpan from the bottom, a spinning coin sails across the
 * frame, and it punches out on a 2-frame white flash + ka-ching. Mount in a
 * Sequence of INTRO_STING_DURATION frames (the flash pins to the end).
 */
export const INTRO_STING_DURATION = 48;

export interface IntroStingProps {
  /** Manifest entry for the goblin deadpan sprite. */
  goblin?: AssetEntry | null;
  /** Manifest loop entry for the spinning coin. */
  coin?: AssetEntry | null;
  kicker?: string;
}

const WORDS = ['THE', 'MARKET', 'SAYS'];
const WORD_AT = [0, 5, 10];

const COIN_PALETTE: Record<string, string> = {
  g: '#b0761a',
  y: COLORS.gold,
  d: '#17122b',
};

export const IntroSting: React.FC<IntroStingProps> = ({goblin = null, coin = null, kicker}) => {
  const frame = useCurrentFrame();
  const {fps, width, height, durationInFrames} = useVideoConfig();

  const flashAt = durationInFrames - 2;
  const kaChingAt = Math.max(0, durationInFrames - 12);

  // Coin flight: left -> right with a shallow arc, spinning.
  const coinT = interpolate(frame, [6, flashAt - 2], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const coinX = -180 + coinT * (width + 360);
  const coinY = height * 0.42 - Math.sin(coinT * Math.PI) * height * 0.16;
  const coinFrames = coin?.loop && coin.loop.length > 0 ? coin.loop : null;
  const coinStep = Math.floor((frame * 12) / fps);
  const coinSize = 130;

  const goblinS =
    frame < 12
      ? 0
      : spring({frame: frame - 12, fps, config: {damping: 11, stiffness: 260, mass: 0.8}, durationInFrames: 12});

  const fontSize = Math.round(width * 0.062);

  return (
    <AbsoluteFill style={{background: COLORS.canvas, overflow: 'hidden'}}>
      {/* wordmark */}
      <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center', paddingBottom: height * 0.12}}>
        {kicker ? (
          <div
            style={{
              fontFamily: MONO_FAMILY,
              fontWeight: 700,
              fontSize: Math.round(fontSize * 0.24),
              letterSpacing: '0.4em',
              color: COLORS.mutedText,
              marginBottom: fontSize * 0.5,
            }}
          >
            {kicker.toUpperCase()}
          </div>
        ) : null}
        <div style={{display: 'flex', gap: fontSize * 0.5}}>
          {WORDS.map((w, i) => {
            const local = frame - WORD_AT[i];
            if (local < 0) return <span key={w} style={{width: 0}} />;
            const s = spring({
              frame: local,
              fps,
              config: {damping: 12, stiffness: 320, mass: 0.7},
              durationInFrames: 10,
            });
            const jitter = local < 4 ? (local % 2 === 0 ? 3 : -3) : 0;
            const accent = i === 1;
            return (
              <span
                key={w}
                style={{
                  fontFamily: PIXEL_FAMILY,
                  fontSize,
                  lineHeight: 1.1,
                  color: accent ? COLORS.magenta : COLORS.ink,
                  textShadow: `${9 + jitter}px ${9 - jitter}px 0 ${accent ? inkAlpha(0.9) : inkAlpha(0.16)}`,
                  scale: String(1.8 - 0.8 * s),
                  rotate: `${((1 - s) * (i % 2 === 0 ? -4 : 4)).toFixed(2)}deg`,
                }}
              >
                {w}
              </span>
            );
          })}
        </div>
      </AbsoluteFill>

      {/* spinning coin crossing the frame */}
      <div style={{position: 'absolute', left: coinX, top: coinY, rotate: `${(coinT * 40 - 20).toFixed(1)}deg`}}>
        {coinFrames ? (
          <Img
            src={assetSrc(coinFrames[coinStep % coinFrames.length])}
            style={{width: coinSize, height: coinSize, objectFit: 'contain'}}
          />
        ) : (
          <PixelSprite bitmap={COIN_FRAMES[coinStep % COIN_FRAMES.length]} palette={COIN_PALETTE} size={coinSize} />
        )}
      </div>

      {/* goblin deadpan pop, center-bottom */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: -24,
          display: 'flex',
          justifyContent: 'center',
          translate: `0px ${((1 - goblinS) * 380).toFixed(1)}px`,
        }}
      >
        {goblin ? (
          <Img
            src={assetSrc(goblin.alpha ?? goblin.file)}
            style={{width: 360, height: 360, objectFit: 'contain'}}
          />
        ) : (
          <Img
            src={staticFile('assets/mascot/v2/deadpan-alpha.png')}
            style={{width: 360, height: 360, objectFit: 'contain'}}
          />
        )}
      </div>

      {/* 2-frame white flash out */}
      {frame >= flashAt ? <AbsoluteFill style={{background: '#ffffff'}} /> : null}

      {/* SFX */}
      {WORD_AT.map((f) => (
        <Sequence key={f} from={f} durationInFrames={8} name={`Sting blip ${f}`} layout="none">
          <Audio src={staticFile('assets/sfx/blip.wav')} volume={0.38} />
        </Sequence>
      ))}
      <Sequence from={10} durationInFrames={24} name="Sting whoosh" layout="none">
        <Audio src={staticFile('assets/sfx/whoosh-up.wav')} volume={0.3} />
      </Sequence>
      <Sequence from={kaChingAt} durationInFrames={durationInFrames - kaChingAt} name="Sting ka-ching" layout="none">
        <Audio src={staticFile('assets/sfx/ka-ching.wav')} volume={0.5} />
      </Sequence>
    </AbsoluteFill>
  );
};

/**
 * Standalone-composition wrapper: resolves the goblin + coin from the art
 * manifest (renders out/intro-sting.mp4 for reuse across episodes).
 */
export type IntroStingStandaloneProps = {
  assets?: AssetManifest | null;
} & Record<string, unknown>;

export const IntroStingStandalone: React.FC<IntroStingStandaloneProps> = ({assets = null}) => {
  const goblin = resolveAsset(assets, 'mascot-deadpan') ?? resolveAsset(assets, 'deadpan');
  const coin =
    resolveAsset(assets, 'confetti-coin', 'loop') ??
    resolveAsset(assets, 'coin-loop', 'loop') ??
    resolveAsset(assets, 'coin', 'loop');
  return <IntroSting goblin={goblin} coin={coin} kicker="A KALSHI MARKETS SHOW" />;
};
