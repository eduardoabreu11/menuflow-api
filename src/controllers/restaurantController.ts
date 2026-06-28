import type { Request, Response } from "express";

import {
  getAllRestaurants,
  getRestaurantById,
  createNewRestaurant,
  updateRestaurantById,
  blockRestaurantById,
  activateRestaurantById,
  deleteRestaurantById,
} from "../services/restaurantService.js";

import { AppError } from "../utils/AppError.js";

function getStatusCode(error: unknown) {
  if (!(error instanceof Error)) {
    return 400;
  }

  if (error.message.includes("Acesso negado")) {
    return 403;
  }

  if (
    error.message.includes("não encontrado") ||
    error.message.includes("não encontrada")
  ) {
    return 404;
  }

  return 400;
}

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function index(req: Request, res: Response) {
  try {
    if (!req.user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const restaurants = await getAllRestaurants(req.user);

    return res.json(restaurants);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Erro ao listar restaurantes"),
      getStatusCode(error),
    );
  }
}

export async function show(req: Request, res: Response) {
  try {
    if (!req.user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new AppError("ID inválido", 400);
    }

    const restaurant = await getRestaurantById(id, req.user);

    return res.json(restaurant);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Restaurante não encontrado"),
      getStatusCode(error),
    );
  }
}

export async function store(req: Request, res: Response) {
  try {
    if (!req.user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const restaurant = await createNewRestaurant(req.body, req.user);

    return res.status(201).json(restaurant);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Erro ao criar restaurante"),
      getStatusCode(error),
    );
  }
}

export async function update(req: Request, res: Response) {
  try {
    if (!req.user) {
      throw new AppError("Usuário não autenticado", 401);
    }

    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new AppError("ID inválido", 400);
    }

    const restaurant = await updateRestaurantById(id, req.body, req.user);

    return res.json(restaurant);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Erro ao atualizar restaurante"),
      getStatusCode(error),
    );
  }
}

export async function block(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new AppError("ID inválido", 400);
    }

    const restaurant = await blockRestaurantById(id);

    return res.json(restaurant);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Erro ao bloquear restaurante"),
      getStatusCode(error),
    );
  }
}

export async function activate(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new AppError("ID inválido", 400);
    }

    const restaurant = await activateRestaurantById(id);

    return res.json(restaurant);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Erro ao ativar restaurante"),
      getStatusCode(error),
    );
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new AppError("ID inválido", 400);
    }

    const restaurant = await deleteRestaurantById(id);

    return res.json({
      message: "Restaurante removido com sucesso",
      restaurant,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Erro ao remover restaurante"),
      getStatusCode(error),
    );
  }
}