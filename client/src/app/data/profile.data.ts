import { SkillGroup } from '../core/models/skill.model';

export const PROFILE = {
  name: 'Ivan Hua',
  role: 'Computer engineering student',
  tagline:
    'Mathematics is what pulled me into engineering. AI is where I want to go deeper.',
  location: 'Polytechnique Montréal',
  email: 'ivanhua631@gmail.com',
  bio: [
    'I am a computer engineering student who likes learning about AI. Most of what ' +
      'I build starts as something I wanted to understand, whether that is inverse ' +
      'kinematics on a robotic arm or how a search algorithm actually explores a grid.',
    'Lately I have started reading research papers, both to keep up with where AI ' +
      'is going and to find ideas worth building into my next project.',
  ],
  socials: [
    { label: 'GitHub', url: 'https://github.com/IvanHua2004' },
    // TODO(ivan): your real LinkedIn, or delete this entry — a dead link is
    // worse than a missing one.
    { label: 'LinkedIn', url: 'https://linkedin.com/in/your-username' },
    { label: 'Email', url: 'mailto:ivanhua631@gmail.com' },
  ],
} as const;

/**
 * Grouped by what it's for rather than by language, so the robotics work and
 * the web work each read as a coherent set instead of one long alphabetised
 * list of nouns.
 *
 * TODO(ivan): add or cut to match what you'd actually be happy to be asked
 * about in an interview. Listing a tool you've touched once costs more than
 * leaving it off.
 */
export const SKILLS: SkillGroup[] = [
  { category: 'Robotics', items: ['ROS 2', 'RViz', 'URDF', 'Inverse kinematics', 'Eigen'] },
  { category: 'Languages', items: ['C++', 'TypeScript', 'JavaScript', 'HTML', 'SCSS'] },
  { category: 'Web', items: ['Angular', 'RxJS', 'Node.js', 'Express', 'Canvas'] },
  { category: 'Tooling', items: ['Git', 'CMake', 'colcon', 'GitHub Actions'] },
];

/**
 * What you're actually up to right now.
 *
 * This replaces the usual work-history timeline. A student two years in doesn't
 * have one worth printing, and an empty or padded timeline reads worse than no
 * timeline at all — whereas what someone is studying, building and reading this
 * term is genuinely the most interesting thing about them.
 *
 * Keep `updated` honest. A stale "currently" is worse than none, and the date
 * is what tells a reader the site is maintained rather than abandoned.
 */
export const CURRENT = {
  updated: 'August 2026',
  items: [
    {
      label: 'Studying',
      text:
        'Linear algebra and probability at Polytechnique — the parts that keep ' +
        'turning up underneath machine learning.',
    },
    {
      label: 'Building',
      text:
        'This site, including a hero that measures its own text out of the DOM ' +
        'and rebuilds it from a few thousand particles.',
    },
    {
      label: 'Reading',
      text: 'Working through the maths behind neural networks, one chapter at a time.',
    },
  ],
};
