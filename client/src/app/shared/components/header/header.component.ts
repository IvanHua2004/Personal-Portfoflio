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

  private watchSections(attempt = 0): void {
    const sections = this.navItems
      .map((item) => document.getElementById(item.fragment))
      .filter((el): el is HTMLElement => el !== null);

    if (sections.length < this.navItems.length) {
      if (attempt < 60) {
        requestAnimationFrame(() => this.watchSections(attempt + 1));
      }
      return;
    }

    this.zone.runOutsideAngular(() => {
      let queued = false;

      const pick = () => {
        queued = false;
        const line = 96;
        let best = sections[0].id;

        for (const section of sections) {
          if (section.getBoundingClientRect().top <= line) {
            best = section.id;
          }
        }

        const doc = document.documentElement;
        if (doc.scrollTop + doc.clientHeight >= doc.scrollHeight - 2) {
          best = sections[sections.length - 1].id;
        }

        if (best !== this.activeSection()) {
          this.zone.run(() => this.activeSection.set(best));
        }
      };

      const onScroll = () => {
        if (!queued) {
          queued = true;
          requestAnimationFrame(pick);
        }
      };

      addEventListener('scroll', onScroll, { passive: true });
      addEventListener('resize', onScroll, { passive: true });
      pick();

      this.destroyRef.onDestroy(() => {
        removeEventListener('scroll', onScroll);
        removeEventListener('resize', onScroll);
      });
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }
}
