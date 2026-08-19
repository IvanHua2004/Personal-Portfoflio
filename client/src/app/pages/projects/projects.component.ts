import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { ProjectService } from '../../core/services/project.service';
import { RevealDirective } from '../../shared/directives/reveal.directive';

/**
 * The tag filter is gone. Four projects produced ten filter pills — more
 * controls than content, and a filter that can only ever narrow a list you can
 * already see in full is decoration. It's worth bringing back at ~12 projects.
 */
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
