import type { UserRole } from "../../config/jwt.js";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: UserRole;
        restaurantId?: string | null;
      };
    }
  }
}

export {};