/**
 * Where the cat is allowed to be.
 *
 * Every perch is checked against every line of text before it can be used,
 * which is what lets the cat land in unusual places without ever covering the
 * copy. The search runs once per layout, so the frame loop only ever picks
 * from a list of positions already known to be safe.
 */

import { SampledText } from './text-sampler';

export interface CatSpot {
  x: number;
  y: number;
  /** Radians. A few degrees of lean, so it never sits perfectly square. */
  tilt: number;
  /** 1 faces right, -1 faces left. */
  facing: number;
  /** On-screen height at this perch, in px. */
  size: number;
}

export interface CatPerches {
  /** One per line, used during the write. */
  lineSpots: CatSpot[];
  /** Everything the cat may blink to. Index 0 is the final seat. */
  spots: CatSpot[];
  /** Fallback for a line with nowhere clear beside it. */
  homeSpot: CatSpot;
  /** The big bottom-right seat it finishes on. */
  endSpot: CatSpot;
  /** A strip clear of the text, used when a perch has to fall back to it. */
  laneY: number;
}

export interface PerchOptions {
  width: number;
  height: number;
  text: SampledText;
  /** Height of the cat at its big perches. */
  bigPx: number;
  /** Height of the cat at the small per-line perches. */
  smallPx: number;
  /** The configured cat size, used to scale the final seat. */
  catSize: number;
}

/**
 * True when a cat standing here would touch neither the canvas edge nor any
 * line of text.
 */
function spotClear(
  o: PerchOptions,
  x: number,
  y: number,
  size: number,
  allowOffscreen = false,
): boolean {
  const halfW = size * 0.5;
  const left = x - halfW;
  const right = x + halfW;
  const top = y - size;
  const bottom = y;

  // The big perch is meant to hang off the edge, so it only has to clear the
  // text. Everything else has to sit fully inside the hero.
  if (!allowOffscreen && (left < 4 || right > o.width - 4 || top < 4)) {
    return false;
  }
  if (bottom > o.height + 2 || top > o.height - 30) {
    return false;
  }

  for (let i = 0; i < o.text.lineCount; i++) {
    const lineLeft = o.text.minX[i] - 12;
    const lineRight = o.text.maxX[i] + 12;
    const lineTop = o.text.top[i] - 8;
    const lineBottom = o.text.bottom[i] + 8;
    if (right > lineLeft && left < lineRight && bottom > lineTop && top < lineBottom) {
      return false;
    }
  }

  return true;
}

/**
 * Picks a horizontal strip clear of the text. Above the block is preferred,
 * underneath is the fallback — the cat is taller than a line, so sitting on the
 * line it's writing puts its body straight over the lines above.
 */
function findLane(o: PerchOptions): number {
  const gap = 16;
  if (o.text.boxTop - gap - o.bigPx >= 4) {
    return o.text.boxTop - gap;
  }
  if (o.text.boxBottom + gap + o.bigPx <= o.height - 4) {
    return o.text.boxBottom + gap + o.bigPx;
  }
  return o.height - 14;
}

/**
 * Works out everywhere the cat can legally sit: the big seat off the right
 * edge, and one small perch beside each line on alternating sides. Heights are
 * deliberately uneven and every perch gets a few degrees of lean, so it never
 * looks pasted to a grid.
 */
export function findCatPerches(o: PerchOptions): CatPerches | null {
  if (o.text.lineCount === 0) {
    return null;
  }

  const laneY = findLane(o);

  // Deterministic per index, so a resize doesn't reshuffle the whole layout.
  // Kept under a couple of degrees — enough to look casual, not enough to look
  // like it's falling over.
  const tiltFor = (n: number) => (((n * 37) % 7) - 3) * 0.013;

  const small = o.smallPx;
  const halfSmall = small * 0.5;

  // The fallback perch leans in from beyond the right edge. Placed by its left
  // flank at a fixed clearance from the text, so however large it gets it
  // always clears the copy and always keeps a third of itself off-screen.
  const bigHalf = o.bigPx * 0.5;
  const homeSpot: CatSpot = {
    x: Math.max(o.width - bigHalf * 0.34, o.text.boxRight + 24 + bigHalf),
    y: o.height - 4,
    tilt: -0.02,
    facing: -1,
    size: o.bigPx,
  };
  // Deliberately NOT in the roaming pool. It sits within 34px of the final seat
  // at a slightly different size, so having both in the rotation made the big
  // cat appear to flicker and resize on the spot. It survives only as a
  // fallback for a line with nowhere else to go.

  // The final seat: bottom-right and much larger, anchored the same way.
  const endSize = Math.max(200, Math.min(o.catSize * 1.15, o.height * 0.78));
  const endHalf = endSize * 0.5;
  const endSpot: CatSpot = {
    x: Math.max(o.width - endHalf * 0.34, o.text.boxRight + 24 + endHalf),
    y: o.height - 4,
    tilt: -0.015,
    facing: -1,
    size: endSize,
  };

  // First in the pool, so any weighting toward index 0 favours it.
  const spots: CatSpot[] = [endSpot];
  const lineSpots: CatSpot[] = [];

  // Small perches beside each line, alternating sides down the block. The rises
  // include some deeper drops: a perch beside the last line only clears the
  // line above it if it can sit well below its own baseline.
  const rises = [-14, 8, -28, 20, -4, 28, 54, 78];

  for (let i = 0; i < o.text.lineCount; i++) {
    // First line left, second right, alternating down the block.
    const order = i % 2 === 0 ? [-1, 1] : [1, -1];
    let chosen: CatSpot | null = null;

    // Several gaps, not one: with a fixed 22px gap the left perch missed the
    // canvas edge by 4px, which quietly forced every line onto the right and
    // lost the alternation entirely.
    for (const side of order) {
      for (const pad of [22, 14, 8]) {
        for (let r = 0; r < rises.length && !chosen; r++) {
          const x =
            side === 1
              ? o.text.maxX[i] + halfSmall + pad
              : o.text.minX[i] - halfSmall - pad;
          const y = o.text.bottom[i] + rises[(i + r) % rises.length];
          if (spotClear(o, x, y, small)) {
            chosen = {
              x,
              y,
              tilt: tiltFor(i + r),
              facing: side === 1 ? -1 : 1,
              size: small,
            };
          }
        }
        if (chosen) {
          break;
        }
      }
      if (chosen) {
        break;
      }
    }

    if (chosen) {
      lineSpots[i] = chosen;
      spots.push(chosen);
    } else {
      lineSpots[i] = homeSpot;
    }
  }

  // Deliberately nothing else goes in the pool. It holds exactly the perches
  // the transition uses — one per line plus the final seat — so the cat can
  // never turn up anywhere the sequence didn't already take it.
  return { lineSpots, spots, homeSpot, endSpot, laneY };
}
