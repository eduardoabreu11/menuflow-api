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

export async function index(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Usuário não autenticado",
      });
    }

    const restaurants = await getAllRestaurants(req.user);

    return res.json(restaurants);
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro ao listar restaurantes",
    });
  }
}

export async function show(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Usuário não autenticado",
      });
    }

    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const restaurant = await getRestaurantById(id, req.user);

    return res.json(restaurant);
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      message:
        error instanceof Error ? error.message : "Restaurante não encontrado",
    });
  }
}

export async function store(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Usuário não autenticado",
      });
    }

    const restaurant = await createNewRestaurant(req.body, req.user);

    return res.status(201).json(restaurant);
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      message:
        error instanceof Error ? error.message : "Erro ao criar restaurante",
    });
  }
}

export async function update(req: Request, res: Response) {
  try {
    if (!req.user) {
      return res.status(401).json({
        message: "Usuário não autenticado",
      });
    }

    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const restaurant = await updateRestaurantById(id, req.body, req.user);

    return res.json(restaurant);
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar restaurante",
    });
  }
}

export async function block(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const restaurant = await blockRestaurantById(id);

    return res.json(restaurant);
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro ao bloquear restaurante",
    });
  }
}

export async function activate(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const restaurant = await activateRestaurantById(id);

    return res.json(restaurant);
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro ao ativar restaurante",
    });
  }
}

export async function destroy(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const restaurant = await deleteRestaurantById(id);

    return res.json({
      message: "Restaurante removido com sucesso",
      restaurant,
    });
  } catch (error) {
    return res.status(getStatusCode(error)).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro ao remover restaurante",
    });
  }
}