import nodemailer from "nodemailer";

// Pluggable mailer. If SMTP_* env vars are set it sends real email; otherwise it
// logs the message (and any link) to the server console so the full flow works
// in development without credentials. To go live, just set the SMTP_* vars —
// no code change required.
//
//   SMTP_HOST   e.g. smtp.gmail.com
//   SMTP_PORT   587 (STARTTLS) or 465 (SSL)
//   SMTP_USER   smtp username (e.g. your Gmail address)
//   SMTP_PASS   smtp password / app password
//   MAIL_FROM   "OctoScore <no-reply@yourdomain.com>" (defaults to SMTP_USER)

let transporter;

function getTransporter() {
  if (transporter !== undefined) return transporter;
  if (!process.env.SMTP_HOST) {
    transporter = null; // no SMTP configured → console fallback
    return transporter;
  }
  const port = Number(process.env.SMTP_PORT) || 587;
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465, // 465 = implicit TLS; 587 = STARTTLS
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

export async function sendMail({ to, subject, html, text }) {
  const t = getTransporter();
  const from = process.env.MAIL_FROM || process.env.SMTP_USER || "OctoScore <no-reply@octoscore.app>";

  if (!t) {
    console.log(
      `\n──────── [mailer] no SMTP configured — email NOT sent ────────\n` +
        `To:      ${to}\nSubject: ${subject}\n\n${text || html}\n` +
        `─────────────────────────────────────────────────────────────\n`
    );
    return { delivered: false, logged: true };
  }

  await t.sendMail({ from, to, subject, html, text });
  return { delivered: true };
}

// Builds the verification email body for a given confirmation URL.
export function verificationEmail(name, url) {
  const subject = "Verify your OctoScore email";
  const text =
    `Hi ${name},\n\n` +
    `Confirm your email address to activate your OctoScore account:\n${url}\n\n` +
    `This link expires in 24 hours. If you didn't create an account, you can ignore this email.`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
    <h2 style="margin:0 0 12px">Welcome to OctoScore, ${escapeHtml(name)}</h2>
    <p style="margin:0 0 20px;line-height:1.5;color:#444">
      Confirm your email address to activate your account.
    </p>
    <p style="margin:0 0 24px">
      <a href="${url}" style="display:inline-block;background:#6236FF;color:#fff;text-decoration:none;
        padding:12px 22px;border-radius:10px;font-weight:bold">Verify my email</a>
    </p>
    <p style="margin:0 0 8px;font-size:12px;color:#888">Or paste this link into your browser:</p>
    <p style="margin:0 0 20px;font-size:12px;word-break:break-all"><a href="${url}">${url}</a></p>
    <p style="margin:0;font-size:12px;color:#aaa">This link expires in 24 hours. If you didn't sign up, ignore this email.</p>
  </div>`;
  return { subject, text, html };
}

// Builds the password-reset email body for a given reset URL.
export function resetPasswordEmail(name, url) {
  const subject = "Reset your OctoScore password";
  const text =
    `Hi ${name},\n\n` +
    `We received a request to reset your OctoScore password. Use the link below to choose a new one:\n${url}\n\n` +
    `This link expires in 1 hour. If you didn't request this, you can safely ignore this email — your password won't change.`;
  const html = `
  <div style="font-family:Arial,Helvetica,sans-serif;max-width:480px;margin:0 auto;padding:24px;color:#111">
    <h2 style="margin:0 0 12px">Reset your password, ${escapeHtml(name)}</h2>
    <p style="margin:0 0 20px;line-height:1.5;color:#444">
      We received a request to reset your OctoScore password. Choose a new one below.
    </p>
    <p style="margin:0 0 24px">
      <a href="${url}" style="display:inline-block;background:#6236FF;color:#fff;text-decoration:none;
        padding:12px 22px;border-radius:10px;font-weight:bold">Reset my password</a>
    </p>
    <p style="margin:0 0 8px;font-size:12px;color:#888">Or paste this link into your browser:</p>
    <p style="margin:0 0 20px;font-size:12px;word-break:break-all"><a href="${url}">${url}</a></p>
    <p style="margin:0;font-size:12px;color:#aaa">This link expires in 1 hour. If you didn't request a reset, ignore this email — your password stays the same.</p>
  </div>`;
  return { subject, text, html };
}

function escapeHtml(s = "") {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
