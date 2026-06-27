// src/config/jwt.ts

import jwt from "jsonwebtoken";
import type { Request, Response, NextFunction } from "express";

const jwtSecretFromEnv = process.env.JWT_SECRET;

if (!jwtSecretFromEnv) {
  throw new Error("JWT_SECRET não configurado no .env");
}

const jwtSecret: jwt.Secret = jwtSecretFromEnv;

const jwtIssuer = process.env.JWT_ISSUER || "cardapio-api";
const jwtAudience = process.env.JWT_AUDIENCE || "cardapio-web";

const jwtExpiresIn = (process.env.JWT_EXPIRES_IN || "15m") as NonNullable<
  jwt.SignOptions["expiresIn"]
>;

export type UserRole = "MASTER" | "RESTAURANT_OWNER" | "RESTAURANT_STAFF";

type GenerateTokenPayload = {
  id: string;
  role: UserRole;
};

export type AuthUser = {
  id: string;
  role: UserRole;
};

const allowedRoles: UserRole[] = [
  "MASTER",
  "RESTAURANT_OWNER",
  "RESTAURANT_STAFF",
];

function isValidRole(role: unknown): role is UserRole {
  return typeof role === "string" && allowedRoles.includes(role as UserRole);
}

function isValidTokenPayload(payload: unknown): payload is AuthUser {
  if (typeof payload !== "object" || payload === null) {
    return false;
  }

  if (!("id" in payload) || !("role" in payload)) {
    return false;
  }

  return typeof payload.id === "string" && isValidRole(payload.role);
}

export function generateToken(payload: GenerateTokenPayload) {
  const options: jwt.SignOptions = {
    algorithm: "HS256",
    expiresIn: jwtExpiresIn,
    issuer: jwtIssuer,
    audience: jwtAudience,
  };

  return jwt.sign(payload, jwtSecret, options);
}

export function verifyToken(token: string): AuthUser {
  const options: jwt.VerifyOptions = {
    algorithms: ["HS256"],
    issuer: jwtIssuer,
    audience: jwtAudience,
  };

  const decoded = jwt.verify(token, jwtSecret, options);

  if (!isValidTokenPayload(decoded)) {
    throw new Error("Token inválido");
  }

  return {
    id: decoded.id,
    role: decoded.role,
  };
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        message: "Token não informado",
      });
    }

    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return res.status(401).json({
        message: "Token mal formatado",
      });
    }

    const user = verifyToken(token);

    req.user = user;

    next();
  } catch {
    return res.status(401).json({
      message: "Token inválido ou expirado",
    });
  }
}
