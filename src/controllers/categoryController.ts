import type { Request, Response } from "express";

import { CategoryService } from "../services/categoryService.js";
import { AppError } from "../utils/AppError.js";

const categoryService = new CategoryService();

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

export class CategoryController {
  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const category = await categoryService.create(req.body, req.user);

      return res.status(201).json(category);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao criar categoria"),
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
        const categories = await categoryService.findByRestaurantId(
          String(restaurant_id),
          req.user,
        );

        return res.json(categories);
      }

      const categories = await categoryService.findAll(req.user);

      return res.json(categories);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao listar categorias"),
        getStatusCode(error),
      );
    }
  }

  async findById(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const id = String(req.params.id);

      const category = await categoryService.findById(id, req.user);

      return res.json(category);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao buscar categoria"),
        getStatusCode(error),
      );
    }
  }

  async update(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const id = String(req.params.id);

      const category = await categoryService.update(id, req.body, req.user);

      return res.json(category);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao atualizar categoria"),
        getStatusCode(error),
      );
    }
  }

  async activate(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const id = String(req.params.id);

      const category = await categoryService.activate(id, req.user);

      return res.json(category);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao ativar categoria"),
        getStatusCode(error),
      );
    }
  }

  async disable(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const id = String(req.params.id);

      const category = await categoryService.disable(id, req.user);

      return res.json(category);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao desativar categoria"),
        getStatusCode(error),
      );
    }
  }

  async delete(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const id = String(req.params.id);

      const result = await categoryService.delete(id, req.user);

      return res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao deletar categoria"),
        getStatusCode(error),
      );
    }
  }
}