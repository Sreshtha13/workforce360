import nodemailer from "nodemailer";
import { env } from "./env";

export type SendEmailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);
}

/**
 * Sends an email via SMTP (nodemailer) when configured.
 * Otherwise logs to console (dev / test fallback).
 */
export async function sendEmail(input: SendEmailInput): Promise<{ sent: boolean; mode: "smtp" | "console" }> {
  const from = env.SMTP_FROM ?? "noreply@workforce360.local";
  const text = input.text ?? (input.html ? input.html.replace(/<[^>]+>/g, " ") : "");

  if (!isSmtpConfigured()) {
    console.info("[email:console]", {
      to: input.to,
      from,
      subject: input.subject,
      text: text.slice(0, 500),
    });
    return { sent: false, mode: "console" };
  }

  const transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: (env.SMTP_PORT ?? 587) === 465,
    auth: env.SMTP_USER
      ? {
          user: env.SMTP_USER,
          pass: env.SMTP_PASS,
        }
      : undefined,
  });

  await transporter.sendMail({
    from,
    to: input.to,
    subject: input.subject,
    text,
    html: input.html,
  });

  return { sent: true, mode: "smtp" };
}
