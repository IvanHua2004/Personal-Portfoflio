import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';

import { asyncHandler } from '../middleware/async-handler.js';
import { HttpError } from '../middleware/error-handler.js';
import { sendContactMessage } from '../lib/mailer.js';

export const contactRouter = Router();

const contactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().trim().email('Please provide a valid email address').max(200),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000),
  // Honeypot: bots fill hidden fields, humans leave them empty. Deliberately
  // permissive so a filled value reaches the handler and can be dropped
  // silently, rather than returning a validation error that teaches bots
  // which field gave them away.
  website: z.string().optional(),
});

/** Five submissions per IP per fifteen minutes. */
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many messages sent. Please try again later.' },
});

/** POST /api/contact */
contactRouter.post(
  '/',
  contactLimiter,
  asyncHandler(async (req, res) => {
    const parsed = contactSchema.safeParse(req.body);

    if (!parsed.success) {
      const details = parsed.error.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
      }));
      res.status(400).json({ error: 'Validation failed', details });
      return;
    }

    const { website, ...message } = parsed.data;

    // Silently accept honeypot hits so bots don't learn they were caught.
    if (website && website.trim().length > 0) {
      console.warn('[contact] honeypot triggered, dropping submission');
      res.status(202).json({ ok: true });
      return;
    }

    try {
      await sendContactMessage(message);
    } catch (error) {
      console.error('[contact] send failed', error);
      throw new HttpError(502, 'Could not send your message. Please email me directly.');
    }

    res.status(202).json({ ok: true });
  }),
);
