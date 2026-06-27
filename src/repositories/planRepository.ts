import { pool } from "../database/database.js";

export type CreatePlanData = {
  name: string;
  description?: string | null;
  monthly_price: number;
  annual_price?: number | null;
  max_restaurants?: number;
  max_products?: number | null;
  max_categories?: number | null;
  max_users?: number;
};

export type UpdatePlanData = {
  name?: string;
  description?: string | null;
  monthly_price?: number;
  annual_price?: number | null;
  max_restaurants?: number;
  max_products?: number | null;
  max_categories?: number | null;
  max_users?: number;
};

export async function listPlans() {
  const result = await pool.query(`
    SELECT *
    FROM plans
    ORDER BY created_at DESC
  `);

  return result.rows;
}

export async function findPlanById(id: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM plans
    WHERE id = $1
    `,
    [id],
  );

  return result.rows[0];
}

export async function findPlanByName(name: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM plans
    WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
    `,
    [name],
  );

  return result.rows[0];
}

export async function findPlanByNameExceptId(name: string, id: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM plans
    WHERE LOWER(TRIM(name)) = LOWER(TRIM($1))
      AND id <> $2
    `,
    [name, id],
  );

  return result.rows[0];
}

export async function createPlan(data: CreatePlanData) {
  const result = await pool.query(
    `
    INSERT INTO plans (
      name,
      description,
      monthly_price,
      annual_price,
      max_restaurants,
      max_products,
      max_categories,
      max_users
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
    RETURNING *
    `,
    [
      data.name,
      data.description ?? null,
      data.monthly_price,
      data.annual_price ?? null,
      data.max_restaurants ?? 1,
      data.max_products ?? null,
      data.max_categories ?? null,
      data.max_users ?? 1,
    ],
  );

  return result.rows[0];
}

export async function updatePlan(id: string, data: UpdatePlanData) {
  const result = await pool.query(
    `
    UPDATE plans
    SET
      name = COALESCE($1, name),
      description = COALESCE($2, description),
      monthly_price = COALESCE($3, monthly_price),
      annual_price = COALESCE($4, annual_price),
      max_restaurants = COALESCE($5, max_restaurants),
      max_products = COALESCE($6, max_products),
      max_categories = COALESCE($7, max_categories),
      max_users = COALESCE($8, max_users),
      updated_at = NOW()
    WHERE id = $9
    RETURNING *
    `,
    [
      data.name ?? null,
      data.description ?? null,
      data.monthly_price ?? null,
      data.annual_price ?? null,
      data.max_restaurants ?? null,
      data.max_products ?? null,
      data.max_categories ?? null,
      data.max_users ?? null,
      id,
    ],
  );

  return result.rows[0];
}

export async function disablePlan(id: string) {
  const result = await pool.query(
    `
    UPDATE plans
    SET
      is_active = false,
      updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );

  return result.rows[0];
}

export async function deletePlan(id: string) {
  const result = await pool.query(
    `
    DELETE FROM plans
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );

  return result.rows[0];
}