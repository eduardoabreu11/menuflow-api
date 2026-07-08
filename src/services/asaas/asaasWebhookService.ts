import { ensureAsaasWebhookConfigured } from "../../config/asaas.js";
import { AppError } from "../../utils/AppError.js";

import {
  findPaymentByGatewayPaymentId,
  markPaymentAsPaidById,
  updatePaymentById,
  updatePaymentGatewayDataById,
  type Payment,
} from "../../repositories/paymentRepository.js";

import { updateSubscriptionById } from "../../repositories/subscriptionRepository.js";

type AsaasWebhookPayment = {
  id?: string;
  status?: string;
  value?: number;
  dueDate?: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  transactionReceiptUrl?: string | null;
  paymentDate?: string | null;
  clientPaymentDate?: string | null;
  confirmedDate?: string | null;
  dateCreated?: string | null;
  externalReference?: string | null;
  deleted?: boolean;
};

type AsaasWebhookPayload = {
  id?: string;
  event?: string;
  payment?: AsaasWebhookPayment;
};

type ProcessedWebhookResult = {
  received: true;
  processed: boolean;
  event: string;
  gateway_payment_id?: string;
  payment_id?: string;
  action:
    | "IGNORED"
    | "UPDATED_GATEWAY"
    | "MARKED_AS_PAID"
    | "MARKED_AS_OVERDUE"
    | "MARKED_AS_CANCELED";
  reason?: string;
};

const paidEvents = new Set([
  "PAYMENT_CONFIRMED",
  "PAYMENT_RECEIVED",
  "PAYMENT_RECEIVED_IN_CASH",
]);

const overdueEvents = new Set(["PAYMENT_OVERDUE"]);

const canceledEvents = new Set([
  "PAYMENT_DELETED",
  "PAYMENT_REFUNDED",
  "PAYMENT_REFUND_RECEIVED",
]);

const refusedEvents = new Set(["PAYMENT_CREDIT_CARD_CAPTURE_REFUSED"]);

function normalizeDate(date: string) {
  const cleanDate = date.split("T")[0];

  if (!cleanDate) {
    throw new AppError("Data inválida", 400);
  }

  return cleanDate;
}

