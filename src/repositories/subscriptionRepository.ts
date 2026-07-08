import { pool } from "../database/database.js";

export type SubscriptionStatus = "ACTIVE" | "PENDING" | "OVERDUE" | "CANCELED";

export type Subscription = {
  id: string;
  owner_user_id: string;
  restaurant_id: string | null;
  status: SubscriptionStatus;
  plan_name: string;
  monthly_price: number;
  started_at: string;
  next_billing_date: string;
  created_at: Date;
  updated_at: Date;
};

export type SubscriptionWithOwner = Subscription & {
  owner_name: string;
  owner_email: string;
  total_restaurants: number;

  // Mantido por compatibilidade temporária com o frontend antigo
  restaurant_name: string;
  restaurant_slug: string;
};

type CreateSubscriptionData = {
  owner_user_id?: string | undefined;
  restaurant_id?: string | undefined;
  status?: SubscriptionStatus | undefined;
  plan_name?: string | undefined;
  monthly_price: number;
  started_at?: string | undefined;
  next_billing_date: string;
};

type UpdateSubscriptionData = {
  status?: SubscriptionStatus | undefined;
  plan_name?: string | undefined;
  monthly_price?: number | undefined;
  started_at?: string | undefined;
  next_billing_date?: string | undefined;
};

const subscriptionSelect = `
  SELECT
    id,
    owner_user_id,
    restaurant_id,
    status,
    plan_name,
    monthly_price::float AS monthly_price,
    started_at::text AS started_at,
    next_billing_date::text AS next_billing_date,
    created_at,
    updated_at
  FROM subscriptions
`;

const subscriptionWithOwnerSelect = `
  SELECT
    subscriptions.id,
    subscriptions.owner_user_id,
    subscriptions.restaurant_id,
    subscriptions.status,
    subscriptions.plan_name,
    subscriptions.monthly_price::float AS monthly_price,
    subscriptions.started_at::text AS started_at,
    subscriptions.next_billing_date::text AS next_billing_date,
    subscriptions.created_at,
    subscriptions.updated_at,
    users.name AS owner_name,
    users.email AS owner_email,
    users.name AS restaurant_name,
    users.email AS restaurant_slug,
    (
      SELECT COUNT(*)::int
      FROM restaurants
      WHERE restaurants.owner_user_id = users.id
    ) AS total_restaurants
  FROM subscriptions
  INNER JOIN users ON users.id = subscriptions.owner_user_id
`;

export async function listSubscriptions() {
  const result = await pool.query<SubscriptionWithOwner>(
    `${subscriptionWithOwnerSelect}
     ORDER BY subscriptions.created_at DESC`,
  );

  return result.rows;
}

export async function listActiveSubscriptionsReadyForBilling(upToDate: string) {
  const result = await pool.query<SubscriptionWithOwner>(
    `${subscriptionWithOwnerSelect}
     WHERE subscriptions.status = 'ACTIVE'
       AND subscriptions.next_billing_date <= $1::date
     ORDER BY subscriptions.next_billing_date ASC`,
    [upToDate],
  );

  return result.rows;
}

export async function findSubscriptionById(id: string) {
  const result = await pool.query<Subscription>(
    `${subscriptionSelect}
     WHERE id = $1`,
    [id],
  );

  return result.rows[0];
}

export async function findSubscriptionByOwnerUserId(ownerUserId: string) {
  const result = await pool.query<Subscription>(
    `${subscriptionSelect}
     WHERE owner_user_id = $1
       AND status <> 'CANCELED'
     ORDER BY created_at DESC
     LIMIT 1`,
    [ownerUserId],
  );

  return result.rows[0];
}

export async function findSubscriptionByRestaurantId(restaurantId: string) {
  const result = await pool.query<Subscription>(
    `${subscriptionSelect}
     WHERE owner_user_id = (
       SELECT owner_user_id
       FROM restaurants
       WHERE id = $1
     )
       AND status <> 'CANCELED'
     ORDER BY created_at DESC
     LIMIT 1`,
    [restaurantId],
  );

  return result.rows[0];
}

