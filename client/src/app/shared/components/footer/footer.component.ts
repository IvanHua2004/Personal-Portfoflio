import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PROFILE } from '../../../data/profile.data';

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FooterComponent {
  protected readonly profile = PROFILE;
  protected readonly year = new Date().getFullYear();
}
