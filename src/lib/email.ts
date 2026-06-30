import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST;
const smtpPort = Number(process.env.SMTP_PORT || "587");
const smtpUser = process.env.SMTP_USER;
const smtpPass = process.env.SMTP_PASS;
const smtpFrom = process.env.SMTP_FROM || smtpUser;
const smtpSecure = process.env.SMTP_SECURE === "true";

function createTransporter() {
  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error(
      "ERROR: SMTP_HOST, SMTP_USER, and SMTP_PASS harus diset di .env.local untuk mengirim email undangan.",
    );
  }

  return nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });
}

export async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const transporter = createTransporter();

  return transporter.sendMail({
    from: smtpFrom,
    to,
    subject,
    html,
  });
}
