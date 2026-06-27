// src/middlewares/roleMiddleware.ts

import type { Request, Response, NextFunction } from "express";
import type { UserRole } from "../config/jwt.js";

export function requireRole(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        message: "Usuário não autenticado",
      });
    }

    const userRole = req.user.role as UserRole;

    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({
        message: "Acesso negado",
      });
    }

    next();
  };
}