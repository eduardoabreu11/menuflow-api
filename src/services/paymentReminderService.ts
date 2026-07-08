import {
  createPaymentReminderIfNotExists,
  listPaymentsReadyForReminders,
  markPaymentReminderAsFailed,
  markPaymentReminderAsSent,
  type PaymentReadyForReminder,
  type PaymentReminderChannel,
  type PaymentReminderType,
} from "../repositories/paymentReminderRepository.js";

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
  const cleanDate = date.split("T")[0];

  if (!cleanDate) {
    return date;
  }

  const [year, month, day] = cleanDate.split("-");

  if (!year || !month || !day) {
    return date;
  }

  return `${day}/${month}/${year}`;
}

function getPaymentInvoiceUrl(payment: PaymentReadyForReminder) {
  return payment.gateway_invoice_url ?? payment.gateway_payment_url ?? "";
}

function getReminderType(payment: PaymentReadyForReminder): PaymentReminderType {
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

function buildEmailMessage(
  payment: PaymentReadyForReminder,
  reminderType: PaymentReminderType,
): ReminderMessage {
  const invoiceUrl = getPaymentInvoiceUrl(payment);
  const amount = formatCurrency(payment.amount);
  const dueDate = formatDate(payment.due_date);
  const ownerName = payment.owner_name || "cliente";

  if (reminderType === "BEFORE_DUE") {
    return {
      subject: `Sua mensalidade Serviu vence em ${payment.days_until_due} dia(s)`,
      message: [
        `Olá, ${ownerName}.`,
        "",
        `Sua mensalidade do plano ${payment.plan_name} vence em ${payment.days_until_due} dia(s).`,
        `Valor: ${amount}`,
        `Vencimento: ${dueDate}`,
        "",
        invoiceUrl ? `Link de pagamento: ${invoiceUrl}` : "",
        "",
        "Evite atraso para manter seu cardápio digital ativo.",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (reminderType === "DUE_TODAY") {
    return {
      subject: "Sua mensalidade Serviu vence hoje",
      message: [
        `Olá, ${ownerName}.`,
        "",
        `Sua mensalidade do plano ${payment.plan_name} vence hoje.`,
        `Valor: ${amount}`,
        `Vencimento: ${dueDate}`,
        "",
        invoiceUrl ? `Link de pagamento: ${invoiceUrl}` : "",
        "",
        "Após a confirmação do pagamento, seu acesso permanece ativo normalmente.",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  if (reminderType === "OVERDUE") {
    const daysLate = Math.abs(payment.days_until_due);

    return {
      subject: `Sua mensalidade Serviu está vencida há ${daysLate} dia(s)`,
      message: [
        `Olá, ${ownerName}.`,
        "",
        `Identificamos que sua mensalidade do plano ${payment.plan_name} está vencida há ${daysLate} dia(s).`,
        `Valor: ${amount}`,
        `Vencimento: ${dueDate}`,
        "",
        invoiceUrl ? `Link de pagamento: ${invoiceUrl}` : "",
        "",
        "Regularize para evitar o bloqueio do seu cardápio digital.",
      ]
        .filter(Boolean)
        .join("\n"),
    };
  }

  return {
    subject: "Seu acesso ao Serviu está bloqueado por atraso",
    message: [
      `Olá, ${ownerName}.`,
      "",
      `Sua mensalidade do plano ${payment.plan_name} está vencida desde ${dueDate}.`,
      `Valor: ${amount}`,
      "",
      "Seu acesso pode ficar bloqueado até a confirmação do pagamento.",
      invoiceUrl ? `Link de pagamento: ${invoiceUrl}` : "",
      "",
      "Após o pagamento, o sistema libera automaticamente pelo webhook do Asaas.",
    ]
      .filter(Boolean)
      .join("\n"),
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
}) {
  // Simulação por enquanto.
  // Depois conectamos aqui no provedor real:
  // EMAIL: SMTP, Resend, SendGrid, Amazon SES etc.
  // WHATSAPP: Z-API, Evolution API, Twilio, Meta Cloud API etc.
  console.log(
    [
      `📨 Lembrete ${data.channel} simulado.`,
      `Para: ${data.recipient}`,
      `Assunto: ${data.subject}`,
      `Mensagem: ${data.message}`,
    ].join("\n"),
  );
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
        await sendReminderMessage({
          channel,
          recipient,
          subject: reminderMessage.subject,
          message: reminderMessage.message,
        });

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