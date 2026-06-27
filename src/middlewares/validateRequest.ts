import type { Request, Response, NextFunction } from "express";
import { ZodError, type ZodTypeAny } from "zod";

type ValidateRequestSchemas = {
  body?: ZodTypeAny;
  params?: ZodTypeAny;
  query?: ZodTypeAny;
};

function formatZodError(error: ZodError) {
  return error.issues.map((issue) => ({
    field: issue.path.map((path) => String(path)).join("."),
    message: issue.message,
  }));
}

export function validateRequest(schemas: ValidateRequestSchemas) {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        const result = schemas.body.safeParse(req.body);

        if (!result.success) {
          res.status(400).json({
            message: "Erro de validação",
            issues: formatZodError(result.error),
          });
          return;
        }

        req.body = result.data;
      }

      if (schemas.params) {
        const result = schemas.params.safeParse(req.params);

        if (!result.success) {
          res.status(400).json({
            message: "Erro de validação",
            issues: formatZodError(result.error),
          });
          return;
        }

        Object.assign(req.params, result.data);
      }

      if (schemas.query) {
        const result = schemas.query.safeParse(req.query);

        if (!result.success) {
          res.status(400).json({
            message: "Erro de validação",
            issues: formatZodError(result.error),
          });
          return;
        }

        Object.assign(req.query, result.data);
      }

      next();
    } catch (error) {
      console.error("Erro no validateRequest:", error);

      res.status(400).json({
        message: "Erro de validação",
      });
    }
  };
}