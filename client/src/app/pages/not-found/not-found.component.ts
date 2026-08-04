import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="section">
      <div class="container">
        <p class="code">404</p>
        <h1>Page not found</h1>
        <p>The page you were looking for doesn't exist or has moved.</p>
        <a class="btn btn--primary" routerLink="/">Back home</a>
      </div>
    </section>
  `,
  styles: `
    .code {
      font-family: var(--font-mono);
      font-size: var(--text-2xl);
      color: var(--color-accent);
      margin-bottom: var(--space-2);
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
