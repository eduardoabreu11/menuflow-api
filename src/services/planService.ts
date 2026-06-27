import {
  listPlans,
  findPlanById,
  findPlanByName,
  findPlanByNameExceptId,
  createPlan,
  updatePlan,
  disablePlan,
  deletePlan,
} from "../repositories/planRepository.js";

import type {
  CreatePlanData,
  UpdatePlanData,
} from "../repositories/planRepository.js";

export async function getAllPlans() {
  return await listPlans();
}

export async function getPlanById(id: string) {
  const plan = await findPlanById(id);

  if (!plan) {
    throw new Error("Plano não encontrado");
  }

  return plan;
}

export async function createNewPlan(data: CreatePlanData) {
  const planExists = await findPlanByName(data.name);

  if (planExists) {
    throw new Error("Já existe um plano com esse nome");
  }

  return await createPlan(data);
}

export async function updatePlanById(id: string, data: UpdatePlanData) {
  const plan = await findPlanById(id);

  if (!plan) {
    throw new Error("Plano não encontrado");
  }

  if (data.name) {
    const planExists = await findPlanByNameExceptId(data.name, id);

    if (planExists) {
      throw new Error("Já existe um plano com esse nome");
    }
  }

  return await updatePlan(id, data);
}

export async function disablePlanById(id: string) {
  const plan = await findPlanById(id);

  if (!plan) {
    throw new Error("Plano não encontrado");
  }

  return await disablePlan(id);
}

export async function deletePlanById(id: string) {
  const plan = await findPlanById(id);

  if (!plan) {
    throw new Error("Plano não encontrado");
  }

  return await deletePlan(id);
}