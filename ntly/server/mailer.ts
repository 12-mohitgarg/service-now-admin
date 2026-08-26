import nodemailer from "nodemailer";

function getMailFrom() {
  return process.env.MAIL_FROM || '"InternMitra" <info@internmitra.com>';
}

function createTransporter() {
  const host = process.env.SMTP_HOST || process.env.MAIL_HOST || "smtp.gmail.com";
  const port = Number(process.env.SMTP_PORT || process.env.MAIL_PORT || 465);
  const user = process.env.SMTP_USER || process.env.MAIL_USER;
  const pass = process.env.SMTP_PASS || process.env.MAIL_PASS;

  if (!user || !pass) {
    throw new Error("Email SMTP credentials are not configured");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
}

async function sendWithResend({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: string;
    encoding?: string;
  }[];
}) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getMailFrom(),
      to: [to],
      subject,
      html,
      attachments: attachments?.map((att) => ({
        filename: att.filename,
        content: att.content,
      })),
    }),
  });

  const result = await response.json().catch(() => null);

  if (!response.ok) {
    throw new Error(result?.message || result?.error || "Resend email failed");
  }

  return { messageId: result?.id || null, provider: "resend" };
}

export async function sendEmail({
  to,
  subject,
  html,
  attachments,
}: {
  to: string;
  subject: string;
  html: string;
  attachments?: {
    filename: string;
    content: string; // base64 string
    encoding?: string;
  }[];
}) {
  if (process.env.RESEND_API_KEY) {
    return sendWithResend({ to, subject, html, attachments });
  }

  const transporter = createTransporter();
  const mailOptions = {
    from: getMailFrom(),
    to,
    subject,
    html,
    attachments: attachments?.map((att) => ({
      filename: att.filename,
      content: att.content,
      encoding: "base64",
    })),
  };

  return transporter.sendMail(mailOptions);
}
