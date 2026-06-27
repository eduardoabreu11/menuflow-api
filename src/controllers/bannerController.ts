import type { Request, Response } from "express";
import { BannerService } from "../services/bannerService.js";

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

export class BannerController {
  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
        });
      }

      const banner = await bannerService.create(req.body, req.user);

      return res.status(201).json(banner);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao criar banner",
      });
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
        });
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
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao listar banners",
      });
    }
  }

  async findById(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
        });
      }

      const banner = await bannerService.findById(
        String(req.params.id),
        req.user,
      );

      return res.json(banner);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao buscar banner",
      });
    }
  }

  async update(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
        });
      }

      const banner = await bannerService.update(
        String(req.params.id),
        req.body,
        req.user,
      );

      return res.json(banner);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar banner",
      });
    }
  }

  async activate(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
        });
      }

      const banner = await bannerService.activate(
        String(req.params.id),
        req.user,
      );

      return res.json(banner);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao ativar banner",
      });
    }
  }

  async disable(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
        });
      }

      const banner = await bannerService.disable(
        String(req.params.id),
        req.user,
      );

      return res.json(banner);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao desativar banner",
      });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
        });
      }

      const result = await bannerService.delete(
        String(req.params.id),
        req.user,
      );

      return res.json(result);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao deletar banner",
      });
    }
  }
}