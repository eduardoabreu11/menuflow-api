import { AppError } from "../utils/AppError.js";

import { findRestaurantById } from "../repositories/restaurantRepository.js";

import {
  findSubscriptionById,
  findSubscriptionByRestaurantId,
  listActiveSubscriptionsReadyForBilling,
  updateSubscriptionNextBillingDateById,
} from "../repositories/subscriptionRepository.js";

import {
  cancelPaymentById,
  createPayment,
  deletePaymentById,
  findActivePaymentBySubscriptionAndBillingMonth,
  findPaymentById,
  findPaymentsByRestaurantId,
  findPaymentsBySubscriptionId,
  listPayments,
  markPaymentAsPaidById,
  updatePaymentById,
  type Payment,
  type PaymentStatus,
} from "../repositories/paymentRepository.js";

type CreatePaymentData = {
  restaurant_id: string;
  subscription_id: string;
  amount: number;
  due_date: string;
  status?: PaymentStatus | undefined;
};

type UpdatePaymentData = {
  amount?: number | undefined;
  due_date?: string | undefined;
  status?: PaymentStatus | undefined;
};

type GenerateMonthlyPaymentsOptions = {
  up_to_date?: string | undefined;
};

type GeneratedPaymentSummary = {
  subscription_id: string;
  restaurant_id: string;
  restaurant_name: string;
  due_date: string;
  next_billing_date: string;
  payment: Payment | null;
  status: "GENERATED" | "SKIPPED";
  reason?: string;
};

function isDatabaseUniqueError(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function validateInitialPaymentStatus(status: PaymentStatus) {
  if (status !== "PENDING" && status !== "PAID") {
    throw new AppError("Status inicial da fatura deve ser PENDING ou PAID", 400);
  }
}

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
    throw new AppError("Data de vencimento inválida", 400);
  }

  const targetMonthZeroBased = month - 1 + 1;
  const targetYear = year + Math.floor(targetMonthZeroBased / 12);
  const normalizedTargetMonthZeroBased = targetMonthZeroBased % 12;
  const targetMonth = normalizedTargetMonthZeroBased + 1;

  const lastDayOfTargetMonth = new Date(
    targetYear,
    targetMonth,
    0,
  ).getDate();

  const targetDay = Math.min(day, lastDayOfTargetMonth);

  return `${targetYear}-${String(targetMonth).padStart(2, "0")}-${String(
    targetDay,
  ).padStart(2, "0")}`;
}

function ensureCreatedPayment(payment: Payment | undefined) {
  if (!payment) {
    throw new AppError("Erro ao criar fatura", 500);
  }

  return payment;
}

async function ensurePaymentIsNotDuplicated(
  subscriptionId: string,
  dueDate: string,
  ignoredPaymentId?: string,
) {
  const existingPayment =
    await findActivePaymentBySubscriptionAndBillingMonth(
      subscriptionId,
      dueDate,
      ignoredPaymentId,
    );

  if (existingPayment) {
    throw new AppError(
      "Já existe uma fatura não cancelada para esta assinatura neste mês",
      409,
    );
  }
}

export async function listPaymentsService() {
  return listPayments();
}

export async function getPaymentByIdService(id: string) {
  const payment = await findPaymentById(id);

  if (!payment) {
    throw new AppError("Fatura não encontrada", 404);
  }

  return payment;
}

export async function getPaymentsByRestaurantIdService(restaurantId: string) {
  const restaurant = await findRestaurantById(restaurantId);

  if (!restaurant) {
    throw new AppError("Restaurante não encontrado", 404);
  }

  return findPaymentsByRestaurantId(restaurantId);
}

export async function getPaymentsBySubscriptionIdService(subscriptionId: string) {
  const subscription = await findSubscriptionById(subscriptionId);

  if (!subscription) {
    throw new AppError("Assinatura não encontrada", 404);
  }

  return findPaymentsBySubscriptionId(subscriptionId);
}

