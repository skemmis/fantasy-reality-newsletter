import React, {useMemo} from 'react';
import {AbsoluteFill, Img} from 'remotion';
import {EpisodeData} from './types';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from './theme/theme';
import {PIXEL_FAMILY, MONO_FAMILY} from './fonts';
import {AssetManifest, assetSrc, resolveAsset} from './assets';
import {HEADLINE_PCT} from './episodes/fedhike';

export type ThumbFedHikeProps = {
  data: EpisodeData | null;
  assets?: AssetManifest | null;
} & Record<string, unknown>;

/**
 * 1280x720 thumbnail still: giant "51%", panicking goblin, a sliver of the
 * real tape, and the title strip "THE FED... HIKES?". Rendered via
 * `npx remotion still ThumbFedHike out/thumb-fedhike.png`.
 */
export const ThumbFedHike: React.FC<ThumbFedHikeProps> = ({data, assets = null}) => {
  const panic = resolveAsset(assets, 'mascot-panic') ?? resolveAsset(assets, 'panic');

  // Tape sliver: stepped polyline of the real daily series.
  const TAPE_W = 1280;
  const TAPE_H = 190;
  const tapePath = useMemo(() => {
    const pts = data?.markets?.[0]?.points ?? [];
    if (pts.length < 2) return '';
    const vals = pts.map((p) => p.p);
    const lo = Math.min(...vals);
    const hi = Math.max(...vals);
    const pad = 22;
    const x = (i: number) => (i / (pts.length - 1)) * TAPE_W;
    const y = (v: number) => pad + (1 - (v - lo) / (hi - lo)) * (TAPE_H - pad * 2);
    let d = `M ${x(0).toFixed(1)} ${y(vals[0]).toFixed(1)}`;
    for (let i = 1; i < pts.length; i++) {
      d += ` H ${x(i).toFixed(1)} V ${y(vals[i]).toFixed(1)}`;
    }
    return d;
  }, [data]);

  return (
    <AbsoluteFill style={{background: COLORS.canvas, overflow: 'hidden'}}>
      {/* tape sliver band across the middle */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: 330,
          height: TAPE_H,
          background: COLORS.card,
          borderTop: `6px solid ${COLORS.ink}`,
          borderBottom: `6px solid ${COLORS.ink}`,
          opacity: 0.9,
        }}
      >
        <svg width={TAPE_W} height={TAPE_H} style={{display: 'block'}}>
          <path d={tapePath} fill="none" stroke={COLORS.magenta} strokeWidth={7} />
        </svg>
      </div>

      {/* giant 51% */}
      <div
        style={{
          position: 'absolute',
          left: 56,
          top: 64,
          fontFamily: PIXEL_FAMILY,
          fontSize: 300,
          lineHeight: 1,
          color: COLORS.ink,
          textShadow: `16px 16px 0 ${COLORS.gold}, 26px 26px 0 ${inkAlpha(0.2)}`,
        }}
      >
        {HEADLINE_PCT}%
      </div>
      <div
        style={{
          position: 'absolute',
          left: 64,
          top: 386,
          fontFamily: MONO_FAMILY,
          fontWeight: 700,
          fontSize: 34,
          letterSpacing: '0.24em',
          color: COLORS.ink,
          background: COLORS.cream,
          border: pixelBorder(4),
          boxShadow: hardShadow(inkAlpha(0.35)),
          padding: '10px 22px 10px 28px',
        }}
      >
        THE MARKET SAYS
      </div>

      {/* panicking goblin, right side, over the tape */}
      <div style={{position: 'absolute', right: -30, bottom: 60}}>
        <Img
          src={panic ? assetSrc(panic.alpha ?? panic.file) : 'data:image/gif;base64,R0lGODlhAQABAAAAACw='}
          style={{
            width: 560,
            height: 560,
            objectFit: 'contain',
            filter: `drop-shadow(12px 12px 0 ${inkAlpha(0.25)})`,
          }}
        />
      </div>

      {/* title strip */}
      <div
        style={{
          position: 'absolute',
          left: -30,
          right: -30,
          bottom: 56,
          background: COLORS.magenta,
          border: pixelBorder(6),
          boxShadow: hardShadow(inkAlpha(0.4), 1.6),
          padding: '26px 40px 26px 100px',
          rotate: '-2deg',
        }}
      >
        <span
          style={{
            fontFamily: PIXEL_FAMILY,
            fontSize: 66,
            lineHeight: 1,
            color: COLORS.card,
            textShadow: `8px 8px 0 ${inkAlpha(0.35)}`,
            whiteSpace: 'nowrap',
          }}
        >
          THE FED... HIKES?
        </span>
      </div>
    </AbsoluteFill>
  );
};
