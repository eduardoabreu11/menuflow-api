import type { Request, Response } from "express";

import { asyncHandler } from "../utils/asyncHandler.js";

import { listPaymentRemindersService } from "../services/paymentReminderService.js";

export const listPaymentRemindersController = asyncHandler(
  async (_req: Request, res: Response) => {
    const reminders = await listPaymentRemindersService();

    return res.status(200).json(reminders);
  },
);