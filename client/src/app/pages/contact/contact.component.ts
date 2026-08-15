import { ChangeDetectionStrategy, Component } from '@angular/core';

import { PROFILE } from '../../data/profile.data';

/**
 * Contact is a short list of links rather than a form.
 *
 * A form needs a server, a mail provider and a spam defence to do what a mailto
 * link does for free, and on a personal site almost nobody fills one in when
 * their own mail client is one click away.
 */
@Component({
  selector: 'app-contact',
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  protected readonly profile = PROFILE;
}
