import { AppError } from "../utils/AppError.js";

import {
  createSubscription,
  findSubscriptionById,
  findSubscriptionByRestaurantId,
  listSubscriptions,
  updateSubscriptionById,
  cancelSubscriptionById,
  type SubscriptionStatus,
} from "../repositories/subscriptionRepository.js";

import { findRestaurantById } from "../repositories/restaurantRepository.js";

type CreateSubscriptionData = {
  restaurant_id: string;
  status?: SubscriptionStatus;
  plan_name?: string;
  monthly_price: number;
  started_at?: string;
  next_billing_date: string;
};

type UpdateSubscriptionData = {
  status?: SubscriptionStatus;
  plan_name?: string;
  monthly_price?: number;
  started_at?: string;
  next_billing_date?: string;
};

export async function listSubscriptionsService() {
  return listSubscriptions();
}

export async function getSubscriptionByIdService(id: string) {
  const subscription = await findSubscriptionById(id);

  if (!subscription) {
    throw new AppError("Assinatura não encontrada", 404);
  }

  return subscription;
}

export async function getSubscriptionByRestaurantIdService(restaurantId: string) {
  const restaurant = await findRestaurantById(restaurantId);

  if (!restaurant) {
    throw new AppError("Restaurante não encontrado", 404);
  }

  const subscription = await findSubscriptionByRestaurantId(restaurantId);

  if (!subscription) {
    throw new AppError("Assinatura não encontrada para este restaurante", 404);
  }

  return subscription;
}

export async function createSubscriptionService(data: CreateSubscriptionData) {
  const restaurant = await findRestaurantById(data.restaurant_id);

  if (!restaurant) {
    throw new AppError("Restaurante não encontrado", 404);
  }

  const existingSubscription = await findSubscriptionByRestaurantId(
    data.restaurant_id,
  );

  if (existingSubscription) {
    throw new AppError("Este restaurante já possui uma assinatura", 409);
  }

  const subscriptionData: CreateSubscriptionData = {
    restaurant_id: data.restaurant_id,
    status: data.status ?? "PENDING",
    plan_name: data.plan_name?.trim() || "MenuFlow Completo",
    monthly_price: data.monthly_price,
    next_billing_date: data.next_billing_date,
  };

  if (data.started_at !== undefined) {
    subscriptionData.started_at = data.started_at;
  }

  return createSubscription(subscriptionData);
}

export async function updateSubscriptionService(
  id: string,
  data: UpdateSubscriptionData,
) {
  const subscription = await findSubscriptionById(id);

  if (!subscription) {
    throw new AppError("Assinatura não encontrada", 404);
  }

  const updateData: UpdateSubscriptionData = {};

  if (data.status !== undefined) {
    updateData.status = data.status;
  }

  if (data.plan_name !== undefined) {
    updateData.plan_name = data.plan_name;
  }

  if (data.monthly_price !== undefined) {
    updateData.monthly_price = data.monthly_price;
  }

  if (data.started_at !== undefined) {
    updateData.started_at = data.started_at;
  }

  if (data.next_billing_date !== undefined) {
    updateData.next_billing_date = data.next_billing_date;
  }

  return updateSubscriptionById(id, updateData);
}

export async function cancelSubscriptionService(id: string) {
  const subscription = await findSubscriptionById(id);

  if (!subscription) {
    throw new AppError("Assinatura não encontrada", 404);
  }

  if (subscription.status === "CANCELED") {
    throw new AppError("Assinatura já está cancelada", 400);
  }

  return cancelSubscriptionById(id);
}