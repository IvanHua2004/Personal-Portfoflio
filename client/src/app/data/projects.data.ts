import { Project } from '../core/models/project.model';

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
    media: {
      src: 'projects/six-axis.mp4',
      type: 'video',
      poster: 'projects/six-axis.jpg',
      alt: 'The claw following a sphere dragged through the RViz scene',
    },
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
    media: {
      src: 'projects/ik-3dof.mp4',
      type: 'video',
      poster: 'projects/ik-3dof.jpg',
      alt: 'The turtle claw reaching a target turtle that has just spawned',
    },
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
    media: {
      src: 'projects/graph-search.mp4',
      type: 'video',
      poster: 'projects/graph-search.jpg',
      alt: 'A search expanding across the grid, frontier spreading toward the goal',
    },
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
    media: {
      src: 'projects/portfolio.mp4',
      type: 'video',
      poster: 'projects/portfolio.jpg',
      alt: 'The hero assembling its headings out of particles',
    },
  },
];
