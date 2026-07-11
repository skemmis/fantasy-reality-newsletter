import {loadFont} from '@remotion/fonts';
import {staticFile} from 'remotion';
import {tokens} from './theme/theme';

/**
 * House fonts, self-hosted in public/fonts/ (latin subsets vendored from
 * Google Fonts) so renders never depend on the network. Loaded once at
 * module scope; Remotion waits for document.fonts before capturing.
 */
const load = (family: string, file: string, weight: string, style = 'normal') =>
  loadFont({
    family,
    url: staticFile(`fonts/${file}`),
    weight,
    style,
  }).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`Failed to load font ${family} ${weight} ${style}`, err);
  });

load(tokens.fonts.pixel, 'press-start-2p-400.woff2', '400');
load(tokens.fonts.mono, 'space-mono-400.woff2', '400');
load(tokens.fonts.mono, 'space-mono-700.woff2', '700');
load(tokens.fonts.mono, 'space-mono-400-italic.woff2', '400', 'italic');

export const PIXEL_FAMILY = `'${tokens.fonts.pixel}', monospace`;
export const MONO_FAMILY = `'${tokens.fonts.mono}', monospace`;
