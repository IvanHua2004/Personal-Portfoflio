import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';

import { ProjectCardComponent } from '../../shared/components/project-card/project-card.component';
import { ProjectService } from '../../core/services/project.service';
import { PROFILE, SKILLS } from '../../data/profile.data';

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProjectCardComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HomeComponent {
  private readonly projectService = inject(ProjectService);

  protected readonly profile = PROFILE;
  protected readonly skills = SKILLS;
  protected readonly featured = this.projectService.featured;
  protected readonly loading = this.projectService.loading;
}
