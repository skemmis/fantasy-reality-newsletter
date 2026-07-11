import {tokens} from './theme/theme';
import inline from './theme/fonts-inline.json';

/**
 * House fonts embedded as base64 woff2 (regenerate fonts-inline.json from
 * public/fonts/, see video/README). Constructed from ArrayBuffers, which
 * the CSS Font Loading spec parses synchronously — deliberately NOT
 * loadFont()/delayRender(): in this container, promise-based FontFace
 * loads intermittently never settle late in long headless renders,
 * timing out the whole render.
 */
const decode = (dataUri: string): ArrayBuffer => {
  const b64 = dataUri.slice(dataUri.indexOf(',') + 1);
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
};

const load = (family: string, dataUri: string, weight: string, style = 'normal') => {
  try {
    const face = new FontFace(family, decode(dataUri), {weight, style});
    document.fonts.add(face);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`Failed to load font ${family} ${weight} ${style}`, err);
  }
};

load(tokens.fonts.pixel, inline.pixel400, '400');
load(tokens.fonts.mono, inline.mono400, '400');
load(tokens.fonts.mono, inline.mono700, '700');
load(tokens.fonts.mono, inline.mono400i, '400', 'italic');

export const PIXEL_FAMILY = `'${tokens.fonts.pixel}', monospace`;
export const MONO_FAMILY = `'${tokens.fonts.mono}', monospace`;
