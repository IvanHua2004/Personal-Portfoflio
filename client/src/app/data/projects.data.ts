import { Project } from '../core/models/project.model';

/**
 * Every project on the site. This is the only copy — the API that used to serve
 * them is gone, along with the three places a stale list could hide.
 *
 * Each entry renders as a full-width row with its media on alternating sides
 * and the whole write-up beside it. Add `media` to give a row a screenshot or
 * a clip; without one it falls back to a dotted plate.
 *
 * TODO(ivan): the `year` on each entry is a placeholder. Set the year you
 * actually built each one; a wrong date is the kind of detail people notice.
 */
export const PROJECTS: Project[] = [
  {
    slug: 'six-axis-arm',
    title: '6-axis robotic arm with inverse kinematics',
    summary:
      'A simulated arm in RViz whose claw tracks a sphere you can drag through all ' +
      'three planes.',
    description:
      'The target is a sphere on an interactive marker, with quaternion-oriented ' +
      'controls in the XY, ZX and YZ planes so it can be moved anywhere in the ' +
      'workspace. The solver is a Jacobian with damped least squares, which stays ' +
      'stable near singularities where a plain inverse blows up.',
    tags: ['ROS 2', 'C++', 'Eigen', 'RViz', 'Inverse kinematics', 'Quaternions', 'URDF'],
    year: 2026,
    featured: true,
    links: {
      repo: 'https://github.com/IvanHua2004/six-axis-robotic-arm-simulation',
    },
    // A clip beats a still here — a screenshot can't show that the claw
    // actually follows the target. Drop the file in public/projects/ and
    // uncomment:
    // media: {
    //   src: 'projects/six-axis.mp4',
    //   type: 'video',
    //   poster: 'projects/six-axis.webp',
    //   alt: 'The claw following a sphere dragged through the RViz scene',
    // },
  },
  {
    slug: 'ik-claw-3dof',
    title: '3-DOF claw chasing random targets',
    summary:
      'A three-joint arm in turtlesim, with turtles standing in for the claw and the ' +
      'target it chases.',
    description:
      'Targets spawn at random points and the arm solves its inverse kinematics to ' +
      'reach them. Three joints keeps the geometry tractable, so it was the right ' +
      'place to get the solver and the ROS 2 node structure right before scaling the ' +
      'same ideas up to six axes.',
    tags: ['ROS 2', 'turtlesim', 'Inverse kinematics', 'Robotics'],
    year: 2026,
    featured: true,
    links: {
      repo: 'https://github.com/IvanHua2004/Inverse_kinematic_ROS2_simulation',
    },
    // media: {
    //   src: 'projects/ik-3dof.mp4',
    //   type: 'video',
    //   poster: 'projects/ik-3dof.webp',
    //   alt: 'The turtle claw reaching a target turtle that has just spawned',
    // },
  },
  {
    slug: 'graph-search-visualiser',
    title: 'Graph search visualiser',
    summary: 'DFS, BFS and A* explored side by side on a grid you draw walls into.',
    description:
      'Watching the frontier expand makes the difference obvious in a way pseudocode ' +
      'never is: DFS commits down one path, BFS spreads evenly, and A* leans toward ' +
      'the goal its heuristic points at.',
    tags: ['Algorithms', 'Pathfinding', 'A*', 'BFS', 'DFS', 'Visualisation'],
    year: 2026,
    featured: true,
    links: {
      repo: 'https://github.com/IvanHua2004/GraphSearchVisualiser',
    },
    // Capture this one mid-search, with the frontier visible and the path
    // found — the finished state says much less than the search does.
    // media: {
    //   src: 'projects/graph-search.webp',
    //   alt: 'A* part-way through a grid, frontier expanding toward the goal',
    // },
  },
  {
    slug: 'personal-portfolio',
    title: 'This site',
    summary: 'An Angular portfolio whose hero is built from a few thousand particles.',
    description:
      'Angular 20 and signals on a hand-written SCSS system, no UI library. The hero ' +
      'measures its own headings out of the DOM, so it tracks the real layout at any ' +
      'size, and the real text stays in the page for screen readers.',
    tags: ['Angular', 'TypeScript', 'Canvas', 'SCSS', 'Express', 'Node.js'],
    year: 2026,
    featured: true,
    links: {
      repo: 'https://github.com/IvanHua2004/Personal-Portfoflio',
    },
    // media: {
    //   src: 'projects/portfolio.webp',
    //   alt: 'The hero mid-assembly, particles forming the headline',
    // },
  },
];
