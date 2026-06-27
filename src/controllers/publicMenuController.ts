import type { Request, Response } from "express";
import { PublicMenuService } from "../services/publicMenuService.js";

const publicMenuService = new PublicMenuService();

export class PublicMenuController {
  async show(req: Request, res: Response) {
    try {
      const slug = String(req.params.slug);

      const menu = await publicMenuService.findBySlug(slug);

      return res.json(menu);
    } catch (error) {
      return res.status(404).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao buscar cardápio público",
      });
    }
  }
}