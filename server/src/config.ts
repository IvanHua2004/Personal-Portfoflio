/**
 * Central place for environment-derived settings, so nothing else in the
 * codebase reads process.env directly.
 */
const parseOrigins = (value: string | undefined): string[] =>
  (value ?? 'http://localhost:4200')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const config = {
  port: Number(process.env['PORT'] ?? 3000),
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
  isProduction: process.env['NODE_ENV'] === 'production',
  corsOrigins: parseOrigins(process.env['CORS_ORIGINS']),
  email: {
    apiKey: process.env['RESEND_API_KEY'] ?? '',
    from: process.env['CONTACT_FROM'] ?? 'onboarding@resend.dev',
    to: process.env['CONTACT_TO'] ?? '',
  },
} as const;

/** True when email is fully configured; otherwise the contact route logs. */
export const emailEnabled = Boolean(config.email.apiKey && config.email.to);