export async function createSubscription(data: CreateSubscriptionData) {
  const result = await pool.query<Subscription>(
    `INSERT INTO subscriptions (
       owner_user_id,
       restaurant_id,
       status,
       plan_name,
       monthly_price,
       started_at,
       next_billing_date
     )
     VALUES (
       COALESCE(
         $1::uuid,
         (
           SELECT owner_user_id
           FROM restaurants
           WHERE id = $2::uuid
         )
       ),
       $2::uuid,
       $3,
       $4,
       $5,
       COALESCE($6, CURRENT_DATE),
       $7
     )
     RETURNING
       id,
       owner_user_id,
       restaurant_id,
       status,
       plan_name,
       monthly_price::float AS monthly_price,
       started_at::text AS started_at,
       next_billing_date::text AS next_billing_date,
       created_at,
       updated_at`,
    [
      data.owner_user_id ?? null,
      data.restaurant_id ?? null,
      data.status ?? "PENDING",
      data.plan_name?.trim() || "Serviu Completo",
      data.monthly_price,
      data.started_at ?? null,
      data.next_billing_date,
    ],
  );

  return result.rows[0];
}

export async function updateSubscriptionById(
  id: string,
  data: UpdateSubscriptionData,
) {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.status !== undefined) {
    values.push(data.status);
    fields.push(`status = $${values.length}`);
  }

  if (data.plan_name !== undefined) {
    values.push(data.plan_name.trim());
    fields.push(`plan_name = $${values.length}`);
  }

  if (data.monthly_price !== undefined) {
    values.push(data.monthly_price);
    fields.push(`monthly_price = $${values.length}`);
  }

  if (data.started_at !== undefined) {
    values.push(data.started_at);
    fields.push(`started_at = $${values.length}`);
  }

  if (data.next_billing_date !== undefined) {
    values.push(data.next_billing_date);
    fields.push(`next_billing_date = $${values.length}`);
  }

  if (fields.length === 0) {
    return findSubscriptionById(id);
  }

  values.push(id);

  const result = await pool.query<Subscription>(
    `UPDATE subscriptions
     SET ${fields.join(", ")},
         updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING
       id,
       owner_user_id,
       restaurant_id,
       status,
       plan_name,
       monthly_price::float AS monthly_price,
       started_at::text AS started_at,
       next_billing_date::text AS next_billing_date,
       created_at,
       updated_at`,
    values,
  );

  return result.rows[0];
}

export async function updateSubscriptionNextBillingDateById(
  id: string,
  nextBillingDate: string,
) {
  const result = await pool.query<Subscription>(
    `UPDATE subscriptions
     SET next_billing_date = $2::date,
         updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       owner_user_id,
       restaurant_id,
       status,
       plan_name,
       monthly_price::float AS monthly_price,
       started_at::text AS started_at,
       next_billing_date::text AS next_billing_date,
       created_at,
       updated_at`,
    [id, nextBillingDate],
  );

  return result.rows[0];
}

export async function cancelSubscriptionById(id: string) {
  const result = await pool.query<Subscription>(
    `UPDATE subscriptions
     SET status = 'CANCELED',
         updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
       owner_user_id,
       restaurant_id,
       status,
       plan_name,
       monthly_price::float AS monthly_price,
       started_at::text AS started_at,
       next_billing_date::text AS next_billing_date,
       created_at,
       updated_at`,
    [id],
  );

  return result.rows[0];
}

export async function listSubscriptionsWithPaymentsOverdueByDays(
  daysAfterDueDate: number,
) {
  const safeDaysAfterDueDate = Math.max(0, Math.floor(daysAfterDueDate));

  const result = await pool.query<SubscriptionWithOwner>(
    `${subscriptionWithOwnerSelect}
     WHERE subscriptions.status <> 'CANCELED'
       AND EXISTS (
         SELECT 1
         FROM payments
         WHERE payments.subscription_id = subscriptions.id
           AND payments.gateway_provider = 'ASAAS'
           AND payments.status IN ('PENDING', 'OVERDUE')
           AND payments.due_date <= CURRENT_DATE - ($1::int * INTERVAL '1 day')
       )
     ORDER BY subscriptions.next_billing_date ASC`,
    [safeDaysAfterDueDate],
  );

  return result.rows;
}