export async function createPaymentService(data: CreatePaymentData) {
  if (data.amount <= 0) {
    throw new AppError("Valor da fatura deve ser maior que zero", 400);
  }

  const initialStatus = data.status ?? "PENDING";

  validateInitialPaymentStatus(initialStatus);

  const restaurant = await findRestaurantById(data.restaurant_id);

  if (!restaurant) {
    throw new AppError("Restaurante não encontrado", 404);
  }

  const subscription = await findSubscriptionById(data.subscription_id);

  if (!subscription) {
    throw new AppError("Assinatura não encontrada", 404);
  }

  if (subscription.restaurant_id !== data.restaurant_id) {
    throw new AppError(
      "A assinatura informada não pertence a este restaurante",
      400,
    );
  }

  if (subscription.status === "CANCELED") {
    throw new AppError(
      "Não é possível criar fatura para assinatura cancelada",
      400,
    );
  }

  await ensurePaymentIsNotDuplicated(data.subscription_id, data.due_date);

  try {
    const payment = await createPayment({
      restaurant_id: data.restaurant_id,
      subscription_id: data.subscription_id,
      amount: data.amount,
      due_date: data.due_date,
      status: initialStatus,
    });

    return ensureCreatedPayment(payment);
  } catch (error) {
    if (isDatabaseUniqueError(error)) {
      throw new AppError(
        "Já existe uma fatura não cancelada para esta assinatura neste mês",
        409,
      );
    }

    throw error;
  }
}

export async function createPaymentForRestaurantService(data: {
  restaurant_id: string;
  amount: number;
  due_date: string;
  status?: PaymentStatus | undefined;
}) {
  if (data.amount <= 0) {
    throw new AppError("Valor da fatura deve ser maior que zero", 400);
  }

  const initialStatus = data.status ?? "PENDING";

  validateInitialPaymentStatus(initialStatus);

  const restaurant = await findRestaurantById(data.restaurant_id);

  if (!restaurant) {
    throw new AppError("Restaurante não encontrado", 404);
  }

  const subscription = await findSubscriptionByRestaurantId(data.restaurant_id);

  if (!subscription) {
    throw new AppError("Este restaurante não possui assinatura", 404);
  }

  if (subscription.status === "CANCELED") {
    throw new AppError(
      "Não é possível criar fatura para assinatura cancelada",
      400,
    );
  }

  await ensurePaymentIsNotDuplicated(subscription.id, data.due_date);

  try {
    const payment = await createPayment({
      restaurant_id: data.restaurant_id,
      subscription_id: subscription.id,
      amount: data.amount,
      due_date: data.due_date,
      status: initialStatus,
    });

    return ensureCreatedPayment(payment);
  } catch (error) {
    if (isDatabaseUniqueError(error)) {
      throw new AppError(
        "Já existe uma fatura não cancelada para esta assinatura neste mês",
        409,
      );
    }

    throw error;
  }
}

export async function generateMonthlyPaymentsService(
  options: GenerateMonthlyPaymentsOptions = {},
) {
  const upToDate = options.up_to_date ?? getTodayDate();

  const subscriptions = await listActiveSubscriptionsReadyForBilling(upToDate);

  const summaries: GeneratedPaymentSummary[] = [];

  for (const subscription of subscriptions) {
    const dueDate = normalizeDate(subscription.next_billing_date);
    const nextBillingDate = addOneMonth(dueDate);

    const existingPayment =
      await findActivePaymentBySubscriptionAndBillingMonth(
        subscription.id,
        dueDate,
      );

    if (existingPayment) {
      await updateSubscriptionNextBillingDateById(
        subscription.id,
        nextBillingDate,
      );

      summaries.push({
        subscription_id: subscription.id,
        restaurant_id: subscription.restaurant_id,
        restaurant_name: subscription.restaurant_name,
        due_date: dueDate,
        next_billing_date: nextBillingDate,
        payment: null,
        status: "SKIPPED",
        reason:
          "Já existia uma fatura não cancelada para esta assinatura neste mês",
      });

      continue;
    }

    try {
      const payment = await createPayment({
        restaurant_id: subscription.restaurant_id,
        subscription_id: subscription.id,
        amount: subscription.monthly_price,
        due_date: dueDate,
        status: "PENDING",
      });

      const createdPayment = ensureCreatedPayment(payment);

      await updateSubscriptionNextBillingDateById(
        subscription.id,
        nextBillingDate,
      );

      summaries.push({
        subscription_id: subscription.id,
        restaurant_id: subscription.restaurant_id,
        restaurant_name: subscription.restaurant_name,
        due_date: dueDate,
        next_billing_date: nextBillingDate,
        payment: createdPayment,
        status: "GENERATED",
      });
    } catch (error) {
      if (isDatabaseUniqueError(error)) {
        await updateSubscriptionNextBillingDateById(
          subscription.id,
          nextBillingDate,
        );

        summaries.push({
          subscription_id: subscription.id,
          restaurant_id: subscription.restaurant_id,
          restaurant_name: subscription.restaurant_name,
          due_date: dueDate,
          next_billing_date: nextBillingDate,
          payment: null,
          status: "SKIPPED",
          reason:
            "Já existia uma fatura não cancelada para esta assinatura neste mês",
        });

        continue;
      }

      throw error;
    }
  }

  const generated = summaries.filter(
    (summary) => summary.status === "GENERATED",
  );

  const skipped = summaries.filter((summary) => summary.status === "SKIPPED");

  return {
    up_to_date: upToDate,
    total_subscriptions_ready: subscriptions.length,
    generated_count: generated.length,
    skipped_count: skipped.length,
    summaries,
  };
}

