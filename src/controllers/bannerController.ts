import type { Request, Response } from "express";

import { BannerService } from "../services/bannerService.js";
import { AppError } from "../utils/AppError.js";

const bannerService = new BannerService();

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

export class BannerController {
  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const banner = await bannerService.create(req.body, req.user);

      return res.status(201).json(banner);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao criar banner"),
        getStatusCode(error),
      );
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const { restaurant_id } = req.query;

      if (restaurant_id) {
        const banners = await bannerService.findByRestaurantId(
          String(restaurant_id),
          req.user,
        );

        return res.json(banners);
      }

      const banners = await bannerService.findAll(req.user);

      return res.json(banners);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao listar banners"),
        getStatusCode(error),
      );
    }
  }

  async findById(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const banner = await bannerService.findById(
        String(req.params.id),
        req.user,
      );

      return res.json(banner);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao buscar banner"),
        getStatusCode(error),
      );
    }
  }

  async update(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const banner = await bannerService.update(
        String(req.params.id),
        req.body,
        req.user,
      );

      return res.json(banner);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao atualizar banner"),
        getStatusCode(error),
      );
    }
  }

  async activate(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const banner = await bannerService.activate(
        String(req.params.id),
        req.user,
      );

      return res.json(banner);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao ativar banner"),
        getStatusCode(error),
      );
    }
  }

  async disable(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const banner = await bannerService.disable(
        String(req.params.id),
        req.user,
      );

      return res.json(banner);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao desativar banner"),
        getStatusCode(error),
      );
    }
  }

  async delete(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const result = await bannerService.delete(
        String(req.params.id),
        req.user,
      );

      return res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao deletar banner"),
        getStatusCode(error),
      );
    }
  }
}