import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { toObservable, toSignal } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { map, switchMap } from 'rxjs';

import { Project } from '../../core/models/project.model';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-project-detail',
  imports: [RouterLink],
  templateUrl: './project-detail.component.html',
  styleUrl: './project-detail.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectDetailComponent {
  private readonly projectService = inject(ProjectService);

  /** Bound from the :slug route parameter (withComponentInputBinding). */
  readonly slug = input<string>('');

  /** null while loading, undefined when no such project exists. */
  protected readonly project = toSignal<Project | undefined | null>(
    toObservable(this.slug).pipe(
      switchMap((slug) => this.projectService.getBySlug(slug).pipe(map((p) => p ?? undefined))),
    ),
    { initialValue: null },
  );
}
