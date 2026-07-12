import React from 'react';
import {AbsoluteFill, random, useCurrentFrame, useVideoConfig} from 'remotion';
import {inkAlpha} from '../theme/theme';

/**
 * Full-frame retro screen treatment, layered over everything:
 *   - 2px-period scanlines (~6% opacity at intensity 1)
 *   - soft corner vignette
 *   - faint red/cyan fringe hugging the left/right edges
 *   - a 1-frame horizontal "tape tear" roughly every 90 frames (whole-frame
 *     jitter + a bright streak at a deterministic row)
 *
 * Default intensity is tuned for 2+ minute watchability — it should read as
 * texture, not an effect. Use as a wrapper (children render below the
 * treatment) or mount empty as a top overlay.
 *
 * The tear deliberately jitters the container instead of re-rendering
 * children in slices: children may carry <Audio> tags, which must mount
 * exactly once.
 */
export interface CRTOverlayProps {
  /** 0 disables everything, 1 = full strength. Default 0.7. */
  intensity?: number;
  /** Frames between tears (average). 0 disables tears. Default 90. */
  tearEvery?: number;
  children?: React.ReactNode;
}

export const CRTOverlay: React.FC<CRTOverlayProps> = ({
  intensity = 0.7,
  tearEvery = 90,
  children,
}) => {
  const frame = useCurrentFrame();
  const {height} = useVideoConfig();
  const k = Math.max(0, Math.min(1, intensity));

  // ---- 1-frame tear: pick one frame inside each tearEvery-long cycle ----
  let tearing = false;
  let tearY = 0;
  let tearDx = 0;
  if (k > 0 && tearEvery > 0) {
    const cycle = Math.floor(frame / tearEvery);
    const tearFrame = Math.floor(random(`crt-tear-${cycle}`) * tearEvery);
    tearing = frame % tearEvery === tearFrame;
    tearY = (0.15 + 0.7 * random(`crt-tear-y-${cycle}`)) * height;
    tearDx = (random(`crt-tear-dx-${cycle}`) > 0.5 ? 1 : -1) * (5 + 6 * k);
  }

  const scanAlpha = 0.06 * k;
  const fringeAlpha = 0.05 * k;

  return (
    <AbsoluteFill>
      {children ? (
        <AbsoluteFill
          style={{
            translate: tearing ? `${tearDx.toFixed(1)}px 0px` : '0px 0px',
            filter: tearing ? 'brightness(1.06)' : undefined,
          }}
        >
          {children}
        </AbsoluteFill>
      ) : null}
      {k > 0 ? (
        <AbsoluteFill style={{pointerEvents: 'none'}}>
          {/* scanlines: 1px dark / 1px clear */}
          <AbsoluteFill
            style={{
              backgroundImage: `repeating-linear-gradient(to bottom, rgba(23, 18, 43, ${scanAlpha.toFixed(3)}) 0px, rgba(23, 18, 43, ${scanAlpha.toFixed(3)}) 1px, transparent 1px, transparent 2px)`,
            }}
          />
          {/* vignette */}
          <AbsoluteFill
            style={{
              background: `radial-gradient(ellipse 78% 72% at 50% 48%, transparent 62%, ${inkAlpha(0.11 * k)} 100%)`,
            }}
          />
          {/* RGB edge fringe: warm left, cool right */}
          <AbsoluteFill
            style={{
              background: `linear-gradient(to right, rgba(255, 46, 90, ${fringeAlpha.toFixed(3)}) 0%, transparent 3.5%, transparent 96.5%, rgba(46, 210, 255, ${fringeAlpha.toFixed(3)}) 100%)`,
            }}
          />
          {/* tear streak */}
          {tearing ? (
            <div
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: tearY,
                height: 3 + 6 * k,
                background: `rgba(255, 255, 255, ${(0.22 * k).toFixed(3)})`,
                boxShadow: `0 ${tearDx > 0 ? 4 : -4}px 0 rgba(23, 18, 43, ${(0.12 * k).toFixed(3)})`,
              }}
            />
          ) : null}
        </AbsoluteFill>
      ) : null}
    </AbsoluteFill>
  );
};
