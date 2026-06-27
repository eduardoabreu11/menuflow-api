import type { AuthUser } from "../config/jwt.js";

import {
  listRestaurants,
  listRestaurantsForOwner,
  findRestaurantById,
  findRestaurantByIdForOwner,
  findRestaurantBySlug,
  createRestaurant,
  updateRestaurant,
  updateRestaurantForOwner,
  blockRestaurant,
  activateRestaurant,
  deleteRestaurant,
} from "../repositories/restaurantRepository.js";

import type {
  CreateRestaurantData,
  UpdateRestaurantData,
} from "../repositories/restaurantRepository.js";

export async function getAllRestaurants(user: AuthUser) {
  if (user.role === "MASTER") {
    return await listRestaurants();
  }

  return await listRestaurantsForOwner(user.id);
}

export async function getRestaurantById(id: string, user: AuthUser) {
  if (user.role === "MASTER") {
    const restaurant = await findRestaurantById(id);

    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    return restaurant;
  }

  const restaurant = await findRestaurantByIdForOwner(id, user.id);

  if (!restaurant) {
    throw new Error("Restaurante não encontrado ou acesso negado");
  }

  return restaurant;
}

export async function createNewRestaurant(
  data: CreateRestaurantData,
  user: AuthUser,
) {
  if (!data.name) {
    throw new Error("Nome do restaurante é obrigatório");
  }

  if (!data.slug) {
    throw new Error("Slug do restaurante é obrigatório");
  }

  const slugExists = await findRestaurantBySlug(data.slug);

  if (slugExists) {
    throw new Error("Slug já cadastrado");
  }

  if (user.role === "MASTER") {
    if (!data.owner_user_id) {
      throw new Error("ID do dono do restaurante é obrigatório");
    }

    return await createRestaurant(data);
  }

  return await createRestaurant({
    ...data,
    owner_user_id: user.id,
  });
}

export async function updateRestaurantById(
  id: string,
  data: UpdateRestaurantData,
  user: AuthUser,
) {
  if (!data.name) {
    throw new Error("Nome do restaurante é obrigatório");
  }

  if (!data.slug) {
    throw new Error("Slug do restaurante é obrigatório");
  }

  const slugExists = await findRestaurantBySlug(data.slug);

  if (slugExists && slugExists.id !== id) {
    throw new Error("Slug já cadastrado");
  }

  if (user.role === "MASTER") {
    const restaurant = await updateRestaurant(id, data);

    if (!restaurant) {
      throw new Error("Restaurante não encontrado");
    }

    return restaurant;
  }

  const restaurant = await updateRestaurantForOwner(id, user.id, data);

  if (!restaurant) {
    throw new Error("Restaurante não encontrado ou acesso negado");
  }

  return restaurant;
}

export async function blockRestaurantById(id: string) {
  const restaurant = await findRestaurantById(id);

  if (!restaurant) {
    throw new Error("Restaurante não encontrado");
  }

  return await blockRestaurant(id);
}

export async function activateRestaurantById(id: string) {
  const restaurant = await findRestaurantById(id);

  if (!restaurant) {
    throw new Error("Restaurante não encontrado");
  }

  return await activateRestaurant(id);
}

export async function deleteRestaurantById(id: string) {
  const restaurant = await findRestaurantById(id);

  if (!restaurant) {
    throw new Error("Restaurante não encontrado");
  }

  return await deleteRestaurant(id);
}