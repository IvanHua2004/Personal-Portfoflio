import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <section class="lost">
      <svg class="lost__cat" viewBox="0 0 64 64" aria-hidden="true">
        <g fill="currentColor">
          <path d="M17 26 L19 11 L28 21 Z" />
          <path d="M47 26 L45 11 L36 21 Z" />
          <ellipse cx="32" cy="34" rx="17" ry="15" />
        </g>
        <g
          fill="none"
          stroke="var(--color-bg)"
          stroke-width="2.6"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="M22 31 L27 34 L22 37" />
          <path d="M42 31 L37 34 L42 37" />
        </g>
      </svg>

      <p class="lost__code">404</p>
      <h1 class="lost__title">The cat knocked this page off the table</h1>
      <p class="lost__text">Whatever was here isn't anymore. Everything worth seeing is on the home page.</p>
      <a class="btn btn--primary" routerLink="/">Back home</a>
    </section>
  `,
  styles: `
    .lost {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 70vh;
      padding: var(--space-9) var(--space-5);
      text-align: center;
    }

    .lost__cat {
      width: 120px;
      height: 120px;
      color: var(--color-cat);
      animation: tilt 3.2s ease-in-out infinite;
      transform-origin: 50% 80%;
    }

    .lost__code {
      margin: var(--space-5) 0 var(--space-2);
      font-family: var(--font-mono);
      color: var(--color-accent);
    }

    .lost__title {
      max-width: 22ch;
      font-size: clamp(1.8rem, 4vw, 2.6rem);
    }

    .lost__text {
      max-width: 44ch;
      margin-bottom: var(--space-6);
    }

    @keyframes tilt {
      0%, 100% { transform: rotate(-6deg); }
      50% { transform: rotate(6deg); }
    }

    @media (prefers-reduced-motion: reduce) {
      .lost__cat { animation: none; }
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}
