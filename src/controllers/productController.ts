import type { Request, Response } from "express";

import { ProductService } from "../services/productService.js";
import { AppError } from "../utils/AppError.js";

const productService = new ProductService();

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

export class ProductController {
  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const product = await productService.create(req.body, req.user);

      return res.status(201).json(product);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao criar produto"),
        getStatusCode(error),
      );
    }
  }

  async findAll(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const { restaurant_id, category_id } = req.query;

      if (restaurant_id) {
        const products = await productService.findByRestaurantId(
          String(restaurant_id),
          req.user,
        );

        return res.json(products);
      }

      if (category_id) {
        const products = await productService.findByCategoryId(
          String(category_id),
          req.user,
        );

        return res.json(products);
      }

      const products = await productService.findAll(req.user);

      return res.json(products);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao listar produtos"),
        getStatusCode(error),
      );
    }
  }

  async findById(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const product = await productService.findById(
        String(req.params.id),
        req.user,
      );

      return res.json(product);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao buscar produto"),
        getStatusCode(error),
      );
    }
  }

  async update(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const product = await productService.update(
        String(req.params.id),
        req.body,
        req.user,
      );

      return res.json(product);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao atualizar produto"),
        getStatusCode(error),
      );
    }
  }

  async activate(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const product = await productService.activate(
        String(req.params.id),
        req.user,
      );

      return res.json(product);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao ativar produto"),
        getStatusCode(error),
      );
    }
  }

  async disable(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const product = await productService.disable(
        String(req.params.id),
        req.user,
      );

      return res.json(product);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao desativar produto"),
        getStatusCode(error),
      );
    }
  }

  async delete(req: Request, res: Response) {
    try {
      if (!req.user) {
        throw new AppError("Usuário não autenticado", 401);
      }

      const result = await productService.delete(
        String(req.params.id),
        req.user,
      );

      return res.json(result);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      throw new AppError(
        getErrorMessage(error, "Erro ao deletar produto"),
        getStatusCode(error),
      );
    }
  }
}