import { pool } from "../database/database.js";

export type PaymentStatus = "PAID" | "PENDING" | "OVERDUE" | "CANCELED";

export type PaymentGatewayProvider = "MANUAL" | "ASAAS";

export type Payment = {
  id: string;
  owner_user_id: string;
  restaurant_id: string | null;
  subscription_id: string;
  amount: number;
  due_date: string;
  paid_at: Date | null;
  status: PaymentStatus;
  gateway_provider: PaymentGatewayProvider;
  gateway_payment_id: string | null;
  gateway_payment_url: string | null;
  gateway_invoice_url: string | null;
  gateway_status: string | null;
  gateway_response: unknown | null;
  gateway_created_at: Date | null;
  gateway_updated_at: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type PaymentWithOwner = Payment & {
  owner_name: string;
  owner_email: string;
  total_restaurants: number;
  subscription_status: string;
  plan_name: string;

  // Mantido por compatibilidade temporária com o frontend antigo
  restaurant_name: string;
  restaurant_slug: string;
};

type CreatePaymentData = {
  owner_user_id: string;
  restaurant_id?: string | null | undefined;
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

type UpdatePaymentGatewayData = {
  gateway_provider?: PaymentGatewayProvider | undefined;
  gateway_payment_id?: string | null | undefined;
  gateway_payment_url?: string | null | undefined;
  gateway_invoice_url?: string | null | undefined;
  gateway_status?: string | null | undefined;
  gateway_response?: unknown | null | undefined;
};

const paymentSelect = `
  SELECT
    id,
    owner_user_id,
    restaurant_id,
    subscription_id,
    amount::float AS amount,
    due_date::text AS due_date,
    paid_at,
    status,
    gateway_provider,
    gateway_payment_id,
    gateway_payment_url,
    gateway_invoice_url,
    gateway_status,
    gateway_response,
    gateway_created_at,
    gateway_updated_at,
    created_at,
    updated_at
  FROM payments
`;

const paymentWithOwnerSelect = `
  SELECT
    payments.id,
    payments.owner_user_id,
    payments.restaurant_id,
    payments.subscription_id,
    payments.amount::float AS amount,
    payments.due_date::text AS due_date,
    payments.paid_at,
    payments.status,
    payments.gateway_provider,
    payments.gateway_payment_id,
    payments.gateway_payment_url,
    payments.gateway_invoice_url,
    payments.gateway_status,
    payments.gateway_response,
    payments.gateway_created_at,
    payments.gateway_updated_at,
    payments.created_at,
    payments.updated_at,
    users.name AS owner_name,
    users.email AS owner_email,
    users.name AS restaurant_name,
    users.email AS restaurant_slug,
    (
      SELECT COUNT(*)::int
      FROM restaurants
      WHERE restaurants.owner_user_id = users.id
    ) AS total_restaurants,
    subscriptions.status AS subscription_status,
    subscriptions.plan_name
  FROM payments
  INNER JOIN users ON users.id = payments.owner_user_id
  INNER JOIN subscriptions ON subscriptions.id = payments.subscription_id
`;

const paymentReturning = `
  id,
  owner_user_id,
  restaurant_id,
  subscription_id,
  amount::float AS amount,
  due_date::text AS due_date,
  paid_at,
  status,
  gateway_provider,
  gateway_payment_id,
  gateway_payment_url,
  gateway_invoice_url,
  gateway_status,
  gateway_response,
  gateway_created_at,
  gateway_updated_at,
  created_at,
  updated_at
`;

export async function listPayments() {
  const result = await pool.query<PaymentWithOwner>(
    `${paymentWithOwnerSelect}
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

export async function findPaymentByGatewayPaymentId(gatewayPaymentId: string) {
  const result = await pool.query<Payment>(
    `${paymentSelect}
     WHERE gateway_payment_id = $1`,
    [gatewayPaymentId],
  );

  return result.rows[0];
}

export async function findPaymentsByOwnerUserId(ownerUserId: string) {
  const result = await pool.query<Payment>(
    `${paymentSelect}
     WHERE owner_user_id = $1
     ORDER BY due_date DESC, created_at DESC`,
    [ownerUserId],
  );

  return result.rows;
}

export async function findPaymentsByRestaurantId(restaurantId: string) {
  const result = await pool.query<Payment>(
    `${paymentSelect}
     WHERE owner_user_id = (
       SELECT owner_user_id
       FROM restaurants
       WHERE id = $1
     )
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
       owner_user_id,
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
       $5,
       $6::varchar,
       CASE WHEN $6::varchar = 'PAID' THEN NOW() ELSE NULL END
     )
     RETURNING ${paymentReturning}`,
    [
      data.owner_user_id,
      data.restaurant_id ?? null,
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
     RETURNING ${paymentReturning}`,
    values,
  );

  return result.rows[0];
}

export async function updatePaymentGatewayDataById(
  id: string,
  data: UpdatePaymentGatewayData,
) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.gateway_provider !== undefined) {
    values.push(data.gateway_provider);
    fields.push(`gateway_provider = $${values.length}`);
  }

  if (data.gateway_payment_id !== undefined) {
    values.push(data.gateway_payment_id);
    fields.push(`gateway_payment_id = $${values.length}`);
  }

  if (data.gateway_payment_url !== undefined) {
    values.push(data.gateway_payment_url);
    fields.push(`gateway_payment_url = $${values.length}`);
  }

  if (data.gateway_invoice_url !== undefined) {
    values.push(data.gateway_invoice_url);
    fields.push(`gateway_invoice_url = $${values.length}`);
  }

  if (data.gateway_status !== undefined) {
    values.push(data.gateway_status);
    fields.push(`gateway_status = $${values.length}`);
  }

  if (data.gateway_response !== undefined) {
    values.push(
      data.gateway_response === null
        ? null
        : JSON.stringify(data.gateway_response),
    );
    fields.push(`gateway_response = $${values.length}::jsonb`);
  }

  if (fields.length === 0) {
    return findPaymentById(id);
  }

  fields.push(`gateway_updated_at = NOW()`);

  if (data.gateway_provider === "ASAAS") {
    fields.push(`gateway_created_at = COALESCE(gateway_created_at, NOW())`);
  }

  values.push(id);

  const result = await pool.query<Payment>(
    `UPDATE payments
     SET ${fields.join(", ")},
         updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING ${paymentReturning}`,
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
     RETURNING ${paymentReturning}`,
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
     RETURNING ${paymentReturning}`,
    [id],
  );

  return result.rows[0];
}

export async function deletePaymentById(id: string) {
  const result = await pool.query<Payment>(
    `DELETE FROM payments
     WHERE id = $1
     RETURNING ${paymentReturning}`,
    [id],
  );

  return result.rows[0];
}