import type { Request, Response } from "express";
import { DashboardService } from "../services/dashboardService.js";

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

export class DashboardController {
  async getRecentProducts(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
        });
      }

      const { restaurant_id } = req.query;

      if (typeof restaurant_id !== "string") {
        return res.status(400).json({
          message: "ID do restaurante é obrigatório",
        });
      }

      const products = await dashboardService.getRecentProducts(
        restaurant_id,
        req.user,
      );

      return res.json(products);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao buscar últimos produtos",
      });
    }
  }

  async getStats(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
        });
      }

      const { restaurant_id } = req.query;

      if (typeof restaurant_id !== "string") {
        return res.status(400).json({
          message: "ID do restaurante é obrigatório",
        });
      }

      const stats = await dashboardService.getStats(
        restaurant_id,
        req.user,
      );

      return res.json(stats);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao buscar dados do dashboard",
      });
    }
  }
}