import type { Request, Response } from "express";

import {
  getAllPlans,
  getPlanById,
  createNewPlan,
  updatePlanById,
  disablePlanById,
  deletePlanById,
} from "../services/planService.js";

import { AppError } from "../utils/AppError.js";

function getStatusCode(error: unknown) {
  if (!(error instanceof Error)) {
    return 400;
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
  const plans = await getAllPlans();

  return res.json(plans);
}

export async function show(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new AppError("ID inválido", 400);
    }

    const plan = await getPlanById(id);

    return res.json(plan);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Plano não encontrado"),
      getStatusCode(error),
    );
  }
}

export async function store(req: Request, res: Response) {
  try {
    const {
      name,
      description,
      monthly_price,
      annual_price,
      max_restaurants,
      max_products,
      max_categories,
      max_users,
    } = req.body;

    const plan = await createNewPlan({
      name,
      description,
      monthly_price,
      annual_price,
      max_restaurants,
      max_products,
      max_categories,
      max_users,
    });

    return res.status(201).json(plan);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Erro ao criar plano"),
      getStatusCode(error),
    );
  }
}

export async function update(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new AppError("ID inválido", 400);
    }

    const plan = await updatePlanById(id, req.body);

    return res.json(plan);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Erro ao atualizar plano"),
      getStatusCode(error),
    );
  }
}

export async function disable(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      throw new AppError("ID inválido", 400);
    }

    const plan = await disablePlanById(id);

    return res.json(plan);
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Erro ao desativar plano"),
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

    const plan = await deletePlanById(id);

    return res.json({
      message: "Plano removido com sucesso",
      plan,
    });
  } catch (error) {
    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(
      getErrorMessage(error, "Erro ao remover plano"),
      getStatusCode(error),
    );
  }
}