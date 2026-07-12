import React from 'react';
import {AbsoluteFill, Sequence, useCurrentFrame} from 'remotion';
import {COLORS, hardShadow, inkAlpha, pixelBorder} from './theme/theme';
import {PIXEL_FAMILY} from './fonts';
import {EpisodeData} from './types';
import {sampleEpisode} from './sample-data';
import {AssetManifest, resolveAsset} from './assets';
import {MarketChartScene} from './components/MarketChartScene';
import {BigNumber} from './components/BigNumber';
import {BreakingBanner} from './components/BreakingBanner';
import {HawkDoveMeter} from './components/HawkDoveMeter';
import {MoneyPrinterBeat} from './components/MoneyPrinterBeat';
import {ChapterCard} from './components/ChapterCard';
import {IntroSting, INTRO_STING_DURATION} from './components/IntroSting';
import {SpriteLoop} from './components/SpriteLoop';
import {CRTOverlay} from './fx/CRTOverlay';
import {VHSGlitch} from './fx/VHSGlitch';
import {FireBorder} from './fx/FireBorder';
import {ProgressBar} from './fx/ProgressBar';
import {useScreenShake} from './fx/useScreenShake';

/**
 * FX vocabulary reel #2 — the maximalist retro package:
 * BreakingBanner -> HawkDoveMeter (dove->hawk sweep) -> MoneyPrinterBeat
 * (Veo broll + CoinRain) -> FireBorder over the chart -> BigNumber slam
 * with screen shake -> ChapterCard -> IntroSting, cut together with
 * VHSGlitch bursts, all under CRTOverlay + ProgressBar. ~38s @ 1920x1080/30.
 */
export type ShotReel2Props = {
  data: EpisodeData | null;
  assets?: AssetManifest | null;
} & Record<string, unknown>;

// ---- timeline ----
const S = {
  breaking: 0,
  meter: 186,
  printer: 432,
  fire: 702,
  bignum: 912,
  chapter: 1038,
  sting: 1083,
  end: 1083 + INTRO_STING_DURATION, // 1131
} as const;
export const SHOT_REEL2_DURATION = S.end;

const GLITCH_LEN = 6;
const glitchCuts = [S.meter, S.printer, S.fire, S.bignum, S.chapter, S.sting];

/** Breaking scene: the chart mid-broadcast, kicked by the banner slam. */
const BreakingScene: React.FC<{
  data: EpisodeData;
  banner: ReturnType<typeof resolveAsset>;
  siren: ReturnType<typeof resolveAsset>;
}> = ({data, banner, siren}) => {
  const BANNER_AT = 8;
  const shake = useScreenShake(BANNER_AT, {amp: 15, rotAmp: 1.1, durationInFrames: 20, seed: 'under'});
  return (
    <AbsoluteFill style={{background: COLORS.canvas}}>
      <AbsoluteFill style={{translate: shake.translate, rotate: shake.rotate}}>
        <MarketChartScene data={data} reveal={1} showCursor showCounter showAnnotations={false} curve="step" />
      </AbsoluteFill>
      <Sequence from={BANNER_AT} name="Breaking banner">
        <BreakingBanner
          text="BREAKING"
          sub="FED SIGNALS A HIKE IS ON THE TABLE"
          banner={banner}
          siren={siren}
          outAfter={132}
        />
      </Sequence>
    </AbsoluteFill>
  );
};

/** Fire scene: the tape burns; goblin sips coffee. */
const FireScene: React.FC<{
  data: EpisodeData;
  flame: ReturnType<typeof resolveAsset>;
  goblin: ReturnType<typeof resolveAsset>;
}> = ({data, flame, goblin}) => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{background: COLORS.canvas}}>
      <MarketChartScene data={data} reveal={1} showCursor showCounter showAnnotations curve="step" />
      <FireBorder flame={flame} appearFrame={4} />
      {goblin ? (
        <div style={{position: 'absolute', right: 60, bottom: 150, opacity: frame > 30 ? 1 : 0}}>
          <SpriteLoop asset={goblin} fps={6} size={210} />
        </div>
      ) : null}
      {frame > 46 ? (
        <div
          style={{
            position: 'absolute',
            left: 70,
            bottom: 170,
            fontFamily: PIXEL_FAMILY,
            fontSize: 34,
            color: COLORS.ink,
            background: COLORS.gold,
            border: pixelBorder(5),
            boxShadow: hardShadow(inkAlpha(0.3)),
            padding: '16px 24px',
            rotate: '-2deg',
          }}
        >
          THIS IS FINE.
        </div>
      ) : null}
    </AbsoluteFill>
  );
};

