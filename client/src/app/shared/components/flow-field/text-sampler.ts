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

export interface SampledText {
  points: Float32Array;
  lineIds: Uint8Array;
  lineCount: number;
  minX: Float32Array;
  maxX: Float32Array;
  top: Float32Array;
  bottom: Float32Array;
  boxLeft: number;
  boxTop: number;
  boxRight: number;
  boxBottom: number;
  centroidX: number;
  centroidY: number;
}

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

  for (const line of lines) {
    const stride = Math.max(2, Math.min(3, Math.round(line.fontPx / 18)));
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
