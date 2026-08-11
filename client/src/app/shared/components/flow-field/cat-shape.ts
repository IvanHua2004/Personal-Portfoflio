/**
 * The cat's silhouette, rasterised once and kept as target offsets.
 *
 * Same trick the text uses: draw it, sample the lit pixels, and from then on
 * it's just a set of points particles can be asked to hold. Offsets are stored
 * as fractions of the cat's own height, so a perch only has to supply a
 * position and a size.
 */

export interface CatShape {
  /** Offsets from the point between the front paws, as fractions of height. */
  lx: Float32Array;
  ly: Float32Array;
  /** 0 where the tail joins the body, 1 at the tip. */
  tail: Float32Array;
  /** Head and ear membership, feathered rather than hard cut. */
  head: Float32Array;
  ear: Float32Array;
  count: number;
  /** Gap between neighbouring points at full size, in px. */
  spacing: number;
}

/** Neck pivot in the cat's normalised local space, from the design box. */
export const HEAD_PIVOT_X = 18 / 104;
export const HEAD_PIVOT_Y = -56 / 104;

/**
 * Draws the cat into an offscreen canvas at `size` px tall and samples it.
 *
 * Each body part is filled separately and deliberately. In a single path these
 * subpaths wind in opposite directions, and canvas's nonzero fill rule cancels
 * where two opposing windings overlap — which punched a hole straight through
 * the body everywhere the tail crossed it.
 */
export function buildCatShape(size: number): CatShape | null {
  const scale = size / 104;
  const w = Math.ceil(100 * scale);
  const h = Math.ceil(104 * scale);

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  if (!g) {
    return null;
  }

  g.scale(scale, scale);
  g.translate(0, 4);
  g.fillStyle = '#fff';

  // Body: haunches flaring at the base, narrowing to the shoulders.
  const body = new Path2D();
  body.moveTo(44, 98);
  body.quadraticCurveTo(36, 62, 56, 50);
  body.lineTo(80, 50);
  body.quadraticCurveTo(94, 70, 88, 98);
  body.closePath();
  g.fill(body);

  const head = new Path2D();
  head.arc(68, 30, 20, 0, Math.PI * 2);
  g.fill(head);

  // Ears. Curved rather than flat triangles: the outer edge sweeps up to the
  // point and the inner edge falls back to the skull, which is what gives a
  // cat's ear its hooked look and a clean notch between the two.
  const earLeft = new Path2D();
  earLeft.moveTo(52, 18);
  earLeft.quadraticCurveTo(49, 2, 55, -6);
  earLeft.quadraticCurveTo(62, 4, 66, 12);
  earLeft.closePath();
  g.fill(earLeft);

  const earRight = new Path2D();
  earRight.moveTo(72, 11);
  earRight.quadraticCurveTo(80, -2, 88, -5);
  earRight.quadraticCurveTo(89, 8, 86, 20);
  earRight.closePath();
  g.fill(earRight);

  const tailPath = new Path2D();
  tailPath.moveTo(46, 96);
  tailPath.quadraticCurveTo(6, 102, 12, 62);
  tailPath.quadraticCurveTo(14, 50, 24, 56);
  tailPath.quadraticCurveTo(22, 84, 48, 88);
  tailPath.closePath();
  g.fill(tailPath);

  for (const cx of [54, 80]) {
    const paw = new Path2D();
    paw.ellipse(cx, 97, 9, 5, 0, 0, Math.PI * 2);
    g.fill(paw);
  }

  const data = g.getImageData(0, 0, w, h).data;
  // Sampling scales with the cat, so a large one doesn't turn into a
  // constellation of dots with holes between them.
  const stride = Math.max(2, Math.round(size / 78));
  const xs: number[] = [];
  const ys: number[] = [];
  const tail: number[] = [];
  const headW: number[] = [];
  const earW: number[] = [];

  for (let y = 0; y < h; y += stride) {
    for (let x = 0; x < w; x += stride) {
      if (data[(y * w + x) * 4 + 3] > 128) {
        xs.push((x - w / 2) / size);
        ys.push((y - h) / size);

        // How far along the tail this point sits. A flat flag made the whole
        // tail translate as a rigid lump, which tore a seam at the join.
        const along = (w * 0.34 - x) / (w * 0.34);
        tail.push(Math.max(0, Math.min(1, along)));

        // Head and ear membership in the 0–104 design space, feathered:
        // rotating a hard-edged head tears a visible seam across the neck.
        const dy = y / scale - 4;
        headW.push(Math.max(0, Math.min(1, (58 - dy) / 12)));
        earW.push(Math.max(0, Math.min(1, (17 - dy) / 10)));
      }
    }
  }

  // Enough points to fill the silhouette at this size. Too few and the
  // sampling grid shows through as holes, which no amount of stroke width
  // hides on a large cat.
  const cap = 2600;
  const step = xs.length > cap ? xs.length / cap : 1;
  const count = Math.min(cap, xs.length);

  const shape: CatShape = {
    lx: new Float32Array(count),
    ly: new Float32Array(count),
    tail: new Float32Array(count),
    head: new Float32Array(count),
    ear: new Float32Array(count),
    count,
    spacing: stride * step,
  };

  for (let k = 0; k < count; k++) {
    const src = Math.floor(k * step);
    shape.lx[k] = xs[src];
    shape.ly[k] = ys[src];
    shape.tail[k] = tail[src];
    shape.head[k] = headW[src];
    shape.ear[k] = earW[src];
  }

  return shape;
}
