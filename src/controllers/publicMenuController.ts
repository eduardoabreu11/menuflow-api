import type { Request, Response } from "express";

import { PublicMenuService } from "../services/publicMenuService.js";
import { AppError } from "../utils/AppError.js";

const publicMenuService = new PublicMenuService();

function getStatusCode(error: unknown) {
  if (!(error instanceof Error)) {
    return 400;
  }

  if (
    error.message.includes("não encontrado") ||
    error.message.includes("não encontrada") ||
    error.message.includes("inativo") ||
    error.message.includes("bloqueado")
  ) {
    return 404;
  }

  return 400;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export class PublicMenuController {
  async show(req: Request, res: Response) {
    try {
      const slug = String(req.params.slug);

      const menu = await publicMenuService.findBySlug(slug);

      return res.json(menu);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao buscar cardápio público"),
        getStatusCode(error),
      );
    }
  }
}