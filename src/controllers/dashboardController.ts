import type { Request, Response } from "express";

import { DashboardService } from "../services/dashboardService.js";
import { AppError } from "../utils/AppError.js";

const dashboardService = new DashboardService();

function getStatusCode(error: unknown) {
  if (!(error instanceof Error)) {
    return 400;
  }

  if (error.message.includes("Acesso negado")) {
    return 403;
  }

  if (
    error.message.includes("não encontrado") ||
    error.message.includes("não encontrada")
  ) {
    return 404;
  }

  return 400;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export class DashboardController {
  async getRecentProducts(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const { restaurant_id } = req.query;

      if (typeof restaurant_id !== "string") {
        throw new AppError("ID do restaurante é obrigatório", 400);
      }

      const products = await dashboardService.getRecentProducts(
        restaurant_id,
        req.user,
      );

      return res.json(products);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao buscar últimos produtos"),
        getStatusCode(error),
      );
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const { restaurant_id } = req.query;

      if (typeof restaurant_id !== "string") {
        throw new AppError("ID do restaurante é obrigatório", 400);
      }

      const stats = await dashboardService.getStats(
        restaurant_id,
        req.user,
      );

      return res.json(stats);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao buscar dados do dashboard"),
        getStatusCode(error),
      );
    }
  }
}