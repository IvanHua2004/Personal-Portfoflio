import { ChangeDetectionStrategy, Component } from '@angular/core';

import { CURRENT, PROFILE, SKILLS } from '../../data/profile.data';
import { RevealDirective } from '../../shared/directives/reveal.directive';

@Component({
  selector: 'app-about',
  imports: [RevealDirective],
  templateUrl: './about.component.html',
  styleUrl: './about.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AboutComponent {
  protected readonly profile = PROFILE;
  protected readonly skills = SKILLS;
  protected readonly current = CURRENT;
}
