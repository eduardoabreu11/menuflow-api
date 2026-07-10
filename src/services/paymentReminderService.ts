import {
  createPaymentReminderIfNotExists,
  listPaymentsReadyForReminders,
  markPaymentReminderAsFailed,
  markPaymentReminderAsSent,
  listPaymentRemindersRepository,
  type PaymentReadyForReminder,
  type PaymentReminderChannel,
  type PaymentReminderType,
} from "../repositories/paymentReminderRepository.js";

import { sendEmailService } from "./emailService.js";

const DEFAULT_REMINDER_DAYS_BEFORE_DUE = 10;
const DEFAULT_REMINDER_DAYS_AFTER_DUE = 30;

type SendPaymentRemindersOptions = {
  days_before_due?: number | undefined;
  days_after_due?: number | undefined;
  channels?: PaymentReminderChannel[] | undefined;
};

type ReminderMessage = {
  subject: string;
  message: string;
  html?: string;
};

function getNumberFromEnv(envName: string, fallback: number) {
  const rawValue = process.env[envName];

  if (!rawValue) {
    return fallback;
  }

  const parsedValue = Number(rawValue);

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return fallback;
  }

  return Math.floor(parsedValue);
}

function getDefaultReminderDaysBeforeDue() {
  return getNumberFromEnv(
    "BILLING_REMINDER_DAYS_BEFORE_DUE",
    DEFAULT_REMINDER_DAYS_BEFORE_DUE,
  );
}

function getDefaultReminderDaysAfterDue() {
  return getNumberFromEnv(
    "BILLING_REMINDER_DAYS_AFTER_DUE",
    DEFAULT_REMINDER_DAYS_AFTER_DUE,
  );
}

