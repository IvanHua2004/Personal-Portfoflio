import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  viewChild,
} from '@angular/core';

import { Project } from '../../../core/models/project.model';

/**
 * One project, as a full-width row: media on one side, the whole write-up on
 * the other.
 *
 * There's no detail page behind this. Everything worth reading is here, and the
 * only link out is to the source.
 */
@Component({
  selector: 'app-project-card',
  templateUrl: './project-card.component.html',
  styleUrl: './project-card.component.scss',
  host: {
    '[class.is-flipped]': 'flipped()',
    '[class.is-text-only]': '!project().media',
  },
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectCardComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly project = input.required<Project>();
  /** Position in the list, shown as the row's number. */
  readonly index = input(1);
  /** Puts the media on the right instead of the left. */
  readonly flipped = input(false);

  private readonly clip = viewChild<ElementRef<HTMLVideoElement>>('clip');

  protected readonly padded = computed(() => String(this.index()).padStart(2, '0'));

  constructor() {
    afterNextRender(() => this.start());
  }

  /**
   * Starts the clip and keeps it running, without any visible control.
   *
   * Playback is kicked off from code rather than the `autoplay` attribute
   * because Angular sets `muted` as an attribute, which doesn't set the DOM
   * *property* — and browsers only autoplay videos muted at the property
   * level, so the attribute alone leaves it stalled on the poster frame.
   *
   * If a browser policy refuses the first attempt anyway, it retries once the
   * clip is buffered and again on the visitor's first interaction with the
   * page, which is the point at which autoplay restrictions lift.
   */
  private start(): void {
    const video = this.clip()?.nativeElement;
    if (!video) {
      return;
    }

    video.muted = true;
    video.defaultMuted = true;
    video.loop = true;
    video.playsInline = true;

    const attempt = () => video.play().catch(() => undefined);

    attempt();
    video.addEventListener('canplay', attempt, { once: true });

    const onInteract = () => {
      if (video.paused) {
        attempt();
      }
    };
    // Capture phase, so it fires even if something else swallows the event.
    document.addEventListener('pointerdown', onInteract, { once: true, capture: true });

    this.destroyRef.onDestroy(() => {
      video.removeEventListener('canplay', attempt);
      document.removeEventListener('pointerdown', onInteract, { capture: true });
    });
  }
}
