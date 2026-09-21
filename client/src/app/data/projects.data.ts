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
    tags: ['ROS 2', 'C++', 'RViz', 'Inverse kinematics', 'Quaternions', 'URDF', 'Eigen'],
    keyTag: 'Inverse kinematics',
    year: 2026,
    featured: true,
    links: {
      repo: 'https://github.com/IvanHua2004/six-axis-robotic-arm-simulation',
    },
    media: {
      src: 'projects/six-axis.mp4',
      type: 'video',
      ratio: '966 / 720',
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
    tags: ['ROS 2', 'Python', 'turtlesim', 'Inverse kinematics', 'Robotics'],
    keyTag: 'Inverse kinematics',
    year: 2026,
    featured: true,
    links: {
      repo: 'https://github.com/IvanHua2004/Inverse_kinematic_ROS2_simulation',
    },
    media: {
      src: 'projects/ik-3dof.mp4',
      type: 'video',
      ratio: '720 / 720',
      poster: 'projects/ik-3dof.jpg',
      alt: 'The turtle claw reaching a target turtle that has just spawned',
    },
  },
  {
    slug: 'graph-search-visualiser',
    title: 'Graph search visualiser',
    summary: 'DFS, BFS and A* explored side by side on a grid you draw walls into.',
    description:
      'I wanted to understand these algorithms visually, not just as code. Watching ' +
      'the frontier expand makes the difference clear: DFS commits down one path, ' +
      'BFS spreads evenly, and A* leans toward the goal its heuristic points at. ' +
      'Building it was how I learned A*.',
    tags: ['Algorithms', 'Pathfinding', 'A*', 'BFS', 'DFS', 'Visualisation', 'PyQt', 'Python'],
    keyTag: 'Pathfinding',
    year: 2026,
    featured: true,
    links: {
      repo: 'https://github.com/IvanHua2004/GraphSearchVisualiser',
    },
    media: {
      src: 'projects/graph-search.mp4',
      type: 'video',
      ratio: '1324 / 720',
      poster: 'projects/graph-search.jpg',
      alt: 'A search expanding across the grid, frontier spreading toward the goal',
    },
  },
  {
    slug: 'digit-guesser',
    title: 'Digit guesser',
    summary:
      'A CNN trained on MNIST, with a drawing pad that predicts live as you write.',
    description:
      'I read the research paper Gradient-Based Learning Applied to Document ' +
      'Recognition, the one MNIST comes from, and wanted to understand CNNs ' +
      'better, so I built this to learn how they work. It trains 421,642 ' +
      'parameters from scratch on 60,000 handwritten digits per epoch.',
    tags: ['Python', 'PyTorch', 'CNN', 'MNIST', 'Computer vision'],
    keyTag: 'CNN',
    year: 2026,
    featured: true,
    links: {
      repo: 'https://github.com/IvanHua2004/digit-guesser',
    },
    media: {
      src: 'projects/digit-guesser.mp4',
      type: 'video',
      ratio: '922 / 720',
      poster: 'projects/digit-guesser.jpg',
      alt: 'A digit drawn on the pad, with the prediction updating as it is written',
    },
  },
  {
    slug: 'leetcode-helper',
    title: 'LeetCode helper',
    summary:
      'A drag-and-drop trainer that has you assemble a solution line by line instead ' +
      'of typing it.',
    description:
      'I am currently training on LeetCode, so I made an app that makes it easier ' +
      'and more fun. Building the answer from shuffled lines forces you to think ' +
      'about the shape of the solution rather than the syntax, which is what ' +
      'builds intuition for the patterns behind each kind of problem.',
    tags: ['TypeScript', 'Algorithms', 'Problem patterns', 'Python'],
    keyTag: 'Problem patterns',
    year: 2026,
    featured: true,
    links: {
      repo: 'https://github.com/IvanHua2004/LeetCodePractice',
      extra: {
        label: 'My LeetCode',
        url: 'https://leetcode.com/u/ivanhua631/',
        icon: 'leetcode',
      },
    },
    media: {
      src: 'projects/leetcode-helper.mp4',
      type: 'video',
      ratio: '1484 / 720',
      poster: 'projects/leetcode-helper.jpg',
      alt: 'Code lines being dragged from a pool into the solution, with a hint and a timer',
    },
  },
  {
    slug: 'personal-portfolio',
    title: 'This site',
    summary: 'An Angular portfolio whose hero is built from a few thousand particles.',
    description:
      'A single-page portfolio built with Angular and TypeScript, from the layout ' +
      'and styling to the animated particle hero that reacts to the cursor. ' +
      'Designed to work on any screen size and deployed straight from the repo.',
    tags: ['Angular', 'TypeScript', 'Canvas', 'SCSS', 'Express', 'Node.js'],
    keyTag: 'Canvas',
    year: 2026,
    featured: true,
    links: {
      repo: 'https://github.com/IvanHua2004/Personal-Portfoflio',
    },
    media: {
      src: 'projects/portfolio.mp4',
      type: 'video',
      ratio: '1444 / 720',
      poster: 'projects/portfolio.jpg',
      alt: 'The hero assembling its headings out of particles',
    },
  },
];
