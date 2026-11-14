import nodemailer from 'nodemailer';
import { db } from './db.ts';

export const DEFAULT_NOTIFY_EMAIL = process.env.NOTIFY_EMAIL || 'cc7279950@gmail.com';

export interface AuthNotifyPayload {
  userId: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  role: string;
  eventType: 'login' | 'register';
  ipAddress: string;
  userAgent: string;
}

export function isMailerConfigured(): { configured: boolean; provider: string; recipient: string } {
  const recipient = process.env.NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL;
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return { configured: true, provider: `SMTP (${process.env.SMTP_HOST})`, recipient };
  }
  const gmailUser = process.env.GMAIL_USER || recipient;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    return { configured: true, provider: `Gmail SMTP (${gmailUser})`, recipient };
  }
  return { configured: false, provider: 'Not configured', recipient };
}

function createTransporter() {
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    const port = Number(process.env.SMTP_PORT || 587);
    return {
      transporter: nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      }),
      from: process.env.SMTP_FROM || `CHAND MOTORS <${process.env.SMTP_USER}>`,
    };
  }

  const gmailUser = process.env.GMAIL_USER || DEFAULT_NOTIFY_EMAIL;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  if (gmailUser && gmailPass) {
    return {
      transporter: nodemailer.createTransport({
        service: 'gmail',
        auth: {
          user: gmailUser,
          pass: gmailPass,
        },
      }),
      from: process.env.SMTP_FROM || `CHAND MOTORS <${gmailUser}>`,
    };
  }

  return null;
}

