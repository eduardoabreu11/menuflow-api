import { pool } from "../database/database.js";

export type BillingUser = {
  id: string;
  name: string;
  email: string;
  asaas_customer_id: string | null;
};

export async function findUserForBillingById(id: string) {
  const result = await pool.query<BillingUser>(
    `
    SELECT
      id,
      name,
      email,
      asaas_customer_id
    FROM users
    WHERE id = $1
    `,
    [id],
  );

  return result.rows[0];
}

export async function updateUserAsaasCustomerId(
  id: string,
  asaasCustomerId: string,
) {
  const result = await pool.query<BillingUser>(
    `
    UPDATE users
    SET asaas_customer_id = $2,
        updated_at = NOW()
    WHERE id = $1
    RETURNING
      id,
      name,
      email,
      asaas_customer_id
    `,
    [id, asaasCustomerId],
  );

  return result.rows[0];
}