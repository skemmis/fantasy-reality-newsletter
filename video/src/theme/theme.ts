import tokensJson from './tokens.json';

export interface ThemeTokens {
  colors: {
    ink: string;
    canvas: string;
    card: string;
    cream: string;
    magenta: string;
    red: string;
    gold: string;
    mutedText: string;
    grid: string;
  };
  series: string[];
  yes: string;
  no: string;
  fonts: {pixel: string; mono: string};
  shadow: {dx: number; dy: number; alpha: number};
  radius: number;
}

export const tokens = tokensJson as ThemeTokens;

export const COLORS = tokens.colors;
export const SERIES = tokens.series;
export const FONT_PIXEL = `'${tokens.fonts.pixel}', monospace`;
export const FONT_MONO = `'${tokens.fonts.mono}', monospace`;

/**
 * The house shadow: hard offset, zero blur.
 * Pass a color for a solid shadow (e.g. ink), or omit for the
 * default translucent-ink shadow from tokens.
 */
export const hardShadow = (
  color?: string,
  scale = 1,
): string => {
  const {dx, dy, alpha} = tokens.shadow;
  const c = color ?? `rgba(23, 18, 43, ${alpha})`;
  return `${dx * scale}px ${dy * scale}px 0 0 ${c}`;
};

/** Same idea for text-shadow (no spread parameter allowed). */
export const hardTextShadow = (color?: string, scale = 1): string => {
  const {dx, dy, alpha} = tokens.shadow;
  const c = color ?? `rgba(23, 18, 43, ${alpha})`;
  return `${(dx / 2) * scale}px ${(dy / 2) * scale}px 0 ${c}`;
};

/** Chunky pixel border. */
export const pixelBorder = (width = 4, color: string = COLORS.ink): string =>
  `${width}px solid ${color}`;

/** The standard card panel: card bg, pixel border, hard shadow, no radius. */
export const cardPanel = (opts?: {
  borderWidth?: number;
  shadowColor?: string;
  shadowScale?: number;
  background?: string;
}): React.CSSProperties => ({
  background: opts?.background ?? COLORS.card,
  border: pixelBorder(opts?.borderWidth ?? 4),
  borderRadius: tokens.radius,
  boxShadow: hardShadow(opts?.shadowColor, opts?.shadowScale ?? 1),
});

/** rgba() helper for the ink color. */
export const inkAlpha = (alpha: number): string => `rgba(23, 18, 43, ${alpha})`;
