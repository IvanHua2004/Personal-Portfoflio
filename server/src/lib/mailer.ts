import { Resend } from 'resend';

import { config, emailEnabled } from '../config.js';

export interface ContactMessage {
  name: string;
  email: string;
  message: string;
}

const resend = emailEnabled ? new Resend(config.email.apiKey) : null;

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/**
 * Sends a contact form submission by email.
 *
 * If RESEND_API_KEY / CONTACT_TO aren't set, the message is logged instead so
 * the endpoint still works in local development. Set both in Render's
 * Environment tab to switch delivery on — no code change needed.
 */
export async function sendContactMessage(payload: ContactMessage): Promise<void> {
  if (!resend) {
    console.log('[contact] email not configured, logging instead:', payload);
    return;
  }

  const { error } = await resend.emails.send({
    from: config.email.from,
    to: config.email.to,
    replyTo: payload.email,
    subject: `Portfolio contact from ${payload.name}`,
    text: `From: ${payload.name} <${payload.email}>\n\n${payload.message}`,
    html: `
      <p><strong>From:</strong> ${escapeHtml(payload.name)}
        &lt;${escapeHtml(payload.email)}&gt;</p>
      <hr />
      <p style="white-space: pre-wrap">${escapeHtml(payload.message)}</p>
    `,
  });

  if (error) {
    throw new Error(`Resend rejected the message: ${error.message}`);
  }
}
