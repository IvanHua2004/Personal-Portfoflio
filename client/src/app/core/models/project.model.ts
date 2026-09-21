export interface ProjectMedia {
  src: string;
  type?: 'image' | 'video';
  poster?: string;
  ratio: string;
  width?: string;
  alt: string;
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  description: string;
  tags: string[];
  keyTag?: string;
  year: number;
  featured: boolean;
  links?: {
    live?: string;
    repo?: string;
  };
  media?: ProjectMedia;
}
