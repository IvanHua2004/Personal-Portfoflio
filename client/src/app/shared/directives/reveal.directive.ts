import {
  DestroyRef,
  Directive,
  ElementRef,
  afterNextRender,
  inject,
  input,
} from '@angular/core';

@Directive({
  selector: '[appReveal]',
})
export class RevealDirective {
  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);

  /** Delay in ms, for staggering siblings. */
  readonly appRevealDelay = input(0);

  constructor() {
    afterNextRender(() => this.observe());
  }

  private observe(): void {
    const el = this.host.nativeElement as HTMLElement;

    const still = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (still || typeof IntersectionObserver === 'undefined') {
      return;
    }

    // Hidden from here, not from CSS, so a failed bundle leaves the page readable.
    el.classList.add('reveal');
    el.style.transitionDelay = `${this.appRevealDelay()}ms`;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.classList.add('is-revealed');
          observer.disconnect();
        }
      },
      { rootMargin: '0px 0px -12% 0px' },
    );

    observer.observe(el);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }
}
