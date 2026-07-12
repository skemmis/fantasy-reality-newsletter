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
import {AssetEntry, assetSrc} from '../assets';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from '../theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from '../fonts';

export interface PostSpan {
  text: string;
  bold?: boolean;
}

export interface PostCardProps {
  /** Manifest avatar; null renders the pixel initial block. */
  avatar?: AssetEntry | null;
  /** public/-relative avatar fallback path. */
  avatarSrc?: string | null;
  /** Display name, e.g. "Federal Reserve". */
  name: string;
  /** Handle / org line, e.g. "@federalreserve". */
  handle: string;
  /** Body copy; **bold** spans get the gold marker. Or pass `spans`. */
  body?: string;
  spans?: PostSpan[];
  /** e.g. "JUN 17 2026 · 2:01 PM ET". */
  timestamp: string;
  /** Attribution line, e.g. "FOMC STATEMENT · FEDERALRESERVE.GOV". */
  source?: string;
  /** Initial-block background. */
  accent?: string;
  width?: number;
  appearFrame?: number;
  silent?: boolean;
}

/** Tiny markdown-ish parser: split on **bold** runs. */
export const parsePostBody = (body: string): PostSpan[] =>
  body
    .split(/\*\*/)
    .map((text, i) => ({text, bold: i % 2 === 1}))
    .filter((s) => s.text.length > 0);

/**
 * Clean re-typeset social/statement post: cream card, ink border, pixel
 * chrome bar — deliberately house-styled, NOT a platform clone.
 */
export const PostCard: React.FC<PostCardProps> = ({
  avatar = null,
  avatarSrc = null,
  name,
  handle,
  body,
  spans,
  timestamp,
  source,
  accent = COLORS.magenta,
  width = 1150,
  appearFrame = 0,
  silent = false,
}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  if (frame < appearFrame) return null;
  const local = frame - appearFrame;

  const s = spring({
    frame: local,
    fps,
    config: {damping: 13, stiffness: 260, mass: 0.8},
    durationInFrames: 14,
  });

  const content: PostSpan[] = spans ?? (body ? parsePostBody(body) : []);
  const initial = (name.trim()[0] ?? '?').toUpperCase();
  const resolvedAvatar = avatar
    ? assetSrc(avatar.file)
    : avatarSrc
      ? staticFile(avatarSrc)
      : null;

  return (
    <div
      style={{
        width,
        transform: `scale(${0.82 + 0.18 * s}) translateY(${(1 - s) * 46}px)`,
        opacity: Math.min(1, s * 2.2),
      }}
    >
      <div
        style={{
          background: COLORS.cream,
          border: pixelBorder(5),
          boxShadow: hardShadow(inkAlpha(0.22), 2),
        }}
      >
        {/* pixel chrome bar */}
        <div
          style={{
            height: 46,
            background: COLORS.ink,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 18px',
          }}
        >
          <div style={{display: 'flex', gap: 10}}>
            {[COLORS.gold, COLORS.magenta, COLORS.card].map((c) => (
              <div key={c} style={{width: 14, height: 14, background: c}} />
            ))}
          </div>
          <span
            style={{
              fontFamily: MONO_FAMILY,
              fontWeight: 700,
              fontSize: 17,
              letterSpacing: '0.22em',
              color: COLORS.gold,
            }}
          >
            RE-TYPESET · ORIGINAL TEXT
          </span>
        </div>

        <div style={{padding: '34px 44px 30px'}}>
          {/* header row */}
          <div style={{display: 'flex', alignItems: 'center', gap: 24}}>
            <div
              style={{
                width: 92,
                height: 92,
                flexShrink: 0,
                border: pixelBorder(4),
                boxShadow: hardShadow(inkAlpha(0.2), 0.8),
                background: accent,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
              }}
            >
              {resolvedAvatar ? (
                <Img
                  src={resolvedAvatar}
                  style={{width: '100%', height: '100%', objectFit: 'cover'}}
                />
              ) : (
                <span
                  style={{
                    fontFamily: PIXEL_FAMILY,
                    fontSize: 44,
                    color: COLORS.card,
                    textShadow: `4px 4px 0 ${inkAlpha(0.35)}`,
                  }}
                >
                  {initial}
                </span>
              )}
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 8, minWidth: 0}}>
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontWeight: 700,
                  fontSize: 32,
                  color: COLORS.ink,
                  letterSpacing: '0.01em',
                }}
              >
                {name}
              </span>
              <span
                style={{
                  fontFamily: MONO_FAMILY,
                  fontSize: 24,
                  color: COLORS.mutedText,
                  letterSpacing: '0.04em',
                }}
              >
                {handle}
              </span>
            </div>
          </div>

          {/* body */}
          <div
            style={{
              marginTop: 30,
              fontFamily: MONO_FAMILY,
              fontSize: 31,
              lineHeight: 1.62,
              color: COLORS.ink,
              overflowWrap: 'break-word',
            }}
          >
            {content.map((sp, i) =>
              sp.bold ? (
                <span
                  key={i}
                  style={{
                    fontWeight: 700,
                    background: COLORS.gold,
                    boxShadow: `3px 3px 0 ${inkAlpha(0.18)}`,
                    padding: '0 6px',
                  }}
                >
                  {sp.text}
                </span>
              ) : (
                <span key={i}>{sp.text}</span>
              ),
            )}
          </div>

          {/* footer */}
          <div
            style={{
              marginTop: 30,
              paddingTop: 22,
              borderTop: `3px dashed ${inkAlpha(0.25)}`,
              display: 'flex',
              justifyContent: 'space-between',
              gap: 20,
              fontFamily: MONO_FAMILY,
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '0.09em',
              color: COLORS.mutedText,
            }}
          >
            <span>{timestamp.toUpperCase()}</span>
            {source ? <span>{source.toUpperCase()}</span> : null}
          </div>
        </div>
      </div>
      {!silent ? (
        <Sequence from={appearFrame} durationInFrames={12} name="Post pop" layout="none">
          <Audio src={staticFile('assets/sfx/pop-in.wav')} volume={0.4} />
        </Sequence>
      ) : null}
    </div>
  );
};
