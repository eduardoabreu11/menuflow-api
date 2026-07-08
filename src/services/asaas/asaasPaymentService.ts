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