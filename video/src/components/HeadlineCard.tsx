import React from 'react';
import {
  Img,
  Sequence,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';
import {Audio} from '@remotion/media';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';

/** Fraction rect over the screenshot area (0-1 of the image box). */
export interface HighlightRect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface HeadlineCardProps {
  /**
   * Screenshot path relative to public/ (e.g. "assets/headlines/jobs-cnbc.png").
   * null/undefined renders the generated placeholder "screenshot".
   */
  src?: string | null;
  /** Source chip, e.g. "CNBC". */
  source: string;
  /** Date chip, e.g. "JUN 5 2026". */
  date: string;
  /** Card index in a stack: tilt alternates -1.5deg / +1.5deg by parity. */
  index?: number;
  /** Explicit tilt in degrees; overrides index parity. */
  tilt?: number;
  /** Optional rect that gets a magenta pixel box after a beat. */
  highlight?: HighlightRect | null;
  /** Local frame the highlight draws. */
  highlightAt?: number;
  /** Local frame the slam-in starts. */
  appearFrame?: number;
  /** Outer card width in px. */
  width?: number;
  /** Screenshot aspect (w/h) used for the image box. */
  aspect?: number;
  /** Headline text for the generated placeholder screenshot. */
  headline?: string;
  /** URL line for the placeholder browser chrome. */
  url?: string;
  /** 0-1: dims everything except the highlight rect (used by ArticleZoom). */
  dim?: number;
  /** Suppress the thud SFX (e.g. when a wrapper owns audio). */
  silent?: boolean;
}

const BORDER = 6;
const MAT = 18;

/** Geometry shared with ArticleZoom. All px, relative to the card's top-left. */
export const headlineCardLayout = (width: number, aspect: number) => {
  const imgW = width - 2 * (BORDER + MAT);
  const imgH = Math.round(imgW / aspect);
  const cardH = imgH + 2 * (BORDER + MAT);
  return {cardW: width, cardH, imgX: BORDER + MAT, imgY: BORDER + MAT, imgW, imgH};
};

const sfx = (name: string) => staticFile(`assets/sfx/${name}.wav`);

/** Generated stand-in that reads as a news-site screenshot. */
const PlaceholderShot: React.FC<{
  w: number;
  h: number;
  source: string;
  headline: string;
  url: string;
}> = ({w, h, source, headline, url}) => {
  const chromeH = Math.round(h * 0.075);
  const mastH = Math.round(h * 0.105);
  return (
    <div style={{width: w, height: h, background: '#ffffff', position: 'relative'}}>
      {/* browser chrome */}
      <div
        style={{
          height: chromeH,
          background: '#d9d5cb',
          borderBottom: '2px solid #b9b4a6',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '0 18px',
        }}
      >
        {['#e24050', '#ffc37a', '#128a72'].map((c) => (
          <div key={c} style={{width: 13, height: 13, background: c, border: '2px solid #17122b'}} />
        ))}
        <div
          style={{
            flex: 1,
            marginLeft: 10,
            background: '#f4f1e9',
            border: '2px solid #b9b4a6',
            fontFamily: MONO_FAMILY,
            fontSize: Math.round(chromeH * 0.36),
            color: '#6d675a',
            padding: '4px 12px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
          }}
        >
          {url}
        </div>
      </div>
      {/* masthead */}
      <div
        style={{
          height: mastH,
          background: '#0a0a0a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 34px',
        }}
      >
        <span
          style={{
            fontFamily: "'Arial Black', Arial, sans-serif",
            fontWeight: 900,
            fontSize: Math.round(mastH * 0.5),
            letterSpacing: '0.04em',
            color: '#ffffff',
          }}
        >
          {source.toUpperCase()}
        </span>
        <span
          style={{
            fontFamily: 'Arial, sans-serif',
            fontSize: Math.round(mastH * 0.3),
            letterSpacing: '0.18em',
            color: '#9a9a9a',
          }}
        >
          MARKETS&nbsp;&nbsp;ECONOMY&nbsp;&nbsp;TECH
        </span>
      </div>
      {/* article body */}
      <div style={{padding: `${Math.round(h * 0.05)}px ${Math.round(w * 0.045)}px`}}>
        <div
          style={{
            fontFamily: 'Arial, sans-serif',
            fontWeight: 700,
            fontSize: Math.round(h * 0.032),
            letterSpacing: '0.14em',
            color: '#c02a2a',
            marginBottom: Math.round(h * 0.03),
          }}
        >
          ECONOMY
        </div>
        <div
          style={{
            fontFamily: "Georgia, 'DejaVu Serif', serif",
            fontWeight: 700,
            fontSize: Math.round(h * 0.082),
            lineHeight: 1.22,
            color: '#111111',
            maxWidth: '94%',
          }}
        >
          {headline}
        </div>
        <div
          style={{
            marginTop: Math.round(h * 0.045),
            fontFamily: 'Arial, sans-serif',
            fontSize: Math.round(h * 0.03),
            color: '#8a8a8a',
          }}
        >
          Published Fri, Jun 5 2026 · 8:31 AM EDT
        </div>
        {/* faux paragraph bars */}
        <div style={{marginTop: Math.round(h * 0.055), display: 'flex', flexDirection: 'column', gap: Math.round(h * 0.026)}}>
          {[0.92, 0.98, 0.85, 0.6].map((f, i) => (
            <div
              key={i}
              style={{width: `${f * 100}%`, height: Math.round(h * 0.024), background: '#dedede'}}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * A real article screenshot framed as a torn-newspaper pixel card:
 * chunky ink border + hard shadow, source chip bottom-left on gold,
 * slight paper tilt. Slams in with a spring + thud.
 */
export const HeadlineCard: React.FC<HeadlineCardProps> = ({
  src = null,
  source,
  date,
  index = 0,
  tilt,
  highlight = null,
  highlightAt = 20,
  appearFrame = 0,
  width = 1240,
  aspect = 1.6,
  headline = 'Payrolls surge past forecasts',
  url = 'https://www.cnbc.com/2026/06/05/jobs-report-may-2026.html',
  dim = 0,
  silent = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < appearFrame) return null;
  const local = frame - appearFrame;

  const deg = tilt ?? (index % 2 === 0 ? -1.5 : 1.5);
  const {cardW, cardH, imgX, imgY, imgW, imgH} = headlineCardLayout(width, aspect);

  // Slam-in: overscaled, settles with a spring; shadow jitters for 4 frames.
  const s = spring({
    frame: local,
    fps,
    config: {damping: 13, stiffness: 300, mass: 0.7},
    durationInFrames: 12,
  });
  const scale = 1.55 - 0.55 * s;
  const jitter = local < 4 ? (local % 2 === 0 ? 2 : -2) : 0;

  // Highlight: hard double-blink, then steady with a settle spring.
  const hlLocal = local - highlightAt;
  const hlOn = highlight && hlLocal >= 0;
  const hlBlink = hlOn ? (hlLocal < 8 ? Math.floor(hlLocal / 2) % 2 === 0 : true) : false;
  const hlSpring = hlOn
    ? spring({frame: hlLocal, fps, config: {damping: 12, stiffness: 280, mass: 0.6}, durationInFrames: 10})
    : 0;

  const hl = highlight
    ? {
        left: imgX + highlight.x * imgW,
        top: imgY + highlight.y * imgH,
        width: highlight.w * imgW,
        height: highlight.h * imgH,
      }
    : null;

  // Torn bottom edge: pixel teeth hanging below the card.
  const TOOTH_W = 30;
  const teeth = Math.floor(cardW / (TOOTH_W * 2));

  return (
    <div
      style={{
        position: 'relative',
        width: cardW,
        height: cardH,
        transform: `rotate(${deg}deg) scale(${scale}) translate(${jitter}px, ${-jitter}px)`,
        opacity: Math.min(1, s * 2.5),
      }}
    >
      {/* paper mat + screenshot */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: COLORS.card,
          border: pixelBorder(BORDER),
          boxShadow: hardShadow(inkAlpha(0.22), 2),
        }}
      />
      {/* pixel-torn bottom edge */}
      <div
        style={{
          position: 'absolute',
          left: BORDER,
          bottom: -14,
          width: cardW - BORDER * 2,
          height: 14,
          display: 'flex',
        }}
      >
        {Array.from({length: teeth}).map((_, i) => (
          <div
            key={i}
            style={{
              width: TOOTH_W,
              height: 14,
              marginRight: TOOTH_W,
              background: COLORS.ink,
            }}
          />
        ))}
      </div>
      <div
        style={{
          position: 'absolute',
          left: imgX,
          top: imgY,
          width: imgW,
          height: imgH,
          border: `3px solid ${inkAlpha(0.85)}`,
          boxSizing: 'content-box',
          marginLeft: -3,
          marginTop: -3,
          overflow: 'hidden',
          background: '#ffffff',
        }}
      >
        {src ? (
          <Img
            src={staticFile(src)}
            style={{width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top'}}
          />
        ) : (
          <PlaceholderShot w={imgW} h={imgH} source={source} headline={headline} url={url} />
        )}
      </div>
      {/* dim wash with a hole over the highlight (ArticleZoom) */}
      {dim > 0.004 && hl ? (
        <div
          style={{
            position: 'absolute',
            left: hl.left,
            top: hl.top,
            width: hl.width,
            height: hl.height,
            boxShadow: `0 0 0 9999px ${inkAlpha(0.3 * Math.min(1, dim))}`,
          }}
        />
      ) : null}
      {/* magenta pixel highlight box + underline */}
      {hlOn && hl ? (
        <div
          style={{
            position: 'absolute',
            left: hl.left,
            top: hl.top,
            width: hl.width,
            height: hl.height,
            opacity: hlBlink ? 1 : 0,
            transform: `scale(${1.18 - 0.18 * hlSpring})`,
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: -5,
              border: `5px solid ${COLORS.magenta}`,
              boxShadow: hardShadow(inkAlpha(0.25), 0.7),
            }}
          />
          <div
            style={{
              position: 'absolute',
              left: 0,
              bottom: -14,
              width: '100%',
              height: 7,
              background: COLORS.magenta,
            }}
          />
        </div>
      ) : null}
      {/* gold tape corners */}
      <div
        style={{
          position: 'absolute',
          top: -16,
          left: cardW * 0.09,
          width: 92,
          height: 30,
          background: COLORS.gold,
          border: pixelBorder(3),
          transform: 'rotate(-5deg)',
          opacity: 0.95,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: -16,
          right: cardW * 0.09,
          width: 92,
          height: 30,
          background: COLORS.gold,
          border: pixelBorder(3),
          transform: 'rotate(4deg)',
          opacity: 0.95,
        }}
      />
      {/* source chip */}
      <div
        style={{
          position: 'absolute',
          left: -16,
          bottom: -20,
          fontFamily: MONO_FAMILY,
          fontWeight: 700,
          fontSize: 27,
          letterSpacing: '0.06em',
          color: COLORS.ink,
          background: COLORS.gold,
          border: pixelBorder(4),
          boxShadow: hardShadow(inkAlpha(0.25)),
          padding: '10px 20px',
          whiteSpace: 'nowrap',
        }}
      >
        {`${source} · ${date}`.toUpperCase()}
      </div>
      {/* SFX: thud on the slam, blip when the highlight lands.
          `from` is in the PARENT's frame space (this component renders null
          before appearFrame, so anchor sequences at absolute frames). */}
      {!silent ? (
        <>
          <Sequence from={appearFrame} durationInFrames={14} name="Headline thud" layout="none">
            <Audio src={sfx('thud')} volume={0.5} />
          </Sequence>
          {highlight ? (
            <Sequence
              from={appearFrame + highlightAt}
              durationInFrames={10}
              name="Highlight blip"
              layout="none"
            >
              <Audio src={sfx('blip')} volume={0.4} />
            </Sequence>
          ) : null}
        </>
      ) : null}
    </div>
  );
};
