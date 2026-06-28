import type { Request, Response, NextFunction } from "express";

import { AppError } from "../utils/AppError.js";

type PostgreSQLError = Error & {
  code?: string;
  constraint?: string;
};

type OperationalError = Error & {
  statusCode?: number;
  isOperational?: boolean;
};

export function errorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.headersSent) {
    return next(error);
  }

  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      message: "JSON inválido",
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message,
    });
  }

  const operationalError = error as OperationalError;

  if (
    operationalError.isOperational === true &&
    typeof operationalError.statusCode === "number"
  ) {
    return res.status(operationalError.statusCode).json({
      message: operationalError.message,
    });
  }

  if (error.message === "Origem não permitida pelo CORS") {
    return res.status(403).json({
      message: "Origem não permitida pelo CORS",
    });
  }

  const postgresError = error as PostgreSQLError;

  if (postgresError.code === "23505") {
    const duplicatedMessages: Record<string, string> = {
      users_email_key: "E-mail já cadastrado",
      users_email_unique_lower_idx: "E-mail já cadastrado",
      restaurants_slug_key: "Slug já cadastrado",
      restaurants_slug_unique_lower_idx: "Slug já cadastrado",
      plans_name_unique_lower_idx: "Nome do plano já cadastrado",
      categories_restaurant_name_unique_lower_idx:
        "Categoria já cadastrada neste restaurante",
      products_restaurant_category_name_unique_lower_idx:
        "Produto já cadastrado nesta categoria",
      banners_restaurant_image_url_unique_idx:
        "Banner já cadastrado neste restaurante",
    };

    const message =
      postgresError.constraint &&
      duplicatedMessages[postgresError.constraint]
        ? duplicatedMessages[postgresError.constraint]
        : "Registro duplicado";

    return res.status(400).json({
      message,
    });
  }

  console.error("Erro interno:", error);

  return res.status(500).json({
    message: "Erro interno do servidor",
  });
}