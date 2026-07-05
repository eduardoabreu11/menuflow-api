import { BannerRepository } from "../repositories/bannerRepository.js";
import { findRestaurantByIdForOwner } from "../repositories/restaurantRepository.js";

import type {
  CreateBannerDTO,
  UpdateBannerDTO,
} from "../repositories/bannerRepository.js";

import type { AuthUser } from "../config/jwt.js";

const bannerRepository = new BannerRepository();

export class BannerService {
  async create(data: CreateBannerDTO, user: AuthUser) {
    if (!data.restaurant_id) {
      throw new Error("ID do restaurante é obrigatório");
    }

    if (!data.image_url) {
      throw new Error("URL da imagem é obrigatória");
    }

    if (user.role !== "MASTER") {
      const restaurant = await findRestaurantByIdForOwner(
        data.restaurant_id,
        user.id,
      );

      if (!restaurant) {
        throw new Error("Acesso negado ao restaurante");
      }

      if (restaurant.status !== "ACTIVE") {
        throw new Error("Restaurante bloqueado");
      }
    }

    const bannerExists =
      await bannerRepository.findByImageUrlAndRestaurantId(
        data.restaurant_id,
        data.image_url,
      );

    if (bannerExists) {
      throw new Error("Já existe um banner com essa imagem neste restaurante");
    }

    if (user.role === "MASTER") {
      return await bannerRepository.create(data);
    }

    const banner = await bannerRepository.createForOwner(data, user.id);

    if (!banner) {
      throw new Error("Acesso negado ao restaurante");
    }

    return banner;
  }

  async findAll(user: AuthUser) {
    if (user.role === "MASTER") {
      return await bannerRepository.findAll();
    }

    return await bannerRepository.findAllForOwner(user.id);
  }

  async findById(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const banner = await bannerRepository.findById(id);

      if (!banner) {
        throw new Error("Banner não encontrado");
      }

      return banner;
    }

    const banner = await bannerRepository.findByIdForOwner(id, user.id);

    if (!banner) {
      throw new Error("Banner não encontrado ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      banner.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    return banner;
  }

  async findByRestaurantId(restaurantId: string, user: AuthUser) {
    if (!restaurantId) {
      throw new Error("ID do restaurante é obrigatório");
    }

    if (user.role === "MASTER") {
      return await bannerRepository.findByRestaurantId(restaurantId);
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

    return await bannerRepository.findByRestaurantIdForOwner(
      restaurantId,
      user.id,
    );
  }

  async update(id: string, data: UpdateBannerDTO, user: AuthUser) {
    if (data.image_url !== undefined && !data.image_url) {
      throw new Error("URL da imagem é obrigatória");
    }

    if (user.role === "MASTER") {
      const currentBanner = await bannerRepository.findById(id);

      if (!currentBanner) {
        throw new Error("Banner não encontrado");
      }

      if (data.image_url) {
        const bannerExists =
          await bannerRepository.findByImageUrlAndRestaurantIdExceptId(
            currentBanner.restaurant_id,
            data.image_url,
            id,
          );

        if (bannerExists) {
          throw new Error(
            "Já existe um banner com essa imagem neste restaurante",
          );
        }
      }

      const banner = await bannerRepository.update(id, data);

      if (!banner) {
        throw new Error("Banner não encontrado");
      }

      return banner;
    }

    const currentBanner = await bannerRepository.findByIdForOwner(id, user.id);

    if (!currentBanner) {
      throw new Error("Banner não encontrado ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentBanner.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    if (data.image_url) {
      const bannerExists =
        await bannerRepository.findByImageUrlAndRestaurantIdExceptId(
          currentBanner.restaurant_id,
          data.image_url,
          id,
        );

      if (bannerExists) {
        throw new Error(
          "Já existe um banner com essa imagem neste restaurante",
        );
      }
    }

    const banner = await bannerRepository.updateForOwner(id, user.id, data);

    if (!banner) {
      throw new Error("Banner não encontrado ou acesso negado");
    }

    return banner;
  }

  async activate(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const banner = await bannerRepository.activate(id);

      if (!banner) {
        throw new Error("Banner não encontrado");
      }

      return banner;
    }

    const currentBanner = await bannerRepository.findByIdForOwner(id, user.id);

    if (!currentBanner) {
      throw new Error("Banner não encontrado ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentBanner.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    const banner = await bannerRepository.activateForOwner(id, user.id);

    if (!banner) {
      throw new Error("Banner não encontrado ou acesso negado");
    }

    return banner;
  }

  async disable(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const banner = await bannerRepository.disable(id);

      if (!banner) {
        throw new Error("Banner não encontrado");
      }

      return banner;
    }

    const currentBanner = await bannerRepository.findByIdForOwner(id, user.id);

    if (!currentBanner) {
      throw new Error("Banner não encontrado ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentBanner.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    const banner = await bannerRepository.disableForOwner(id, user.id);

    if (!banner) {
      throw new Error("Banner não encontrado ou acesso negado");
    }

    return banner;
  }

  async delete(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const banner = await bannerRepository.delete(id);

      if (!banner) {
        throw new Error("Banner não encontrado");
      }

      return {
        message: "Banner deletado com sucesso",
      };
    }

    const currentBanner = await bannerRepository.findByIdForOwner(id, user.id);

    if (!currentBanner) {
      throw new Error("Banner não encontrado ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentBanner.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    const banner = await bannerRepository.deleteForOwner(id, user.id);

    if (!banner) {
      throw new Error("Banner não encontrado ou acesso negado");
    }

    return {
      message: "Banner deletado com sucesso",
    };
  }
}