import { Resend } from "resend";

type SendEmailData = {
  to: string;
  subject: string;
  message: string;
  html?: string;
};

type EmailPayload = {
  from: string;
  to: string;
  subject: string;
  text: string;
  html?: string;
};

const resendApiKey = process.env.RESEND_API_KEY;
const emailFrom = process.env.EMAIL_FROM || "Serviu <onboarding@resend.dev>";
const emailTestTo = process.env.EMAIL_TEST_TO;

const resend = resendApiKey ? new Resend(resendApiKey) : null;

export async function sendEmailService(data: SendEmailData) {
  if (!resend) {
    throw new Error("RESEND_API_KEY não configurada no .env");
  }

  if (!data.to) {
    throw new Error("Destinatário do e-mail não informado");
  }

  const finalTo = emailTestTo || data.to;

  console.log("📧 Enviando e-mail");
  console.log("Destinatário real:", data.to);
  console.log("Destinatário final:", finalTo);

  const testTextPrefix = emailTestTo
    ? `[TESTE - destinatário real: ${data.to}]\n\n`
    : "";

  const testHtmlPrefix = emailTestTo
    ? `
      <div style="background:#fff7ed;border:1px solid #fed7aa;color:#9a3412;padding:12px 16px;border-radius:10px;margin-bottom:18px;font-family:Arial,sans-serif;font-size:14px;">
        <strong>Modo teste:</strong> destinatário real seria <strong>${data.to}</strong>.
      </div>
    `
    : "";

  const emailPayload: EmailPayload = {
    from: emailFrom,
    to: finalTo,
    subject: data.subject,
    text: `${testTextPrefix}${data.message}`,
  };

  if (data.html) {
    emailPayload.html = `${testHtmlPrefix}${data.html}`;
  }

  const result = await resend.emails.send(emailPayload);

  if (result.error) {
    throw new Error(result.error.message);
  }

  return result.data;
}