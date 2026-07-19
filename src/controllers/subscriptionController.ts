import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";

import {
  cancelSubscriptionService,
  createSubscriptionService,
  getSubscriptionByIdService,
  getSubscriptionByOwnerUserIdService,
  getSubscriptionByRestaurantIdService,
  listSubscriptionsService,
  updateSubscriptionService,
} from "../services/subscriptionService.js";

import {
  createSubscriptionBodySchema,
  subscriptionIdParamsSchema,
  subscriptionOwnerUserIdParamsSchema,
  subscriptionRestaurantIdParamsSchema,
  updateSubscriptionBodySchema,
} from "../validations/subscriptionValidation.js";

export const listSubscriptionsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const subscriptions = await listSubscriptionsService();

    return res.status(200).json(subscriptions);
  },
);

export const getSubscriptionByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = subscriptionIdParamsSchema.parse(req.params);

    const subscription = await getSubscriptionByIdService(id);

    return res.status(200).json(subscription);
  },
);

export const getSubscriptionByOwnerUserIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { owner_user_id } = subscriptionOwnerUserIdParamsSchema.parse(
      req.params,
    );

    const subscription =
      await getSubscriptionByOwnerUserIdService(owner_user_id);

    return res.status(200).json(subscription);
  },
);

export const getSubscriptionByRestaurantIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { restaurant_id } = subscriptionRestaurantIdParamsSchema.parse(
      req.params,
    );

    const subscription =
      await getSubscriptionByRestaurantIdService(restaurant_id);

    return res.status(200).json(subscription);
  },
);

export const createSubscriptionController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = createSubscriptionBodySchema.parse(req.body);

    const subscriptionData: Parameters<typeof createSubscriptionService>[0] = {
      monthly_price: data.monthly_price,
      next_billing_date: data.next_billing_date,
    };

    if (data.owner_user_id !== undefined) {
      subscriptionData.owner_user_id = data.owner_user_id;
    }

    const restaurantId = data.restaurant_id ?? undefined;

    if (restaurantId !== undefined) {
      subscriptionData.restaurant_id = restaurantId;
    }

    if (data.status !== undefined) {
      subscriptionData.status = data.status;
    }

    if (data.plan_name !== undefined) {
      subscriptionData.plan_name = data.plan_name;
    }

    if (data.started_at !== undefined) {
      subscriptionData.started_at = data.started_at;
    }

    const subscription = await createSubscriptionService(subscriptionData);

    return res.status(201).json(subscription);
  },
);

export const updateSubscriptionController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = subscriptionIdParamsSchema.parse(req.params);
    const data = updateSubscriptionBodySchema.parse(req.body);

    const subscriptionData: Parameters<typeof updateSubscriptionService>[1] =
      {};

    if (data.status !== undefined) {
      subscriptionData.status = data.status;
    }

    if (data.plan_name !== undefined) {
      subscriptionData.plan_name = data.plan_name;
    }

    if (data.monthly_price !== undefined) {
      subscriptionData.monthly_price = data.monthly_price;
    }

    if (data.started_at !== undefined) {
      subscriptionData.started_at = data.started_at;
    }

    if (data.next_billing_date !== undefined) {
      subscriptionData.next_billing_date = data.next_billing_date;
    }

    const subscription = await updateSubscriptionService(id, subscriptionData);

    return res.status(200).json(subscription);
  },
);

export const cancelSubscriptionController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = subscriptionIdParamsSchema.parse(req.params);

    const subscription = await cancelSubscriptionService(id);

    return res.status(200).json(subscription);
  },
);