export async function updatePaymentService(id: string, data: UpdatePaymentData) {
  const payment = await findPaymentById(id);

  if (!payment) {
    throw new AppError("Fatura não encontrada", 404);
  }

  if (payment.status === "PAID") {
    throw new AppError("Fatura paga não pode ser editada", 400);
  }

  if (payment.status === "CANCELED") {
    throw new AppError("Fatura cancelada não pode ser editada", 400);
  }

  if (data.amount !== undefined && data.amount <= 0) {
    throw new AppError("Valor da fatura deve ser maior que zero", 400);
  }

  if (data.status === "PAID") {
    throw new AppError(
      "Use a ação de marcar fatura como paga para registrar pagamento",
      400,
    );
  }

  if (data.status === "CANCELED") {
    throw new AppError(
      "Use a ação de cancelar fatura para cancelar a cobrança",
      400,
    );
  }

  if (data.status === "OVERDUE") {
    throw new AppError(
      "O status de atraso é calculado automaticamente pelo vencimento",
      400,
    );
  }

  if (data.due_date !== undefined && data.due_date !== payment.due_date) {
    await ensurePaymentIsNotDuplicated(
      payment.subscription_id,
      data.due_date,
      payment.id,
    );
  }

  const updateData: Parameters<typeof updatePaymentById>[1] = {};

  if (data.amount !== undefined) {
    updateData.amount = data.amount;
  }

  if (data.due_date !== undefined) {
    updateData.due_date = data.due_date;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  try {
    return await updatePaymentById(id, updateData);
  } catch (error) {
    if (isDatabaseUniqueError(error)) {
      throw new AppError(
        "Já existe uma fatura não cancelada para esta assinatura neste mês",
        409,
      );
    }

    throw error;
  }
}

export async function markPaymentAsPaidService(
  id: string,
  paidAt?: string | undefined,
) {
  const payment = await findPaymentById(id);

  if (!payment) {
    throw new AppError("Fatura não encontrada", 404);
  }

  if (payment.status === "PAID") {
    throw new AppError("Fatura já está paga", 400);
  }

  if (payment.status === "CANCELED") {
    throw new AppError("Fatura cancelada não pode ser marcada como paga", 400);
  }

  return markPaymentAsPaidById(id, paidAt);
}

export async function cancelPaymentService(id: string) {
  const payment = await findPaymentById(id);

  if (!payment) {
    throw new AppError("Fatura não encontrada", 404);
  }

  if (payment.status === "PAID") {
    throw new AppError("Fatura paga não pode ser cancelada", 400);
  }

  if (payment.status === "CANCELED") {
    throw new AppError("Fatura já está cancelada", 400);
  }

  return cancelPaymentById(id);
}

export async function deletePaymentService(id: string) {
  const payment = await findPaymentById(id);

  if (!payment) {
    throw new AppError("Fatura não encontrada", 404);
  }

  if (payment.status === "PAID") {
    throw new AppError("Fatura paga não pode ser excluída", 400);
  }

  return deletePaymentById(id);
}