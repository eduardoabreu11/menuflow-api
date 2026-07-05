import { CategoryRepository } from "../repositories/categoryRepository.js";
import { findRestaurantByIdForOwner } from "../repositories/restaurantRepository.js";

import type {
  CreateCategoryDTO,
  UpdateCategoryDTO,
} from "../repositories/categoryRepository.js";

import type { AuthUser } from "../config/jwt.js";

const categoryRepository = new CategoryRepository();

export class CategoryService {
  async create(data: CreateCategoryDTO, user: AuthUser) {
    if (!data.restaurant_id) {
      throw new Error("ID do restaurante é obrigatório");
    }

    if (!data.name) {
      throw new Error("Nome da categoria é obrigatório");
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

    const categoryExists =
      await categoryRepository.findByNameAndRestaurantId(
        data.restaurant_id,
        data.name,
      );

    if (categoryExists) {
      throw new Error("Já existe uma categoria com esse nome neste restaurante");
    }

    if (user.role === "MASTER") {
      return await categoryRepository.create(data);
    }

    const category = await categoryRepository.createForOwner(data, user.id);

    if (!category) {
      throw new Error("Acesso negado ao restaurante");
    }

    return category;
  }

  async findAll(user: AuthUser) {
    if (user.role === "MASTER") {
      return await categoryRepository.findAll();
    }

    return await categoryRepository.findAllForOwner(user.id);
  }

  async findById(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const category = await categoryRepository.findById(id);

      if (!category) {
        throw new Error("Categoria não encontrada");
      }

      return category;
    }

    const category = await categoryRepository.findByIdForOwner(id, user.id);

    if (!category) {
      throw new Error("Categoria não encontrada ou acesso negado");
    }

    return category;
  }

  async findByRestaurantId(restaurantId: string, user: AuthUser) {
    if (!restaurantId) {
      throw new Error("ID do restaurante é obrigatório");
    }

    if (user.role === "MASTER") {
      return await categoryRepository.findByRestaurantId(restaurantId);
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

    return await categoryRepository.findByRestaurantIdForOwner(
      restaurantId,
      user.id,
    );
  }

  async update(id: string, data: UpdateCategoryDTO, user: AuthUser) {
    if (user.role === "MASTER") {
      const currentCategory = await categoryRepository.findById(id);

      if (!currentCategory) {
        throw new Error("Categoria não encontrada");
      }

      if (data.name) {
        const categoryExists =
          await categoryRepository.findByNameAndRestaurantIdExceptId(
            currentCategory.restaurant_id,
            data.name,
            id,
          );

        if (categoryExists) {
          throw new Error(
            "Já existe uma categoria com esse nome neste restaurante",
          );
        }
      }

      const category = await categoryRepository.update(id, data);

      if (!category) {
        throw new Error("Categoria não encontrada");
      }

      return category;
    }

    const currentCategory = await categoryRepository.findByIdForOwner(
      id,
      user.id,
    );

    if (!currentCategory) {
      throw new Error("Categoria não encontrada ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentCategory.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    if (data.name) {
      const categoryExists =
        await categoryRepository.findByNameAndRestaurantIdExceptId(
          currentCategory.restaurant_id,
          data.name,
          id,
        );

      if (categoryExists) {
        throw new Error(
          "Já existe uma categoria com esse nome neste restaurante",
        );
      }
    }

    const category = await categoryRepository.updateForOwner(id, user.id, data);

    if (!category) {
      throw new Error("Categoria não encontrada ou acesso negado");
    }

    return category;
  }

  async activate(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const category = await categoryRepository.activate(id);

      if (!category) {
        throw new Error("Categoria não encontrada");
      }

      return category;
    }

    const currentCategory = await categoryRepository.findByIdForOwner(
      id,
      user.id,
    );

    if (!currentCategory) {
      throw new Error("Categoria não encontrada ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentCategory.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    const category = await categoryRepository.activateForOwner(id, user.id);

    if (!category) {
      throw new Error("Categoria não encontrada ou acesso negado");
    }

    return category;
  }

  async disable(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const category = await categoryRepository.disable(id);

      if (!category) {
        throw new Error("Categoria não encontrada");
      }

      return category;
    }

    const currentCategory = await categoryRepository.findByIdForOwner(
      id,
      user.id,
    );

    if (!currentCategory) {
      throw new Error("Categoria não encontrada ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentCategory.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    const category = await categoryRepository.disableForOwner(id, user.id);

    if (!category) {
      throw new Error("Categoria não encontrada ou acesso negado");
    }

    return category;
  }

  async delete(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const category = await categoryRepository.delete(id);

      if (!category) {
        throw new Error("Categoria não encontrada");
      }

      return {
        message: "Categoria deletada com sucesso",
      };
    }

    const currentCategory = await categoryRepository.findByIdForOwner(
      id,
      user.id,
    );

    if (!currentCategory) {
      throw new Error("Categoria não encontrada ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentCategory.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    const category = await categoryRepository.deleteForOwner(id, user.id);

    if (!category) {
      throw new Error("Categoria não encontrada ou acesso negado");
    }

    return {
      message: "Categoria deletada com sucesso",
    };
  }
}