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
  /** Puts the media on the right instead of the left. */
  readonly flipped = input(false);

  private readonly clip = viewChild<ElementRef<HTMLVideoElement>>('clip');

  protected readonly orderedTags = computed(() => {
    const { tags, keyTag } = this.project();
    if (!keyTag || !tags.includes(keyTag)) {
      return tags;
    }
    return [keyTag, ...tags.filter((tag) => tag !== keyTag)];
  });

  constructor() {
    afterNextRender(() => this.start());
  }

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
    document.addEventListener('pointerdown', onInteract, { once: true, capture: true });

    this.destroyRef.onDestroy(() => {
      video.removeEventListener('canplay', attempt);
      document.removeEventListener('pointerdown', onInteract, { capture: true });
    });
  }
}
