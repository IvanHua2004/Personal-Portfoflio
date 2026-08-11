/**
 * Turns live DOM text into particle targets.
 *
 * Nothing here re-implements the browser's typesetting. Lines are measured off
 * the rendered elements with Range rects, then redrawn to an offscreen canvas
 * and read back as lit pixels — so the particles land on the real layout,
 * wrapping and all, at whatever viewport the visitor happens to have.
 */

/** One visual line of text, measured off the live DOM. */
export interface TextLine {
  text: string;
  x: number;
  y: number;
  font: string;
  fontPx: number;
  letterSpacing: string;
  top: number;
  bottom: number;
  index: number;
}

/** Everything the field needs to know about the text it's drawing. */
export interface SampledText {
  /** Flat [x, y, x, y, …] of every lit pixel. */
  points: Float32Array;
  /** Which visual line each point belongs to, parallel to `points`. */
  lineIds: Uint8Array;
  lineCount: number;
  /** Per-line extents, indexed by line id. */
  minX: Float32Array;
  maxX: Float32Array;
  top: Float32Array;
  bottom: Float32Array;
  /** Bounding box of the whole block. */
  boxLeft: number;
  boxTop: number;
  boxRight: number;
  boxBottom: number;
  centroidX: number;
  centroidY: number;
}

/**
 * Walks each element character by character, using Range rects to find where
 * the browser actually broke the lines. That gives the exact substring,
 * position and font of every visual line.
 */
export function measureTextLines(
  sources: readonly HTMLElement[],
  hostRect: DOMRect,
): TextLine[] {
  const lines: TextLine[] = [];
  const range = document.createRange();
  let lineIndex = 0;

  for (const el of sources) {
    if (!el?.isConnected) {
      continue;
    }

    const style = getComputedStyle(el);
    const font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const fontPx = parseFloat(style.fontSize) || 16;
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);

    // Group characters by the top of their client rect: same top, same line.
    let current: { top: number; bottom: number; left: number; chars: string[] } | null = null;

    const flush = () => {
      if (!current) {
        return;
      }
      const text = current.chars.join('').trim();
      if (text) {
        lines.push({
          text,
          x: current.left - hostRect.left,
          y: (current.top + current.bottom) / 2 - hostRect.top,
          font,
          fontPx,
          letterSpacing: style.letterSpacing,
          top: current.top - hostRect.top,
          bottom: current.bottom - hostRect.top,
          index: Math.min(255, lineIndex++),
        });
      }
      current = null;
    };

    let node = walker.nextNode();
    while (node) {
      const value = node.nodeValue ?? '';
      for (let i = 0; i < value.length; i++) {
        range.setStart(node, i);
        range.setEnd(node, i + 1);
        const rect = range.getBoundingClientRect();

        // Collapsed rects are whitespace at a line break — nothing to draw.
        if (rect.width === 0 && rect.height === 0) {
          continue;
        }

        if (!current || Math.abs(rect.top - current.top) > 1) {
          flush();
          current = { top: rect.top, bottom: rect.bottom, left: rect.left, chars: [] };
        }
        current.chars.push(value[i]);
      }
      node = walker.nextNode();
    }

    flush();
  }

  return lines;
}

/** Renders the measured lines offscreen and reads back the lit pixels. */
export function sampleText(
  sources: readonly HTMLElement[],
  hostRect: DOMRect,
  width: number,
  height: number,
): SampledText | null {
  if (sources.length === 0 || width < 2 || height < 2) {
    return null;
  }

  const lines = measureTextLines(sources, hostRect);
  if (lines.length === 0) {
    return null;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const g = canvas.getContext('2d', { willReadFrequently: true });
  if (!g) {
    return null;
  }

  g.textAlign = 'left';
  g.textBaseline = 'middle';
  g.fillStyle = '#fff';

  for (const line of lines) {
    g.font = line.font;
    if (line.letterSpacing && line.letterSpacing !== 'normal' && 'letterSpacing' in g) {
      g.letterSpacing = line.letterSpacing;
    }
    g.fillText(line.text, line.x, line.y);
  }

  const data = g.getImageData(0, 0, width, height).data;
  const points: number[] = [];
  const lineIds: number[] = [];

  // Sampling density per line, not globally. Small copy needs roughly a 5x7
  // grid per character before it reads, but applying that to a 5rem headline
  // costs thousands of points for no gain — a uniform 2px stride over a hero
  // produced 6,600 points where per-line strides produce ~3,200 with every
  // line just as readable.
  for (const line of lines) {
    const stride = Math.max(2, Math.min(4, Math.round(line.fontPx / 14)));
    const yStart = Math.max(0, Math.floor(line.top) - 4);
    const yEnd = Math.min(height - 1, Math.ceil(line.bottom) + 4);

    for (let y = yStart; y <= yEnd; y += stride) {
      for (let x = 0; x < width; x += stride) {
        if (data[(y * width + x) * 4 + 3] > 128) {
          points.push(x, y);
          lineIds.push(line.index);
        }
      }
    }
  }

  const total = points.length / 2;
  if (total === 0) {
    return null;
  }

  let boxLeft = Number.POSITIVE_INFINITY;
  let boxTop = Number.POSITIVE_INFINITY;
  let boxRight = Number.NEGATIVE_INFINITY;
  let boxBottom = Number.NEGATIVE_INFINITY;
  let sumX = 0;
  let sumY = 0;

  const lineCount = lines.length;
  const minX: Float32Array = new Float32Array(lineCount).fill(Number.POSITIVE_INFINITY);
  const maxX: Float32Array = new Float32Array(lineCount).fill(Number.NEGATIVE_INFINITY);
  const top: Float32Array = new Float32Array(lineCount).fill(Number.POSITIVE_INFINITY);
  const bottom: Float32Array = new Float32Array(lineCount);

  for (let k = 0; k < total; k++) {
    const x = points[k * 2];
    const y = points[k * 2 + 1];
    sumX += x;
    sumY += y;

    if (x < boxLeft) boxLeft = x;
    if (x > boxRight) boxRight = x;
    if (y < boxTop) boxTop = y;
    if (y > boxBottom) boxBottom = y;

    const id = lineIds[k];
    if (x < minX[id]) minX[id] = x;
    if (x > maxX[id]) maxX[id] = x;
    if (y < top[id]) top[id] = y;
    if (y > bottom[id]) bottom[id] = y;
  }

  return {
    points: new Float32Array(points),
    lineIds: new Uint8Array(lineIds),
    lineCount,
    minX,
    maxX,
    top,
    bottom,
    boxLeft,
    boxTop,
    boxRight,
    boxBottom,
    centroidX: sumX / total,
    centroidY: sumY / total,
  };
}
