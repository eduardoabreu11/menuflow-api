// src/config/jwt.ts

import jwt from "jsonwebtoken";
import type {
  CookieOptions,
  Request,
  Response,
  NextFunction,
} from "express";

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

const isProduction = process.env.NODE_ENV === "production";

export const AUTH_COOKIE_NAME = "menuflow_token";

export const authCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
  maxAge: 15 * 60 * 1000,
};

export const clearAuthCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: isProduction,
  sameSite: isProduction ? "none" : "lax",
  path: "/",
};

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

function getTokenFromRequest(req: Request) {
  const authHeader = req.headers.authorization;

  if (authHeader) {
    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      return {
        error: "malformed",
        token: undefined,
      };
    }

    return {
      error: null,
      token,
    };
  }

  const cookieToken = req.cookies?.[AUTH_COOKIE_NAME];

  if (typeof cookieToken === "string" && cookieToken.length > 0) {
    return {
      error: null,
      token: cookieToken,
    };
  }

  return {
    error: "missing",
    token: undefined,
  };
}

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const { error, token } = getTokenFromRequest(req);

    if (error === "malformed") {
      return res.status(401).json({
        message: "Token mal formatado",
      });
    }

    if (error === "missing" || !token) {
      return res.status(401).json({
        message: "Token não informado",
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