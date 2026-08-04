export interface Project {
  slug: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  year: number;
  featured: boolean;
  links?: {
    live?: string;
    repo?: string;
  };
  image?: string;
}
