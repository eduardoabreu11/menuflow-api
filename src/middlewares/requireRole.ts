import type { NextFunction, Request, Response } from "express";

import { AppError } from "../utils/AppError.js";

type UserRole = "MASTER" | "RESTAURANT_OWNER" | "RESTAURANT_STAFF";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    if (!allowedRoles.includes(req.user.role as UserRole)) {
      throw new AppError("Você não tem permissão para acessar este recurso", 403);
    }

    return next();
  };
}