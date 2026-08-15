import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PROFILE } from '../../data/profile.data';

@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  protected readonly profile = PROFILE;
}
