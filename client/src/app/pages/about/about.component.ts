import { ChangeDetectionStrategy, Component } from '@angular/core';

import { EXPERIENCE, PROFILE, SKILLS } from '../../data/profile.data';

@Component({
  selector: 'app-about',
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  protected readonly profile = PROFILE;
  protected readonly skills = SKILLS;
  protected readonly experience = EXPERIENCE;
}