function getTodayDate() {
  const today = new Date();

  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function addOneMonth(date: string) {
  const cleanDate = normalizeDate(date);
  const [yearText, monthText, dayText] = cleanDate.split("-");

  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);

  if (!year || !month || !day) {
    throw new AppError("Data de pagamento inválida", 400);
  }

  const targetMonthZeroBased = month - 1 + 1;
  const targetYear = year + Math.floor(targetMonthZeroBased / 12);
  const normalizedTargetMonthZeroBased = targetMonthZeroBased % 12;
  const targetMonth = normalizedTargetMonthZeroBased + 1;

  const lastDayOfTargetMonth = new Date(targetYear, targetMonth, 0).getDate();
  const targetDay = Math.min(day, lastDayOfTargetMonth);

  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(
    targetDay,
  ).padStart(2, "0")}`;
}

function ensureWebhookToken(receivedToken: string | undefined) {
  const config = ensureAsaasWebhookConfigured();

  if (!receivedToken || receivedToken !== config.webhookToken) {
    throw new AppError("Webhook Asaas não autorizado", 401);
  }
}

function getGatewayPaymentUrl(asaasPayment: AsaasWebhookPayment) {
  return asaasPayment.invoiceUrl ?? asaasPayment.bankSlipUrl ?? null;
}

function getGatewayInvoiceUrl(asaasPayment: AsaasWebhookPayment) {
  return asaasPayment.invoiceUrl ?? null;
}

function getPaidAtFromAsaasPayment(asaasPayment: AsaasWebhookPayment) {
  return (
    asaasPayment.paymentDate ??
    asaasPayment.clientPaymentDate ??
    asaasPayment.confirmedDate ??
    null
  );
}

function isPaidEvent(event: string, asaasPayment: AsaasWebhookPayment) {
  const status = asaasPayment.status ?? "";

  return (
    paidEvents.has(event) ||
    status === "CONFIRMED" ||
    status === "RECEIVED" ||
    status === "RECEIVED_IN_CASH"
  );
}

function isOverdueEvent(event: string, asaasPayment: AsaasWebhookPayment) {
  const status = asaasPayment.status ?? "";

  return overdueEvents.has(event) || status === "OVERDUE";
}

function isCanceledEvent(event: string, asaasPayment: AsaasWebhookPayment) {
  const status = asaasPayment.status ?? "";

  return (
    canceledEvents.has(event) ||
    asaasPayment.deleted === true ||
    status === "DELETED" ||
    status === "REFUNDED"
  );
}

function isRefusedEvent(event: string, asaasPayment: AsaasWebhookPayment) {
  return refusedEvents.has(event);
}

async function updateGatewaySnapshot(
  payment: Payment,
  event: string,
  asaasPayment: AsaasWebhookPayment,
) {
  return updatePaymentGatewayDataById(payment.id, {
    gateway_provider: "ASAAS",
    gateway_payment_id: asaasPayment.id ?? payment.gateway_payment_id,
    gateway_payment_url: getGatewayPaymentUrl(asaasPayment),
    gateway_invoice_url: getGatewayInvoiceUrl(asaasPayment),
    gateway_status: asaasPayment.status ?? event,
    gateway_response: {
      event,
      payment: asaasPayment,
    },
  });
}

async function markLocalPaymentAsPaid(
  payment: Payment,
  asaasPayment: AsaasWebhookPayment,
) {
  const paidAt = getPaidAtFromAsaasPayment(asaasPayment) ?? getTodayDate();
  const paidAtDate = normalizeDate(paidAt);
  const nextBillingDate = addOneMonth(paidAtDate);

  const updatedPayment =
    payment.status === "PAID"
      ? payment
      : await markPaymentAsPaidById(payment.id, paidAtDate);

  await updateSubscriptionById(payment.subscription_id, {
    status: "ACTIVE",
    started_at: paidAtDate,
    next_billing_date: nextBillingDate,
  });

  return updatedPayment;
}

async function markLocalPaymentAsOverdue(payment: Payment) {
  if (payment.status === "PAID" || payment.status === "CANCELED") {
    return payment;
  }

  const updatedPayment = await updatePaymentById(payment.id, {
    status: "OVERDUE",
  });

  await updateSubscriptionById(payment.subscription_id, {
    status: "OVERDUE",
  });

  return updatedPayment;
}

async function markLocalPaymentAsCanceled(payment: Payment) {
  if (payment.status === "PAID" || payment.status === "CANCELED") {
    return payment;
  }

  return updatePaymentById(payment.id, {
    status: "CANCELED",
  });
}

export async function processAsaasWebhookService(
  payload: AsaasWebhookPayload,
  receivedToken: string | undefined,
): Promise<ProcessedWebhookResult> {
  ensureWebhookToken(receivedToken);

  const event = payload.event ?? "UNKNOWN_EVENT";
  const asaasPayment = payload.payment;

  if (!asaasPayment?.id) {
    return {
      received: true,
      processed: false,
      event,
      action: "IGNORED",
      reason: "Evento sem ID de cobrança do Asaas",
    };
  }

  const payment = await findPaymentByGatewayPaymentId(asaasPayment.id);

  if (!payment) {
    return {
      received: true,
      processed: false,
      event,
      gateway_payment_id: asaasPayment.id,
      action: "IGNORED",
      reason: "Cobrança não encontrada no banco local",
    };
  }

  await updateGatewaySnapshot(payment, event, asaasPayment);

  if (isPaidEvent(event, asaasPayment)) {
    await markLocalPaymentAsPaid(payment, asaasPayment);

    return {
      received: true,
      processed: true,
      event,
      gateway_payment_id: asaasPayment.id,
      payment_id: payment.id,
      action: "MARKED_AS_PAID",
    };
  }

  if (isOverdueEvent(event, asaasPayment)) {
    await markLocalPaymentAsOverdue(payment);

    return {
      received: true,
      processed: true,
      event,
      gateway_payment_id: asaasPayment.id,
      payment_id: payment.id,
      action: "MARKED_AS_OVERDUE",
    };
  }

  if (isCanceledEvent(event, asaasPayment)) {
    await markLocalPaymentAsCanceled(payment);

    return {
      received: true,
      processed: true,
      event,
      gateway_payment_id: asaasPayment.id,
      payment_id: payment.id,
      action: "MARKED_AS_CANCELED",
    };
  }

  if (isRefusedEvent(event, asaasPayment)) {
    return {
      received: true,
      processed: true,
      event,
      gateway_payment_id: asaasPayment.id,
      payment_id: payment.id,
      action: "UPDATED_GATEWAY",
      reason: "Captura de cartão recusada; fatura mantida sem marcar como paga",
    };
  }

  return {
    received: true,
    processed: true,
    event,
    gateway_payment_id: asaasPayment.id,
    payment_id: payment.id,
    action: "UPDATED_GATEWAY",
  };
}