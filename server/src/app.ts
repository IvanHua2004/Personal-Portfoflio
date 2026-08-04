import cors from 'cors';
import express from 'express';

import { config, emailEnabled } from './config.js';
import { errorHandler, notFound } from './middleware/error-handler.js';
import { contactRouter } from './routes/contact.route.js';
import { projectsRouter } from './routes/projects.route.js';

export function createApp() {
  const app = express();

  // Render sits behind a proxy; needed for correct client IPs in rate limiting.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    cors({
      origin(origin, callback) {
        // No Origin header means a non-browser client (curl, Render's health
        // check) — nothing to protect against, so allow it.
        if (!origin || config.corsOrigins.includes(origin)) {
          callback(null, true);
          return;
        }
        // Reject by withholding the CORS headers rather than throwing: the
        // browser blocks the response, and we avoid a 500 + stack trace.
        console.warn(`[cors] blocked origin: ${origin}`);
        callback(null, false);
      },
    }),
  );

  app.use(express.json({ limit: '100kb' }));

  /** Render pings this to check the service is alive. */
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      env: config.nodeEnv,
      emailConfigured: emailEnabled,
      uptime: Math.round(process.uptime()),
    });
  });

  app.use('/api/projects', projectsRouter);
  app.use('/api/contact', contactRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
