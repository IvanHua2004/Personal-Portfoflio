/**
 * A still or a short loop shown beside a project.
 *
 * Video is a first-class option rather than an afterthought: a screenshot of an
 * RViz scene is a grey robot on a grid, and can't show that the claw actually
 * tracks anything. A few seconds of silent loop says what the description says.
 */
export interface ProjectMedia {
  /** Path relative to /public, e.g. 'projects/six-axis.webp'. */
  src: string;
  /** 'video' renders a muted, looping, inline clip. Defaults to 'image'. */
  type?: 'image' | 'video';
  /** Still shown before a video loads, and instead of it on reduced motion. */
  poster?: string;
  /** Describe what's happening, not that it's a screenshot. */
  alt: string;
}

export interface Project {
  /** URL-friendly identifier used in /projects/:slug */
  slug: string;
  title: string;
  /** One-line pitch shown in the list */
  summary: string;
  /** Longer write-up shown on the detail page */
  description: string;
  tags: string[];
  /**
   * The one tag that names what the project is really about, highlighted in the
   * accent colour so a reader skimming the list picks up the idea rather than
   * the toolchain. Must match an entry in `tags` to have any effect.
   */
  keyTag?: string;
  year: number;
  featured: boolean;
  links?: {
    live?: string;
    repo?: string;
  };
  /** Optional. Without it the row falls back to a plain panel. */
  media?: ProjectMedia;
}
