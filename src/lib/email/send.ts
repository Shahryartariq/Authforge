import { appendFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { Resend } from "resend";
import { env } from "@/lib/env";

type Email = { to: string; subject: string; html: string; text: string };

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null;

/**
 * Sends a transactional email through Resend.
 * Without RESEND_API_KEY (local dev), the email is printed to the console
 * so every flow still works end to end. The browser tests set
 * EMAIL_OUTBOX_FILE to collect emails in a file instead.
 */
export async function sendEmail({ to, subject, html, text }: Email) {
  if (!resend) {
    if (env.EMAIL_OUTBOX_FILE) {
      await mkdir(dirname(env.EMAIL_OUTBOX_FILE), { recursive: true });
      await appendFile(env.EMAIL_OUTBOX_FILE, `${JSON.stringify({ to, subject, text })}\n`);
      return;
    }
    if (env.NODE_ENV === "production") {
      console.error(`[email] RESEND_API_KEY is not set; "${subject}" to ${to} was not sent.`);
      return;
    }
    console.info(`\n[email] To: ${to}\n[email] Subject: ${subject}\n${text}\n`);
    return;
  }

  const { error } = await resend.emails.send({ from: env.EMAIL_FROM, to, subject, html, text });
  if (error) {
    console.error("[email] Resend error:", error);
    throw new Error("Could not send email. Please try again.");
  }
}
