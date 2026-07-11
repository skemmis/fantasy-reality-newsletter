import React from 'react';
import {AbsoluteFill, spring, useCurrentFrame, useVideoConfig} from 'remotion';
import {COLORS, tokens, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';

export type ResolutionStatus = 'OPEN' | 'YES' | 'NO';

export interface ResolutionEntry {
  market: string;
  /** e.g. "priced 4%" — what the show said when covered. */
  call: string;
  status: ResolutionStatus;
}

export interface EndCardProps {
  entries?: ResolutionEntry[];
  title?: string;
}

const statusColor = (s: ResolutionStatus) =>
  s === 'YES' ? tokens.yes : s === 'NO' ? tokens.no : COLORS.gold;

/**
 * "Resolution Watch" end card: a pixel scoreboard of markets the show
 * covered vs. how they resolved. Rows pop in staggered.
 */
export const EndCard: React.FC<EndCardProps> = ({
  entries = [
    {market: 'FED HIKE 2026', call: 'covered @ 4%', status: 'OPEN'},
    {market: 'OPENAI AGI BY 2027', call: 'covered @ 17%', status: 'OPEN'},
    {market: 'GOVT SHUTDOWN OCT', call: 'covered @ 62%', status: 'YES'},
  ],
  title = 'RESOLUTION WATCH',
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const portrait = height > width;

  const boardW = Math.min(width * 0.82, 1400);

  return (
    <AbsoluteFill
      style={{
        background: COLORS.canvas,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div
        style={{
          fontFamily: PIXEL_FAMILY,
          fontSize: portrait ? 44 : 56,
          color: COLORS.ink,
          textShadow: `6px 6px 0 ${inkAlpha(0.15)}`,
          marginBottom: 60,
          letterSpacing: '0.02em',
        }}
      >
        {title}
      </div>
      <div
        style={{
          width: boardW,
          background: COLORS.card,
          border: pixelBorder(5),
          boxShadow: hardShadow(inkAlpha(0.18), 2),
          padding: portrait ? '28px 30px' : '36px 48px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {entries.map((e, i) => {
          const s = spring({
            frame: frame - 8 - i * 7,
            fps,
            config: {damping: 12, stiffness: 240, mass: 0.7},
            durationInFrames: 12,
          });
          return (
            <div
              key={i}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 24,
                padding: '26px 4px',
                borderBottom:
                  i < entries.length - 1 ? `3px dashed ${COLORS.grid}` : 'none',
                opacity: s,
                transform: `translateX(${(1 - s) * 40}px)`,
              }}
            >
              <div style={{display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0}}>
                <span
                  style={{
                    fontFamily: PIXEL_FAMILY,
                    fontSize: portrait ? 20 : 24,
                    lineHeight: 1.5,
                    color: COLORS.ink,
                  }}
                >
                  {e.market}
                </span>
                <span
                  style={{
                    fontFamily: MONO_FAMILY,
                    fontWeight: 700,
                    fontSize: portrait ? 19 : 21,
                    color: COLORS.mutedText,
                    letterSpacing: '0.06em',
                  }}
                >
                  {e.call.toUpperCase()}
                </span>
              </div>
              <span
                style={{
                  fontFamily: PIXEL_FAMILY,
                  fontSize: portrait ? 20 : 24,
                  color: e.status === 'OPEN' ? COLORS.ink : COLORS.card,
                  background: statusColor(e.status),
                  border: pixelBorder(4),
                  boxShadow: hardShadow(inkAlpha(0.25), 0.8),
                  padding: '14px 20px',
                  flexShrink: 0,
                }}
              >
                {e.status}
              </span>
            </div>
          );
        })}
      </div>
      <div
        style={{
          marginTop: 54,
          fontFamily: MONO_FAMILY,
          fontWeight: 700,
          fontSize: 22,
          letterSpacing: '0.14em',
          color: COLORS.mutedText,
        }}
      >
        THE MARKET SAYS · NOT FINANCIAL ADVICE · 18+
      </div>
    </AbsoluteFill>
  );
};
