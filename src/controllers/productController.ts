import type { Request, Response } from "express";
import { ProductService } from "../services/productService.js";

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

export class ProductController {
  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({
          message: "Usuário não autenticado",
        });
      }

      const product = await productService.create(req.body, req.user);

      return res.status(201).json(product);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao criar produto",
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
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao listar produtos",
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

      const product = await productService.findById(
        String(req.params.id),
        req.user,
      );

      return res.json(product);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao buscar produto",
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

      const product = await productService.update(
        String(req.params.id),
        req.body,
        req.user,
      );

      return res.json(product);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao atualizar produto",
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

      const product = await productService.activate(
        String(req.params.id),
        req.user,
      );

      return res.json(product);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao ativar produto",
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

      const product = await productService.disable(
        String(req.params.id),
        req.user,
      );

      return res.json(product);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao desativar produto",
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

      const result = await productService.delete(
        String(req.params.id),
        req.user,
      );

      return res.json(result);
    } catch (error) {
      return res.status(getStatusCode(error)).json({
        message:
          error instanceof Error
            ? error.message
            : "Erro ao deletar produto",
      });
    }
  }
}