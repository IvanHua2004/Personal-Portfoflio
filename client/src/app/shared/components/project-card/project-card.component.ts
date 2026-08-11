import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';

import { Project } from '../../../core/models/project.model';

/**
 * One project, as a full-width row: media on one side, the whole write-up on
 * the other.
 *
 * There's no detail page behind this. Everything worth reading is here, and the
 * only link out is to the source — clicking through to a page that repeats what
 * you just read is a wasted step on a portfolio this size.
 */
@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
  host: {
    '[class.is-flipped]': 'flipped()',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  readonly project = input.required<Project>();
  /** Position in the list, shown as the row's number. */
  readonly index = input(1);
  /** Puts the media on the right instead of the left. */
  readonly flipped = input(false);

  protected readonly padded = computed(() => String(this.index()).padStart(2, '0'));

  /** Clips don't autoplay for visitors who'd rather things held still. */
  protected readonly reducedMotion = signal(
    typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  );
}
