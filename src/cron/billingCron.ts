import * as cron from "node-cron";

import { blockOverdueSubscriptionsService } from "../services/billingAccessService.js";
import { generateMonthlyPaymentsService } from "../services/paymentService.js";
import { sendPaymentRemindersService } from "../services/paymentReminderService.js";

const DEFAULT_TIMEZONE = "America/Sao_Paulo";
const DEFAULT_CREATE_IN_ADVANCE_DAYS = 10;
const DEFAULT_BLOCK_AFTER_DUE_DAYS = 3;
const DEFAULT_REMINDER_DAYS_BEFORE_DUE = 10;
const DEFAULT_REMINDER_DAYS_AFTER_DUE = 30;

let cronStarted = false;
let isGenerateBillingJobRunning = false;
let isBlockOverdueJobRunning = false;
let isPaymentRemindersJobRunning = false;

function getBillingTimezone() {
  return process.env.BILLING_CRON_TIMEZONE || DEFAULT_TIMEZONE;
}

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

function getDatePartsInTimeZone(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const year = parts.find((part) => part.type === "year")?.value;
  const month = parts.find((part) => part.type === "month")?.value;
  const day = parts.find((part) => part.type === "day")?.value;

  if (!year || !month || !day) {
    throw new Error("Não foi possível calcular a data do cron financeiro");
  }

  return {
    year,
    month,
    day,
  };
}

function formatDateInTimeZone(date: Date, timeZone: string) {
  const { year, month, day } = getDatePartsInTimeZone(date, timeZone);

  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);

  nextDate.setDate(nextDate.getDate() + days);

  return nextDate;
}

function getBillingUpToDate() {
  const timeZone = getBillingTimezone();

  const createInAdvanceDays = getNumberFromEnv(
    "BILLING_CREATE_IN_ADVANCE_DAYS",
    DEFAULT_CREATE_IN_ADVANCE_DAYS,
  );

  const targetDate = addDays(new Date(), createInAdvanceDays);

  return formatDateInTimeZone(targetDate, timeZone);
}

function getBlockAfterDueDays() {
  return getNumberFromEnv(
    "BILLING_BLOCK_AFTER_DUE_DAYS",
    DEFAULT_BLOCK_AFTER_DUE_DAYS,
  );
}

function getReminderDaysBeforeDue() {
  return getNumberFromEnv(
    "BILLING_REMINDER_DAYS_BEFORE_DUE",
    DEFAULT_REMINDER_DAYS_BEFORE_DUE,
  );
}

function getReminderDaysAfterDue() {
  return getNumberFromEnv(
    "BILLING_REMINDER_DAYS_AFTER_DUE",
    DEFAULT_REMINDER_DAYS_AFTER_DUE,
  );
}

function isBillingCronEnabled() {
  return process.env.BILLING_CRON_ENABLED !== "false";
}

export async function runGenerateBillingJob() {
  if (isGenerateBillingJobRunning) {
    console.log("⏭️ Cron de geração de cobranças já está em execução.");

    return;
  }

  try {
    isGenerateBillingJobRunning = true;

    const upToDate = getBillingUpToDate();

    console.log(
      `🧾 Iniciando geração automática de cobranças até ${upToDate}...`,
    );

    const result = await generateMonthlyPaymentsService({
      up_to_date: upToDate,
      create_asaas_charges: true,
    });

    console.log(
      [
        "✅ Geração automática finalizada.",
        `Assinaturas prontas: ${result.total_subscriptions_ready}.`,
        `Faturas geradas: ${result.generated_count}.`,
        `Faturas puladas: ${result.skipped_count}.`,
        `Cobranças Asaas geradas: ${result.asaas_generated_count}.`,
        `Cobranças Asaas com erro: ${result.asaas_failed_count}.`,
        `Cobranças Asaas puladas: ${result.asaas_skipped_count}.`,
      ].join(" "),
    );
  } catch (error) {
    console.error("❌ Erro no cron de geração automática de cobranças:", error);
  } finally {
    isGenerateBillingJobRunning = false;
  }
}

export async function runBlockOverdueRestaurantsJob() {
  if (isBlockOverdueJobRunning) {
    console.log("⏭️ Cron de bloqueio por atraso já está em execução.");

    return;
  }

  try {
    isBlockOverdueJobRunning = true;

    const daysAfterDueDate = getBlockAfterDueDays();

    console.log(
      `🔒 Iniciando bloqueio automático de assinaturas vencidas há ${daysAfterDueDate} dia(s)...`,
    );

    const result = await blockOverdueSubscriptionsService({
      days_after_due_date: daysAfterDueDate,
    });

    console.log(
      [
        "✅ Bloqueio automático finalizado.",
        `Assinaturas verificadas: ${result.total_subscriptions_checked}.`,
        `Restaurantes bloqueados: ${result.total_restaurants_blocked}.`,
      ].join(" "),
    );
  } catch (error) {
    console.error("❌ Erro no cron de bloqueio automático por atraso:", error);
  } finally {
    isBlockOverdueJobRunning = false;
  }
}

export async function runPaymentRemindersJob() {
  if (isPaymentRemindersJobRunning) {
    console.log("⏭️ Cron de lembretes de pagamento já está em execução.");

    return;
  }

  try {
    isPaymentRemindersJobRunning = true;

    const daysBeforeDue = getReminderDaysBeforeDue();
    const daysAfterDue = getReminderDaysAfterDue();

    console.log(
      `📣 Iniciando lembretes de pagamento. Antes: ${daysBeforeDue} dia(s). Depois: ${daysAfterDue} dia(s).`,
    );

    const result = await sendPaymentRemindersService({
      days_before_due: daysBeforeDue,
      days_after_due: daysAfterDue,
    });

    console.log(
      [
        "✅ Lembretes de pagamento finalizados.",
        `Faturas verificadas: ${result.payments_checked}.`,
        `Lembretes criados: ${result.reminders_created}.`,
        `Lembretes enviados: ${result.reminders_sent}.`,
        `Duplicados hoje: ${result.reminders_duplicated}.`,
        `Sem destinatário: ${result.reminders_skipped_without_recipient}.`,
        `Falhas: ${result.reminders_failed}.`,
      ].join(" "),
    );
  } catch (error) {
    console.error("❌ Erro no cron de lembretes de pagamento:", error);
  } finally {
    isPaymentRemindersJobRunning = false;
  }
}

export function startBillingCron() {
  if (cronStarted) {
    return;
  }

  if (!isBillingCronEnabled()) {
    console.log("⏸️ Cron financeiro desativado por env.");

    return;
  }

  cronStarted = true;

  const timeZone = getBillingTimezone();

  cron.schedule(
    "0 3 * * *",
    () => {
      void runGenerateBillingJob();
    },
    {
      timezone: timeZone,
    },
  );

  cron.schedule(
    "10 3 * * *",
    () => {
      void runBlockOverdueRestaurantsJob();
    },
    {
      timezone: timeZone,
    },
  );

  cron.schedule(
    "0 9 * * *",
    () => {
      void runPaymentRemindersJob();
    },
    {
      timezone: timeZone,
    },
  );

  console.log(
    [
      "⏰ Cron financeiro iniciado.",
      `Timezone: ${timeZone}.`,
      "Geração de cobranças: 03:00.",
      "Bloqueio por atraso: 03:10.",
      "Lembretes de pagamento: 09:00.",
    ].join(" "),
  );
}