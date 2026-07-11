import React from 'react';
import {spring, useVideoConfig} from 'remotion';
import {COLORS, hardShadow, inkAlpha} from '../theme/theme';
import {MONO_FAMILY} from '../fonts';

/**
 * Pixel callout box + connector, anchored (in SVG pixel space) at (x, y).
 * Pops in with a snappy spring (scale 0.6 -> 1, ~9 frames) starting at
 * `appearFrame`; render nothing before then.
 */
export const AnnotationCallout: React.FC<{
  x: number;
  y: number;
  dx?: number;
  dy?: number;
  label: string;
  frame: number;
  appearFrame: number;
  accent?: string;
}> = ({x, y, dx = 24, dy = -80, label, frame, appearFrame, accent = COLORS.magenta}) => {
  const {fps} = useVideoConfig();
  if (frame < appearFrame) return null;

  const s = spring({
    frame: frame - appearFrame,
    fps,
    config: {damping: 11, stiffness: 260, mass: 0.6},
    durationInFrames: 10,
  });
  const scale = 0.6 + 0.4 * s;

  const boxX = x + dx;
  const boxY = y + dy;
  const lines = label.split('\n');

  return (
    <g>
      {/* connector: elbow line, pixel-square anchor */}
      <line
        x1={x}
        y1={y}
        x2={boxX + (dx >= 0 ? 6 : -6)}
        y2={boxY + (dy >= 0 ? 2 : 0) + (dy < 0 ? lines.length * 26 + 18 : 0)}
        stroke={COLORS.ink}
        strokeWidth={3}
        opacity={s}
        shapeRendering="crispEdges"
      />
      <rect
        x={x - 6}
        y={y - 6}
        width={12}
        height={12}
        fill={accent}
        stroke={COLORS.ink}
        strokeWidth={3}
        shapeRendering="crispEdges"
      />
      <g
        transform={`translate(${boxX}, ${boxY}) scale(${scale})`}
        style={{transformBox: 'fill-box', transformOrigin: 'center'} as React.CSSProperties}
      >
        <foreignObject
          x={dx >= 0 ? 0 : -320}
          y={0}
          width={320}
          height={lines.length * 26 + 26}
          style={{overflow: 'visible'}}
        >
          <div
            style={{
              display: 'inline-block',
              background: COLORS.cream,
              border: `3px solid ${COLORS.ink}`,
              boxShadow: hardShadow(inkAlpha(0.2), 0.7),
              padding: '8px 12px',
              fontFamily: MONO_FAMILY,
              fontWeight: 700,
              fontSize: 19,
              lineHeight: '26px',
              color: COLORS.ink,
              whiteSpace: 'pre',
              float: dx >= 0 ? 'left' : 'right',
            }}
          >
            {label}
          </div>
        </foreignObject>
      </g>
    </g>
  );
};
