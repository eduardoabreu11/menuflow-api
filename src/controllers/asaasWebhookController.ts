import type { Request, Response } from "express";

import { processAsaasWebhookService } from "../services/asaas/asaasWebhookService.js";

export async function handleAsaasWebhook(req: Request, res: Response) {
  const receivedToken = req.header("asaas-access-token");

  const result = await processAsaasWebhookService(req.body, receivedToken);

  return res.status(200).json(result);
}