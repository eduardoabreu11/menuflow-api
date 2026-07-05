import type { AuthUser } from "../config/jwt.js";

import { DashboardRepository } from "../repositories/dashboardRepository.js";
import { findRestaurantByIdForOwner } from "../repositories/restaurantRepository.js";

const dashboardRepository = new DashboardRepository();

export class DashboardService {
  async getRecentProducts(restaurantId: string, user: AuthUser) {
    if (!restaurantId) {
      throw new Error("ID do restaurante é obrigatório");
    }

    if (user.role === "MASTER") {
      return await dashboardRepository.getRecentProducts(restaurantId);
    }

    const restaurant = await findRestaurantByIdForOwner(
      restaurantId,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
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

    const restaurant = await findRestaurantByIdForOwner(
      restaurantId,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    return await dashboardRepository.getStatsForOwner(
      restaurantId,
      user.id,
    );
  }
}