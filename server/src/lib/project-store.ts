import { readFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import type { Project } from '../types.js';

const here = dirname(fileURLToPath(import.meta.url));
const dataFile = join(here, '..', 'data', 'projects.json');

let cache: Project[] | null = null;

/**
 * Reads projects.json once and keeps it in memory. Swap the body of this
 * function for a database query later — callers won't need to change.
 */
export async function loadProjects(): Promise<Project[]> {
  if (cache) {
    return cache;
  }

  const raw = await readFile(dataFile, 'utf-8');
  const projects = JSON.parse(raw) as Project[];
  cache = projects.sort((a, b) => b.year - a.year);
  return cache;
}

export async function findProject(slug: string): Promise<Project | undefined> {
  const projects = await loadProjects();
  return projects.find((project) => project.slug === slug);
}

/** Clears the in-memory cache — useful in tests. */
export function resetProjectCache(): void {
  cache = null;
}
