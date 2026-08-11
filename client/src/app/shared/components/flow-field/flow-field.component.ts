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

/**
 * Animated flow-field background that can assemble into the hero's own text.
 *
 * The field itself: particles take their heading from a two-octave Perlin
 * field, so they sweep in coherent currents rather than jittering. Each gets a
 * random depth `z` in 0..1 driving speed, line width, opacity and pointer
 * sensitivity together — near particles move fast, draw thick and bright, and
 * swerve hard. Correlating all four is what reads as perspective.
 *
 * The cursor applies three forces, all fading quadratically to nothing at
 * `pointerRadius`: repel (away), swirl (perpendicular, so it rotates), and
 * drag (along the cursor's velocity, leaving a wake).
 *
 * Pass `sources` — the real heading and paragraph elements — and the particles
 * assemble into them. Targets come from measuring those elements in the DOM, so
 * the effect tracks the actual layout at every viewport and needs no duplicate
 * copy. Assembly is driven by pointer proximity, not a timer, and re-triggers
 * when the hero is scrolled back into view.
 *
 * The host is absolutely positioned, so give the parent `position: relative`
 * and raise your content with `z-index`.
 */
@Component({
  selector: 'app-flow-field',
  template: '<canvas #canvas aria-hidden="true"></canvas>',
  styles: `
    :host {
      position: absolute;
      inset: 0;
      display: block;
      overflow: hidden;
      /* Clicks and text selection pass straight through to the content above. */
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

  /** Fires once the canvas is running, so callers can hide the source text. */
  readonly ready = output<void>();

  /** Particles per 100,000 px² of canvas during free flow. This is deliberately
   * high relative to what a bare field needs: the text state runs several
   * thousand particles, and dropping to a few hundred afterwards reads as the
   * field emptying out. Keeping the two populations within a few times of each
   * other makes the hand-off far less noticeable. */
  readonly density = input(115);
  /** Ceiling on particle count, including the extras the text needs. Coverage
   * is what makes letters readable, so this needs to reach the glyph sample
   * count. Lower it on low-powered devices. */
  readonly maxParticles = input(3600);
  /** Travel speed in px per frame, before the depth multiplier. */
  readonly speed = input(1.8);
  /** How tightly currents curl. Larger = more turbulent. */
  readonly turbulence = input(0.8);
  /** Noise feature size. Smaller = broader, calmer currents. */
  readonly fieldScale = input(0.0009);
  /** How fast the field itself drifts over time. */
  readonly drift = input(0.0012);

  /** Radius of pointer influence on the current, in px. */
  readonly pointerRadius = input(230);
  /** Push directly away from the cursor. */
  readonly repelStrength = input(4.2);
  /** Rotation around the cursor. Set to 0 for a pure push, no vortex. */
  readonly swirlStrength = input(3.4);
  /** How strongly a moving cursor drags particles along behind it. */
  readonly dragStrength = input(2.4);

  /** Elements whose rendered text the particles assemble into. */
  readonly sources = input<readonly HTMLElement[]>([]);
  /** How close the pointer must get to the text before it assembles, in px. */
  readonly revealRadius = input(120);
  /** Milliseconds to fully assemble. */
  readonly assembleMs = input(1600);
  /** Milliseconds to release back into the current. */
  readonly dissolveMs = input(900);
  /** How long an auto-reveal holds after scrolling back to the hero, in ms.
   * Must exceed assembleMs plus catSettleMs plus the cat's fade, or the text
   * releases while the big cat is still on screen and the two read as one
   * event. At the defaults the cat is gone a beat before the text lets go. */
  readonly autoRevealMs = input(6000);
  /** Duration of the landing pop, in ms. */
  readonly popMs = input(520);
  /** Size of the landing pop, as a fraction. 0 disables it. */
  readonly popAmount = input(0.07);

  /** Opacity of a fully assembled letter, before the depth blend fades out. */
  readonly textAlpha = input(0.85);
  /** Stroke width of a fully assembled letter, in px. */
  readonly textWidth = input(1.1);
  /** How much of the reveal is spread out in time, 0–0.9. */
  readonly writeStagger = input(0.75);
  /** 'reading' writes top line to bottom, left to right within each line.
   * 'random' resolves the text out of the scatter in no particular order. */
  readonly revealOrder = input<'random' | 'reading'>('reading');
  /** Outward impulse when the text shatters, in px per frame. */
  readonly burstSpeed = input(32);
  /** Per-frame velocity decay of a shard. Total travel is roughly
   * burstSpeed / (1 - burstDrag), so this governs reach more than speed does. */
  readonly burstDrag = input(0.93);
  /** How long the shatter takes to be absorbed by the current, in ms. */
  readonly burstMs = input(1500);
  /** Share of shards thrown in a completely random direction rather than
   * radially outward, 0–1. At 1 the debris goes everywhere. */
  readonly burstChaos = input(1);

  /** Draw a small cat that walks the text as it's written, then sits beside it. */
  readonly showCat = input(true);
  /** Height of the cat, in px. Shrinks automatically if the hero is too small
   * to hold it without touching the text. */
  readonly catSize = input(460);
  /** Stroke weight of the cat's particles. Heavier than the text on purpose —
   * it's what closes the gaps between points and makes the shape read solid. */
  readonly catStroke = input(3.2);
  /** How far the tail sways, in px. */
  readonly catWag = input(4);
  /** Cat colour. Defaults to --color-cat from CSS custom properties. */
  readonly catColor = input<string | null>(null);
  /** How long the big cat holds its seat before it strikes, in ms. The hold is
   * motionless, and motionless time reads long — 3s felt closer to 5. */
  readonly catSettleMs = input(1800);
  /** Duration of the swipe that shatters the text, in ms. */
  readonly catSwipeMs = input(620);
  /** How long the claw marks linger after impact, in ms. */
  readonly catScratchMs = input(520);
  /** How close the pointer may get before the cat bolts elsewhere, in px. */
  readonly catShyRadius = input(90);

  /** Trail persistence, 0–1. Higher = longer streaks. */
  readonly trail = input(0.95);
  /** Stroke colour. Defaults to the site accent from CSS custom properties. */
  readonly color = input<string | null>(null);

  /** Depth buckets. More bands = smoother gradation, more draw calls. */
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
  /** Depth, 0 = far, 1 = near. Drives speed, width, alpha and pointer response. */
  private z: Float32Array = new Float32Array(0);
  private spd: Float32Array = new Float32Array(0);
  private react: Float32Array = new Float32Array(0);
  /** Orbit state, so held particles keep circulating instead of parking. */
  private orbitPhase: Float32Array = new Float32Array(0);
  private orbitSpeed: Float32Array = new Float32Array(0);
  private orbitRadius: Float32Array = new Float32Array(0);
  private band: Uint8Array = new Uint8Array(0);
  private count = 0;
  /** Particles active during free flow. The rest only exist for the text. */
  private flowCount = 0;
  /** Per-particle delay applied to the formation curve. */
  private stagger: Float32Array = new Float32Array(0);
  /** Burst level at which each text-only particle stops being drawn, so the
   * surplus population thins out gradually instead of all at once. */
  private exitAt: Float32Array = new Float32Array(0);

  /** Flat [x, y, x, y, …] sampled from the rendered text. */
  private glyphPoints: Float32Array = new Float32Array(0);
  /** Which visual line each glyph point belongs to. */
  private glyphLine: Uint8Array = new Uint8Array(0);
  private targetX: Float32Array = new Float32Array(0);
  private targetY: Float32Array = new Float32Array(0);
  private hasTarget: Uint8Array = new Uint8Array(0);
  /** Per-line geometry, so the cat can be placed relative to each line. */
  private geomMinX: Float32Array = new Float32Array(0);
  private geomMaxX: Float32Array = new Float32Array(0);
  private geomTop: Float32Array = new Float32Array(0);
  private geomBottom: Float32Array = new Float32Array(0);
  private lineCount = 0;

  /** The current text sample, kept so the cat can be rebuilt against it. */
  private text: SampledText | null = null;
  /** One verified-clear perch per line, for the writing phase. */
  private lineSpots: CatSpot[] = [];
  /** Every clear perch found, for blinking around once the text is done. */
  private spots: CatSpot[] = [];

  /** Cat target offsets, relative to the point between its front paws. */
  private catLX: Float32Array = new Float32Array(0);
  private catLY: Float32Array = new Float32Array(0);
  private catTail: Float32Array = new Float32Array(0);
  private catHead: Float32Array = new Float32Array(0);
  private catEar: Float32Array = new Float32Array(0);
  private catSpacing = 3;

  /** Smoothed head tilt toward the pointer, radians. */
  private catHeadAngle = 0;
  /** 0–1 alertness, drives the ear twitch as the pointer closes in. */
  private catAlert = 0;
  /** Swipe animation, 0–1. Above 0 means the cat is mid-strike. */
  private catSwipeT = 0;
  private catSwiping = false;
  private catStruck = false;
  /** Blocks re-spooking every frame while the pointer sits on top of it. */
  private catSpookCool = 0;

  /** Where the paw is reaching for — a point inside the text, not beside it. */
  private strikeX = 0;
  private strikeY = 0;
  /** Live paw position during the swipe, for drawing the arm and paw. */
  private pawX = 0;
  private pawY = 0;
  private pawOut = 0;

  /** Claw marks left at the point of impact. 1 at the strike, fading to 0. */
  private scratchT = 0;
  private scratchX = 0;
  private scratchY = 0;
  private scratchAngle = 0;
  private scratchSize = 0;
  private catCount = 0;
  private catStart = 0;
  /** Actual on-screen cat height after fitting it to the hero. */
  private catPx = 0;
  private catBigPx = 0;
  private catSmallPx = 0;
  /** Size of the perch it's currently on. */
  private catCurPx = 0;
  /** The big off-screen perch, where it waits and watches. */
  private homeSpot: CatSpot | null = null;
  /** Where it settles for good once the writing is done. */
  private endSpot: CatSpot | null = null;
  private catSettled = false;
  /** True once it has held the final seat and faded out for good. */
  private catDone = false;
  private catX = 0;
  private catY = 0;
  private catFacing = 1;
  private catPlaced = false;
  /** Y the cat walks along while writing — a clear lane outside the text. */
  private catLaneY = 0;
  private catBlinkIn = 0;
  /** Set on the frame of a blink, so the particles jump rather than fly. */
  private catSnap = false;
  /** Rotation of the current perch, plus the per-frame idle sway. */
  private catTilt = 0;
  private catPhase = 0;
  private catCos = 1;
  private catSin = 0;
  private catBob = 0;
  private catBreathe = 1;
  /** Eased 0–1 presence. The cat fades rather than shattering. */
  private catShow = 0;
  /** Which line was last being written, so a change triggers a blink. */
  private catLine = -1;

  /** Bounding box of the sampled text, used for the proximity test. */
  private boxLeft = 0;
  private boxTop = 0;
  private boxRight = 0;
  private boxBottom = 0;
  private centroidX = 0;
  private centroidY = 0;

  /** Velocity carried by a shattered piece, decaying back into the current. */
  private burstVX: Float32Array = new Float32Array(0);
  private burstVY: Float32Array = new Float32Array(0);
  /** 1 at the instant of the shatter, decaying to 0. */
  private burstT = 0;
  private burstPending = false;
  /** Where the shatter radiates from, and how scattered it is. Set per burst
   * so the cat's strike can throw the letters away from its paw. */
  private burstOriginX = 0;
  private burstOriginY = 0;
  private burstChaosNow = 1;
  private prevWanted = 0;

  /** 0 = free flow, 1 = fully assembled. */
  private formT = 0;
  private popScale = 1;
  private popTimer = Number.POSITIVE_INFINITY;
  private popArmed = true;
  private autoRevealTimer = 0;
  /** Blocks the text reassembling straight after a shatter. */
  private revealCooldown = 0;
  private lastTime = -1;
  private frameDt = 16.7;
  /** True once the hero has been scrolled far enough away to re-arm the pop. */
  private scrolledAway = false;

  private pointerX = -9999;
  private pointerY = -9999;
  private pointerActive = false;
  private smoothX = 0;
  private smoothY = 0;
  private velX = 0;
  private velY = 0;
  private pointerSeeded = false;

  private rgb = '79, 156, 249';
  /** Colours the drawn parts of the cat use. */
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
    this.rgb = this.resolveColor(this.color(), '--color-accent', '79, 156, 249');
    this.paint = {
      cat: this.resolveColor(this.catColor(), '--color-cat', '242, 161, 92'),
      bg: this.resolveColor(null, '--color-bg', '13, 17, 23'),
      scratch: this.resolveColor(null, '--color-text', '230, 237, 243'),
    };

    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    this.resize();

    if (!reduceMotion.matches) {
      // Only now is it safe for the caller to hide its own text: if the canvas
      // had failed, the real headings would have stayed visible.
      this.ready.emit();
      this.autoRevealTimer = this.autoRevealMs();
    }

    // Webfonts land after first paint. Sampling before Inter is ready would
    // trace the fallback font's letterforms, so re-sample once fonts settle.
    document.fonts?.ready.then(() => this.resize());

    // Everything below runs outside Angular. A requestAnimationFrame loop inside
    // the zone would trigger change detection 60 times a second and make the
    // whole app feel sluggish — this is the single most important line here.
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

      // Two jobs: pause the loop when the hero is off screen, and re-arm the
      // reveal once it has been scrolled well away, so coming back pops again.
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
        // Motion can trigger vestibular symptoms. The caller keeps its real
        // text visible in this case, so the field stays plain and still.
        this.renderStatic();
      } else {
        this.start();
      }
    });
  }

  /** Reads a CSS custom property off the host so the effect follows the theme. */
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

    // Cap DPR at 2 — a 3x buffer costs 2.25x the fill rate for no visible gain.
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = this.width * dpr;
    canvas.height = this.height * dpr;

    this.ctx?.setTransform(dpr, 0, 0, dpr, 0, 0);

    this.applyText(sampleText(this.sources(), rect, this.width, this.height));
    this.seed();
  }

  /** Adopts a fresh text sample, then rebuilds the cat around it. */
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

  /** Rasterises the cat at its largest size and finds everywhere it may sit. */
  private buildCat(text: SampledText): void {
    if (!this.showCat()) {
      return;
    }

    // Sampled once at the largest size it will ever be drawn, then scaled per
    // perch. Small enough to still fit the left margin beside the text — at
    // 84px it never did, so every line silently fell back to the right.
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

  /**
   * Blows the text apart from a given point. formT drops to zero on the same
   * frame: any residual pull toward the letters would fight the impulse and the
   * pieces would crawl apart instead of flying.
   */
  private shatter(originX: number, originY: number, chaos: number): void {
    this.burstOriginX = originX;
    this.burstOriginY = originY;
    this.burstChaosNow = chaos;
    this.burstPending = true;
    this.burstT = 1;
    this.formT = 0;

    // Stand the reveal down. Without this the text simply rebuilds itself on
    // the next frame — the reveal window is still open when the cat strikes,
    // so the letters would reassemble before the debris had even cleared.
    this.autoRevealTimer = 0;
    this.revealCooldown = 1100;
  }

  /**
   * Turns the head toward the pointer and raises the cat's alertness as it gets
   * near. Only the head group rotates — the body stays put, which is what makes
   * it read as an animal noticing you rather than the whole sprite swivelling.
   */
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

      // Tilt is driven by how far above or below the head the pointer sits.
      // A silhouette can't yaw, so pitch is the only readable axis.
      const raw = Math.atan2(dy, Math.max(60, Math.abs(dx))) * 0.7;
      target = Math.max(-0.26, Math.min(0.26, raw)) * this.catFacing;
      alert = Math.max(0, 1 - dist / 260);
    }

    this.catHeadAngle += (target - this.catHeadAngle) * 0.09;
    this.catAlert += (alert - this.catAlert) * 0.08;
  }

  /**
   * If the pointer gets too close the cat bolts to another perch. It's the one
   * piece of the effect a visitor can play with, which is worth more than
   * anything it does on its own.
   */
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

    // Somewhere else, and preferably not right back under the cursor.
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

  /**
   * Maps a point in the cat's normalised local space to screen coordinates,
   * running the same chain the particles do — head turn, facing, breath, lean,
   * tilt, bob. Anything drawn on the cat has to go through this or it slides
   * off the face the moment the cat moves.
   */
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

  /**
   * Picks where the paw lands: the nearest point of the nearest line, not the
   * middle of the block. Aiming at the centre meant the cat had to reach across
   * the whole hero whatever it was sitting next to — this keeps the strike
   * short and makes it look like it hit what was actually in front of it.
   */
  private aimStrike(): void {
    const size = this.catCurPx;
    const shoulderX = this.catX + 0.16 * size * this.catFacing;
    const shoulderY = this.catY - 0.46 * size;

    let bestDist = Number.POSITIVE_INFINITY;
    let bestLine = -1;
    let hitX = this.centroidX;
    let hitY = this.centroidY;

    for (let i = 0; i < this.lineCount; i++) {
      // Closest point on this line's box to the shoulder.
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

    // Bite a short way past the edge so the claws land on letters rather than
    // clipping the very boundary of the line.
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

  /** Moves the cat to a perch instantly, tilt and facing included. */
  private perch(spot: CatSpot): void {
    this.catX = spot.x;
    this.catY = spot.y;
    this.catFacing = spot.facing;
    this.catTilt = spot.tilt;
    this.catCurPx = spot.size;
    // Fresh phase per perch, so its idle motion doesn't resume mid-breath.
    this.catPhase = Math.random() * Math.PI * 2;
    this.catSnap = true;
    this.catPlaced = true;
  }

  private seed(): void {
    const ceiling = this.maxParticles();
    const base = Math.round(((this.width * this.height) / 100_000) * this.density());
    this.flowCount = Math.max(80, Math.min(base, ceiling));

    // The text needs far more particles than a good-looking current does.
    // Allocate for the text, but keep the surplus dormant until it assembles —
    // otherwise free flow turns into soup.
    const needed = this.glyphPoints.length / 2;
    this.count =
      needed > 0
        ? Math.max(this.flowCount, Math.min(ceiling, Math.round(needed * 0.95)))
        : this.flowCount;

    // The cat gets its own block at the end, on top of the ceiling — borrowing
    // from the text budget would thin the letters to pay for it.
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
      // Spread across most of the burst so debris winks out progressively.
      this.exitAt[i] = Math.random() * 0.5;
    }

    // Cat particles count as "having a target" so they inherit the shatter,
    // the recycling exemption and the surplus fade for free.
    for (let i = this.catStart; i < this.count; i++) {
      this.hasTarget[i] = 1;
    }

    this.catPlaced = false;
    this.assignTargets();
  }

  /** Hands glyph points to a random subset of particles. */
  private assignTargets(): void {
    const total = this.glyphPoints.length / 2;
    if (total === 0) {
      return;
    }

    // Shuffle particle indices so the text isn't built from one depth band.
    // Only the text pool — the tail of the array belongs to the cat.
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

    // Horizontal extent of each line, so a point's delay can be expressed as
    // "how far through this line am I" regardless of how the lines are set.
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
      // Even stride through the glyph points keeps coverage uniform.
      const point = Math.floor((k * total) / take);
      const x = this.glyphPoints[point * 2];
      this.targetX[particle] = x;
      this.targetY[particle] = this.glyphPoints[point * 2 + 1];
      this.hasTarget[particle] = 1;

      if (this.revealOrder() === 'reading') {
        // Line by line, left to right within each, so the block writes itself
        // out. Dissolving reverses for free: the formation curve runs
        // backwards, so the last letters written are the first to let go.
        const id = this.glyphLine[point];
        const min = lineMin.get(id) ?? 0;
        const max = lineMax.get(id) ?? min + 1;
        const along = max > min ? (x - min) / (max - min) : 0;
        const reading = (id + along) / lines;
        // A little jitter keeps it from reading as a hard mechanical wipe.
        this.stagger[particle] = Math.min(0.92, reading * spread + Math.random() * 0.04);
      } else {
        // Pieces drift back in no particular order, so the text resolves out of
        // the scatter rather than being written.
        this.stagger[particle] = Math.random() * spread;
      }
    }
  }

  private respawn(i: number, initial = false): void {
    this.px[i] = Math.random() * this.width;
    this.py[i] = Math.random() * this.height;
    this.prevX[i] = this.px[i];
    this.prevY[i] = this.py[i];
    // Staggered lifetimes so particles don't all reset on the same frame.
    this.life[i] = initial ? Math.random() * 260 : 160 + Math.random() * 160;

    // Cubed random biases the population toward the far plane, so the near
    // layer stays sparse and legible instead of crowding the content.
    const r = Math.random();
    const depth = r * r * r * 0.55 + r * 0.45;
    this.z[i] = depth;

    // Parallax: near particles travel further per frame than far ones.
    this.spd[i] = (0.35 + depth * 1.5) * (0.85 + Math.random() * 0.3);
    // Near particles also react much harder to the cursor.
    this.react[i] = 0.25 + depth * depth * 1.35;

    // Small personal orbit, used while holding a letter. Kept close to a pixel
    // so it reads as motion without thickening the strokes of small type.
    this.orbitPhase[i] = Math.random() * Math.PI * 2;
    this.orbitSpeed[i] = (0.07 + Math.random() * 0.09) * (Math.random() < 0.5 ? -1 : 1);
    this.orbitRadius[i] = 0.35 + Math.random() * 0.8;

    this.band[i] = Math.min(
      FlowFieldComponent.BANDS - 1,
      Math.floor(depth * FlowFieldComponent.BANDS),
    );
  }

  /**
   * Two octaves of noise: a broad current plus a finer, faster-moving detail
   * layer. One octave alone makes every particle in a region trace the same
   * arc, which reads as repetitive wallpaper.
   */
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

  /** Slow in, slow out — used to retract the paw without a hard stop. */
  private static easeInOutCubic(t: number): number {
    const c = Math.min(1, Math.max(0, t));
    return c < 0.5 ? 4 * c * c * c : 1 - (-2 * c + 2) ** 3 / 2;
  }

  /**
   * Vertical distance from the pointer to the text's band, ignoring horizontal
   * position entirely. The trigger is a full-width strip bounded by the top of
   * the first line and the bottom of the last, so moving along a line never
   * drops out of range — only moving above or below the block does.
   */
  private pointerDistanceToText(): number {
    if (!this.pointerActive || this.glyphPoints.length === 0) {
      return Number.POSITIVE_INFINITY;
    }
    return Math.max(this.boxTop - this.pointerY, 0, this.pointerY - this.boxBottom);
  }

  /**
   * Rate-driven rather than a timeline: the text is chasing a target of 0 or 1,
   * so approaching and leaving are interruptible at any point. A timeline would
   * have to finish assembling before it could start dissolving.
   */
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

    // The moment the text is no longer wanted, it shatters instead of easing
    // out. formT is dropped to zero on the same frame: any residual pull toward
    // the letters would fight the impulse and the pieces would crawl apart.
    if (this.prevWanted === 1 && wanted === 0 && this.formT > 0.55) {
      // Released rather than struck: scatter from the middle of the block.
      this.shatter(this.centroidX, this.centroidY, this.burstChaos());
    }
    this.prevWanted = wanted;

    const rate = wanted > this.formT ? dt / this.assembleMs() : -dt / this.dissolveMs();
    this.formT = Math.min(1, Math.max(0, this.formT + rate));

    // Fire the pop once per arrival, re-arming only after a real release.
    if (this.popArmed && this.formT > 0.97) {
      this.popArmed = false;
      this.popTimer = 0;
    } else if (!this.popArmed && this.formT < 0.5) {
      this.popArmed = true;
    }

    const popMs = this.popMs();
    if (this.popTimer < popMs) {
      this.popTimer += dt;
      // Half a sine: starts and ends at exactly 1, peaks in the middle. The
      // clamp matters — a frame that lands past popMs would push the sine
      // negative and briefly shrink the text below its real size.
      const u = Math.min(1, this.popTimer / popMs);
      this.popScale = 1 + this.popAmount() * Math.sin(Math.PI * u);
    } else {
      this.popScale = 1;
    }
  }

  /**
   * Hands every piece of the text an outward impulse from the block's centre.
   * Speed scales with depth, so near shards fly furthest and the debris keeps
   * the same sense of perspective the field has.
   */
  private igniteBurst(): void {
    const base = this.burstSpeed();
    const chaos = this.burstChaosNow;
    const originX = this.burstOriginX;
    const originY = this.burstOriginY;

    for (let i = 0; i < this.count; i++) {
      // The cat is a creature, not debris — it fades out instead of shattering.
      if (this.hasTarget[i] !== 1 || i >= this.catStart) {
        continue;
      }

      const dx = this.px[i] - originX;
      const dy = this.py[i] - originY;
      const dist = Math.hypot(dx, dy);

      // Purely radial reads as a tidy ring expanding outward. Throwing a share
      // of the shards in completely random directions — some back through the
      // middle, some sideways — is what makes it scatter everywhere instead.
      const angle =
        dist <= 0.001 || Math.random() < chaos
          ? Math.random() * Math.PI * 2
          : Math.atan2(dy, dx) + (Math.random() - 0.5) * 1.1;

      const mag = base * (0.45 + Math.random() * 1.05) * (0.55 + this.z[i] * 0.9);
      this.burstVX[i] = Math.cos(angle) * mag;
      this.burstVY[i] = Math.sin(angle) * mag;
    }
  }

  /** Lags the raw pointer to derive a smooth velocity — raw deltas are spiky. */
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

    // Clamp so a flick across the screen doesn't fling particles off-canvas.
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

  /** One simulation + draw pass. */
  step(time: number): void {
    const ctx = this.ctx;
    if (!ctx) {
      return;
    }

    // Fade the previous frame instead of clearing it — that's what leaves
    // trails. destination-out erases by alpha, which works on a transparent
    // canvas and lets whatever is behind the hero show through.
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

    // Text-only particles reach full opacity early, so on release they stay lit
    // while they disperse — and through the whole shatter, which is the part
    // worth watching. Without the burst term they'd blink out on impact.
    const surplusFade = Math.max(
      FlowFieldComponent.smoothstep(form / 0.35),
      Math.sqrt(burst),
    );
    // Shards keep the bright even stroke of assembled text while they fly,
    // then settle back into depth shading as the burst dies.
    const lit = Math.max(form, burst * 0.8);

    // The cat never travels. It steps through one perch per line as each line
    // is written, finishes on the big seat, holds it, and then fades out. It
    // does not reappear afterwards — the whole performance belongs to the
    // transition and nothing shows up once the text is settled.
    if (this.catCount > 0 && this.spots.length > 0) {
      this.trackPointer();

      if (this.catSwiping) {
        // Mid-strike. This runs outside the `forming` branch because the text
        // is already gone by the second half of the swipe — the cat has to
        // finish its follow-through after what it destroyed has left.
        this.catSwipeT += this.frameDt / this.catSwipeMs();
        const u = Math.min(1, this.catSwipeT);

        // Paw travel: a short pull back, a fast reach, a brief hold at full
        // extension, then a smooth retract. Keeping the action in the paw is
        // what makes it read as a swipe — shoving the whole body forward just
        // looked like the cat sliding.
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

        // Shoulder, in screen space.
        const size = this.catCurPx;
        const restX = this.catX + 0.16 * size * this.catFacing;
        const restY = this.catY - 0.46 * size;
        this.pawX = restX + (this.strikeX - restX) * out;
        this.pawY = restY + (this.strikeY - restY) * out;

        if (!this.catStruck && u >= 0.56) {
          this.catStruck = true;
          // Contact lands inside the block, so the letters tear apart from
          // within rather than being nudged from off to one side.
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
          // The big cat is the final step of the sequence, not something that
          // arrives after it. One perch per line, then the big one, all inside
          // the write. It used to wait for form to hit 0.999, which put it on
          // screen at the same instant the last line's cat was still showing
          // and left it only a sliver of the transition.
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
          // Writing done. It's already on the big seat from the last step, so
          // this only starts its hold — re-perching here would blink it in a
          // second time on the spot it's already sitting on.
          this.catSettled = true;
          if (this.catLine < this.lineCount && this.endSpot) {
            this.perch(this.endSpot);
          }
          this.catLine = this.lineCount;
          this.catBlinkIn = this.catSettleMs();
        } else if (!this.catDone) {
          // Hold its seat, then strike. The shatter is the cat's doing, not
          // something that happens to coincide with it.
          this.catBlinkIn -= this.frameDt;
          if (this.catBlinkIn <= 0) {
            this.catSwiping = true;
            this.catSwipeT = 0;
            this.catStruck = false;
            this.aimStrike();
          }
        }
      } else {
        // Released: the cat isn't debris, so it dims out where it stands rather
        // than being thrown across the hero with the letters.
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

    // Idle motion. Three slow cycles at different rates so they drift in and
    // out of phase and never repeat a pose: a turn at the shoulders, a bob on
    // the spot, and a breath that stretches it a little taller.
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
    // The cat is stroked separately so it can carry its own colour.
    const catPath = new Path2D();

    for (let i = 0; i < this.count; i++) {
      const surplus = i >= this.flowCount;
      const isCat = this.catCount > 0 && i >= this.catStart;

      // The cat exists exactly as long as it's visible, and holds still while
      // it fades — it doesn't rejoin the field or get swept up in the shatter.
      if (isCat) {
        if (!catAlive) {
          this.prevX[i] = this.px[i];
          this.prevY[i] = this.py[i];
          continue;
        }
      } else if (surplus && !forming && !bursting) {
        this.prevX[i] = this.px[i];
        this.prevY[i] = this.py[i];
        // Drift them to fresh spots while invisible so each reveal looks new.
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

      // The cat is held rigidly to its silhouette. It takes no flow, no orbit,
      // no pointer force and no shatter — every one of those was a way for it
      // to smear out of shape, which is exactly what it was doing before.
      if (isCat) {
        const k = i - this.catStart;
        // Offsets are fractions of the cat's height, so the perch's size sets
        // how big it is — small beside a line, large leaning in from the edge.
        const scale = this.catCurPx;

        let ux = this.catLX[k];
        let uy = this.catLY[k];

        // Head turn, applied in the cat's own unmirrored space about the neck
        // and weighted so it fades out down the throat rather than shearing.
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

        // Ears flick when something gets close.
        const ew = this.catEar[k];
        if (ew > 0.001 && this.catAlert > 0.01) {
          uy -= this.catAlert * ew * 0.012 * (1 + Math.sin(time * 0.02));
        }

        let lx = ux * scale * this.catFacing;
        // Breath stretches it from the paws up, so its feet stay planted.
        let ly = uy * scale * this.catBreathe;

        // Sway ramps up along the tail, squared so the base barely moves and
        // the tip carries the motion — a tail bends, it doesn't slide.
        const t = this.catTail[k];
        if (t > 0) {
          const bend = t * t * (scale / this.catBigPx);
          lx += wag * 0.6 * bend * this.catFacing;
          ly += wag * bend;
        }

        // The strike: a lunge forward and down, sharpest at contact, with the
        // front of the body leading so it reads as a paw swipe rather than the
        // whole cat sliding.
        if (this.catSwiping) {
          // The body only leans — a suggestion of weight behind the strike.
          // All the actual travel belongs to the paw, which is drawn
          // separately. Moving the whole silhouette was what made the swipe
          // read as the cat sliding sideways rather than striking.
          const front = Math.max(0, Math.min(1, (ux + 0.18) / 0.55));
          lx += this.pawOut * scale * 0.05 * front * this.catFacing;
          ly -= this.pawOut * scale * 0.015 * front;
        }

        // Lean and idle turn, applied as a rotation about the front paws.
        const goalX = this.catX + lx * this.catCos - ly * this.catSin;
        const goalY = this.catY + this.catBob + lx * this.catSin + ly * this.catCos;

        if (this.catSnap) {
          // On a blink the particles are placed at the destination outright.
          // Letting them fly there would draw 340 streaks across the hero,
          // reading as the cat sprinting rather than vanishing and reappearing.
          this.px[i] = goalX;
          this.py[i] = goalY;
          this.prevX[i] = goalX;
          this.prevY[i] = goalY;
          catPath.moveTo(goalX, goalY);
          catPath.lineTo(goalX + 0.1, goalY);
          continue;
        }

        // Track harder mid-swipe: at the default chase rate the goal outruns
        // the particles and the cat smears instead of striking.
        const chase = this.catSwiping ? 0.72 : 0.45;
        this.prevX[i] = x;
        this.prevY[i] = y;
        this.px[i] = x + (goalX - x) * chase;
        this.py[i] = y + (goalY - y) * chase;
        catPath.moveTo(x, y);
        catPath.lineTo(this.px[i], this.py[i]);
        continue;
      }

      // Each particle runs the formation curve on its own delay, so the block
      // gathers and releases as a ripple down the lines rather than at once.
      const delay = this.stagger[i];
      const eff = Math.max(0, (form - delay) / (1 - delay));

      const held = eff > 0.001 && this.hasTarget[i] === 1;
      if (held) {
        // During the pop the whole block inflates about its centre.
        let goalX =
          pop === 1
            ? this.targetX[i]
            : this.centroidX + (this.targetX[i] - this.centroidX) * pop;
        let goalY =
          pop === 1
            ? this.targetY[i]
            : this.centroidY + (this.targetY[i] - this.centroidY) * pop;

        // Chase a point circling the target rather than the target itself, so
        // nothing ever comes to a stop and there's no frozen frame to break out
        // of when the text releases.
        this.orbitPhase[i] += this.orbitSpeed[i];
        const r = this.orbitRadius[i] * eff;
        goalX += Math.cos(this.orbitPhase[i]) * r;
        goalY += Math.sin(this.orbitPhase[i]) * r;

        // Exponential approach rather than a spring: no ringing, and no extra
        // velocity state per particle.
        const homeX = x + (goalX - x) * 0.14;
        const homeY = y + (goalY - y) * 0.14;
        nextX = flowX + (homeX - flowX) * eff;
        nextY = flowY + (homeY - flowY) * eff;
      }

      // Carry any shatter velocity, bleeding it off each frame until the
      // current takes over again.
      if (bursting) {
        nextX += this.burstVX[i];
        nextY += this.burstVY[i];
        this.burstVX[i] *= burstDrag;
        this.burstVY[i] *= burstDrag;
      }

      // Pointer forces apply at full strength regardless of formation, so
      // sweeping the cursor through the text dents it and it re-forms.
      if (this.pointerActive) {
        const dx = x - this.smoothX;
        const dy = y - this.smoothY;
        const distSq = dx * dx + dy * dy;

        if (distSq < radiusSq && distSq > 0.0001) {
          const dist = Math.sqrt(distSq);
          // Quadratic falloff: strong at the cursor, nothing at the edge.
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
        // Lifetimes are frozen while a particle holds a letter. Letting them
        // tick would expire hundreds during a long hold, and every one would
        // teleport on the frame the text let go. Recycling mid-word would also
        // punch holes in the glyphs, so strays get clamped instead.
        this.px[i] = Math.min(this.width, Math.max(0, this.px[i]));
        this.py[i] = Math.min(this.height, Math.max(0, this.py[i]));
      } else if (
        !(
          bursting &&
          this.hasTarget[i] === 1 &&
          Math.abs(this.burstVX[i]) + Math.abs(this.burstVY[i]) > 0.4
        )
      ) {
        // A shard is exempt from recycling while it still carries speed — one
        // teleporting back to a random spot mid-flight is the most obvious way
        // to break the illusion that these are real fragments. Keying the
        // exemption to each shard's own velocity rather than a global flag
        // means they rejoin the field spread over time instead of every
        // off-screen piece reappearing on the frame the burst ends.
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

      // Debris retires one piece at a time on the way out, rather than the
      // whole surplus population disappearing on a single frame.
      if (surplus && !forming && burst < this.exitAt[i]) {
        continue;
      }

      const path = isCat ? catPath : (surplus ? surplusPaths : paths)[this.band[i]];
      path.moveTo(this.prevX[i], this.prevY[i]);
      path.lineTo(this.px[i], this.py[i]);
    }

    this.catSnap = false;

    // Far bands first so near particles overlay them.
    ctx.lineCap = 'round';
    const litAlpha = this.textAlpha();
    const litWidth = this.textWidth();

    for (let b = 0; b < FlowFieldComponent.BANDS; b++) {
      const depth = (b + 0.5) / FlowFieldComponent.BANDS;
      const depthAlpha = 0.12 + depth * 0.5;
      const depthWidth = 0.5 + depth * 1.6;

      // Depth shading is what sells the drifting field, and exactly what ruins
      // small type: two thirds of every letter would be drawn at 0.12 alpha.
      // So as the text forms, the bands converge on one bright, even stroke —
      // atmosphere while flowing, legibility while assembled.
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

    // Cat last, in its own warm colour and at a single even weight — it's a
    // creature, not part of the drifting field, so it skips depth shading.
    // Happy squint: > < knocked out of the silhouette in the background colour
    // so they read as negative space rather than something stuck on top. Both
    // chevrons point inward, which is what makes the expression read as pleased
    // rather than cross.
    if (catAlive) {
      // Design-space (60, 27) and (77, 27), normalised the same way the
      // silhouette's points are, and run through the same transform chain so
      // the eyes stay on the face when the head turns.
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

    // The paw itself: a tapered foreleg out of the cat's shoulder ending in a
    // rounded pad with three toes. Drawn rather than built from particles so
    // the shape stays crisp and legible at speed — this is the bit of the
    // animation the eye is supposed to follow.
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

    // Claw marks: three arcs raked across the point of impact. They shoot out
    // fast and linger, so the eye reads the strike after it has happened.
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
      // Stroke scales with the perch, so a small cat doesn't turn into a blob
      // and a large one still has its sample points overlapping.
      // Derived from the real point spacing at this size, so the points always
      // overlap into a solid shape instead of separating into dots.
      ctx.lineWidth = Math.max(
        1.1,
        this.catSpacing * (this.catCurPx / Math.max(1, this.catBigPx)) * 1.15,
      );
      ctx.strokeStyle = `rgba(${this.paint.cat}, ${Math.min(1, litAlpha * catShow).toFixed(3)})`;
      ctx.stroke(catPath);
    }
  }

  /** Reduced-motion path: a still frame of the plain field, no text. */
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
