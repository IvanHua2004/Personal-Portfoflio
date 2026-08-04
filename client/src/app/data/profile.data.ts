import { SkillGroup } from '../core/models/skill.model';

export const PROFILE = {
  name: 'Ivan Hua',
  role: 'Front-end Developer',
  tagline: 'I build fast, accessible web applications with Angular and TypeScript.',
  location: 'Your City, Country',
  email: 'ivanhua631@gmail.com',
  bio: [
    'I am a front-end developer who enjoys the part of the job where a rough idea ' +
      'turns into something people can actually click. Most of my work sits in the ' +
      'Angular and TypeScript world, with a strong bias toward performance and accessibility.',
    'Outside of client work I maintain a handful of small open-source utilities and ' +
      'write occasionally about front-end architecture.',
  ],
  socials: [
    { label: 'GitHub', url: 'https://github.com/your-username' },
    { label: 'LinkedIn', url: 'https://linkedin.com/in/your-username' },
    { label: 'Email', url: 'mailto:ivanhua631@gmail.com' },
  ],
} as const;

export const SKILLS: SkillGroup[] = [
  { category: 'Languages', items: ['TypeScript', 'JavaScript', 'HTML', 'SCSS', 'SQL'] },
  { category: 'Frameworks', items: ['Angular', 'RxJS', 'Node.js', 'Express'] },
  { category: 'Tooling', items: ['Git', 'Vite', 'Jest / Jasmine', 'Docker', 'GitHub Actions'] },
];

export const EXPERIENCE = [
  {
    role: 'Front-end Developer',
    company: 'Company Name',
    period: '2024 — Present',
    detail:
      'Building and maintaining customer-facing Angular applications; led the migration to standalone components.',
  },
  {
    role: 'Junior Developer',
    company: 'Earlier Company',
    period: '2022 — 2024',
    detail: 'Shipped features across the stack and owned the design-system component library.',
  },
];
