import type { AuthUser } from "../config/jwt.js";

import { DashboardRepository } from "../repositories/dashboardRepository.js";
import { userOwnsRestaurant } from "../repositories/restaurantRepository.js";

const dashboardRepository = new DashboardRepository();

export class DashboardService {
  async getRecentProducts(restaurantId: string, user: AuthUser) {
    if (!restaurantId) {
      throw new Error("ID do restaurante é obrigatório");
    }

    if (user.role === "MASTER") {
      return await dashboardRepository.getRecentProducts(restaurantId);
    }

    const ownsRestaurant = await userOwnsRestaurant(user.id, restaurantId);

    if (!ownsRestaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    return await dashboardRepository.getRecentProductsForOwner(
      restaurantId,
      user.id,
    );
  }

  async getStats(restaurantId: string, user: AuthUser) {
    if (!restaurantId) {
      throw new Error("ID do restaurante é obrigatório");
    }

    if (user.role === "MASTER") {
      return await dashboardRepository.getStats(restaurantId);
    }

    const ownsRestaurant = await userOwnsRestaurant(user.id, restaurantId);

    if (!ownsRestaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    return await dashboardRepository.getStatsForOwner(
      restaurantId,
      user.id,
    );
  }
}