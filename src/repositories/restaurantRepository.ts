import { pool } from "../database/database.js";

export type CreateRestaurantData = {
  owner_user_id: string;
  name: string;
  slug: string;
  description?: string | undefined;
  logo_url?: string | undefined;
  whatsapp?: string | undefined;
  phone?: string | undefined;
  address?: string | undefined;
  opening_hours?: string | undefined;
};

export type UpdateRestaurantData = {
  name: string;
  slug: string;
  description?: string | undefined;
  logo_url?: string | undefined;
  whatsapp?: string | undefined;
  phone?: string | undefined;
  address?: string | undefined;
  opening_hours?: string | undefined;
};

export async function listRestaurants() {
  const result = await pool.query(`
    SELECT
      restaurants.*,
      users.name AS owner_name,
      users.email AS owner_email
    FROM restaurants
    INNER JOIN users ON users.id = restaurants.owner_user_id
    ORDER BY restaurants.created_at DESC
  `);

  return result.rows;
}

export async function listRestaurantsForOwner(ownerUserId: string) {
  const result = await pool.query(
    `
    SELECT
      restaurants.*,
      users.name AS owner_name,
      users.email AS owner_email
    FROM restaurants
    INNER JOIN users ON users.id = restaurants.owner_user_id
    WHERE restaurants.owner_user_id = $1
    ORDER BY restaurants.created_at DESC
    `,
    [ownerUserId],
  );

  return result.rows;
}

export async function findRestaurantById(id: string) {
  const result = await pool.query(
    `
    SELECT
      restaurants.*,
      users.name AS owner_name,
      users.email AS owner_email
    FROM restaurants
    INNER JOIN users ON users.id = restaurants.owner_user_id
    WHERE restaurants.id = $1
    `,
    [id],
  );

  return result.rows[0];
}

export async function findRestaurantByIdForOwner(
  id: string,
  ownerUserId: string,
) {
  const result = await pool.query(
    `
    SELECT
      restaurants.*,
      users.name AS owner_name,
      users.email AS owner_email
    FROM restaurants
    INNER JOIN users ON users.id = restaurants.owner_user_id
    WHERE restaurants.id = $1
      AND restaurants.owner_user_id = $2
    `,
    [id, ownerUserId],
  );

  return result.rows[0];
}

export async function findRestaurantBySlug(slug: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM restaurants
    WHERE slug = $1
    `,
    [slug],
  );

  return result.rows[0];
}

export async function findRestaurantByAsaasCustomerId(asaasCustomerId: string) {
  const result = await pool.query(
    `
    SELECT *
    FROM restaurants
    WHERE asaas_customer_id = $1
    `,
    [asaasCustomerId],
  );

  return result.rows[0];
}

export async function createRestaurant(data: CreateRestaurantData) {
  const result = await pool.query(
    `
    INSERT INTO restaurants (
      owner_user_id,
      name,
      slug,
      description,
      logo_url,
      whatsapp,
      phone,
      address,
      opening_hours
    )
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
    `,
    [
      data.owner_user_id,
      data.name,
      data.slug,
      data.description ?? null,
      data.logo_url ?? null,
      data.whatsapp ?? null,
      data.phone ?? null,
      data.address ?? null,
      data.opening_hours ?? null,
    ],
  );

  return result.rows[0];
}

export async function updateRestaurant(
  id: string,
  data: UpdateRestaurantData,
) {
  const result = await pool.query(
    `
    UPDATE restaurants
    SET
      name = $1,
      slug = $2,
      description = $3,
      logo_url = $4,
      whatsapp = $5,
      phone = $6,
      address = $7,
      opening_hours = $8,
      updated_at = NOW()
    WHERE id = $9
    RETURNING *
    `,
    [
      data.name,
      data.slug,
      data.description ?? null,
      data.logo_url ?? null,
      data.whatsapp ?? null,
      data.phone ?? null,
      data.address ?? null,
      data.opening_hours ?? null,
      id,
    ],
  );

  return result.rows[0];
}

export async function updateRestaurantForOwner(
  id: string,
  ownerUserId: string,
  data: UpdateRestaurantData,
) {
  const result = await pool.query(
    `
    UPDATE restaurants
    SET
      name = $1,
      slug = $2,
      description = $3,
      logo_url = $4,
      whatsapp = $5,
      phone = $6,
      address = $7,
      opening_hours = $8,
      updated_at = NOW()
    WHERE id = $9
      AND owner_user_id = $10
    RETURNING *
    `,
    [
      data.name,
      data.slug,
      data.description ?? null,
      data.logo_url ?? null,
      data.whatsapp ?? null,
      data.phone ?? null,
      data.address ?? null,
      data.opening_hours ?? null,
      id,
      ownerUserId,
    ],
  );

  return result.rows[0];
}

export async function updateRestaurantAsaasCustomerId(
  id: string,
  asaasCustomerId: string,
) {
  const result = await pool.query(
    `
    UPDATE restaurants
    SET asaas_customer_id = $2,
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id, asaasCustomerId],
  );

  return result.rows[0];
}

export async function blockRestaurant(id: string) {
  const result = await pool.query(
    `
    UPDATE restaurants
    SET status = 'BLOCKED',
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );

  return result.rows[0];
}

export async function activateRestaurant(id: string) {
  const result = await pool.query(
    `
    UPDATE restaurants
    SET status = 'ACTIVE',
        updated_at = NOW()
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );

  return result.rows[0];
}

export async function deleteRestaurant(id: string) {
  const result = await pool.query(
    `
    DELETE FROM restaurants
    WHERE id = $1
    RETURNING *
    `,
    [id],
  );

  return result.rows[0];
}

export async function userOwnsRestaurant(userId: string, restaurantId: string) {
  const result = await pool.query(
    `
    SELECT id
    FROM restaurants
    WHERE id = $1
      AND owner_user_id = $2
    `,
    [restaurantId, userId],
  );

  return Boolean(result.rows[0]);
}