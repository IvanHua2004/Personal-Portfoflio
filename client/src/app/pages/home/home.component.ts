import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  computed,
  signal,
  viewChildren,
} from '@angular/core';
import { RouterLink } from '@angular/router';

import { FlowFieldComponent } from '../../shared/components/flow-field/flow-field.component';
import { AboutComponent } from '../about/about.component';
import { ContactComponent } from '../contact/contact.component';
import { ProjectsComponent } from '../projects/projects.component';
import { PROFILE } from '../../data/profile.data';

/**
 * The whole site, on one page.
 *
 * The hero owns the particle field; everything below it is the existing section
 * components composed in. They're embedded rather than copied so the project
 * list, the bio and the contact form each still live in exactly one place, and
 * the nav scrolls between them by fragment instead of routing away.
 */
@Component({
  selector: 'app-home',
  imports: [RouterLink, FlowFieldComponent, ProjectsComponent, AboutComponent, ContactComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  protected readonly profile = PROFILE;

  private readonly heroLines = viewChildren<ElementRef<HTMLElement>>('heroLine');

  /** The real hero elements, handed to the canvas to measure and trace. */
  protected readonly heroSources = computed(() =>
    this.heroLines().map((ref) => ref.nativeElement),
  );

  /**
   * The headings stay in the DOM for screen readers, search engines and text
   * selection — they are only made transparent, and only once the canvas has
   * confirmed it is running. If the canvas fails, or JavaScript is off, or the
   * visitor prefers reduced motion, the original text is simply still there.
   */
  protected readonly fieldReady = signal(false);

  protected onFieldReady(): void {
    this.fieldReady.set(true);
  }
}
