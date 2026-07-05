import { ProductRepository } from "../repositories/productRepository.js";
import { CategoryRepository } from "../repositories/categoryRepository.js";
import { findRestaurantByIdForOwner } from "../repositories/restaurantRepository.js";

import type {
  CreateProductDTO,
  UpdateProductDTO,
} from "../repositories/productRepository.js";

import type { AuthUser } from "../config/jwt.js";

const productRepository = new ProductRepository();
const categoryRepository = new CategoryRepository();

export class ProductService {
  async create(data: CreateProductDTO, user: AuthUser) {
    if (!data.restaurant_id) {
      throw new Error("ID do restaurante é obrigatório");
    }

    if (!data.category_id) {
      throw new Error("ID da categoria é obrigatório");
    }

    if (!data.name) {
      throw new Error("Nome do produto é obrigatório");
    }

    if (data.price === undefined || data.price === null) {
      throw new Error("Preço do produto é obrigatório");
    }

    if (data.price <= 0) {
      throw new Error("Preço do produto deve ser maior que zero");
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

    const categoryBelongsToRestaurant =
      await productRepository.categoryBelongsToRestaurant(
        data.restaurant_id,
        data.category_id,
      );

    if (!categoryBelongsToRestaurant) {
      throw new Error("Categoria não pertence ao restaurante informado");
    }

    const productExists =
      await productRepository.findByNameRestaurantAndCategory(
        data.restaurant_id,
        data.category_id,
        data.name,
      );

    if (productExists) {
      throw new Error("Já existe um produto com esse nome nesta categoria");
    }

    if (user.role === "MASTER") {
      return await productRepository.create(data);
    }

    const product = await productRepository.createForOwner(data, user.id);

    if (!product) {
      throw new Error("Produto não criado. Restaurante ou categoria inválidos");
    }

    return product;
  }

  async findAll(user: AuthUser) {
    if (user.role === "MASTER") {
      return await productRepository.findAll();
    }

    return await productRepository.findAllForOwner(user.id);
  }

  async findById(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const product = await productRepository.findById(id);

      if (!product) {
        throw new Error("Produto não encontrado");
      }

      return product;
    }

    const product = await productRepository.findByIdForOwner(id, user.id);

    if (!product) {
      throw new Error("Produto não encontrado ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      product.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    return product;
  }

  async findByRestaurantId(restaurantId: string, user: AuthUser) {
    if (!restaurantId) {
      throw new Error("ID do restaurante é obrigatório");
    }

    if (user.role === "MASTER") {
      return await productRepository.findByRestaurantId(restaurantId);
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

    return await productRepository.findByRestaurantIdForOwner(
      restaurantId,
      user.id,
    );
  }

  async findByCategoryId(categoryId: string, user: AuthUser) {
    if (!categoryId) {
      throw new Error("ID da categoria é obrigatório");
    }

    if (user.role === "MASTER") {
      return await productRepository.findByCategoryId(categoryId);
    }

    const category = await categoryRepository.findByIdForOwner(
      categoryId,
      user.id,
    );

    if (!category) {
      throw new Error("Acesso negado à categoria");
    }

    const restaurant = await findRestaurantByIdForOwner(
      category.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    return await productRepository.findByCategoryIdForOwner(
      categoryId,
      user.id,
    );
  }

  async update(id: string, data: UpdateProductDTO, user: AuthUser) {
    if (data.price !== undefined && data.price <= 0) {
      throw new Error("Preço do produto deve ser maior que zero");
    }

    if (user.role === "MASTER") {
      const currentProduct = await productRepository.findById(id);

      if (!currentProduct) {
        throw new Error("Produto não encontrado");
      }

      const nextName = data.name ?? currentProduct.name;
      const nextCategoryId = data.category_id ?? currentProduct.category_id;

      if (data.category_id) {
        const categoryBelongsToRestaurant =
          await productRepository.categoryBelongsToRestaurant(
            currentProduct.restaurant_id,
            data.category_id,
          );

        if (!categoryBelongsToRestaurant) {
          throw new Error("Categoria não pertence ao restaurante informado");
        }
      }

      if (data.name || data.category_id) {
        const productExists =
          await productRepository.findByNameRestaurantAndCategoryExceptId(
            currentProduct.restaurant_id,
            nextCategoryId,
            nextName,
            id,
          );

        if (productExists) {
          throw new Error("Já existe um produto com esse nome nesta categoria");
        }
      }

      const product = await productRepository.update(id, data);

      if (!product) {
        throw new Error("Produto não encontrado ou categoria inválida");
      }

      return product;
    }

    const currentProduct = await productRepository.findByIdForOwner(
      id,
      user.id,
    );

    if (!currentProduct) {
      throw new Error("Produto não encontrado ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentProduct.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    const nextName = data.name ?? currentProduct.name;
    const nextCategoryId = data.category_id ?? currentProduct.category_id;

    if (data.category_id) {
      const categoryBelongsToRestaurant =
        await productRepository.categoryBelongsToRestaurant(
          currentProduct.restaurant_id,
          data.category_id,
        );

      if (!categoryBelongsToRestaurant) {
        throw new Error("Categoria não pertence ao restaurante informado");
      }
    }

    if (data.name || data.category_id) {
      const productExists =
        await productRepository.findByNameRestaurantAndCategoryExceptId(
          currentProduct.restaurant_id,
          nextCategoryId,
          nextName,
          id,
        );

      if (productExists) {
        throw new Error("Já existe um produto com esse nome nesta categoria");
      }
    }

    const product = await productRepository.updateForOwner(id, user.id, data);

    if (!product) {
      throw new Error("Produto não encontrado ou acesso negado");
    }

    return product;
  }

  async activate(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const product = await productRepository.activate(id);

      if (!product) {
        throw new Error("Produto não encontrado");
      }

      return product;
    }

    const currentProduct = await productRepository.findByIdForOwner(
      id,
      user.id,
    );

    if (!currentProduct) {
      throw new Error("Produto não encontrado ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentProduct.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    const product = await productRepository.activateForOwner(id, user.id);

    if (!product) {
      throw new Error("Produto não encontrado ou acesso negado");
    }

    return product;
  }

  async disable(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const product = await productRepository.disable(id);

      if (!product) {
        throw new Error("Produto não encontrado");
      }

      return product;
    }

    const currentProduct = await productRepository.findByIdForOwner(
      id,
      user.id,
    );

    if (!currentProduct) {
      throw new Error("Produto não encontrado ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentProduct.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    const product = await productRepository.disableForOwner(id, user.id);

    if (!product) {
      throw new Error("Produto não encontrado ou acesso negado");
    }

    return product;
  }

  async delete(id: string, user: AuthUser) {
    if (user.role === "MASTER") {
      const product = await productRepository.delete(id);

      if (!product) {
        throw new Error("Produto não encontrado");
      }

      return {
        message: "Produto deletado com sucesso",
      };
    }

    const currentProduct = await productRepository.findByIdForOwner(
      id,
      user.id,
    );

    if (!currentProduct) {
      throw new Error("Produto não encontrado ou acesso negado");
    }

    const restaurant = await findRestaurantByIdForOwner(
      currentProduct.restaurant_id,
      user.id,
    );

    if (!restaurant) {
      throw new Error("Acesso negado ao restaurante");
    }

    if (restaurant.status !== "ACTIVE") {
      throw new Error("Restaurante bloqueado");
    }

    const product = await productRepository.deleteForOwner(id, user.id);

    if (!product) {
      throw new Error("Produto não encontrado ou acesso negado");
    }

    return {
      message: "Produto deletado com sucesso",
    };
  }
}