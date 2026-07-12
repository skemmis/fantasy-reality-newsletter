import React from 'react';
import {
  AbsoluteFill,
  Img,
  Sequence,
  random,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {AssetEntry, assetSrc} from '../assets';
import {COIN_FRAMES, PixelSprite} from './PixelSprite';
import {COLORS} from '../theme/theme';

/**
 * Deterministic particle shower of tumbling pixel coins. Every number comes
 * from remotion's seeded random(seed-…) — NO Math.random — so any frame
 * renders identically on every machine.
 *
 * Pass a manifest loop entry (confetti-coin-* / coin-*) to tumble real art;
 * with no entry it tumbles a procedural 2-frame pixel coin (gold squares).
 */
export interface CoinRainProps {
  /** Namespace for the deterministic randomness. */
  seed?: string | number;
  /** 24-40 recommended. Default 32. */
  count?: number;
  /** Manifest loop entry whose frames are the coin sprite. */
  coin?: AssetEntry | null;
  /** Local frame the shower (and the ka-ching) starts. */
  burstFrame?: number;
  sfx?: boolean;
  /** Scales every coin. */
  scale?: number;
}

const COIN_PALETTE: Record<string, string> = {
  g: '#b0761a',
  y: COLORS.gold,
  d: '#17122b',
};

export const CoinRain: React.FC<CoinRainProps> = ({
  seed = 'coins',
  count = 32,
  coin = null,
  burstFrame = 0,
  sfx = true,
  scale = 1,
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const local = frame - burstFrame;

  const loopFrames = coin?.loop && coin.loop.length > 0 ? coin.loop : null;

  const coins = Array.from({length: count}, (_, i) => {
    const r = (salt: string) => random(`${seed}-coin-${i}-${salt}`);
    const delay = Math.floor(r('delay') * 16);
    const t = local - delay;
    if (t < 0) return null;

    const size = (46 + r('size') * 58) * scale;
    const x0 = r('x') * (width + 200) - 100;
    const drift = (r('drift') * 2 - 1) * 3.2;
    const vy0 = 1.5 + r('vy') * 4;
    const g = 0.85 + r('g') * 0.4;
    const y = -size - 20 + vy0 * t + 0.5 * g * t * t;
    if (y > height + size) return null;
    const x = x0 + drift * t;

    // Tumble: step through the sprite loop at a per-coin rate + spin the div.
    const spinFps = 6 + Math.floor(r('spinfps') * 8);
    const phase = Math.floor(r('phase') * 8);
    const step = Math.floor((t * spinFps) / fps) + phase;
    const rotV = (r('rotv') * 2 - 1) * 7;
    const rot = ((r('rot0') * 360 + rotV * t) % 360).toFixed(1);

    return (
      <div
        key={i}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          rotate: `${rot}deg`,
        }}
      >
        {loopFrames ? (
          <Img
            src={assetSrc(loopFrames[step % loopFrames.length])}
            style={{width: size, height: size, objectFit: 'contain'}}
          />
        ) : (
          <PixelSprite
            bitmap={COIN_FRAMES[step % COIN_FRAMES.length]}
            palette={COIN_PALETTE}
            size={size}
          />
        )}
      </div>
    );
  });

  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {coins}
      {sfx ? (
        <Sequence from={burstFrame} durationInFrames={34} name="Coin ka-ching" layout="none">
          <Audio src={staticFile('assets/sfx/ka-ching.wav')} volume={0.42} />
        </Sequence>
      ) : null}
    </AbsoluteFill>
  );
};
