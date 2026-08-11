import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  afterNextRender,
  inject,
  signal,
} from '@angular/core';
import { NgZone } from '@angular/core';
import { RouterLink } from '@angular/router';

import { PROFILE } from '../../../data/profile.data';

interface NavItem {
  label: string;
  /** Id of the section it scrolls to. */
  fragment: string;
}

@Component({
  selector: 'app-header',
  imports: [RouterLink],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderComponent {
  private readonly zone = inject(NgZone);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly profile = PROFILE;
  protected readonly menuOpen = signal(false);

  /** The section currently filling most of the viewport. */
  protected readonly activeSection = signal('top');

  protected readonly navItems: NavItem[] = [
    { label: 'Home', fragment: 'top' },
    { label: 'Projects', fragment: 'projects' },
    { label: 'About', fragment: 'about' },
    { label: 'Contact', fragment: 'contact' },
  ];

  constructor() {
    afterNextRender(() => this.watchSections());
  }

  /**
   * Scroll-spy. `routerLinkActive` only knows about the URL, and on a one-page
   * site the URL barely changes — so the highlight has to come from what's
   * actually on screen instead.
   */
  private watchSections(): void {
    const sections = this.navItems
      .map((item) => document.getElementById(item.fragment))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length === 0) {
      return;
    }

    this.zone.runOutsideAngular(() => {
      const visible = new Map<string, number>();

      const observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            visible.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
          }

          // Whichever section shows the most wins. Comparing ratios rather than
          // taking the first intersecting one stops the highlight flickering
          // between two sections while a boundary crosses the viewport.
          let best = '';
          let bestRatio = 0;
          for (const [id, ratio] of visible) {
            if (ratio > bestRatio) {
              bestRatio = ratio;
              best = id;
            }
          }

          if (best && best !== this.activeSection()) {
            this.zone.run(() => this.activeSection.set(best));
          }
        },
        // Several thresholds so the ratio updates smoothly as you scroll,
        // rather than only at the moment a section enters or leaves.
        { threshold: [0, 0.15, 0.3, 0.5, 0.75, 1] },
      );

      for (const section of sections) {
        observer.observe(section);
      }

      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
