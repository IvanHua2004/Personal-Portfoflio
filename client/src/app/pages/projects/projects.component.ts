import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';

import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { ProjectService } from '../../core/services/project.service';

@Component({
  selector: 'app-projects',
  imports: [ProjectCardComponent],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  private readonly projectService = inject(ProjectService);

  protected readonly tags = this.projectService.tags;
  protected readonly loading = this.projectService.loading;
  protected readonly activeTag = signal<string | null>(null);

  protected readonly visibleProjects = computed(() => {
    const tag = this.activeTag();
    const projects = this.projectService.all();
    return tag ? projects.filter((p) => p.tags.includes(tag)) : projects;
  });

  protected selectTag(tag: string | null): void {
    this.activeTag.set(tag);
  }
}
