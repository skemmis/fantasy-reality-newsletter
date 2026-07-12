import React from 'react';
import {useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, inkAlpha} from '../theme/theme';

/**
 * Thin episode progress bar: pixel segments filling left-to-right with the
 * composition's progress. Mount at the ROOT of a composition (not inside a
 * trimmed <Sequence>) so useCurrentFrame()/durationInFrames reflect the
 * whole episode. The leading segment blinks while filling.
 */
export interface ProgressBarProps {
  /** Distance from the bottom edge in px (sit above the footer). Default 10. */
  bottom?: number;
  /** Number of pixel segments. Default 48. */
  segments?: number;
  /** Bar height in px. Default 12. */
  height?: number;
  color?: string;
  /** Horizontal inset from each side. Default 14. */
  inset?: number;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  bottom = 10,
  segments = 48,
  height = 12,
  color = COLORS.gold,
  inset = 14,
}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const progress = Math.min(1, frame / Math.max(1, durationInFrames - 1));
  const filledExact = progress * segments;
  const filled = Math.floor(filledExact);
  const blinkOn = Math.floor(frame / 6) % 2 === 0;

  return (
    <div
      style={{
        position: 'absolute',
        left: inset,
        right: inset,
        bottom,
        height,
        display: 'flex',
        gap: 3,
        pointerEvents: 'none',
      }}
    >
      {Array.from({length: segments}, (_, i) => {
        const isFilled = i < filled;
        const isLeading = i === filled && progress < 1;
        return (
          <div
            key={i}
            style={{
              flex: 1,
              height: '100%',
              background: isFilled
                ? color
                : isLeading && blinkOn
                  ? color
                  : inkAlpha(0.12),
              boxShadow: isFilled || (isLeading && blinkOn) ? `0 2px 0 ${inkAlpha(0.25)}` : undefined,
            }}
          />
        );
      })}
    </div>
  );
};
