import { pool } from "../database/database.js";

export type PaymentStatus = "PAID" | "PENDING" | "OVERDUE" | "CANCELED";

export type Payment = {
  id: string;
  restaurant_id: string;
  subscription_id: string;
  amount: number;
  due_date: string;
  paid_at: Date | null;
  status: PaymentStatus;
  created_at: Date;
  updated_at: Date;
};

export type PaymentWithRestaurant = Payment & {
  restaurant_name: string;
  restaurant_slug: string;
  subscription_status: string;
  plan_name: string;
};

type CreatePaymentData = {
  restaurant_id: string;
  subscription_id: string;
  amount: number;
  due_date: string;
  status?: PaymentStatus | undefined;
};

type UpdatePaymentData = {
  amount?: number | undefined;
  due_date?: string | undefined;
  status?: PaymentStatus | undefined;
};

const paymentSelect = `
  SELECT
    id,
    restaurant_id,
    subscription_id,
    amount::float AS amount,
    due_date::text AS due_date,
    paid_at,
    status,
    created_at,
    updated_at
  FROM payments
`;

const paymentWithRestaurantSelect = `
  SELECT
    payments.id,
    payments.restaurant_id,
    payments.subscription_id,
    payments.amount::float AS amount,
    payments.due_date::text AS due_date,
    payments.paid_at,
    payments.status,
    payments.created_at,
    payments.updated_at,
    restaurants.name AS restaurant_name,
    restaurants.slug AS restaurant_slug,
    subscriptions.status AS subscription_status,
    subscriptions.plan_name
  FROM payments
  INNER JOIN restaurants ON restaurants.id = payments.restaurant_id
  INNER JOIN subscriptions ON subscriptions.id = payments.subscription_id
`;

export async function listPayments() {
  const result = await pool.query<PaymentWithRestaurant>(
    `${paymentWithRestaurantSelect}
     ORDER BY payments.due_date DESC, payments.created_at DESC`,
  );

  return result.rows;
}

export async function findPaymentById(id: string) {
  const result = await pool.query<Payment>(
    `${paymentSelect}
     WHERE id = $1`,
    [id],
  );

  return result.rows[0];
}

export async function findPaymentsByRestaurantId(restaurantId: string) {
  const result = await pool.query<Payment>(
    `${paymentSelect}
     WHERE restaurant_id = $1
     ORDER BY due_date DESC, created_at DESC`,
    [restaurantId],
  );

  return result.rows;
}

export async function findPaymentsBySubscriptionId(subscriptionId: string) {
  const result = await pool.query<Payment>(
    `${paymentSelect}
     WHERE subscription_id = $1
     ORDER BY due_date DESC, created_at DESC`,
    [subscriptionId],
  );

  return result.rows;
}

export async function findActivePaymentBySubscriptionAndBillingMonth(
  subscriptionId: string,
  dueDate: string,
  ignoredPaymentId?: string,
) {
  const values: unknown[] = [subscriptionId, dueDate];

  let query = `
    ${paymentSelect}
    WHERE subscription_id = $1
      AND EXTRACT(YEAR FROM due_date) = EXTRACT(YEAR FROM $2::date)
      AND EXTRACT(MONTH FROM due_date) = EXTRACT(MONTH FROM $2::date)
      AND status <> 'CANCELED'
  `;

  if (ignoredPaymentId) {
    values.push(ignoredPaymentId);
    query += ` AND id <> $${values.length}`;
  }

  query += ` LIMIT 1`;

  const result = await pool.query<Payment>(query, values);

  return result.rows[0];
}

export async function createPayment(data: CreatePaymentData) {
  const status = data.status ?? "PENDING";

  const result = await pool.query<Payment>(
    `INSERT INTO payments (
       restaurant_id,
       subscription_id,
       amount,
       due_date,
       status,
       paid_at
     )
     VALUES (
       $1,
       $2,
       $3,
       $4,
       $5::varchar,
       CASE WHEN $5::varchar = 'PAID' THEN NOW() ELSE NULL END
     )
     RETURNING
       id,
       restaurant_id,
       subscription_id,
       amount::float AS amount,
       due_date::text AS due_date,
       paid_at,
       status,
       created_at,
       updated_at`,
    [
      data.restaurant_id,
      data.subscription_id,
      data.amount,
      data.due_date,
      status,
    ],
  );

  return result.rows[0];
}

export async function updatePaymentById(id: string, data: UpdatePaymentData) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.amount !== undefined) {
    values.push(data.amount);
    fields.push(`amount = $${values.length}`);
  }

  if (data.due_date !== undefined) {
    values.push(data.due_date);
    fields.push(`due_date = $${values.length}`);
  }

  if (data.status !== undefined) {
    values.push(data.status);
    fields.push(`status = $${values.length}`);
  }

  if (fields.length === 0) {
    return findPaymentById(id);
  }

  values.push(id);

  const result = await pool.query<Payment>(
    `UPDATE payments
     SET ${fields.join(", ")},
         updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING
       id,
       restaurant_id,
       subscription_id,
       amount::float AS amount,
       due_date::text AS due_date,
       paid_at,
       status,
       created_at,
       updated_at`,
    values,
  );

  return result.rows[0];
}

export async function markPaymentAsPaidById(id: string, paidAt?: string) {
  const result = await pool.query<Payment>(
    `UPDATE payments
     SET status = 'PAID',
         paid_at = COALESCE($2::timestamptz, NOW()),
         updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       restaurant_id,
       subscription_id,
       amount::float AS amount,
       due_date::text AS due_date,
       paid_at,
       status,
       created_at,
       updated_at`,
    [id, paidAt ?? null],
  );

  return result.rows[0];
}

export async function cancelPaymentById(id: string) {
  const result = await pool.query<Payment>(
    `UPDATE payments
     SET status = 'CANCELED',
         updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       restaurant_id,
       subscription_id,
       amount::float AS amount,
       due_date::text AS due_date,
       paid_at,
       status,
       created_at,
       updated_at`,
    [id],
  );

  return result.rows[0];
}

export async function deletePaymentById(id: string) {
  const result = await pool.query<Payment>(
    `DELETE FROM payments
     WHERE id = $1
     RETURNING
       id,
       restaurant_id,
       subscription_id,
       amount::float AS amount,
       due_date::text AS due_date,
       paid_at,
       status,
       created_at,
       updated_at`,
    [id],
  );

  return result.rows[0];
}