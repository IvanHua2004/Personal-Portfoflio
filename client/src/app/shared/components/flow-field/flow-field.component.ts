import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  NgZone,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

import { Perlin } from '../../../core/utils/perlin';
import { CatSpot, findCatPerches } from './cat-perches';
import { drawCatEyes, drawCatPaw, drawClawMarks, CatPaint } from './cat-render';
import { HEAD_PIVOT_X, HEAD_PIVOT_Y, buildCatShape } from './cat-shape';
import { SampledText, sampleText } from './text-sampler';

@Component({
  selector: 'app-flow-field',
  template: '<canvas #canvas aria-hidden="true"></canvas>',
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
      overflow: hidden;
      pointer-events: none;
    }

    canvas {
      display: block;
      width: 100%;
      height: 100%;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FlowFieldComponent {
  private readonly canvasRef = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  readonly ready = output<void>();

  readonly density = input(115);
  readonly maxParticles = input(5400);
  readonly speed = input(1.8);
  readonly turbulence = input(0.8);
  readonly fieldScale = input(0.0009);
  readonly drift = input(0.0012);

  readonly pointerRadius = input(230);
  readonly repelStrength = input(4.2);
  readonly swirlStrength = input(3.4);
  readonly dragStrength = input(2.4);

  readonly sources = input<readonly HTMLElement[]>([]);
  readonly revealRadius = input(120);
  readonly assembleMs = input(1600);
  readonly dissolveMs = input(900);
  readonly autoRevealMs = input(8200);
  readonly popMs = input(520);
  readonly popAmount = input(0.07);

  readonly textAlpha = input(0.95);
  readonly textWidth = input(1.35);
  readonly writeStagger = input(0.75);
  readonly revealOrder = input<'random' | 'reading'>('reading');
  readonly burstSpeed = input(32);
  readonly burstDrag = input(0.93);
  readonly burstMs = input(1500);
  readonly burstChaos = input(1);

  readonly showCat = input(true);
  readonly catSize = input(460);
  readonly catStroke = input(3.2);
  readonly catWag = input(4);
  readonly catColor = input<string | null>(null);
  readonly catSettleMs = input(3400);
  readonly catSwipeMs = input(620);
  readonly catScratchMs = input(520);
  readonly catShyRadius = input(90);

  readonly trail = input(0.95);
  readonly color = input<string | null>(null);

  private static readonly BANDS = 5;

  private ctx: CanvasRenderingContext2D | null = null;
  private readonly noise = new Perlin();

  private width = 0;
  private height = 0;
  private frame = 0;
  private running = false;
  private visible = true;
  private tabActive = true;

  private px: Float32Array = new Float32Array(0);
  private py: Float32Array = new Float32Array(0);
  private prevX: Float32Array = new Float32Array(0);
  private prevY: Float32Array = new Float32Array(0);
  private life: Float32Array = new Float32Array(0);
  private z: Float32Array = new Float32Array(0);
  private spd: Float32Array = new Float32Array(0);
  private react: Float32Array = new Float32Array(0);
  private orbitPhase: Float32Array = new Float32Array(0);
  private orbitSpeed: Float32Array = new Float32Array(0);
  private orbitRadius: Float32Array = new Float32Array(0);
  private band: Uint8Array = new Uint8Array(0);
  private count = 0;
  private flowCount = 0;
  private stagger: Float32Array = new Float32Array(0);
  private exitAt: Float32Array = new Float32Array(0);

  private glyphPoints: Float32Array = new Float32Array(0);
  private glyphLine: Uint8Array = new Uint8Array(0);
  private targetX: Float32Array = new Float32Array(0);
  private targetY: Float32Array = new Float32Array(0);
  private hasTarget: Uint8Array = new Uint8Array(0);
  private geomMinX: Float32Array = new Float32Array(0);
  private geomMaxX: Float32Array = new Float32Array(0);
  private geomTop: Float32Array = new Float32Array(0);
  private geomBottom: Float32Array = new Float32Array(0);
  private lineCount = 0;

  private text: SampledText | null = null;
  private lineSpots: CatSpot[] = [];
  private spots: CatSpot[] = [];

  private catLX: Float32Array = new Float32Array(0);
  private catLY: Float32Array = new Float32Array(0);
  private catTail: Float32Array = new Float32Array(0);
  private catHead: Float32Array = new Float32Array(0);
  private catEar: Float32Array = new Float32Array(0);
  private catSpacing = 3;

  private catHeadAngle = 0;
  private catAlert = 0;
  private catSwipeT = 0;
  private catSwiping = false;
  private catStruck = false;
  private catSpookCool = 0;

  private strikeX = 0;
  private strikeY = 0;
  private pawX = 0;
  private pawY = 0;
  private pawOut = 0;

  private scratchT = 0;
  private scratchX = 0;
  private scratchY = 0;
  private scratchAngle = 0;
  private scratchSize = 0;
  private catCount = 0;
  private catStart = 0;
  private catPx = 0;
  private catBigPx = 0;
  private catSmallPx = 0;
  private catCurPx = 0;
  private homeSpot: CatSpot | null = null;
  private endSpot: CatSpot | null = null;
  private catSettled = false;
  private catDone = false;
  private catX = 0;
  private catY = 0;
  private catFacing = 1;
  private catPlaced = false;
  private catLaneY = 0;
  private catBlinkIn = 0;
  private catSnap = false;
  private catTilt = 0;
  private catPhase = 0;
  private catCos = 1;
  private catSin = 0;
  private catBob = 0;
  private catBreathe = 1;
  private catShow = 0;
  private catLine = -1;

  private boxLeft = 0;
  private boxTop = 0;
  private boxRight = 0;
  private boxBottom = 0;
  private centroidX = 0;
  private centroidY = 0;

  private burstVX: Float32Array = new Float32Array(0);
  private burstVY: Float32Array = new Float32Array(0);
  private burstT = 0;
  private burstPending = false;
  private burstOriginX = 0;
  private burstOriginY = 0;
  private burstChaosNow = 1;
  private prevWanted = 0;

  private formT = 0;
  private popScale = 1;
  private popTimer = Number.POSITIVE_INFINITY;
  private popArmed = true;
  private autoRevealTimer = 0;
  private revealCooldown = 0;
  private lastTime = -1;
  private frameDt = 16.7;
  private scrolledAway = false;

  private pointerX = -9999;
  private pointerY = -9999;
  private pointerActive = false;
  private smoothX = 0;
  private smoothY = 0;
  private velX = 0;
  private velY = 0;
  private pointerSeeded = false;

  private rgb = '221, 213, 200';
  private paint: CatPaint = {
    cat: '242, 161, 92',
    bg: '13, 17, 23',
    scratch: '230, 237, 243',
  };

  constructor() {
    afterNextRender(() => this.init());
  }

  private init(): void {
    const canvas = this.canvasRef().nativeElement;
    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) {
      return;
    }
    this.ctx = ctx;
    this.rgb = this.resolveColor(this.color(), '--color-particle', '221, 213, 200');
    this.paint = {
      cat: this.resolveColor(this.catColor(), '--color-cat', '242, 161, 92'),
      bg: this.resolveColor(null, '--color-bg', '13, 17, 23'),
      scratch: this.resolveColor(null, '--color-text', '230, 237, 243'),
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    this.resize();

    if (!reduceMotion.matches) {
      this.ready.emit();
      this.autoRevealTimer = this.autoRevealMs();
    }

    document.fonts?.ready.then(() => this.resize());

    this.zone.runOutsideAngular(() => {
      const onPointerMove = (event: PointerEvent) => {
        const rect = canvas.getBoundingClientRect();
        this.pointerX = event.clientX - rect.left;
        this.pointerY = event.clientY - rect.top;
        this.pointerActive =
          this.pointerX >= 0 &&
          this.pointerY >= 0 &&
          this.pointerX <= rect.width &&
          this.pointerY <= rect.height;
      };

      const onPointerLeave = () => {
        this.pointerActive = false;
        this.pointerSeeded = false;
      };

      const onVisibility = () => {
        this.tabActive = document.visibilityState === 'visible';
        this.lastTime = -1;
        this.sync();
      };

      const onMotionChange = () => {
        if (reduceMotion.matches) {
          this.stop();
          this.renderStatic();
        } else {
          this.sync();
        }
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('blur', onPointerLeave);
      document.addEventListener('visibilitychange', onVisibility);
      reduceMotion.addEventListener('change', onMotionChange);

      const observer = new IntersectionObserver(
        ([entry]) => {
          this.visible = entry.isIntersecting;

          if (entry.intersectionRatio < 0.3) {
            this.scrolledAway = true;
          } else if (entry.intersectionRatio > 0.6 && this.scrolledAway) {
            this.scrolledAway = false;
            this.autoRevealTimer = this.autoRevealMs();
          }

          this.sync();
        },
        { threshold: [0, 0.3, 0.6, 1] },
      );
      observer.observe(this.host.nativeElement);

      const resizeObserver = new ResizeObserver(() => {
        this.resize();
        if (reduceMotion.matches) {
          this.renderStatic();
        }
      });
      resizeObserver.observe(this.host.nativeElement);

      this.destroyRef.onDestroy(() => {
        this.stop();
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('blur', onPointerLeave);
        document.removeEventListener('visibilitychange', onVisibility);
        reduceMotion.removeEventListener('change', onMotionChange);
        observer.disconnect();
        resizeObserver.disconnect();
      });

      if (reduceMotion.matches) {
        this.renderStatic();
      } else {
        this.start();
      }
    });
  }

  private resolveColor(explicit: string | null, property: string, fallback: string): string {
    if (explicit) {
      return explicit;
    }

    const value = getComputedStyle(this.host.nativeElement).getPropertyValue(property).trim();

    const hex = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(value);
    if (hex) {
      return `${parseInt(hex[1], 16)}, ${parseInt(hex[2], 16)}, ${parseInt(hex[3], 16)}`;
    }

    const rgb = /rgba?\(([^)]+)\)/.exec(value);
    if (rgb) {
      return rgb[1]
        .split(',')
        .slice(0, 3)
        .map((part) => part.trim())
        .join(', ');
    }

    return fallback;
  }

  private resize(): void {
    const canvas = this.canvasRef().nativeElement;
    const rect = this.host.nativeElement.getBoundingClientRect();

    this.width = Math.max(1, Math.round(rect.width));
    this.height = Math.max(1, Math.round(rect.height));

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = this.width * dpr;
    canvas.height = this.height * dpr;

    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.applyText(sampleText(this.sources(), rect, this.width, this.height));
    this.seed();
  }

  private applyText(sampled: SampledText | null): void {
    this.text = sampled;
    this.catCount = 0;
    this.spots = [];
    this.lineSpots = [];
    this.homeSpot = null;
    this.endSpot = null;

    if (!sampled) {
      this.glyphPoints = new Float32Array(0);
      this.glyphLine = new Uint8Array(0);
      this.lineCount = 0;
      return;
    }

    this.glyphPoints = sampled.points;
    this.glyphLine = sampled.lineIds;
    this.lineCount = sampled.lineCount;
    this.geomMinX = sampled.minX;
    this.geomMaxX = sampled.maxX;
    this.geomTop = sampled.top;
    this.geomBottom = sampled.bottom;
    this.boxLeft = sampled.boxLeft;
    this.boxTop = sampled.boxTop;
    this.boxRight = sampled.boxRight;
    this.boxBottom = sampled.boxBottom;
    this.centroidX = sampled.centroidX;
    this.centroidY = sampled.centroidY;

    this.buildCat(sampled);
  }

  private buildCat(text: SampledText): void {
    if (!this.showCat()) {
      return;
    }

    const size = Math.max(140, Math.min(this.catSize(), this.height * 0.86));
    const small = Math.max(46, Math.min(60, this.height * 0.09));

    const shape = buildCatShape(size);
    if (!shape) {
      return;
    }

    this.catBigPx = size;
    this.catSmallPx = small;
    this.catPx = size;
    this.catLX = shape.lx;
    this.catLY = shape.ly;
    this.catTail = shape.tail;
    this.catHead = shape.head;
    this.catEar = shape.ear;
    this.catCount = shape.count;
    this.catSpacing = shape.spacing;

    const perches = findCatPerches({
      width: this.width,
      height: this.height,
      text,
      bigPx: size,
      smallPx: small,
      catSize: this.catSize(),
    });

    if (!perches) {
      this.catCount = 0;
      return;
    }

    this.spots = perches.spots;
    this.lineSpots = perches.lineSpots;
    this.homeSpot = perches.homeSpot;
    this.endSpot = perches.endSpot;
    this.catLaneY = perches.laneY;
  }

  private shatter(originX: number, originY: number, chaos: number): void {
    this.burstOriginX = originX;
    this.burstOriginY = originY;
    this.burstChaosNow = chaos;
    this.burstPending = true;
    this.burstT = 1;
    this.formT = 0;

    this.autoRevealTimer = 0;
    this.revealCooldown = 1100;
  }

  private trackPointer(): void {
    const size = this.catCurPx || this.catSmallPx;
    const headX =
      this.catX + HEAD_PIVOT_X * size * this.catFacing;
    const headY = this.catY + HEAD_PIVOT_Y * size;

    let target = 0;
    let alert = 0;

    if (this.pointerActive) {
      const dx = this.pointerX - headX;
      const dy = this.pointerY - headY;
      const dist = Math.hypot(dx, dy);

      const raw = Math.atan2(dy, Math.max(60, Math.abs(dx))) * 0.7;
      target = Math.max(-0.26, Math.min(0.26, raw)) * this.catFacing;
      alert = Math.max(0, 1 - dist / 260);
    }

    this.catHeadAngle += (target - this.catHeadAngle) * 0.09;
    this.catAlert += (alert - this.catAlert) * 0.08;
  }

  private maybeSpook(): void {
    if (this.catSpookCool > 0) {
      this.catSpookCool -= this.frameDt;
      return;
    }
    if (!this.pointerActive || this.spots.length < 2) {
      return;
    }

    const size = this.catCurPx || this.catSmallPx;
    const halfW = size * 0.5;
    const dx = Math.max(this.catX - halfW - this.pointerX, 0, this.pointerX - (this.catX + halfW));
    const dy = Math.max(this.catY - size - this.pointerY, 0, this.pointerY - this.catY);

    if (Math.hypot(dx, dy) > this.catShyRadius()) {
      return;
    }

    let best: CatSpot | null = null;
    let bestDist = -1;
    for (let tries = 0; tries < 5; tries++) {
      const candidate = this.spots[Math.floor(Math.random() * this.spots.length)];
      const away = Math.hypot(candidate.x - this.pointerX, candidate.y - this.pointerY);
      if (away > bestDist) {
        bestDist = away;
        best = candidate;
      }
    }

    if (best) {
      this.perch(best);
      this.catSpookCool = 700;
    }
  }

  private catPoint(ux: number, uy: number, headWeight = 1): [number, number] {
    const scale = this.catCurPx;

    let lux = ux;
    let luy = uy;

    if (headWeight > 0.001 && Math.abs(this.catHeadAngle) > 0.0005) {
      const a = this.catHeadAngle * headWeight;
      const ca = Math.cos(a);
      const sa = Math.sin(a);
      const ox = lux - HEAD_PIVOT_X;
      const oy = luy - HEAD_PIVOT_Y;
      lux = HEAD_PIVOT_X + ox * ca - oy * sa;
      luy = HEAD_PIVOT_Y + ox * sa + oy * ca;
    }

    let lx = lux * scale * this.catFacing;
    let ly = luy * scale * this.catBreathe;

    if (this.catSwiping) {
      const front = Math.max(0, Math.min(1, (lux + 0.18) / 0.55));
      lx += this.pawOut * scale * 0.05 * front * this.catFacing;
      ly -= this.pawOut * scale * 0.015 * front;
    }

    return [
      this.catX + lx * this.catCos - ly * this.catSin,
      this.catY + this.catBob + lx * this.catSin + ly * this.catCos,
    ];
  }

  private aimStrike(): void {
    const size = this.catCurPx;
    const shoulderX = this.catX + 0.16 * size * this.catFacing;
    const shoulderY = this.catY - 0.46 * size;

    let bestDist = Number.POSITIVE_INFINITY;
    let bestLine = -1;
    let hitX = this.centroidX;
    let hitY = this.centroidY;

    for (let i = 0; i < this.lineCount; i++) {
      const cx = Math.max(this.geomMinX[i], Math.min(shoulderX, this.geomMaxX[i]));
      const cy = Math.max(this.geomTop[i], Math.min(shoulderY, this.geomBottom[i]));
      const dist = Math.hypot(cx - shoulderX, cy - shoulderY);
      if (dist < bestDist) {
        bestDist = dist;
        bestLine = i;
        hitX = cx;
        hitY = cy;
      }
    }

    if (bestLine < 0) {
      this.strikeX = hitX;
      this.strikeY = hitY;
      return;
    }

    const dx = hitX - shoulderX;
    const dy = hitY - shoulderY;
    const len = Math.hypot(dx, dy) || 1;
    const inset = Math.min(40, size * 0.08);

    this.strikeX = Math.max(
      this.geomMinX[bestLine],
      Math.min(hitX + (dx / len) * inset, this.geomMaxX[bestLine]),
    );
    this.strikeY = Math.max(
      this.geomTop[bestLine],
      Math.min(hitY + (dy / len) * inset, this.geomBottom[bestLine]),
    );
  }

  private perch(spot: CatSpot): void {
    this.catX = spot.x;
    this.catY = spot.y;
    this.catFacing = spot.facing;
    this.catTilt = spot.tilt;
    this.catCurPx = spot.size;
    this.catPhase = Math.random() * Math.PI * 2;
    this.catSnap = true;
    this.catPlaced = true;
  }

  private seed(): void {
    const ceiling = this.maxParticles();
    const base = Math.round(((this.width * this.height) / 100_000) * this.density());
    this.flowCount = Math.max(80, Math.min(base, ceiling));

    const needed = this.glyphPoints.length / 2;
    this.count =
      needed > 0 ? Math.max(this.flowCount, Math.min(ceiling, needed)) : this.flowCount;

    this.catStart = this.count;
    this.count += this.catCount;

    this.px = new Float32Array(this.count);
    this.py = new Float32Array(this.count);
    this.prevX = new Float32Array(this.count);
    this.prevY = new Float32Array(this.count);
    this.life = new Float32Array(this.count);
    this.z = new Float32Array(this.count);
    this.spd = new Float32Array(this.count);
    this.react = new Float32Array(this.count);
    this.orbitPhase = new Float32Array(this.count);
    this.orbitSpeed = new Float32Array(this.count);
    this.orbitRadius = new Float32Array(this.count);
    this.band = new Uint8Array(this.count);
    this.targetX = new Float32Array(this.count);
    this.targetY = new Float32Array(this.count);
    this.hasTarget = new Uint8Array(this.count);
    this.stagger = new Float32Array(this.count);
    this.burstVX = new Float32Array(this.count);
    this.burstVY = new Float32Array(this.count);
    this.exitAt = new Float32Array(this.count);

    for (let i = 0; i < this.count; i++) {
      this.respawn(i, true);
      this.stagger[i] = Math.random() * 0.25;
      this.exitAt[i] = Math.random() * 0.5;
    }

    for (let i = this.catStart; i < this.count; i++) {
      this.hasTarget[i] = 1;
    }

    this.catPlaced = false;
    this.assignTargets();
  }

  private assignTargets(): void {
    const total = this.glyphPoints.length / 2;
    if (total === 0) {
      return;
    }

    const pool = this.catStart;
    const order: Int32Array = new Int32Array(pool);
    for (let i = 0; i < pool; i++) {
      order[i] = i;
    }
    for (let i = pool - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = order[i];
      order[i] = order[j];
      order[j] = tmp;
    }

    const lineMin = new Map<number, number>();
    const lineMax = new Map<number, number>();
    let lastLine = 0;
    for (let k = 0; k < total; k++) {
      const id = this.glyphLine[k];
      const x = this.glyphPoints[k * 2];
      lineMin.set(id, Math.min(lineMin.get(id) ?? x, x));
      lineMax.set(id, Math.max(lineMax.get(id) ?? x, x));
      if (id > lastLine) {
        lastLine = id;
      }
    }

    const spread = this.writeStagger();
    const lines = lastLine + 1;
    const take = Math.min(total, pool);

    for (let k = 0; k < take; k++) {
      const particle = order[k];
      const point = Math.floor((k * total) / take);
      const x = this.glyphPoints[point * 2];
      this.targetX[particle] = x;
      this.targetY[particle] = this.glyphPoints[point * 2 + 1];
      this.hasTarget[particle] = 1;

      if (this.revealOrder() === 'reading') {
        const id = this.glyphLine[point];
        const min = lineMin.get(id) ?? 0;
        const max = lineMax.get(id) ?? min + 1;
        const along = max > min ? (x - min) / (max - min) : 0;
        const reading = (id + along) / lines;
        this.stagger[particle] = Math.min(0.92, reading * spread + Math.random() * 0.04);
      } else {
        this.stagger[particle] = Math.random() * spread;
      }
    }
  }

  private respawn(i: number, initial = false): void {
    this.px[i] = Math.random() * this.width;
    this.py[i] = Math.random() * this.height;
    this.prevX[i] = this.px[i];
    this.prevY[i] = this.py[i];
    this.life[i] = initial ? Math.random() * 260 : 160 + Math.random() * 160;

    const r = Math.random();
    const depth = r * r * r * 0.55 + r * 0.45;
    this.z[i] = depth;

    this.spd[i] = (0.35 + depth * 1.5) * (0.85 + Math.random() * 0.3);
    this.react[i] = 0.25 + depth * depth * 1.35;

    this.orbitPhase[i] = Math.random() * Math.PI * 2;
    this.orbitSpeed[i] = (0.04 + Math.random() * 0.05) * (Math.random() < 0.5 ? -1 : 1);
    this.orbitRadius[i] = 0.18 + Math.random() * 0.34;

    this.band[i] = Math.min(
      FlowFieldComponent.BANDS - 1,
      Math.floor(depth * FlowFieldComponent.BANDS),
    );
  }

  private field(x: number, y: number, t: number): number {
    const s = this.fieldScale();
    return (
      this.noise.noise2(x * s, y * s + t) +
      this.noise.noise2(x * s * 2.7 + 31.7, y * s * 2.7 - t * 1.6) * 0.35
    );
  }

  private static smoothstep(t: number): number {
    const c = Math.min(1, Math.max(0, t));
    return c * c * (3 - 2 * c);
  }

  private static easeInOutCubic(t: number): number {
    const c = Math.min(1, Math.max(0, t));
    return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2;
  }

  private pointerDistanceToText(): number {
    if (!this.pointerActive || this.glyphPoints.length === 0) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.max(this.boxTop - this.pointerY, 0, this.pointerY - this.boxBottom);
  }

  private updateForm(time: number): void {
    const dt = this.lastTime < 0 ? 16.7 : Math.min(50, time - this.lastTime);
    this.lastTime = time;
    this.frameDt = dt;

    if (this.glyphPoints.length === 0) {
      this.formT = 0;
      this.popScale = 1;
      return;
    }

    if (this.autoRevealTimer > 0) {
      this.autoRevealTimer -= dt;
    }
    if (this.revealCooldown > 0) {
      this.revealCooldown -= dt;
    }

    const near = this.pointerDistanceToText() < this.revealRadius();
    const wanted = (near || this.autoRevealTimer > 0) && this.revealCooldown <= 0 ? 1 : 0;

    if (this.burstT > 0) {
      this.burstT = Math.max(0, this.burstT - dt / this.burstMs());
    }

    if (this.prevWanted === 1 && wanted === 0 && this.formT > 0.55) {
      this.shatter(this.centroidX, this.centroidY, this.burstChaos());
    }
    this.prevWanted = wanted;

    const rate = wanted > this.formT ? dt / this.assembleMs() : -dt / this.dissolveMs();
    this.formT = Math.min(1, Math.max(0, this.formT + rate));

    if (this.popArmed && this.formT > 0.97) {
      this.popArmed = false;
      this.popTimer = 0;
    } else if (!this.popArmed && this.formT < 0.5) {
      this.popArmed = true;
    }

    const popMs = this.popMs();
    if (this.popTimer < popMs) {
      this.popTimer += dt;
      const u = Math.min(1, this.popTimer / popMs);
      this.popScale = 1 + this.popAmount() * Math.sin(Math.PI * u);
    } else {
      this.popScale = 1;
    }
  }

  private igniteBurst(): void {
    const base = this.burstSpeed();
    const chaos = this.burstChaosNow;
    const originX = this.burstOriginX;
    const originY = this.burstOriginY;

    for (let i = 0; i < this.count; i++) {
      if (this.hasTarget[i] !== 1 || i >= this.catStart) {
        continue;
      }

      const dx = this.px[i] - originX;
      const dy = this.py[i] - originY;
      const dist = Math.hypot(dx, dy);

      const angle =
        dist <= 0.001 || Math.random() < chaos
          ? Math.random() * Math.PI * 2
          : Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.1;

      const mag = base * (0.45 + Math.random() * 1.05) * (0.55 + this.z[i] * 0.9);
      this.burstVX[i] = Math.cos(angle) * mag;
      this.burstVY[i] = Math.sin(angle) * mag;
    }
  }

  private updatePointer(): void {
    if (!this.pointerActive) {
      this.velX *= 0.86;
      this.velY *= 0.86;
      return;
    }

    if (!this.pointerSeeded) {
      this.smoothX = this.pointerX;
      this.smoothY = this.pointerY;
      this.velX = 0;
      this.velY = 0;
      this.pointerSeeded = true;
      return;
    }

    const nextX = this.smoothX + (this.pointerX - this.smoothX) * 0.3;
    const nextY = this.smoothY + (this.pointerY - this.smoothY) * 0.3;

    this.velX = this.velX * 0.8 + (nextX - this.smoothX) * 0.2;
    this.velY = this.velY * 0.8 + (nextY - this.smoothY) * 0.2;

    const mag = Math.hypot(this.velX, this.velY);
    if (mag > 14) {
      this.velX = (this.velX / mag) * 14;
      this.velY = (this.velY / mag) * 14;
    }

    this.smoothX = nextX;
    this.smoothY = nextY;
  }

  private sync(): void {
    if (this.visible && this.tabActive) {
      this.start();
    } else {
      this.stop();
    }
  }

  private start(): void {
    if (this.running) {
      return;
    }
    this.running = true;
    this.lastTime = -1;
    this.frame = requestAnimationFrame(this.tick);
  }

  private stop(): void {
    this.running = false;
    cancelAnimationFrame(this.frame);
  }

  private readonly tick = (time: number): void => {
    if (!this.running) {
      return;
    }
    this.step(time);
    this.frame = requestAnimationFrame(this.tick);
  };

  step(time: number): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = `rgba(0, 0, 0, ${1 - this.trail()})`;
    ctx.fillRect(0, 0, this.width, this.height);
    ctx.globalCompositeOperation = 'source-over';

    this.updatePointer();
    this.updateForm(time);

    const t = time * this.drift();
    const speed = this.speed();
    const turbulence = this.turbulence();
    const radius = this.pointerRadius();
    const radiusSq = radius * radius;
    const repel = this.repelStrength();
    const swirl = this.swirlStrength();
    const drag = this.dragStrength();
    const burstDrag = this.burstDrag();
    const wake = Math.hypot(this.velX, this.velY) > 0.05;
    const form = this.formT;
    const pop = this.popScale;
    const burst = this.burstT;
    const bursting = burst > 0.001;
    const forming = form > 0.001;

    if (this.burstPending) {
      this.igniteBurst();
      this.burstPending = false;
    }

    const surplusFade = Math.max(
      FlowFieldComponent.smoothstep(form / 0.35),
      Math.sqrt(burst),
    );
    const lit = Math.max(form, burst * 0.8);

    if (this.catCount > 0 && this.spots.length > 0) {
      this.trackPointer();

      if (this.catSwiping) {
        this.catSwipeT += this.frameDt / this.catSwipeMs();
        const u = Math.min(1, this.catSwipeT);

        let out: number;
        if (u < 0.32) {
          out = -0.16 * FlowFieldComponent.smoothstep(u / 0.32);
        } else if (u < 0.56) {
          const t = (u - 0.32) / 0.24;
          out = -0.16 + 1.16 * (1 - (1 - t) ** 3);
        } else if (u < 0.68) {
          out = 1;
        } else {
          const t = (u - 0.68) / 0.32;
          out = 1 - FlowFieldComponent.easeInOutCubic(t);
        }
        this.pawOut = out;

        const size = this.catCurPx;
        const restX = this.catX + 0.16 * size * this.catFacing;
        const restY = this.catY - 0.46 * size;
        this.pawX = restX + (this.strikeX - restX) * out;
        this.pawY = restY + (this.strikeY - restY) * out;

        if (!this.catStruck && u >= 0.56) {
          this.catStruck = true;
          this.shatter(this.strikeX, this.strikeY, 0.35);

          this.scratchX = this.strikeX;
          this.scratchY = this.strikeY;
          this.scratchSize = size;
          this.scratchAngle = Math.atan2(this.strikeY - restY, this.strikeX - restX);
          this.scratchT = 1;
        }

        if (this.catSwipeT >= 1) {
          this.catSwiping = false;
          this.catDone = true;
          this.pawOut = 0;
        }
      } else if (forming) {
        this.catShow = this.catDone
          ? Math.max(0, this.catShow - this.frameDt / 700)
          : Math.min(1, this.catShow + this.frameDt / 260);

        this.maybeSpook();

        if (form < 0.999) {
          const steps = this.lineCount + 1;
          const step = Math.min(steps - 1, Math.floor((form / 0.92) * steps));
          if (step !== this.catLine) {
            this.catLine = step;
            const next =
              step >= this.lineCount
                ? (this.endSpot ?? this.homeSpot)
                : (this.lineSpots[step] ?? this.homeSpot);
            if (next) {
              this.perch(next);
            }
          }
        } else if (!this.catSettled) {
          this.catSettled = true;
          if (this.catLine < this.lineCount && this.endSpot) {
            this.perch(this.endSpot);
          }
          this.catLine = this.lineCount;
          this.catBlinkIn = this.catSettleMs();
        } else if (!this.catDone) {
          this.catBlinkIn -= this.frameDt;
          if (this.catBlinkIn <= 0) {
            this.catSwiping = true;
            this.catSwipeT = 0;
            this.catStruck = false;
            this.aimStrike();
          }
        }
      } else {
        this.catShow = Math.max(0, this.catShow - this.frameDt / 700);
        this.catLine = -1;
        this.catPlaced = false;
        this.catSettled = false;
        this.catDone = false;
        this.catSwipeT = 0;
        this.catStruck = false;
      }
    }

    const catShow = this.catShow;
    const catAlive = this.catCount > 0 && catShow > 0.01;
    const wag = Math.sin(time * 0.005) * this.catWag();

    const sway = Math.sin(time * 0.0011 + this.catPhase) * 0.024;
    const angle = this.catTilt + sway;
    this.catCos = Math.cos(angle);
    this.catSin = Math.sin(angle);
    this.catBob = Math.sin(time * 0.0017 + this.catPhase * 1.7) * 1.1;
    this.catBreathe = 1 + Math.sin(time * 0.0026 + this.catPhase) * 0.018;

    const paths: Path2D[] = [];
    const surplusPaths: Path2D[] = [];
    for (let b = 0; b < FlowFieldComponent.BANDS; b++) {
      paths.push(new Path2D());
      surplusPaths.push(new Path2D());
    }
    const catPath = new Path2D();

    for (let i = 0; i < this.count; i++) {
      const surplus = i >= this.flowCount;
      const isCat = this.catCount > 0 && i >= this.catStart;

      if (isCat) {
        if (!catAlive) {
          this.prevX[i] = this.px[i];
          this.prevY[i] = this.py[i];
          continue;
        }
      } else if (surplus && !forming && !bursting) {
        this.prevX[i] = this.px[i];
        this.prevY[i] = this.py[i];
        if (Math.random() < 0.01) {
          this.respawn(i);
        }
        continue;
      }

      const x = this.px[i];
      const y = this.py[i];

      const angle = this.field(x, y, t) * Math.PI * 2 * turbulence;
      const stride = speed * this.spd[i];
      const flowX = x + Math.cos(angle) * stride;
      const flowY = y + Math.sin(angle) * stride;

      let nextX = flowX;
      let nextY = flowY;

      if (isCat) {
        const k = i - this.catStart;
        const scale = this.catCurPx;

        let ux = this.catLX[k];
        let uy = this.catLY[k];

        const hw = this.catHead[k];
        if (hw > 0.001 && Math.abs(this.catHeadAngle) > 0.0005) {
          const a = this.catHeadAngle * hw;
          const ca = Math.cos(a);
          const sa = Math.sin(a);
          const ox = ux - HEAD_PIVOT_X;
          const oy = uy - HEAD_PIVOT_Y;
          ux = HEAD_PIVOT_X + ox * ca - oy * sa;
          uy = HEAD_PIVOT_Y + ox * sa + oy * ca;
        }

        const ew = this.catEar[k];
        if (ew > 0.001 && this.catAlert > 0.01) {
          uy -= this.catAlert * ew * 0.012 * (1 + Math.sin(time * 0.02));
        }

        let lx = ux * scale * this.catFacing;
        let ly = uy * scale * this.catBreathe;

        const t = this.catTail[k];
        if (t > 0) {
          const bend = t * t * (scale / this.catBigPx);
          lx += wag * 0.6 * bend * this.catFacing;
          ly += wag * bend;
        }

        if (this.catSwiping) {
          const front = Math.max(0, Math.min(1, (ux + 0.18) / 0.55));
          lx += this.pawOut * scale * 0.05 * front * this.catFacing;
          ly -= this.pawOut * scale * 0.015 * front;
        }

        const goalX = this.catX + lx * this.catCos - ly * this.catSin;
        const goalY = this.catY + this.catBob + lx * this.catSin + ly * this.catCos;

        if (this.catSnap) {
          this.px[i] = goalX;
          this.py[i] = goalY;
          this.prevX[i] = goalX;
          this.prevY[i] = goalY;
          catPath.moveTo(goalX, goalY);
          catPath.lineTo(goalX + 0.1, goalY);
          continue;
        }

        const chase = this.catSwiping ? 0.72 : 0.45;
        this.prevX[i] = x;
        this.prevY[i] = y;
        this.px[i] = x + (goalX - x) * chase;
        this.py[i] = y + (goalY - y) * chase;
        catPath.moveTo(x, y);
        catPath.lineTo(this.px[i], this.py[i]);
        continue;
      }

      const delay = this.stagger[i];
      const eff = Math.max(0, (form - delay) / (1 - delay));

      const held = eff > 0.001 && this.hasTarget[i] === 1;
      if (held) {
        let goalX =
          pop === 1
            ? this.targetX[i]
            : this.centroidX + (this.targetX[i] - this.centroidX) * pop;
        let goalY =
          pop === 1
            ? this.targetY[i]
            : this.centroidY + (this.targetY[i] - this.centroidY) * pop;

        this.orbitPhase[i] += this.orbitSpeed[i];
        const r = this.orbitRadius[i] * eff;
        goalX += Math.cos(this.orbitPhase[i]) * r;
        goalY += Math.sin(this.orbitPhase[i]) * r;

        const homeX = x + (goalX - x) * 0.14;
        const homeY = y + (goalY - y) * 0.14;
        nextX = flowX + (homeX - flowX) * eff;
        nextY = flowY + (homeY - flowY) * eff;
      }

      if (bursting) {
        nextX += this.burstVX[i];
        nextY += this.burstVY[i];
        this.burstVX[i] *= burstDrag;
        this.burstVY[i] *= burstDrag;
      }

      if (this.pointerActive) {
        const dx = x - this.smoothX;
        const dy = y - this.smoothY;
        const distSq = dx * dx + dy * dy;

        if (distSq < radiusSq && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          const falloff = (1 - dist / radius) ** 2 * this.react[i];
          const nx = dx / dist;
          const ny = dy / dist;

          nextX += nx * repel * falloff - ny * swirl * falloff;
          nextY += ny * repel * falloff + nx * swirl * falloff;

          if (wake) {
            nextX += this.velX * drag * falloff;
            nextY += this.velY * drag * falloff;
          }
        }
      }

      this.prevX[i] = x;
      this.prevY[i] = y;
      this.px[i] = nextX;
      this.py[i] = nextY;

      if (held) {
        this.px[i] = Math.min(this.width, Math.max(0, this.px[i]));
        this.py[i] = Math.min(this.height, Math.max(0, this.py[i]));
      } else if (
        !(
          bursting &&
          this.hasTarget[i] === 1 &&
          Math.abs(this.burstVX[i]) + Math.abs(this.burstVY[i]) > 0.4
        )
      ) {
        this.life[i] -= 1;

        const out =
          this.px[i] < 0 ||
          this.px[i] > this.width ||
          this.py[i] < 0 ||
          this.py[i] > this.height;

        if (out || this.life[i] <= 0) {
          this.respawn(i);
          continue;
        }
      }

      if (surplus && !forming && burst < this.exitAt[i]) {
        continue;
      }

      const path = isCat ? catPath : (surplus ? surplusPaths : paths)[this.band[i]];
      path.moveTo(this.prevX[i], this.prevY[i]);
      path.lineTo(this.px[i], this.py[i]);
    }

    this.catSnap = false;

    ctx.lineCap = 'round';
    const litAlpha = this.textAlpha();
    const litWidth = this.textWidth();

    for (let b = 0; b < FlowFieldComponent.BANDS; b++) {
      const depth = (b + 0.5) / FlowFieldComponent.BANDS;
      const depthAlpha = 0.12 + depth * 0.5;
      const depthWidth = 0.5 + depth * 1.6;

      const alpha = depthAlpha + (litAlpha - depthAlpha) * lit;
      const width = depthWidth + (litWidth - depthWidth) * lit;

      ctx.lineWidth = width;
      ctx.strokeStyle = `rgba(${this.rgb}, ${Math.min(1, alpha).toFixed(3)})`;
      ctx.stroke(paths[b]);

      if (surplusFade > 0.001) {
        const faded = Math.min(1, alpha * surplusFade);
        ctx.strokeStyle = `rgba(${this.rgb}, ${faded.toFixed(3)})`;
        ctx.stroke(surplusPaths[b]);
      }
    }

    if (catAlive) {
      drawCatEyes(
        ctx,
        this.paint,
        this.catPoint((60 - 50) / 104, (27 - 100) / 104),
        this.catPoint((77 - 50) / 104, (27 - 100) / 104),
        this.catCurPx,
        this.catFacing,
        catShow,
      );
    }

    if (catAlive && this.catSwiping && this.pawOut > 0.02) {
      const size = this.catCurPx;
      drawCatPaw(
        ctx,
        this.paint,
        this.catX + 0.16 * size * this.catFacing,
        this.catY - 0.46 * size,
        this.pawX,
        this.pawY,
        size,
        Math.min(1, catShow),
      );
    }

    if (this.scratchT > 0.001) {
      this.scratchT = Math.max(0, this.scratchT - this.frameDt / this.catScratchMs());
      drawClawMarks(
        ctx,
        this.paint,
        this.scratchX,
        this.scratchY,
        this.scratchAngle,
        this.scratchSize,
        this.scratchT,
      );
    }

    if (catAlive) {
      ctx.lineWidth = Math.max(
        1.1,
        this.catSpacing * (this.catCurPx / Math.max(1, this.catBigPx)) * 1.15,
      );
      ctx.strokeStyle = `rgba(${this.paint.cat}, ${Math.min(1, litAlpha * catShow).toFixed(3)})`;
      ctx.stroke(catPath);
    }
  }

  private renderStatic(): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }
    ctx.clearRect(0, 0, this.width, this.height);
    this.pointerActive = false;
    this.autoRevealTimer = 0;
    this.formT = 0;
    for (let i = 0; i < 90; i++) {
      this.lastTime = -1;
      this.step(i * 16);
    }
  }
}
