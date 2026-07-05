import { pool } from "../database/database.js";

export type SubscriptionStatus = "ACTIVE" | "PENDING" | "OVERDUE" | "CANCELED";

export type Subscription = {
  id: string;
  restaurant_id: string;
  status: SubscriptionStatus;
  plan_name: string;
  monthly_price: number;
  started_at: string;
  next_billing_date: string;
  created_at: Date;
  updated_at: Date;
};

export type SubscriptionWithRestaurant = Subscription & {
  restaurant_name: string;
  restaurant_slug: string;
};

type CreateSubscriptionData = {
  restaurant_id: string;
  status?: SubscriptionStatus;
  plan_name?: string;
  monthly_price: number;
  started_at?: string;
  next_billing_date: string;
};

type UpdateSubscriptionData = {
  status?: SubscriptionStatus;
  plan_name?: string;
  monthly_price?: number;
  started_at?: string;
  next_billing_date?: string;
};

const subscriptionSelect = `
  SELECT
    id,
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

const subscriptionWithRestaurantSelect = `
  SELECT
    subscriptions.id,
    subscriptions.restaurant_id,
    subscriptions.status,
    subscriptions.plan_name,
    subscriptions.monthly_price::float AS monthly_price,
    subscriptions.started_at::text AS started_at,
    subscriptions.next_billing_date::text AS next_billing_date,
    subscriptions.created_at,
    subscriptions.updated_at,
    restaurants.name AS restaurant_name,
    restaurants.slug AS restaurant_slug
  FROM subscriptions
  INNER JOIN restaurants ON restaurants.id = subscriptions.restaurant_id
`;

export async function listSubscriptions() {
  const result = await pool.query<SubscriptionWithRestaurant>(
    `${subscriptionWithRestaurantSelect}
     ORDER BY subscriptions.created_at DESC`,
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

export async function findSubscriptionByRestaurantId(restaurantId: string) {
  const result = await pool.query<Subscription>(
    `${subscriptionSelect}
     WHERE restaurant_id = $1`,
    [restaurantId],
  );

  return result.rows[0];
}

export async function createSubscription(data: CreateSubscriptionData) {
  const result = await pool.query<Subscription>(
    `INSERT INTO subscriptions (
       restaurant_id,
       status,
       plan_name,
       monthly_price,
       started_at,
       next_billing_date
     )
     VALUES ($1, $2, $3, $4, COALESCE($5, CURRENT_DATE), $6)
     RETURNING
       id,
       restaurant_id,
       status,
       plan_name,
       monthly_price::float AS monthly_price,
       started_at::text AS started_at,
       next_billing_date::text AS next_billing_date,
       created_at,
       updated_at`,
    [
      data.restaurant_id,
      data.status ?? "PENDING",
      data.plan_name?.trim() || "MenuFlow Completo",
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

export async function cancelSubscriptionById(id: string) {
  const result = await pool.query<Subscription>(
    `UPDATE subscriptions
     SET status = 'CANCELED',
         updated_at = NOW()
     WHERE id = $1
     RETURNING
       id,
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