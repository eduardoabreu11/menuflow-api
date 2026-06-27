import type { Request, Response, NextFunction } from "express";

type AppError = Error & {
  status?: number;
  type?: string;
  body?: unknown;

  code?: string;
  constraint?: string;
  detail?: string;
};

function getUniqueViolationMessage(error: AppError) {
  switch (error.constraint) {
    case "users_email_unique_lower_idx":
      return "Já existe um usuário com esse e-mail";

    case "restaurants_slug_unique_lower_idx":
      return "Já existe um restaurante com esse slug";

    case "plans_name_unique_lower_idx":
      return "Já existe um plano com esse nome";

    case "categories_restaurant_name_unique_lower_idx":
      return "Já existe uma categoria com esse nome neste restaurante";

    case "products_restaurant_category_name_unique_lower_idx":
      return "Já existe um produto com esse nome nesta categoria";

    case "banners_restaurant_image_url_unique_idx":
      return "Já existe um banner com essa imagem neste restaurante";

    default:
      return "Já existe um registro com essas informações";
  }
}

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (
    error instanceof SyntaxError &&
    error.status === 400 &&
    "body" in error
  ) {
    return res.status(400).json({
      message: "JSON inválido",
    });
  }

  if (error.message === "Origem não permitida pelo CORS") {
    return res.status(403).json({
      message: "Origem não permitida pelo CORS",
    });
  }

  if (error.code === "23505") {
    console.error("Erro de duplicidade no PostgreSQL:", {
      code: error.code,
      constraint: error.constraint,
      detail: error.detail,
    });

    return res.status(400).json({
      message: getUniqueViolationMessage(error),
    });
  }

  console.error("Erro interno:", error);

  return res.status(500).json({
    message: "Erro interno do servidor",
  });
}