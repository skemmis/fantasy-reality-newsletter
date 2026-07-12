import React from 'react';
import {
  AbsoluteFill,
  Loop,
  OffthreadVideo,
  Sequence,
  random,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {AssetEntry, assetSrc} from '../assets';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';
import {CoinRain} from '../fx/CoinRain';
import {SpriteLoop} from './SpriteLoop';

/**
 * The money-printer beat: Veo's broll/veo-printer.mp4 full-bleed (looped,
 * via OffthreadVideo), a CoinRain burst over it, "BRRRR" stamps, and the
 * goblin money-shower sprite popping bottom-right when the art exists.
 * With no broll in the manifest it falls back to the printer-loop sprite on
 * canvas — same beat, house placeholder.
 */
export interface MoneyPrinterBeatProps {
  /** Manifest entry for broll/veo-printer.mp4. */
  printer?: AssetEntry | null;
  /** Manifest loop entry for the coin sprite (confetti-coin / coin-loop). */
  coin?: AssetEntry | null;
  /** Manifest loop entry for loops/printer-* (fallback centerpiece). */
  printerLoop?: AssetEntry | null;
  /** Manifest entry for mascot/v2/money-shower.png. */
  goblin?: AssetEntry | null;
  /** Frames of the source broll (8s @30 = 240). */
  brollDurationInFrames?: number;
  caption?: string;
  /** Local frame the coin burst starts. */
  coinsAt?: number;
  seed?: string | number;
}

const BRRR_STAMPS = [
  {at: 26, x: '18%', y: '24%', rot: -8, size: 84},
  {at: 52, x: '74%', y: '18%', rot: 6, size: 66},
  {at: 84, x: '64%', y: '70%', rot: -5, size: 96},
  {at: 122, x: '22%', y: '66%', rot: 7, size: 72},
] as const;

export const MoneyPrinterBeat: React.FC<MoneyPrinterBeatProps> = ({
  printer = null,
  coin = null,
  printerLoop = null,
  goblin = null,
  brollDurationInFrames = 240,
  caption = 'MONEY PRINTER: ON',
  coinsAt = 14,
  seed = 'printer',
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();

  const goblinS =
    frame < 20
      ? 0
      : spring({frame: frame - 20, fps, config: {damping: 12, stiffness: 240, mass: 0.8}, durationInFrames: 14});

  return (
    <AbsoluteFill style={{background: COLORS.canvas}}>
      {/* backdrop: broll when present, printer-loop sprite on canvas else */}
      {printer ? (
        <Loop durationInFrames={Math.max(1, brollDurationInFrames - 1)} name="Printer broll loop">
          <OffthreadVideo
            src={assetSrc(printer.file)}
            style={{width: '100%', height: '100%', objectFit: 'cover'}}
            muted
          />
        </Loop>
      ) : (
        <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
          <SpriteLoop asset={printerLoop} fallbackSrc={undefined} fps={8} size={560} />
        </AbsoluteFill>
      )}

      {/* ink frame to keep it in the house look */}
      <AbsoluteFill style={{border: `12px solid ${COLORS.ink}`, pointerEvents: 'none'}} />

      {/* BRRRR stamps */}
      {BRRR_STAMPS.map((s, i) => {
        const t = frame - s.at;
        if (t < 0) return null;
        const pop = spring({frame: t, fps, config: {damping: 10, stiffness: 320, mass: 0.6}, durationInFrames: 10});
        const wobble = ((Math.floor(frame / 3) + i) % 2 === 0 ? 1 : -1) * 1.5;
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: s.x,
              top: s.y,
              fontFamily: PIXEL_FAMILY,
              fontSize: s.size,
              color: COLORS.gold,
              textShadow: `7px 7px 0 ${inkAlpha(0.9)}`,
              rotate: `${s.rot + wobble}deg`,
              scale: String(1.8 - 0.8 * pop),
              opacity: Math.min(1, pop * 2) * (t > 70 ? Math.max(0, 1 - (t - 70) / 10) : 1),
            }}
          >
            BRRRR
          </div>
        );
      })}

      {/* coin shower */}
      <CoinRain seed={`${seed}-rain`} count={34} coin={coin} burstFrame={coinsAt} />
      {/* second wave, no double ka-ching */}
      <CoinRain seed={`${seed}-rain2`} count={26} coin={coin} burstFrame={coinsAt + 70} sfx={false} />

      {/* goblin money-shower pop (only when the art exists) */}
      {goblin ? (
        <div
          style={{
            position: 'absolute',
            right: '5%',
            bottom: -18,
            translate: `0px ${((1 - goblinS) * 340).toFixed(1)}px`,
          }}
        >
          <SpriteLoop asset={goblin} fps={6} size={430} />
        </div>
      ) : null}

      {/* caption chip */}
      <div style={{position: 'absolute', top: 44, left: 0, right: 0, display: 'flex', justifyContent: 'center'}}>
        <span
          style={{
            fontFamily: MONO_FAMILY,
            fontWeight: 700,
            fontSize: 34,
            letterSpacing: '0.14em',
            color: COLORS.ink,
            background: COLORS.gold,
            border: pixelBorder(4),
            boxShadow: hardShadow(inkAlpha(0.3)),
            padding: '12px 30px',
            rotate: `${(random(`${seed}-cap`) * 2 - 1).toFixed(2)}deg`,
          }}
        >
          {caption.toUpperCase()}
        </span>
      </div>

      {/* extra ka-ching on the second wave, quieter */}
      <Sequence from={coinsAt + 70} durationInFrames={30} name="Second ka-ching" layout="none">
        <Audio src={staticFile('assets/sfx/ka-ching.wav')} volume={0.26} />
      </Sequence>
    </AbsoluteFill>
  );
};
