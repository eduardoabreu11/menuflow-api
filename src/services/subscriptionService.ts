import { AppError } from "../utils/AppError.js";

import {
  createSubscription,
  findSubscriptionById,
  findSubscriptionByOwnerUserId,
  findSubscriptionByRestaurantId,
  listSubscriptions,
  updateSubscriptionById,
  cancelSubscriptionById,
  type SubscriptionStatus,
} from "../repositories/subscriptionRepository.js";

import { findRestaurantById } from "../repositories/restaurantRepository.js";

type CreateSubscriptionData = {
  owner_user_id?: string | undefined;
  restaurant_id?: string | undefined;
  status?: SubscriptionStatus | undefined;
  plan_name?: string | undefined;
  monthly_price: number;
  started_at?: string | undefined;
  next_billing_date: string;
};

type UpdateSubscriptionData = {
  status?: SubscriptionStatus | undefined;
  plan_name?: string | undefined;
  monthly_price?: number | undefined;
  started_at?: string | undefined;
  next_billing_date?: string | undefined;
};

async function resolveOwnerUserId(data: {
  owner_user_id?: string | undefined;
  restaurant_id?: string | undefined;
}) {
  if (data.owner_user_id) {
    return data.owner_user_id;
  }

  if (!data.restaurant_id) {
    throw new AppError("ID do dono da conta é obrigatório", 400);
  }

  const restaurant = await findRestaurantById(data.restaurant_id);

  if (!restaurant) {
    throw new AppError("Restaurante não encontrado", 404);
  }

  return restaurant.owner_user_id as string;
}

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

export async function getSubscriptionByOwnerUserIdService(ownerUserId: string) {
  const subscription = await findSubscriptionByOwnerUserId(ownerUserId);

  if (!subscription) {
    throw new AppError("Assinatura não encontrada para este cliente", 404);
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
    throw new AppError("Assinatura não encontrada para o dono deste restaurante", 404);
  }

  return subscription;
}

export async function createSubscriptionService(data: CreateSubscriptionData) {
  const ownerUserId = await resolveOwnerUserId(data);

  const existingSubscription = await findSubscriptionByOwnerUserId(ownerUserId);

  if (existingSubscription) {
    throw new AppError("Este cliente já possui uma assinatura ativa", 409);
  }

  const subscriptionData: CreateSubscriptionData = {
    owner_user_id: ownerUserId,
    status: data.status ?? "PENDING",
    plan_name: data.plan_name?.trim() || "Serviu Completo",
    monthly_price: data.monthly_price,
    next_billing_date: data.next_billing_date,
  };

  if (data.restaurant_id !== undefined) {
    subscriptionData.restaurant_id = data.restaurant_id;
  }

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