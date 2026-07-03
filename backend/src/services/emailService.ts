import nodemailer, { Transporter } from "nodemailer";

let transporter: Transporter | null = null;
let useEthereal = false;

const getTransporter = async (): Promise<Transporter> => {
  if (transporter) return transporter;

  if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: parseInt(process.env.EMAIL_PORT || "587", 10) || 587,
      secure: process.env.EMAIL_SECURE === "true",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    useEthereal = false;
  } else {
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: "smtp.ethereal.email",
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    useEthereal = true;
    console.log("[EMAIL] Using Ethereal preview account:", testAccount.user);
    console.log("[EMAIL] Preview messages at https://ethereal.email/messages");
  }

  return transporter;
};

const logPreviewUrl = (info: unknown) => {
  if (useEthereal) {
    const url = nodemailer.getTestMessageUrl(
      info as Parameters<typeof nodemailer.getTestMessageUrl>[0]
    );
    if (url) {
      console.log("[EMAIL PREVIEW] View message at:", url);
    }
  }
};

const sendComplaintStatusUpdate = async (
  resident: { email: string; name: string },
  complaint: { id: number; title: string; category: string },
  newStatus: string,
  note?: string
) => {
  try {
    const t = await getTransporter();
    const info = await t.sendMail({
      from:
        process.env.EMAIL_FROM || "Society Maintenance <noreply@society.com>",
      to: resident.email,
      subject: `Complaint #${complaint.id} Status Update: ${newStatus}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563eb">Society Maintenance Tracker</h2>
          <p>Dear ${resident.name},</p>
          <p>Your complaint <strong>#${complaint.id} - ${complaint.title}</strong> has been updated.</p>
          <table style="border-collapse:collapse;width:100%">
            <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc"><strong>Status</strong></td>
                <td style="padding:8px;border:1px solid #e2e8f0">${newStatus}</td></tr>
            <tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc"><strong>Category</strong></td>
                <td style="padding:8px;border:1px solid #e2e8f0">${complaint.category}</td></tr>
            ${
              note
                ? `<tr><td style="padding:8px;border:1px solid #e2e8f0;background:#f8fafc"><strong>Note</strong></td>
                <td style="padding:8px;border:1px solid #e2e8f0">${note}</td></tr>`
                : ""
            }
          </table>
          <p style="color:#64748b;font-size:12px;margin-top:24px">Society Maintenance Tracker</p>
        </div>
      `,
    });
    logPreviewUrl(info);
  } catch (err: unknown) {
    console.error(
      "Email send error:",
      err instanceof Error ? err.message : err
    );
  }
};

const sendImportantNotice = async (
  residents: { email: string }[],
  notice: { title: string; content: string }
) => {
  try {
    if (!residents.length) return;

    const t = await getTransporter();
    const info = await t.sendMail({
      from:
        process.env.EMAIL_FROM || "Society Maintenance <noreply@society.com>",
      to: process.env.EMAIL_FROM || "Society Maintenance <noreply@society.com>",
      bcc: residents.map((r) => r.email).join(","),
      subject: `📢 Important Notice: ${notice.title}`,
      html: `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto">
          <h2 style="color:#2563eb">Society Maintenance Tracker</h2>
          <div style="background:#fef3c7;border:1px solid #f59e0b;border-radius:8px;padding:16px;margin:16px 0">
            <h3 style="margin:0 0 8px;color:#92400e">📢 Important Notice</h3>
            <h4 style="margin:0 0 12px">${notice.title}</h4>
            <p style="margin:0">${notice.content}</p>
          </div>
          <p style="color:#64748b;font-size:12px;margin-top:24px">Society Maintenance Tracker</p>
        </div>
      `,
    });
    logPreviewUrl(info);
  } catch (err: unknown) {
    console.error(
      "Email send error:",
      err instanceof Error ? err.message : err
    );
  }
};

export { sendComplaintStatusUpdate, sendImportantNotice };
