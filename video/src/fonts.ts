import {loadFont} from '@remotion/fonts';
import {tokens} from './theme/theme';
import inline from './theme/fonts-inline.json';

/**
 * House fonts embedded as base64 data URIs (regenerate fonts-inline.json
 * from public/fonts/ with the one-liner in scripts/gen_sfx.mjs's header
 * neighborhood — see README). FontFace loads over the dev-server URL were
 * intermittently hanging delayRender in long headless renders; data URIs
 * remove the fetch entirely. Loaded once at module scope; Remotion waits
 * for document.fonts before capturing.
 */
const load = (family: string, dataUri: string, weight: string, style = 'normal') =>
  loadFont({family, url: dataUri, format: 'woff2', weight, style}).catch((err) => {
    // eslint-disable-next-line no-console
    console.error(`Failed to load font ${family} ${weight} ${style}`, err);
  });

load(tokens.fonts.pixel, inline.pixel400, '400');
load(tokens.fonts.mono, inline.mono400, '400');
load(tokens.fonts.mono, inline.mono700, '700');
load(tokens.fonts.mono, inline.mono400i, '400', 'italic');

export const PIXEL_FAMILY = `'${tokens.fonts.pixel}', monospace`;
export const MONO_FAMILY = `'${tokens.fonts.mono}', monospace`;
