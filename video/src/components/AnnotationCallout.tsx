import React from 'react';
import {spring, useVideoConfig} from 'remotion';
import {COLORS, hardShadow, inkAlpha} from '../theme/theme';
import {MONO_FAMILY} from '../fonts';

export const CALLOUT_FONT_SIZE = 22;
export const CALLOUT_LINE_HEIGHT = 30;
export const CALLOUT_PAD_X = 14;
export const CALLOUT_PAD_Y = 10;
/** Space Mono is monospace: advance width is 0.6em. */
export const CALLOUT_CHAR_W = CALLOUT_FONT_SIZE * 0.6;

/** Measured box for a callout label (max 2 lines). */
export const calloutBox = (label: string): {w: number; h: number; lines: string[]} => {
  const lines = label.split('\n').slice(0, 2);
  const chars = Math.max(...lines.map((l) => l.length));
  return {
    w: Math.ceil(chars * CALLOUT_CHAR_W + CALLOUT_PAD_X * 2 + 6),
    h: lines.length * CALLOUT_LINE_HEIGHT + CALLOUT_PAD_Y * 2 + 6,
    lines,
  };
};

/**
 * Pixel callout box + connector. The parent resolves the box's top-left
 * (boxX, boxY) in plot space (clamped / collision-nudged); this component
 * just pops it in with a snappy spring at `appearFrame` and draws an
 * always-visible connector from the anchor (x, y) to the box edge.
 */
export const AnnotationCallout: React.FC<{
  /** Anchor point on the series line. */
  x: number;
  y: number;
  /** Resolved box top-left + size (plot space). */
  boxX: number;
  boxY: number;
  boxW: number;
  boxH: number;
  label: string;
  frame: number;
  appearFrame: number;
  accent?: string;
  /** True while this callout's hold is running (rest of chart dimmed). */
  active?: boolean;
}> = ({x, y, boxX, boxY, boxW, boxH, label, frame, appearFrame, accent = COLORS.magenta, active = false}) => {
  const {fps} = useVideoConfig();
  if (frame < appearFrame) return null;

  const s = spring({
    frame: frame - appearFrame,
    fps,
    config: {damping: 11, stiffness: 260, mass: 0.6},
    durationInFrames: 10,
  });
  const scale = 0.6 + 0.4 * s;

  const lines = label.split('\n').slice(0, 2);

  // Connector: from anchor to the nearest point on the box perimeter.
  const cx = Math.max(boxX, Math.min(boxX + boxW, x));
  const cy = Math.max(boxY, Math.min(boxY + boxH, y));

  return (
    <g>
      <line
        x1={x}
        y1={y}
        x2={cx}
        y2={cy}
        stroke={COLORS.ink}
        strokeWidth={3}
        opacity={Math.min(1, s * 1.2)}
        shapeRendering="crispEdges"
      />
      {/* pixel-square anchor on the line */}
      <rect
        x={x - 7}
        y={y - 7}
        width={14}
        height={14}
        fill={accent}
        stroke={COLORS.ink}
        strokeWidth={3}
        shapeRendering="crispEdges"
      />
      <g
        transform={`translate(${boxX + boxW / 2}, ${boxY + boxH / 2}) scale(${scale}) translate(${-boxW / 2}, ${-boxH / 2})`}
      >
        <foreignObject x={0} y={0} width={boxW} height={boxH} style={{overflow: 'visible'}}>
          <div
            style={{
              display: 'inline-block',
              background: COLORS.cream,
              border: `3px solid ${active ? accent : COLORS.ink}`,
              boxShadow: active
                ? `0 0 0 3px ${COLORS.ink}, ${hardShadow(inkAlpha(0.3), 1)}`
                : hardShadow(inkAlpha(0.2), 0.7),
              padding: `${CALLOUT_PAD_Y}px ${CALLOUT_PAD_X}px`,
              fontFamily: MONO_FAMILY,
              fontWeight: 700,
              fontSize: CALLOUT_FONT_SIZE,
              lineHeight: `${CALLOUT_LINE_HEIGHT}px`,
              color: COLORS.ink,
              whiteSpace: 'pre',
            }}
          >
            {lines.join('\n')}
          </div>
        </foreignObject>
      </g>
    </g>
  );
};
