import React from 'react';
import {AbsoluteFill, Img, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {AssetEntry, assetSrc} from '../assets';
import {FLAME_FRAMES, PixelSprite} from './PixelSprite';
import {COLORS} from '../theme/theme';

/**
 * "Everything is on fire" frame: animated pixel flames tiled along all four
 * edges, licking inward. Uses a manifest flame loop (loops/flame-*) when
 * available, else the procedural 2-frame pixel flame. Per-tile phase offsets
 * keep the wall of fire from flapping in unison; a warm gradient bleeds in
 * from every edge underneath the sprites.
 */
export interface FireBorderProps {
  flame?: AssetEntry | null;
  /** Tile size in px. Default 96. */
  tile?: number;
  /** Sprite fps for the flicker. Default 8. */
  flickerFps?: number;
  /** Local frame the fire ignites (tiles pop in staggered). */
  appearFrame?: number;
  /** 0-1: gradient bleed strength. Default 0.8. */
  glow?: number;
  seed?: string | number;
}

const FLAME_PALETTE: Record<string, string> = {
  r: COLORS.red,
  g: '#f08c1e',
  y: COLORS.gold,
};

export const FireBorder: React.FC<FireBorderProps> = ({
  flame = null,
  tile = 96,
  flickerFps = 8,
  appearFrame = 0,
  glow = 0.8,
  seed = 'fire',
}) => {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const local = frame - appearFrame;
  if (local < 0) return null;

  const loopFrames = flame?.loop && flame.loop.length > 0 ? flame.loop : null;
  const frameCount = loopFrames ? loopFrames.length : FLAME_FRAMES.length;

  const renderFlame = (key: string, x: number, y: number, rotate: number, index: number) => {
    const r = (salt: string) => random(`${seed}-${key}-${salt}`);
    const phase = Math.floor(r('phase') * frameCount * 3);
    const step = (Math.floor((local * flickerFps) / fps) + phase) % frameCount;
    // Staggered ignition + per-tile size jitter.
    const bornAt = Math.floor(r('born') * 10);
    const grow = Math.min(1, Math.max(0, (local - bornAt) / 6));
    if (grow <= 0) return null;
    const s = (0.82 + r('size') * 0.36) * grow;
    // Tiny stepped sway.
    const sway = ((Math.floor(local / 4) + index) % 2 === 0 ? 1 : -1) * 2;
    return (
      <div
        key={key}
        style={{
          position: 'absolute',
          left: x,
          top: y,
          width: tile,
          height: tile,
          rotate: `${rotate}deg`,
          scale: String(s),
          translate: `${sway}px 0px`,
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'center',
        }}
      >
        {loopFrames ? (
          <Img
            src={assetSrc(loopFrames[step])}
            style={{width: '100%', height: '100%', objectFit: 'contain'}}
          />
        ) : (
          <PixelSprite bitmap={FLAME_FRAMES[step % FLAME_FRAMES.length]} palette={FLAME_PALETTE} size={tile * 0.8} />
        )}
      </div>
    );
  };

  const cols = Math.ceil(width / (tile * 0.78));
  const rows = Math.ceil(height / (tile * 0.78));
  const tiles: React.ReactNode[] = [];
  for (let i = 0; i < cols; i++) {
    const x = i * tile * 0.78 - tile * 0.2;
    tiles.push(renderFlame(`b-${i}`, x, height - tile * 0.92, 0, i)); // bottom, up
    tiles.push(renderFlame(`t-${i}`, x, -tile * 0.08, 180, i)); // top, down
  }
  for (let j = 1; j < rows - 1; j++) {
    const y = j * tile * 0.78 - tile * 0.2;
    tiles.push(renderFlame(`l-${j}`, -tile * 0.08, y, 90, j)); // left, right-ward
    tiles.push(renderFlame(`r-${j}`, width - tile * 0.92, y, 270, j)); // right, left-ward
  }

  const glowA = 0.34 * glow * Math.min(1, local / 10);

  return (
    <AbsoluteFill style={{pointerEvents: 'none', overflow: 'hidden'}}>
      {/* warm bleed from every edge, under the sprites */}
      <AbsoluteFill
        style={{
          background: [
            `linear-gradient(to top, rgba(226, 64, 80, ${glowA}) 0%, transparent ${Math.round(tile * 1.6)}px)`,
            `linear-gradient(to bottom, rgba(226, 64, 80, ${glowA * 0.8}) 0%, transparent ${Math.round(tile * 1.4)}px)`,
            `linear-gradient(to right, rgba(240, 140, 30, ${glowA * 0.7}) 0%, transparent ${Math.round(tile * 1.4)}px)`,
            `linear-gradient(to left, rgba(240, 140, 30, ${glowA * 0.7}) 0%, transparent ${Math.round(tile * 1.4)}px)`,
          ].join(', '),
        }}
      />
      {tiles}
    </AbsoluteFill>
  );
};
