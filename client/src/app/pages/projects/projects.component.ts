import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { ProjectService } from '../../core/services/project.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-projects',
  imports: [ProjectCardComponent, RevealDirective],
  templateUrl: './projects.component.html',
  styleUrl: './projects.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectsComponent {
  private readonly projectService = inject(ProjectService);

  protected readonly projects = this.projectService.all;
}
