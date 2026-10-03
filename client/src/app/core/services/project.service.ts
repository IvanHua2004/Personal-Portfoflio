import { Injectable, computed, signal } from '@angular/core';

import { Project } from '../models/project.model';
import { PROJECTS } from '../../data/projects.data';

@Injectable({ providedIn: 'root' })
export class ProjectService {
  private readonly projects = signal<Project[]>(PROJECTS);

  readonly all = computed(() => [...this.projects()].sort((a, b) => b.year - a.year));
}
