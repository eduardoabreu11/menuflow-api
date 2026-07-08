import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";

import {
  cancelPaymentService,
  createPaymentService,
  deletePaymentService,
  getPaymentByIdService,
  getPaymentsByRestaurantIdService,
  getPaymentsBySubscriptionIdService,
  listPaymentsService,
  markPaymentAsPaidService,
  updatePaymentService,
  generateMonthlyPaymentsService,
} from "../services/paymentService.js";

import {
  createPaymentBodySchema,
  markPaymentAsPaidBodySchema,
  paymentIdParamsSchema,
  paymentRestaurantIdParamsSchema,
  paymentSubscriptionIdParamsSchema,
  updatePaymentBodySchema,
  generateMonthlyPaymentsBodySchema,
} from "../validations/paymentValidation.js";

export const listPaymentsController = asyncHandler(
  async (_req: Request, res: Response) => {
    const payments = await listPaymentsService();

    return res.status(200).json(payments);
  },
);

export const getPaymentByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = paymentIdParamsSchema.parse(req.params);

    const payment = await getPaymentByIdService(id);

    return res.status(200).json(payment);
  },
);

export const getPaymentsByRestaurantIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { restaurant_id } = paymentRestaurantIdParamsSchema.parse(req.params);

    const payments = await getPaymentsByRestaurantIdService(restaurant_id);

    return res.status(200).json(payments);
  },
);

export const getPaymentsBySubscriptionIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const { subscription_id } = paymentSubscriptionIdParamsSchema.parse(
      req.params,
    );

    const payments = await getPaymentsBySubscriptionIdService(subscription_id);

    return res.status(200).json(payments);
  },
);

export const generateMonthlyPaymentsController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = generateMonthlyPaymentsBodySchema.parse(req.body);

    const result = await generateMonthlyPaymentsService(data);

    return res.status(201).json(result);
  },
);

export const createPaymentController = asyncHandler(
  async (req: Request, res: Response) => {
    const data = createPaymentBodySchema.parse(req.body);

    const paymentData: Parameters<typeof createPaymentService>[0] = {
      restaurant_id: data.restaurant_id,
      subscription_id: data.subscription_id,
      amount: data.amount,
      due_date: data.due_date,
    };

    if (data.status !== undefined) {
      paymentData.status = data.status;
    }

    const payment = await createPaymentService(paymentData);

    return res.status(201).json(payment);
  },
);

export const updatePaymentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = paymentIdParamsSchema.parse(req.params);
    const data = updatePaymentBodySchema.parse(req.body);

    const paymentData: Parameters<typeof updatePaymentService>[1] = {};

    if (data.amount !== undefined) {
      paymentData.amount = data.amount;
    }

    if (data.due_date !== undefined) {
      paymentData.due_date = data.due_date;
    }

    if (data.status !== undefined) {
      paymentData.status = data.status;
    }

    const payment = await updatePaymentService(id, paymentData);

    return res.status(200).json(payment);
  },
);

export const markPaymentAsPaidController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = paymentIdParamsSchema.parse(req.params);
    const data = markPaymentAsPaidBodySchema.parse(req.body);

    const payment = await markPaymentAsPaidService(id, data.paid_at);

    return res.status(200).json(payment);
  },
);

export const cancelPaymentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = paymentIdParamsSchema.parse(req.params);

    const payment = await cancelPaymentService(id);

    return res.status(200).json(payment);
  },
);

export const deletePaymentController = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = paymentIdParamsSchema.parse(req.params);

    await deletePaymentService(id);

    return res.status(204).send();
  },
);