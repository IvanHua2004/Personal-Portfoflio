import { Project } from '../core/models/project.model';

/**
 * Replace these with your own work. Everything on the site reads from here,
 * so adding a project is a one-file change.
 */
export const PROJECTS: Project[] = [
  {
    slug: 'task-flow',
    title: 'TaskFlow',
    summary: 'A keyboard-first task manager with offline sync.',
    description:
      'TaskFlow is a single-page task manager built around keyboard navigation. ' +
      'It stores data locally via IndexedDB and reconciles with the server when a ' +
      'connection returns, so the app stays usable on flaky networks.',
    tags: ['Angular', 'TypeScript', 'IndexedDB', 'RxJS'],
    year: 2026,
    featured: true,
    links: {
      live: 'https://example.com',
      repo: 'https://github.com/your-username/taskflow',
    },
  },
  {
    slug: 'pixel-weather',
    title: 'Pixel Weather',
    summary: 'Minimal weather dashboard with animated forecast cards.',
    description:
      'A small dashboard that pulls from a public forecast API and renders a ' +
      'seven-day outlook. Built to practise Angular signals and CSS animation ' +
      'without a component library.',
    tags: ['Angular', 'Signals', 'SCSS', 'REST API'],
    year: 2025,
    featured: true,
    links: {
      repo: 'https://github.com/your-username/pixel-weather',
    },
  },
  {
    slug: 'ledger-lite',
    title: 'Ledger Lite',
    summary: 'Personal finance tracker with CSV import and charting.',
    description:
      'Import bank statements as CSV, auto-categorise transactions with simple ' +
      'rules, and visualise spending over time. Includes a rules editor and an ' +
      'export back to CSV.',
    tags: ['TypeScript', 'Chart.js', 'Node.js'],
    year: 2025,
    featured: false,
    links: {
      repo: 'https://github.com/your-username/ledger-lite',
    },
  },
];
