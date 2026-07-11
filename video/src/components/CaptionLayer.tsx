import React, {useMemo} from 'react';
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from 'remotion';
import {WordsTimeline, TimedWord} from '../types';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {MONO_FAMILY} from '../fonts';

interface Page {
  words: TimedWord[];
  start: number;
  end: number;
}

/** Group words into TikTok-style pages of 3-5 words, breaking on line changes. */
const paginate = (words: TimedWord[], maxWords = 4): Page[] => {
  const pages: Page[] = [];
  let cur: TimedWord[] = [];
  const flush = () => {
    if (cur.length > 0) {
      pages.push({words: cur, start: cur[0].start, end: cur[cur.length - 1].end});
      cur = [];
    }
  };
  for (const w of words) {
    const prev = cur[cur.length - 1];
    const lineBreak = prev && prev.line !== w.line;
    const gap = prev && w.start - prev.end > 0.6;
    if (cur.length >= maxWords || lineBreak || gap) flush();
    cur.push(w);
  }
  flush();
  return pages;
};

export interface CaptionLayerProps {
  timeline: WordsTimeline;
  /** Words per caption page (3-5 reads best). */
  maxWordsPerPage?: number;
  highlightColor?: string;
}

/**
 * Bottom-center word-pop captions driven by a WordsTimeline.
 * The active word is highlighted on a magenta (or gold) block.
 */
export const CaptionLayer: React.FC<CaptionLayerProps> = ({
  timeline,
  maxWordsPerPage = 4,
  highlightColor = COLORS.magenta,
}) => {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = frame / fps;
  const portrait = height > width;

  const pages = useMemo(
    () => paginate(timeline.words, maxWordsPerPage),
    [timeline, maxWordsPerPage],
  );

  const page = pages.find((p) => t >= p.start && t < p.end + 0.15);
  if (!page) return null;

  const fontSize = portrait ? Math.round(width * 0.052) : Math.round(width * 0.026);

  return (
    <AbsoluteFill style={{justifyContent: 'flex-end', alignItems: 'center'}}>
      <div
        style={{
          marginBottom: portrait ? height * 0.16 : height * 0.08,
          display: 'flex',
          flexWrap: 'wrap',
          justifyContent: 'center',
          gap: fontSize * 0.28,
          maxWidth: width * 0.82,
        }}
      >
        {page.words.map((w, i) => {
          const active = t >= w.start && t < w.end;
          const done = t >= w.end;
          return (
            <span
              key={i}
              style={{
                fontFamily: MONO_FAMILY,
                fontWeight: 700,
                fontSize,
                lineHeight: 1.25,
                padding: `${fontSize * 0.12}px ${fontSize * 0.28}px`,
                color: active ? COLORS.card : COLORS.ink,
                background: active ? highlightColor : COLORS.card,
                border: pixelBorder(3),
                boxShadow: hardShadow(inkAlpha(0.35), 0.6),
                transform: active ? 'scale(1.1)' : 'scale(1)',
                opacity: done || active ? 1 : 0.92,
                textTransform: 'uppercase',
              }}
            >
              {w.w}
            </span>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};
