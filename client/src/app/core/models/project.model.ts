export interface Project {
  /** URL-friendly identifier used in /projects/:slug */
  slug: string;
  title: string;
  /** One-line pitch shown on cards */
  summary: string;
  /** Longer write-up shown on the detail page */
  description: string;
  tags: string[];
  year: number;
  /** Marks the project for the "Selected work" list on the home page */
  featured: boolean;
  links?: {
    live?: string;
    repo?: string;
  };
  /** Path relative to /public, e.g. 'images/project-a.png' */
  image?: string;
}
