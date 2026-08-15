import { SkillGroup } from '../core/models/skill.model';

export const PROFILE = {
  name: 'Ivan Hua',
  // The hero greets people by first name; the full name is still used for the
  // header wordmark, the footer and the page title.
  firstName: 'Ivan',
  role: 'Computer engineering student',
  tagline:
    'Mathematics is what pulled me into engineering. AI is where I want to go deeper',
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
    {
      label: 'GitHub',
      handle: 'IvanHua2004',
      url: 'https://github.com/IvanHua2004',
      icon: 'github',
    },
    {
      label: 'LinkedIn',
      handle: 'ivan-hua',
      url: 'https://www.linkedin.com/in/ivan-hua',
      icon: 'linkedin',
    },
    {
      label: 'Email',
      handle: 'ivanhua631@gmail.com',
      url: 'mailto:ivanhua631@gmail.com',
      icon: 'gmail',
    },
  ],
} as const;

export const SKILLS: SkillGroup[] = [
  { category: 'Robotics', items: ['ROS 2', 'RViz', 'URDF', 'Inverse kinematics', 'Eigen'] },
  { category: 'Languages', items: ['C++', 'TypeScript', 'JavaScript', 'Python'] },
  { category: 'Web', items: ['Angular', 'RxJS', 'Node.js', 'Express', 'Canvas'] },
  { category: 'Tooling', items: ['Git', 'CMake', 'colcon', 'GitHub Actions'] },
];

export const CURRENT = {
  updated: 'August 2026',
  items: [
    {
      label: 'Studying',
      text:
        'MTH3302, probabilistic and statistical methods for artificial ' +
        'intelligence, at Polytechnique this semester.',
    },
    {
      label: 'Building',
      text: 'This site, from the layout to the particle hero.',
    },
    {
      label: 'Reading',
      text:
        'An Introduction to Statistical Learning, the Python edition, by James, ' +
        'Witten, Hastie, Tibshirani and Taylor.',
    },
  ],
};
