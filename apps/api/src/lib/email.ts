import nodemailer from "nodemailer";
import { env } from "./env";

export type SendEmailInput = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

export type SendEmailResult = {
  sent: boolean;
  mode: "resend" | "smtp" | "console";
};

function emailFromAddress(): string {
  return env.SMTP_FROM ?? "noreply@workforce360.local";
}

function isSmtpConfigured(): boolean {
  return Boolean(env.SMTP_HOST && env.SMTP_PORT && env.SMTP_FROM);
}

function isResendConfigured(): boolean {
  return Boolean(env.RESEND_API_KEY && env.SMTP_FROM);
}

/**
 * Sends email via Resend API, SMTP (nodemailer), or console fallback.
 * Resend is preferred when RESEND_API_KEY is set; SMTP is the secondary option.
 */
export async function sendEmail(input: SendEmailInput): Promise<SendEmailResult> {
  const from = emailFromAddress();
  const text = input.text ?? (input.html ? input.html.replace(/<[^>]+>/g, " ") : "");

  if (isResendConfigured()) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Resend error ${response.status}: ${body.slice(0, 200)}`);
    }

    return { sent: true, mode: "resend" };
  }

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
