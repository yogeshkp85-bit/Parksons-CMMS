/**
 * email.service.ts
 * Nodemailer-based email service for Parksons CMMS.
 *
 * Supports Gmail SMTP with App Password (recommended for handover).
 * Company can swap to their own SMTP by changing .env values only.
 *
 * Required .env variables:
 *   SMTP_HOST      e.g. smtp.gmail.com
 *   SMTP_PORT      e.g. 587
 *   SMTP_USER      e.g. yogeshkp85@gmail.com
 *   SMTP_PASS      Gmail App Password (16 chars, no spaces)
 *   REPORT_EMAILS  Comma-separated: yogeshkp85@gmail.com,engg.cn@parksonspackaging.com
 */

import nodemailer from 'nodemailer';
import logger from '../utils/logger';

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: false,           // true for port 465, false for 587 (STARTTLS)
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export interface EmailPayload {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

/** Send a single email. Returns true on success, false on failure. */
export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    logger.warn('[EmailService] SMTP_USER or SMTP_PASS not set — email not sent');
    return false;
  }

  try {
    const transporter = createTransporter();
    const toAddresses = Array.isArray(payload.to)
      ? payload.to.join(', ')
      : payload.to;

    await transporter.sendMail({
      from: `"Parksons CMMS" <${process.env.SMTP_USER}>`,
      to: toAddresses,
      subject: payload.subject,
      html: payload.html,
      text: payload.text,
    });

    logger.info(`[EmailService] Email sent to: ${toAddresses} | Subject: ${payload.subject}`);
    return true;
  } catch (err: any) {
    logger.error('[EmailService] Failed to send email:', err.message);
    return false;
  }
}

/** Returns the configured recipient list from REPORT_EMAILS env var */
export function getReportRecipients(): string[] {
  const raw = process.env.REPORT_EMAILS || 'yogeshkp85@gmail.com,engg.cn@parksonspackaging.com';
  return raw.split(',').map((e) => e.trim()).filter(Boolean);
}
