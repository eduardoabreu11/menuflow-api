import type { Request, Response } from "express";
import { CategoryService } from "../services/categoryService.js";

const categoryService = new CategoryService();

function getStatusCode(error: unknown) {
  if (!(error instanceof Error)) {
    return 400;
  }

  if (error.message.includes("Acesso negado")) {
    return 403;
  }

  if (error.message.includes("não encontrada")) {
    return 404;
  }

  return 400;
}

export class CategoryController {
  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
        });
      }

      const category = await categoryService.create(req.body, req.user);

      return res.status(201).json(category);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error ? error.message : "Erro ao criar categoria",
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
        const categories = await categoryService.findByRestaurantId(
          String(restaurant_id),
          req.user,
        );

        return res.json(categories);
      }

      const categories = await categoryService.findAll(req.user);

      return res.json(categories);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error ? error.message : "Erro ao listar categorias",
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

      const id = String(req.params.id);

      const category = await categoryService.findById(id, req.user);

      return res.json(category);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error ? error.message : "Erro ao buscar categoria",
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

      const id = String(req.params.id);

      const category = await categoryService.update(id, req.body, req.user);

      return res.json(category);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error ? error.message : "Erro ao atualizar categoria",
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

      const id = String(req.params.id);

      const category = await categoryService.activate(id, req.user);

      return res.json(category);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error ? error.message : "Erro ao ativar categoria",
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

      const id = String(req.params.id);

      const category = await categoryService.disable(id, req.user);

      return res.json(category);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao desativar categoria",
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

      const id = String(req.params.id);

      const result = await categoryService.delete(id, req.user);

      return res.json(result);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error ? error.message : "Erro ao deletar categoria",
      });
    }
  }
}