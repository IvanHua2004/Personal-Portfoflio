import { createApp } from './app.js';
import { config, emailEnabled } from './config.js';

const app = createApp();

const server = app.listen(config.port, () => {
  console.log(`[server] listening on port ${config.port} (${config.nodeEnv})`);
  console.log(`[server] allowed origins: ${config.corsOrigins.join(', ')}`);
  if (!emailEnabled) {
    console.warn(
      '[server] RESEND_API_KEY/CONTACT_TO not set — contact messages will be logged, not emailed.',
    );
  }
});

const shutdown = (signal: string) => {
  console.log(`[server] ${signal} received, shutting down`);
  server.close(() => process.exit(0));
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
