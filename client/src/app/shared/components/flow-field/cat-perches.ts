import { SampledText } from './text-sampler';

export interface CatSpot {
  x: number;
  y: number;
  tilt: number;
  facing: number;
  size: number;
}

export interface CatPerches {
  lineSpots: CatSpot[];
  spots: CatSpot[];
  homeSpot: CatSpot;
  endSpot: CatSpot;
  laneY: number;
}

export interface PerchOptions {
  width: number;
  height: number;
  text: SampledText;
  bigPx: number;
  smallPx: number;
  catSize: number;
}

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

export function findCatPerches(o: PerchOptions): CatPerches | null {
  if (o.text.lineCount === 0) {
    return null;
  }

  const laneY = findLane(o);

  const tiltFor = (n: number) => (((n * 37) % 7) - 3) * 0.013;

  const small = o.smallPx;
  const halfSmall = small * 0.5;

  const bigHalf = o.bigPx * 0.5;
  const homeSpot: CatSpot = {
    x: Math.max(o.width - bigHalf * 0.34, o.text.boxRight + 24 + bigHalf),
    y: o.height - 4,
    tilt: -0.02,
    facing: -1,
    size: o.bigPx,
  };

  const endSize = Math.max(200, Math.min(o.catSize * 1.15, o.height * 0.78));
  const endHalf = endSize * 0.5;
  const endSpot: CatSpot = {
    x: Math.max(o.width - endHalf * 0.34, o.text.boxRight + 24 + endHalf),
    y: o.height - 4,
    tilt: -0.015,
    facing: -1,
    size: endSize,
  };

  const spots: CatSpot[] = [endSpot];
  const lineSpots: CatSpot[] = [];

  const rises = [-14, 8, -28, 20, -4, 28, 54, 78];

  for (let i = 0; i < o.text.lineCount; i++) {
    const order = i % 2 === 0 ? [-1, 1] : [1, -1];
    let chosen: CatSpot | null = null;

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

  return { lineSpots, spots, homeSpot, endSpot, laneY };
}