export const ShotReel2: React.FC<ShotReel2Props> = ({data, assets = null}) => {
  const episode = data ?? sampleEpisode();

  // ---- optional art (all null-safe; components fall back to placeholders) ----
  const banner = resolveAsset(assets, 'breaking-banner');
  const siren = resolveAsset(assets, 'siren', 'loop') ?? resolveAsset(assets, 'siren-loop');
  // Prefer the 2-frame flap loops; fall back to the static birds.
  const hawk = resolveAsset(assets, 'hawk-flap') ?? resolveAsset(assets, 'hawk');
  const dove = resolveAsset(assets, 'dove-flap') ?? resolveAsset(assets, 'dove');
  const coin =
    resolveAsset(assets, 'confetti-coin', 'loop') ??
    resolveAsset(assets, 'coin-loop', 'loop') ??
    resolveAsset(assets, 'coin', 'loop');
  const flame = resolveAsset(assets, 'flame-loop', 'loop') ?? resolveAsset(assets, 'flame', 'loop');
  const printer = resolveAsset(assets, 'veo-printer');
  const printerLoop = resolveAsset(assets, 'printer-loop', 'loop');
  const moneyShower = resolveAsset(assets, 'money-shower');
  const deadpan = resolveAsset(assets, 'mascot-deadpan') ?? resolveAsset(assets, 'deadpan');
  const coffeeSip = resolveAsset(assets, 'mascot-coffee-sip') ?? resolveAsset(assets, 'coffee-sip');

  return (
    <CRTOverlay intensity={0.7}>
      <AbsoluteFill style={{background: COLORS.canvas}}>
        {/* 1 · BreakingBanner over the tape */}
        <Sequence durationInFrames={S.meter} name="Breaking">
          <BreakingScene data={episode} banner={banner} siren={siren} />
        </Sequence>

        {/* 2 · HawkDoveMeter: dove -> hawk sweep */}
        <Sequence from={S.meter} durationInFrames={S.printer - S.meter} name="HawkDoveMeter">
          <HawkDoveMeter
            value={0.86}
            from={0.1}
            sweepAt={22}
            label="FED VIBES: HAWKISH"
            hawk={hawk}
            dove={dove}
            appearFrame={2}
          />
        </Sequence>

        {/* 3 · MoneyPrinterBeat: Veo broll + CoinRain */}
        <Sequence from={S.printer} durationInFrames={S.fire - S.printer} name="MoneyPrinter">
          <MoneyPrinterBeat
            printer={printer}
            coin={coin}
            printerLoop={printerLoop}
            goblin={moneyShower}
            coinsAt={16}
          />
        </Sequence>

        {/* 4 · FireBorder over the chart */}
        <Sequence from={S.fire} durationInFrames={S.bignum - S.fire} name="Fire">
          <FireScene data={episode} flame={flame} goblin={coffeeSip} />
        </Sequence>

        {/* 5 · BigNumber slam (screen shake demo) */}
        <Sequence from={S.bignum} durationInFrames={S.chapter - S.bignum} name="BigNumber">
          <BigNumber
            value={51}
            suffix="%"
            label="Chance the Fed hikes"
            sub="Market-implied · Dec 31 2026"
            kicker="FED WATCH"
            sfx="alarm"
          />
        </Sequence>

        {/* 6 · ChapterCard */}
        <Sequence from={S.chapter} durationInFrames={S.sting - S.chapter} name="Chapter">
          <ChapterCard part={1} title="THE TAPE" />
        </Sequence>

        {/* 7 · IntroSting closer */}
        <Sequence from={S.sting} durationInFrames={INTRO_STING_DURATION} name="IntroSting">
          <IntroSting goblin={deadpan} coin={coin} kicker="A KALSHI MARKETS SHOW" />
        </Sequence>

        {/* VHS glitch bursts over every cut */}
        {glitchCuts.map((cut, i) => (
          <Sequence key={cut} from={cut - 3} durationInFrames={GLITCH_LEN} name={`Glitch ${i}`}>
            <VHSGlitch seed={`cut-${i}`} />
          </Sequence>
        ))}

        {/* episode progress, above everything */}
        <ProgressBar bottom={14} />
      </AbsoluteFill>
    </CRTOverlay>
  );
};
