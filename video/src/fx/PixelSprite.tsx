import React from 'react';

/**
 * Tiny procedural pixel-art renderer: draws a character bitmap as a grid of
 * hard squares. Used as the graceful fallback wherever a real sprite sheet
 * (hawk/dove/flames/coins) hasn't been generated yet — the house rule is
 * "colored pixel squares, never a broken <Img>".
 *
 * Bitmaps are string rows; each char indexes into `palette`
 * ('.' or ' ' = transparent).
 */
export interface PixelSpriteProps {
  bitmap: string[];
  palette: Record<string, string>;
  /** Total sprite width in px (height follows the bitmap aspect). */
  size: number;
  style?: React.CSSProperties;
  flipX?: boolean;
}

export const PixelSprite: React.FC<PixelSpriteProps> = ({
  bitmap,
  palette,
  size,
  style,
  flipX = false,
}) => {
  const cols = Math.max(...bitmap.map((r) => r.length));
  const px = size / cols;
  return (
    <div
      style={{
        position: 'relative',
        width: cols * px,
        height: bitmap.length * px,
        scale: flipX ? '-1 1' : undefined,
        ...style,
      }}
    >
      {bitmap.map((row, y) =>
        [...row].map((ch, x) => {
          const color = palette[ch];
          if (!color) return null;
          return (
            <div
              key={`${x}-${y}`}
              style={{
                position: 'absolute',
                left: x * px,
                top: y * px,
                // Slight overdraw kills hairline seams between squares.
                width: px + 0.5,
                height: px + 0.5,
                background: color,
              }}
            />
          );
        }),
      )}
    </div>
  );
};

// ---- stock bitmaps ------------------------------------------------------

/** 2-frame perched bird, wings up / wings down. 12x10. */
export const BIRD_FRAMES: string[][] = [
  [
    '....bb......',
    '...bbbb.o...',
    '...bbbbb....',
    'w..bbbb.....',
    'wwwbbbb.....',
    '.wwwbbb.....',
    '..wwbbb.....',
    '...bbb......',
    '...b.b......',
    '..ll.ll.....',
  ],
  [
    '....bb......',
    '...bbbb.o...',
    '...bbbbb....',
    '...bbbb.....',
    '..wbbbb.....',
    '.wwwbbb.....',
    'wwwwbbb.....',
    '...bbb......',
    '...b.b......',
    '..ll.ll.....',
  ],
];

/** 2-frame pixel flame. 8x10. */
export const FLAME_FRAMES: string[][] = [
  [
    '....r...',
    '...rr...',
    '...rrr..',
    '..rrrr..',
    '..rggr..',
    '.rgggr..',
    '.rggggr.',
    'rggyygr.',
    'rgyyyygr',
    '.gyyyyg.',
  ],
  [
    '..r.....',
    '..rr..r.',
    '..rrr.r.',
    '.rrrrrr.',
    '.rggrr..',
    'rrgggr..',
    '.rggggr.',
    '.rgyygr.',
    'rgyyyyg.',
    '.gyyyyg.',
  ],
];

/** 2-frame pixel coin (face / edge-ish). 8x8. */
export const COIN_FRAMES: string[][] = [
  [
    '..gggg..',
    '.gyyyyg.',
    'gyydyyyg',
    'gyydyyyg',
    'gyydddyg',
    'gyydyyyg',
    '.gyyyyg.',
    '..gggg..',
  ],
  [
    '...gg...',
    '..gyyg..',
    '..gydg..',
    '..gydg..',
    '..gydg..',
    '..gydg..',
    '..gyyg..',
    '...gg...',
  ],
];