function getEnabledReminderChannels(): PaymentReminderChannel[] {
  const rawChannels = process.env.BILLING_REMINDER_CHANNELS ?? "EMAIL,WHATSAPP";

  const channels = rawChannels
    .split(",")
    .map((channel) => channel.trim().toUpperCase())
    .filter(Boolean);

  const validChannels = channels.filter(
    (channel): channel is PaymentReminderChannel =>
      channel === "EMAIL" || channel === "WHATSAPP",
  );

  if (validChannels.length === 0) {
    return ["EMAIL", "WHATSAPP"];
  }

  return validChannels;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function formatDate(date: string) {
  const parts = date.split("T");
  const cleanDate = parts[0];

  if (!cleanDate) {
    return date;
  }

  const dateParts = cleanDate.split("-");
  const year = dateParts[0];
  const month = dateParts[1];
  const day = dateParts[2];

  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

function getPaymentInvoiceUrl(payment: PaymentReadyForReminder) {
  return payment.gateway_invoice_url ?? payment.gateway_payment_url ?? "";
}

function getReminderType(
  payment: PaymentReadyForReminder,
): PaymentReminderType {
  if (payment.days_until_due > 0) {
    return "BEFORE_DUE";
  }

  if (payment.days_until_due === 0) {
    return "DUE_TODAY";
  }

  if (payment.days_until_due <= -3) {
    return "BLOCKED";
  }

  return "OVERDUE";
}

function getRecipient(
  payment: PaymentReadyForReminder,
  channel: PaymentReminderChannel,
) {
  if (channel === "EMAIL") {
    return payment.owner_email;
  }

  return payment.owner_whatsapp;
}

function escapeHtml(value: string | number) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export async function listPaymentRemindersService() {
  return listPaymentRemindersRepository();
}

function buildEmailHtml(data: {
  title: string;
  ownerName: string;
  description: string;
  amount: string;
  dueDate: string;
  invoiceUrl: string;
  footerMessage: string;
}) {
  const title = escapeHtml(data.title);
  const ownerName = escapeHtml(data.ownerName);
  const description = escapeHtml(data.description);
  const amount = escapeHtml(data.amount);
  const dueDate = escapeHtml(data.dueDate);
  const footerMessage = escapeHtml(data.footerMessage);

  const safeInvoiceUrl =
    data.invoiceUrl && /^https?:\/\//i.test(data.invoiceUrl)
      ? escapeHtml(data.invoiceUrl)
      : "";

  const paymentButton = safeInvoiceUrl
    ? `
      <a href="${safeInvoiceUrl}" target="_blank"
        style="display:inline-block;background:#16a34a;color:#ffffff;text-decoration:none;padding:14px 22px;border-radius:10px;font-weight:700;font-size:15px;margin-top:16px;">
        Pagar agora
      </a>
    `
    : "";

  const invoiceLink = safeInvoiceUrl
    ? `
      <p style="font-size:13px;color:#64748b;margin-top:18px;word-break:break-all;">
        Link de pagamento:<br />
        <a href="${safeInvoiceUrl}" target="_blank" style="color:#16a34a;">${safeInvoiceUrl}</a>
      </p>
    `
    : "";

  return `
    <div style="margin:0;padding:0;background:#f8fafc;font-family:Arial,sans-serif;color:#0f172a;">
      <div style="max-width:620px;margin:0 auto;padding:32px 16px;">
        <div style="background:#ffffff;border-radius:18px;padding:28px;border:1px solid #e2e8f0;">
          <div style="margin-bottom:24px;">
            <div style="font-size:22px;font-weight:800;color:#16a34a;">Serviu</div>
            <div style="font-size:13px;color:#64748b;">Gestão de cardápio digital</div>
          </div>

          <h1 style="font-size:24px;line-height:1.3;margin:0 0 12px;color:#0f172a;">
            ${title}
          </h1>

          <p style="font-size:16px;line-height:1.6;margin:0 0 18px;color:#334155;">
            Olá, <strong>${ownerName}</strong>.
          </p>

          <p style="font-size:15px;line-height:1.6;margin:0 0 22px;color:#334155;">
            ${description}
          </p>

          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:18px;margin:22px 0;">
            <p style="margin:0 0 8px;font-size:14px;color:#64748b;">Valor</p>
            <p style="margin:0 0 16px;font-size:24px;font-weight:800;color:#0f172a;">${amount}</p>

            <p style="margin:0 0 8px;font-size:14px;color:#64748b;">Vencimento</p>
            <p style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${dueDate}</p>
          </div>

          ${paymentButton}

          ${invoiceLink}

          <p style="font-size:14px;line-height:1.6;color:#64748b;margin-top:28px;">
            ${footerMessage}
          </p>
        </div>

        <p style="text-align:center;font-size:12px;color:#94a3b8;margin-top:18px;">
          Este é um aviso automático do Serviu.
        </p>
      </div>
    </div>
  `;
}

function buildEmailMessage(
  payment: PaymentReadyForReminder,
  reminderType: PaymentReminderType,
): ReminderMessage {
  const invoiceUrl = getPaymentInvoiceUrl(payment);
  const amount = formatCurrency(payment.amount);
  const dueDate = formatDate(payment.due_date);
  const ownerName = payment.owner_name || "cliente";
  const planName = payment.plan_name || "Serviu";

  if (reminderType === "BEFORE_DUE") {
    const title = `Sua mensalidade vence em ${payment.days_until_due} dia(s)`;
    const description = `Sua mensalidade do plano ${planName} vence em ${payment.days_until_due} dia(s).`;
    const footerMessage =
      "Evite atraso para manter seu cardápio digital ativo.";

    return {
      subject: `Sua mensalidade Serviu vence em ${payment.days_until_due} dia(s)`,
      message: [
        `Olá, ${ownerName}.`,
        "",
        description,
        `Valor: ${amount}`,
        `Vencimento: ${dueDate}`,
        "",
        invoiceUrl ? `Link de pagamento: ${invoiceUrl}` : "",
        "",
        footerMessage,
      ]
        .filter(Boolean)
        .join("\n"),
      html: buildEmailHtml({
        title,
        ownerName,
        description,
        amount,
        dueDate,
        invoiceUrl,
        footerMessage,
      }),
    };
  }

  if (reminderType === "DUE_TODAY") {
    const title = "Sua mensalidade vence hoje";
    const description = `Sua mensalidade do plano ${planName} vence hoje.`;
    const footerMessage =
      "Após a confirmação do pagamento, seu acesso permanece ativo normalmente.";

    return {
      subject: "Sua mensalidade Serviu vence hoje",
      message: [
        `Olá, ${ownerName}.`,
        "",
        description,
        `Valor: ${amount}`,
        `Vencimento: ${dueDate}`,
        "",
        invoiceUrl ? `Link de pagamento: ${invoiceUrl}` : "",
        "",
        footerMessage,
      ]
        .filter(Boolean)
        .join("\n"),
      html: buildEmailHtml({
        title,
        ownerName,
        description,
        amount,
        dueDate,
        invoiceUrl,
        footerMessage,
      }),
    };
  }

  if (reminderType === "OVERDUE") {
    const daysLate = Math.abs(payment.days_until_due);
    const title = `Sua mensalidade está vencida há ${daysLate} dia(s)`;
    const description = `Identificamos que sua mensalidade do plano ${planName} está vencida há ${daysLate} dia(s).`;
    const footerMessage =
      "Regularize para evitar o bloqueio do seu cardápio digital.";

    return {
      subject: `Sua mensalidade Serviu está vencida há ${daysLate} dia(s)`,
      message: [
        `Olá, ${ownerName}.`,
        "",
        description,
        `Valor: ${amount}`,
        `Vencimento: ${dueDate}`,
        "",
        invoiceUrl ? `Link de pagamento: ${invoiceUrl}` : "",
        "",
        footerMessage,
      ]
        .filter(Boolean)
        .join("\n"),
      html: buildEmailHtml({
        title,
        ownerName,
        description,
        amount,
        dueDate,
        invoiceUrl,
        footerMessage,
      }),
    };
  }

  const title = "Seu acesso está bloqueado por atraso";
  const description = `Sua mensalidade do plano ${planName} está vencida desde ${dueDate}.`;
  const footerMessage =
    "Após o pagamento, o sistema libera automaticamente pelo webhook do Asaas.";

  return {
    subject: "Seu acesso ao Serviu está bloqueado por atraso",
    message: [
      `Olá, ${ownerName}.`,
      "",
      description,
      `Valor: ${amount}`,
      "",
      "Seu acesso pode ficar bloqueado até a confirmação do pagamento.",
      invoiceUrl ? `Link de pagamento: ${invoiceUrl}` : "",
      "",
      footerMessage,
    ]
      .filter(Boolean)
      .join("\n"),
    html: buildEmailHtml({
      title,
      ownerName,
      description,
      amount,
      dueDate,
      invoiceUrl,
      footerMessage,
    }),
  };
}

function buildWhatsappMessage(
  payment: PaymentReadyForReminder,
  reminderType: PaymentReminderType,
): ReminderMessage {
  const emailMessage = buildEmailMessage(payment, reminderType);

  return {
    subject: emailMessage.subject,
    message: emailMessage.message.replace(/\n\n/g, "\n"),
  };
}

function buildReminderMessage(
  payment: PaymentReadyForReminder,
  channel: PaymentReminderChannel,
  reminderType: PaymentReminderType,
) {
  if (channel === "WHATSAPP") {
    return buildWhatsappMessage(payment, reminderType);
  }

  return buildEmailMessage(payment, reminderType);
}

async function sendReminderMessage(data: {
  channel: PaymentReminderChannel;
  recipient: string;
  subject: string;
  message: string;
  html?: string;
}) {
  if (data.channel === "EMAIL") {
    const emailData: {
      to: string;
      subject: string;
      message: string;
      html?: string;
    } = {
      to: data.recipient,
      subject: data.subject,
      message: data.message,
    };

    if (data.html) {
      emailData.html = data.html;
    }

    await sendEmailService(emailData);

    console.log("📨 Lembrete EMAIL enviado pelo Resend.");
    console.log("Para:", data.recipient);
    console.log("Assunto:", data.subject);

    return;
  }

  console.log("📱 Lembrete WHATSAPP simulado.");
  console.log("Para:", data.recipient);
  console.log("Mensagem:", data.message);
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Erro desconhecido ao enviar lembrete";
}

export async function sendPaymentRemindersService(
  options: SendPaymentRemindersOptions = {},
) {
  const daysBeforeDue =
    options.days_before_due ?? getDefaultReminderDaysBeforeDue();

  const daysAfterDue =
    options.days_after_due ?? getDefaultReminderDaysAfterDue();

  const channels = options.channels ?? getEnabledReminderChannels();

  const payments = await listPaymentsReadyForReminders({
    days_before_due: daysBeforeDue,
    days_after_due: daysAfterDue,
  });

  let createdCount = 0;
  let sentCount = 0;
  let failedCount = 0;
  let duplicateCount = 0;
  let skippedWithoutRecipientCount = 0;

  const summaries: Array<{
    payment_id: string;
    owner_user_id: string;
    owner_name: string;
    channel: PaymentReminderChannel;
    reminder_type: PaymentReminderType;
    status: "SENT" | "FAILED" | "DUPLICATED" | "SKIPPED";
    reason?: string;
  }> = [];

  for (const payment of payments) {
    const reminderType = getReminderType(payment);

    for (const channel of channels) {
      const recipient = getRecipient(payment, channel);

      if (!recipient) {
        skippedWithoutRecipientCount++;

        summaries.push({
          payment_id: payment.payment_id,
          owner_user_id: payment.owner_user_id,
          owner_name: payment.owner_name,
          channel,
          reminder_type: reminderType,
          status: "SKIPPED",
          reason: `Cliente sem destinatário para ${channel}`,
        });

        continue;
      }

      const reminderMessage = buildReminderMessage(
        payment,
        channel,
        reminderType,
      );

      const reminder = await createPaymentReminderIfNotExists({
        payment_id: payment.payment_id,
        owner_user_id: payment.owner_user_id,
        channel,
        reminder_type: reminderType,
        recipient,
        subject: reminderMessage.subject,
        message: reminderMessage.message,
        status: "PENDING",
        metadata: {
          amount: payment.amount,
          due_date: payment.due_date,
          days_until_due: payment.days_until_due,
          plan_name: payment.plan_name,
          gateway_invoice_url: payment.gateway_invoice_url,
          gateway_payment_url: payment.gateway_payment_url,
        },
      });

      if (!reminder) {
        duplicateCount++;

        summaries.push({
          payment_id: payment.payment_id,
          owner_user_id: payment.owner_user_id,
          owner_name: payment.owner_name,
          channel,
          reminder_type: reminderType,
          status: "DUPLICATED",
          reason: "Lembrete já registrado hoje para esta fatura/canal/tipo",
        });

        continue;
      }

      createdCount++;

      try {
        const sendData: {
          channel: PaymentReminderChannel;
          recipient: string;
          subject: string;
          message: string;
          html?: string;
        } = {
          channel,
          recipient,
          subject: reminderMessage.subject,
          message: reminderMessage.message,
        };

        if (reminderMessage.html) {
          sendData.html = reminderMessage.html;
        }

        await sendReminderMessage(sendData);

        await markPaymentReminderAsSent(reminder.id);

        sentCount++;

        summaries.push({
          payment_id: payment.payment_id,
          owner_user_id: payment.owner_user_id,
          owner_name: payment.owner_name,
          channel,
          reminder_type: reminderType,
          status: "SENT",
        });
      } catch (error) {
        const errorMessage = getErrorMessage(error);

        await markPaymentReminderAsFailed(reminder.id, errorMessage);

        failedCount++;

        summaries.push({
          payment_id: payment.payment_id,
          owner_user_id: payment.owner_user_id,
          owner_name: payment.owner_name,
          channel,
          reminder_type: reminderType,
          status: "FAILED",
          reason: errorMessage,
        });
      }
    }
  }

  return {
    days_before_due: daysBeforeDue,
    days_after_due: daysAfterDue,
    channels,
    payments_checked: payments.length,
    reminders_created: createdCount,
    reminders_sent: sentCount,
    reminders_failed: failedCount,
    reminders_duplicated: duplicateCount,
    reminders_skipped_without_recipient: skippedWithoutRecipientCount,
    summaries,
  };
}
