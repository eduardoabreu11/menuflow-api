import { AppError } from "../utils/AppError.js";

import { findRestaurantById } from "../repositories/restaurantRepository.js";

import {
  findSubscriptionById,
  findSubscriptionByRestaurantId,
} from "../repositories/subscriptionRepository.js";

import {
  cancelPaymentById,
  createPayment,
  deletePaymentById,
  findPaymentById,
  findPaymentsByRestaurantId,
  findPaymentsBySubscriptionId,
  listPayments,
  markPaymentAsPaidById,
  updatePaymentById,
  type PaymentStatus,
} from "../repositories/paymentRepository.js";

type CreatePaymentData = {
  restaurant_id: string;
  subscription_id: string;
  amount: number;
  due_date: string;
  status?: PaymentStatus;
};

type UpdatePaymentData = {
  amount?: number;
  due_date?: string;
  status?: PaymentStatus;
};

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

  return createPayment({
    restaurant_id: data.restaurant_id,
    subscription_id: data.subscription_id,
    amount: data.amount,
    due_date: data.due_date,
    status: data.status ?? "PENDING",
  });
}

export async function createPaymentForRestaurantService(data: {
  restaurant_id: string;
  amount: number;
  due_date: string;
  status?: PaymentStatus;
}) {
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

  return createPayment({
    restaurant_id: data.restaurant_id,
    subscription_id: subscription.id,
    amount: data.amount,
    due_date: data.due_date,
    status: data.status ?? "PENDING",
  });
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

  const updateData: UpdatePaymentData = {};

  if (data.amount !== undefined) {
    updateData.amount = data.amount;
  }

  if (data.due_date !== undefined) {
    updateData.due_date = data.due_date;
  }

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  return updatePaymentById(id, updateData);
}

export async function markPaymentAsPaidService(id: string, paidAt?: string) {
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