export async function recordAndNotifySignIn(payload: AuthNotifyPayload): Promise<{
  id: number;
  emailStatus: 'sent' | 'not_configured' | 'failed';
  statusDetail: string;
}> {
  const recipient = process.env.NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL;
  const now = new Date().toISOString();

  const insertResult = db
    .prepare(
      `INSERT INTO signin_notifications (
        user_id, user_name, user_email, user_phone, user_city, event_type,
        ip_address, user_agent, recipient_email, email_status, status_detail, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', 'Dispatching alert...', ?)`,
    )
    .run(
      payload.userId,
      payload.name,
      payload.email,
      payload.phone,
      payload.city,
      payload.eventType,
      payload.ipAddress,
      payload.userAgent.slice(0, 220),
      recipient,
      now,
    );

  const notificationId = Number(insertResult.lastInsertRowid);
  const mailer = createTransporter();

  if (!mailer) {
    const detail =
      'SMTP/Gmail credentials missing. Set GMAIL_USER and GMAIL_APP_PASSWORD (or SMTP_HOST/SMTP_USER/SMTP_PASS) in Secrets to deliver emails.';
    db.prepare('UPDATE signin_notifications SET email_status = ?, status_detail = ? WHERE id = ?').run(
      'not_configured',
      detail,
      notificationId,
    );
    return { id: notificationId, emailStatus: 'not_configured', statusDetail: detail };
  }

  const actionLabel = payload.eventType === 'register' ? 'New Account Registered & Signed In' : 'User Signed In';
  const subject = `[CHAND MOTORS] ${actionLabel}: ${payload.name} (${payload.email})`;

  const textBody = [
    `CHAND MOTORS – Security & Activity Alert`,
    `=========================================`,
    `Event: ${actionLabel}`,
    `Name: ${payload.name}`,
    `Email: ${payload.email}`,
    `Phone: ${payload.phone || 'Not provided'}`,
    `City: ${payload.city || 'Not provided'}`,
    `Role: ${payload.role}`,
    `IP Address: ${payload.ipAddress}`,
    `Device / Browser: ${payload.userAgent}`,
    `Time (UTC): ${now}`,
  ].join('\n');

  const htmlBody = `
    <div style="font-family: Arial, sans-serif; background: #0a0a0b; color: #f4f4f5; padding: 24px;">
      <div style="max-width: 560px; margin: 0 auto; background: #141417; border: 1px solid #27272a; border-radius: 8px; padding: 24px;">
        <p style="color: #d91e2a; font-size: 12px; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; margin: 0 0 8px;">CHAND MOTORS · Sign-In Alert</p>
        <h2 style="margin: 0 0 16px; color: #ffffff; font-size: 20px;">${actionLabel}</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
          <tr><td style="padding: 8px 0; color: #a1a1aa; border-bottom: 1px solid #27272a;">Name</td><td style="padding: 8px 0; color: #ffffff; border-bottom: 1px solid #27272a;">${payload.name}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa; border-bottom: 1px solid #27272a;">Email</td><td style="padding: 8px 0; color: #ffffff; border-bottom: 1px solid #27272a;">${payload.email}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa; border-bottom: 1px solid #27272a;">Phone</td><td style="padding: 8px 0; color: #ffffff; border-bottom: 1px solid #27272a;">${payload.phone || 'Not provided'}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa; border-bottom: 1px solid #27272a;">City</td><td style="padding: 8px 0; color: #ffffff; border-bottom: 1px solid #27272a;">${payload.city || 'Not provided'}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa; border-bottom: 1px solid #27272a;">Role</td><td style="padding: 8px 0; color: #ffffff; border-bottom: 1px solid #27272a;">${payload.role}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa; border-bottom: 1px solid #27272a;">IP Address</td><td style="padding: 8px 0; color: #ffffff; border-bottom: 1px solid #27272a;">${payload.ipAddress}</td></tr>
          <tr><td style="padding: 8px 0; color: #a1a1aa;">Timestamp</td><td style="padding: 8px 0; color: #ffffff;">${now}</td></tr>
        </table>
      </div>
    </div>
  `;

  try {
    const info = await mailer.transporter.sendMail({
      from: mailer.from,
      to: recipient,
      subject,
      text: textBody,
      html: htmlBody,
    });
    const detail = `Email delivered (Message ID: ${info.messageId})`;
    db.prepare('UPDATE signin_notifications SET email_status = ?, status_detail = ? WHERE id = ?').run(
      'sent',
      detail,
      notificationId,
    );
    return { id: notificationId, emailStatus: 'sent', statusDetail: detail };
  } catch (err) {
    const detail = err instanceof Error ? err.message : 'SMTP delivery error';
    db.prepare('UPDATE signin_notifications SET email_status = ?, status_detail = ? WHERE id = ?').run(
      'failed',
      detail,
      notificationId,
    );
    return { id: notificationId, emailStatus: 'failed', statusDetail: detail };
  }
}

export async function sendTestNotificationEmail(): Promise<{
  ok: boolean;
  emailStatus: 'sent' | 'not_configured' | 'failed';
  detail: string;
  recipient: string;
}> {
  const recipient = process.env.NOTIFY_EMAIL || DEFAULT_NOTIFY_EMAIL;
  const mailer = createTransporter();
  if (!mailer) {
    return {
      ok: false,
      emailStatus: 'not_configured',
      recipient,
      detail:
        'SMTP/Gmail credentials are not configured yet. Add GMAIL_USER and GMAIL_APP_PASSWORD (or SMTP_HOST, SMTP_USER, SMTP_PASS) in AI Studio Secrets.',
    };
  }

  try {
    const info = await mailer.transporter.sendMail({
      from: mailer.from,
      to: recipient,
      subject: '[CHAND MOTORS] Test Sign-In Alert Configuration Successful',
      text: `Assalam-o-Alaikum, your CHAND MOTORS sign-in email alert system is active and sending notifications to ${recipient}.`,
    });
    return {
      ok: true,
      emailStatus: 'sent',
      recipient,
      detail: `Test email sent successfully to ${recipient} (Message ID: ${info.messageId}).`,
    };
  } catch (err) {
    return {
      ok: false,
      emailStatus: 'failed',
      recipient,
      detail: err instanceof Error ? err.message : 'Failed to send test email.',
    };
  }
}
