import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, catchError, of, shareReplay } from 'rxjs';

import { environment } from '../../../environments/environment';
import { Project } from '../models/project.model';
import { PROJECTS } from '../../data/projects.data';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/projects`;

  private readonly request$ = this.http.get<Project[]>(this.baseUrl).pipe(
    catchError((error) => {
      // Render's free tier sleeps after 15 minutes idle, so the first request
      // can fail or hang. Fall back to bundled data rather than showing an
      // empty page — the site stays usable either way.
      console.warn('[projects] API unavailable, using bundled data', error);
      return of(PROJECTS);
    }),
    shareReplay({ bufferSize: 1, refCount: false }),
  );

  private readonly projects = toSignal(this.request$, { initialValue: null });

  /** True until the first response (or failure) arrives. */
  readonly loading = computed(() => this.projects() === null);

  /** All projects, newest first. */
  readonly all = computed(() =>
    [...(this.projects() ?? [])].sort((a, b) => b.year - a.year),
  );

  readonly featured = computed(() => this.all().filter((p) => p.featured));

  readonly tags = computed(() =>
    [...new Set(this.all().flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b)),
  );

  /** Fetches one project directly from the API, falling back to bundled data. */
  getBySlug(slug: string): Observable<Project | undefined> {
    return this.http.get<Project>(`${this.baseUrl}/${slug}`).pipe(
      catchError(() => of(PROJECTS.find((p) => p.slug === slug))),
    );
  }
}
