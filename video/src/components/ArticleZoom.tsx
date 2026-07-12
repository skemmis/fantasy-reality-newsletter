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
import {
  HeadlineCard,
  HeadlineCardProps,
  headlineCardLayout,
} from './HeadlineCard';

export interface ArticleZoomProps extends HeadlineCardProps {
  /** Local frame the zoom spring starts. */
  zoomAt: number;
  /** Frames the zoom takes. */
  zoomFrames?: number;
  /** Cap on the zoom scale (auto-fit aims the highlight at ~62% width). */
  maxScale?: number;
}

/**
 * Wraps HeadlineCard: full card first, then springs scale+translate to
 * dive into the highlight rect while everything else dims 30%.
 */
export const ArticleZoom: React.FC<ArticleZoomProps> = ({
  zoomAt,
  zoomFrames = 22,
  maxScale = 3,
  ...card
}) => {
  const frame = useCurrentFrame();
  const {fps, width: frameW} = useVideoConfig();

  const cardW = card.width ?? 1240;
  const aspect = card.aspect ?? 1.6;
  const hl = card.highlight ?? {x: 0.05, y: 0.35, w: 0.5, h: 0.18};
  const {cardH, imgX, imgY, imgW, imgH} = headlineCardLayout(cardW, aspect);

  // Zoom progress.
  const p =
    frame < zoomAt
      ? 0
      : spring({
          frame: frame - zoomAt,
          fps,
          config: {damping: 16, stiffness: 90, mass: 1},
          durationInFrames: zoomFrames,
        });

  // Highlight center offset from the card center (card px).
  const cx = imgX + (hl.x + hl.w / 2) * imgW - cardW / 2;
  const cy = imgY + (hl.y + hl.h / 2) * imgH - cardH / 2;
  // Scale so the highlight lands at ~62% of the frame width.
  const target = Math.max(1.5, Math.min(maxScale, (0.62 * frameW) / Math.max(1, hl.w * imgW)));
  const s = 1 + (target - 1) * p;
  const tilt = card.tilt ?? ((card.index ?? 0) % 2 === 0 ? -1.5 : 1.5);

  return (
    <AbsoluteFill style={{justifyContent: 'center', alignItems: 'center'}}>
      <div
        style={{
          transform: `translate(${-cx * s * p}px, ${-cy * s * p}px) scale(${s})`,
        }}
      >
        <HeadlineCard
          {...card}
          // The wrapper owns the straighten-out; the card keeps its slam.
          tilt={tilt * (1 - p)}
          dim={p}
        />
      </div>
      <Sequence from={zoomAt} durationInFrames={26} name="Zoom whoosh" layout="none">
        <Audio src={staticFile('assets/sfx/whoosh-up.wav')} volume={0.4} />
      </Sequence>
    </AbsoluteFill>
  );
};
