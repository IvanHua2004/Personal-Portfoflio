export interface CatPaint {
  cat: string;
  bg: string;
  scratch: string;
}

export function drawCatEyes(
  ctx: CanvasRenderingContext2D,
  paint: CatPaint,
  left: readonly [number, number],
  right: readonly [number, number],
  size: number,
  facing: number,
  alpha: number,
): void {
  const eyeScale = size * 0.078;

  ctx.strokeStyle = `rgba(${paint.bg}, ${Math.min(1, alpha).toFixed(3)})`;
  ctx.lineWidth = Math.max(1.4, eyeScale * 0.26);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  for (const [[ex, ey], dir] of [
    [left, 1],
    [right, -1],
  ] as const) {
    const d = dir * facing;
    ctx.beginPath();
    ctx.moveTo(ex - d * eyeScale * 0.46, ey - eyeScale * 0.44);
    ctx.lineTo(ex + d * eyeScale * 0.46, ey);
    ctx.lineTo(ex - d * eyeScale * 0.46, ey + eyeScale * 0.44);
    ctx.stroke();
  }
}

export function drawCatPaw(
  ctx: CanvasRenderingContext2D,
  paint: CatPaint,
  shoulderX: number,
  shoulderY: number,
  pawX: number,
  pawY: number,
  size: number,
  alpha: number,
): void {
  const pad = size * 0.075;
  const dx = pawX - shoulderX;
  const dy = pawY - shoulderY;
  const len = Math.hypot(dx, dy) || 1;
  const nx = dx / len;
  const ny = dy / len;

  ctx.strokeStyle = `rgba(${paint.cat}, ${(alpha * 0.95).toFixed(3)})`;
  ctx.fillStyle = `rgba(${paint.cat}, ${alpha.toFixed(3)})`;
  ctx.lineCap = 'round';

  ctx.lineWidth = pad * 0.72;
  ctx.beginPath();
  ctx.moveTo(shoulderX, shoulderY);
  ctx.quadraticCurveTo(
    (shoulderX + pawX) / 2 - ny * len * 0.16,
    (shoulderY + pawY) / 2 + nx * len * 0.16,
    pawX,
    pawY,
  );
  ctx.stroke();

  const dirA = Math.atan2(ny, nx);
  const toes: [number, number, number][] = [];
  for (let t = -1; t <= 1; t++) {
    const a = dirA + t * 0.62;
    toes.push([pawX + Math.cos(a) * pad * 1.28, pawY + Math.sin(a) * pad * 1.28, a]);
  }

  ctx.beginPath();
  ctx.ellipse(pawX, pawY, pad * 1.12, pad * 0.94, dirA, 0, Math.PI * 2);
  ctx.fill();
  for (const [tx, ty, a] of toes) {
    ctx.beginPath();
    ctx.ellipse(tx, ty, pad * 0.5, pad * 0.42, a, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = `rgba(${paint.bg}, ${(alpha * 0.9).toFixed(3)})`;
  ctx.beginPath();
  ctx.ellipse(
    pawX + Math.cos(dirA) * pad * 0.1,
    pawY + Math.sin(dirA) * pad * 0.1,
    pad * 0.6,
    pad * 0.46,
    dirA,
    0,
    Math.PI * 2,
  );
  ctx.fill();
  for (const [tx, ty, a] of toes) {
    ctx.beginPath();
    ctx.ellipse(tx, ty, pad * 0.24, pad * 0.19, a, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function drawClawMarks(
  ctx: CanvasRenderingContext2D,
  paint: CatPaint,
  x: number,
  y: number,
  angle: number,
  size: number,
  life: number,
): void {
  const grown = Math.min(1, (1 - life) * 3.2);
  const reach = size * 0.95 * grown;
  const spread = size * 0.22;

  ctx.fillStyle = `rgba(${paint.scratch}, ${(life * 0.9).toFixed(3)})`;

  const nx = Math.cos(angle);
  const ny = Math.sin(angle);
  const px = -ny;
  const py = nx;

  for (let s = -1; s <= 1; s++) {
    const len = reach * (s === 0 ? 1 : 0.8);
    const startX = x + px * spread * s - nx * len * 0.4;
    const startY = y + py * spread * s - ny * len * 0.4;
    const endX = startX + nx * len;
    const endY = startY + ny * len;

    const wide = Math.max(1.6, size * 0.05) * (s === 0 ? 1 : 0.8);
    const bow = spread * 0.3 * s;
    const midX = (startX + endX) / 2 + px * bow;
    const midY = (startY + endY) / 2 + py * bow;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.quadraticCurveTo(midX + px * wide, midY + py * wide, endX, endY);
    ctx.quadraticCurveTo(midX - px * wide, midY - py * wide, startX, startY);
    ctx.closePath();
    ctx.fill();
  }
}
