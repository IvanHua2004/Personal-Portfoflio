import { Router } from 'express';

import { asyncHandler } from '../middleware/async-handler.js';
import { HttpError } from '../middleware/error-handler.js';
import { findProject, loadProjects } from '../lib/project-store.js';

export const projectsRouter = Router();

/** GET /api/projects?tag=Angular&featured=true */
projectsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    let projects = await loadProjects();

    const tag = req.query['tag'];
    if (typeof tag === 'string' && tag.length > 0) {
      projects = projects.filter((project) => project.tags.includes(tag));
    }

    if (req.query['featured'] === 'true') {
      projects = projects.filter((project) => project.featured);
    }

    res.json(projects);
  }),
);

/** GET /api/projects/:slug */
projectsRouter.get(
  '/:slug',
  asyncHandler(async (req, res) => {
    const project = await findProject(req.params.slug);

    if (!project) {
      throw new HttpError(404, 'Project not found');
    }

    res.json(project);
  }),
);
