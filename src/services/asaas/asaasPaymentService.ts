import { AppError } from "../../utils/AppError.js";

import {
  findPaymentById,
  updatePaymentGatewayDataById,
  type Payment,
} from "../../repositories/paymentRepository.js";

import { asaasRequest } from "./asaasClient.js";

import { getOrCreateAsaasCustomerForOwnerService } from "./asaasCustomerService.js";

type AsaasBillingType = "BOLETO" | "PIX" | "CREDIT_CARD" | "UNDEFINED";

type CreateAsaasChargeOptions = {
  billingType?: AsaasBillingType | undefined;
};

type AsaasCreatePaymentRequest = {
  customer: string;
  billingType: AsaasBillingType;
  value: number;
  dueDate: string;
  description: string;
  externalReference: string;
};

type AsaasPaymentResponse = {
  object: "payment";
  id: string;
  dateCreated?: string;
  customer?: string;
  billingType?: AsaasBillingType;
  value?: number;
  netValue?: number;
  status?: string;
  dueDate?: string;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  transactionReceiptUrl?: string | null;
  externalReference?: string | null;
  deleted?: boolean;
};

type AsaasCancelPaymentResponse = {
  object?: "payment";
  id?: string;
  status?: string;
  deleted?: boolean;
  invoiceUrl?: string | null;
  bankSlipUrl?: string | null;
  transactionReceiptUrl?: string | null;
  externalReference?: string | null;
};

function normalizeDate(date: string) {
  const cleanDate = date.split("T")[0];

  if (!cleanDate) {
    throw new AppError("Data da fatura inválida", 400);
  }

  return cleanDate;
}

function getAsaasPaymentUrl(asaasPayment: AsaasPaymentResponse) {
  return asaasPayment.invoiceUrl ?? asaasPayment.bankSlipUrl ?? null;
}

function isPaidGatewayStatus(gatewayStatus?: string | null) {
  if (!gatewayStatus) {
    return false;
  }

  const normalizedStatus = gatewayStatus.toUpperCase();

  return (
    normalizedStatus === "RECEIVED" ||
    normalizedStatus === "CONFIRMED" ||
    normalizedStatus === "RECEIVED_IN_CASH"
  );
}

function getCanceledGatewayStatus(asaasPayment: AsaasCancelPaymentResponse) {
  if (asaasPayment.status) {
    return asaasPayment.status;
  }

  if (asaasPayment.deleted) {
    return "DELETED";
  }

  return "CANCELED";
}

function ensurePaymentCanGenerateAsaasCharge(payment: Payment) {
  if (payment.status !== "PENDING") {
    throw new AppError(
      "Somente faturas pendentes podem gerar cobrança no Asaas",
      400,
    );
  }

  if (payment.gateway_provider === "ASAAS" && payment.gateway_payment_id) {
    throw new AppError("Esta fatura já possui cobrança no Asaas", 409);
  }

  if (payment.amount <= 0) {
    throw new AppError("Valor da fatura deve ser maior que zero", 400);
  }

  if (!payment.owner_user_id) {
    throw new AppError("Fatura sem dono/cliente vinculado", 400);
  }
}

function ensurePaymentCanCancelAsaasCharge(payment: Payment) {
  if (payment.status === "PAID") {
    throw new AppError(
      "Fatura paga no Asaas não pode ser cancelada por esta ação",
      400,
    );
  }

  if (payment.status === "CANCELED") {
    throw new AppError("Fatura já está cancelada", 400);
  }

  if (payment.gateway_provider !== "ASAAS") {
    throw new AppError("Esta fatura não possui cobrança Asaas", 400);
  }

  if (!payment.gateway_payment_id) {
    throw new AppError("Fatura Asaas sem ID da cobrança", 400);
  }

  if (isPaidGatewayStatus(payment.gateway_status)) {
    throw new AppError(
      "Cobrança Asaas já consta como paga/confirmada e não pode ser cancelada por esta ação",
      400,
    );
  }
}

function buildAsaasPaymentPayload(
  payment: Payment,
  asaasCustomerId: string,
  options: CreateAsaasChargeOptions,
): AsaasCreatePaymentRequest {
  const billingType = options.billingType ?? "UNDEFINED";

  return {
    customer: asaasCustomerId,
    billingType,
    value: payment.amount,
    dueDate: normalizeDate(payment.due_date),
    description: `Mensalidade Serviu - Fatura ${payment.id}`,
    externalReference: payment.id,
  };
}

export async function createAsaasChargeForPaymentService(
  paymentId: string,
  options: CreateAsaasChargeOptions = {},
) {
  const payment = await findPaymentById(paymentId);

  if (!payment) {
    throw new AppError("Fatura não encontrada", 404);
  }

  ensurePaymentCanGenerateAsaasCharge(payment);

  const customerResult = await getOrCreateAsaasCustomerForOwnerService(
    payment.owner_user_id,
  );

  const payload = buildAsaasPaymentPayload(
    payment,
    customerResult.asaas_customer_id,
    options,
  );

  const asaasPayment = await asaasRequest<AsaasPaymentResponse>("/payments", {
    method: "POST",
    body: payload,
  });

  if (!asaasPayment.id) {
    throw new AppError("Asaas não retornou o ID da cobrança", 502);
  }

  const updatedPayment = await updatePaymentGatewayDataById(payment.id, {
    gateway_provider: "ASAAS",
    gateway_payment_id: asaasPayment.id,
    gateway_payment_url: getAsaasPaymentUrl(asaasPayment),
    gateway_invoice_url: asaasPayment.invoiceUrl ?? null,
    gateway_status: asaasPayment.status ?? null,
    gateway_response: asaasPayment,
  });

  return {
    payment: updatedPayment,
    asaas_payment: asaasPayment,
  };
}

export async function cancelAsaasChargeForPaymentService(paymentId: string) {
  const payment = await findPaymentById(paymentId);

  if (!payment) {
    throw new AppError("Fatura não encontrada", 404);
  }

  ensurePaymentCanCancelAsaasCharge(payment);

  const gatewayPaymentId = payment.gateway_payment_id;

  if (!gatewayPaymentId) {
    throw new AppError("Fatura Asaas sem ID da cobrança", 400);
  }

  const asaasPayment = await asaasRequest<AsaasCancelPaymentResponse>(
    `/payments/${gatewayPaymentId}`,
    {
      method: "DELETE",
    },
  );

  const updatedPayment = await updatePaymentGatewayDataById(payment.id, {
    gateway_provider: "ASAAS",
    gateway_payment_id: gatewayPaymentId,
    gateway_payment_url: payment.gateway_payment_url ?? null,
    gateway_invoice_url: payment.gateway_invoice_url ?? null,
    gateway_status: getCanceledGatewayStatus(asaasPayment),
    gateway_response: asaasPayment,
  });

  return {
    payment: updatedPayment,
    asaas_payment: asaasPayment,
  };
}