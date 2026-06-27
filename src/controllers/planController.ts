import type { Request, Response } from "express";


import {
  getAllPlans,
  getPlanById,
  createNewPlan,
  updatePlanById,
  disablePlanById,
  deletePlanById,
} from "../services/planService.js";

export async function index(req: Request, res: Response) {
  const plans = await getAllPlans();

  return res.json(plans);
}

export async function show(req: Request, res: Response) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const plan = await getPlanById(id);

    return res.json(plan);
  } catch (error) {
    return res.status(404).json({
      message:
        error instanceof Error ? error.message : "Plano não encontrado",
    });
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
    return res.status(400).json({
      message:
        error instanceof Error ? error.message : "Erro ao criar plano",
    });
  }
}


export async function update(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const plan = await updatePlanById(
      id,
      req.body
    );

    return res.json(plan);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro ao atualizar plano",
    });
  }
}

export async function disable(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const plan = await disablePlanById(id);

    return res.json(plan);
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro ao desativar plano",
    });
  }
}

export async function destroy(
  req: Request,
  res: Response
) {
  try {
    const id = req.params.id;

    if (!id || Array.isArray(id)) {
      return res.status(400).json({
        message: "ID inválido",
      });
    }

    const plan = await deletePlanById(id);

    return res.json({
      message: "Plano removido com sucesso",
      plan,
    });
  } catch (error) {
    return res.status(400).json({
      message:
        error instanceof Error
          ? error.message
          : "Erro ao remover plano",
    });
  }
}