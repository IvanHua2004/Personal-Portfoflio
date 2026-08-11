import { Injectable, computed, signal } from '@angular/core';

import { Project } from '../models/project.model';
import { PROJECTS } from '../../data/projects.data';

/**
 * Projects are static content.
 *
 * They used to be fetched from the API, which meant the same list existed in
 * three places — this file, the server's JSON, and the compiled copy in the
 * server's dist folder — with an in-memory cache on top. Every one of those was
 * a chance to serve a stale list, and it bought nothing: the content only
 * changes when the site is redeployed, and a sleeping free-tier API made the
 * section slower than reading it straight from the bundle.
 *
 * Editing this file is all it takes to change what the site shows.
 */
@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly projects = signal<Project[]>(PROJECTS);

  /** Kept so callers can still show a spinner if this ever becomes async again. */
  readonly loading = computed(() => false);

  /** Newest first. */
  readonly all = computed(() => [...this.projects()].sort((a, b) => b.year - a.year));

  readonly featured = computed(() => this.all().filter((p) => p.featured));

  readonly tags = computed(() =>
    [...new Set(this.all().flatMap((p) => p.tags))].sort((a, b) => a.localeCompare(b)),
  );
}
