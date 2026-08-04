import { HttpErrorResponse } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';

import { ContactService } from '../../core/services/contact.service';
import { PROFILE } from '../../data/profile.data';

type SubmitState = 'idle' | 'sending' | 'sent' | 'error';

@Component({
  selector: 'app-contact',
  imports: [ReactiveFormsModule],
  templateUrl: './contact.component.html',
  styleUrl: './contact.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactComponent {
  private readonly fb = inject(FormBuilder);
  private readonly contactService = inject(ContactService);

  protected readonly profile = PROFILE;
  protected readonly state = signal<SubmitState>('idle');
  protected readonly errorMessage = signal('');

  protected readonly form: FormGroup = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    message: ['', [Validators.required, Validators.minLength(10)]],
    // Honeypot: hidden from users, filled by bots.
    website: [''],
  });

  protected control(name: string) {
    return this.form.get(name);
  }

  protected isInvalid(name: string): boolean {
    const control = this.control(name);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  protected onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.state.set('sending');
    this.errorMessage.set('');

    this.contactService.send(this.form.getRawValue()).subscribe({
      next: () => {
        this.state.set('sent');
        this.form.reset();
      },
      error: (error: HttpErrorResponse) => {
        this.state.set('error');
        this.errorMessage.set(this.describe(error));
      },
    });
  }

  private describe(error: HttpErrorResponse): string {
    if (error.status === 0) {
      // Free Render services sleep after 15 minutes; the first request wakes them.
      return 'Could not reach the server. It may be waking up — try again in a moment.';
    }
    if (error.status === 429) {
      return 'Too many messages sent. Please try again later.';
    }
    if (error.status === 400) {
      return 'Please check the form and try again.';
    }
    return 'Something went wrong. Please email me directly instead.';
  }
}
