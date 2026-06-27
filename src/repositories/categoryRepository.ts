import { pool } from "../database/database.js";

export type CreateCategoryDTO = {
  restaurant_id: string;
  name: string;
  emoji?: string;
  sort_order?: number;
};

export type UpdateCategoryDTO = {
  name?: string;
  emoji?: string;
  sort_order?: number;
};

export class CategoryRepository {
  async create(data: CreateCategoryDTO) {
    const result = await pool.query(
      `
      INSERT INTO categories (
        restaurant_id,
        name,
        emoji,
        sort_order
      )
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [data.restaurant_id, data.name, data.emoji ?? null, data.sort_order ?? 0],
    );

    return result.rows[0];
  }

  async createForOwner(data: CreateCategoryDTO, ownerUserId: string) {
    const result = await pool.query(
      `
      INSERT INTO categories (
        restaurant_id,
        name,
        emoji,
        sort_order
      )
      SELECT $1, $2, $3, $4
      WHERE EXISTS (
        SELECT 1
        FROM restaurants
        WHERE restaurants.id = $1
          AND restaurants.owner_user_id = $5
      )
      RETURNING *
      `,
      [
        data.restaurant_id,
        data.name,
        data.emoji ?? null,
        data.sort_order ?? 0,
        ownerUserId,
      ],
    );

    return result.rows[0];
  }

  async findAll() {
    const result = await pool.query(`
      SELECT *
      FROM categories
      ORDER BY
        CASE
          WHEN sort_order = 0 THEN 999999
          ELSE sort_order
        END ASC,
        created_at ASC
    `);

    return result.rows;
  }

  async findAllForOwner(ownerUserId: string) {
    const result = await pool.query(
      `
      SELECT categories.*
      FROM categories
      INNER JOIN restaurants
        ON restaurants.id = categories.restaurant_id
      WHERE restaurants.owner_user_id = $1
      ORDER BY
        CASE
          WHEN categories.sort_order = 0 THEN 999999
          ELSE categories.sort_order
        END ASC,
        categories.created_at ASC
      `,
      [ownerUserId],
    );

    return result.rows;
  }

  async findById(id: string) {
    const result = await pool.query(
      `
      SELECT *
      FROM categories
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0];
  }

  async findByIdForOwner(id: string, ownerUserId: string) {
    const result = await pool.query(
      `
      SELECT categories.*
      FROM categories
      INNER JOIN restaurants
        ON restaurants.id = categories.restaurant_id
      WHERE categories.id = $1
        AND restaurants.owner_user_id = $2
      `,
      [id, ownerUserId],
    );

    return result.rows[0];
  }

  async findByRestaurantId(restaurantId: string) {
    const result = await pool.query(
      `
      SELECT *
      FROM categories
      WHERE restaurant_id = $1
      ORDER BY
        CASE
          WHEN sort_order = 0 THEN 999999
          ELSE sort_order
        END ASC,
        created_at ASC
      `,
      [restaurantId],
    );

    return result.rows;
  }

  async findByRestaurantIdForOwner(restaurantId: string, ownerUserId: string) {
    const result = await pool.query(
      `
      SELECT categories.*
      FROM categories
      INNER JOIN restaurants
        ON restaurants.id = categories.restaurant_id
      WHERE categories.restaurant_id = $1
        AND restaurants.owner_user_id = $2
      ORDER BY
        CASE
          WHEN categories.sort_order = 0 THEN 999999
          ELSE categories.sort_order
        END ASC,
        categories.created_at ASC
      `,
      [restaurantId, ownerUserId],
    );

    return result.rows;
  }

  async update(id: string, data: UpdateCategoryDTO) {
    const result = await pool.query(
      `
      UPDATE categories
      SET
        name = COALESCE($1, name),
        emoji = COALESCE($2, emoji),
        sort_order = COALESCE($3, sort_order),
        updated_at = NOW()
      WHERE id = $4
      RETURNING *
      `,
      [data.name ?? null, data.emoji ?? null, data.sort_order ?? null, id],
    );

    return result.rows[0];
  }

  async updateForOwner(
    id: string,
    ownerUserId: string,
    data: UpdateCategoryDTO,
  ) {
    const result = await pool.query(
      `
      UPDATE categories
      SET
        name = COALESCE($1, name),
        emoji = COALESCE($2, emoji),
        sort_order = COALESCE($3, sort_order),
        updated_at = NOW()
      WHERE categories.id = $4
        AND EXISTS (
          SELECT 1
          FROM restaurants
          WHERE restaurants.id = categories.restaurant_id
            AND restaurants.owner_user_id = $5
        )
      RETURNING *
      `,
      [
        data.name ?? null,
        data.emoji ?? null,
        data.sort_order ?? null,
        id,
        ownerUserId,
      ],
    );

    return result.rows[0];
  }

  async activate(id: string) {
    const result = await pool.query(
      `
      UPDATE categories
      SET
        is_active = true,
        updated_at = NOW()
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    return result.rows[0];
  }

  async activateForOwner(id: string, ownerUserId: string) {
    const result = await pool.query(
      `
      UPDATE categories
      SET
        is_active = true,
        updated_at = NOW()
      WHERE categories.id = $1
        AND EXISTS (
          SELECT 1
          FROM restaurants
          WHERE restaurants.id = categories.restaurant_id
            AND restaurants.owner_user_id = $2
        )
      RETURNING *
      `,
      [id, ownerUserId],
    );

    return result.rows[0];
  }

  async disable(id: string) {
    const result = await pool.query(
      `
      UPDATE categories
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

  async disableForOwner(id: string, ownerUserId: string) {
    const result = await pool.query(
      `
      UPDATE categories
      SET
        is_active = false,
        updated_at = NOW()
      WHERE categories.id = $1
        AND EXISTS (
          SELECT 1
          FROM restaurants
          WHERE restaurants.id = categories.restaurant_id
            AND restaurants.owner_user_id = $2
        )
      RETURNING *
      `,
      [id, ownerUserId],
    );

    return result.rows[0];
  }

  async delete(id: string) {
    const result = await pool.query(
      `
      DELETE FROM categories
      WHERE id = $1
      RETURNING *
      `,
      [id],
    );

    return result.rows[0];
  }

  async deleteForOwner(id: string, ownerUserId: string) {
    const result = await pool.query(
      `
      DELETE FROM categories
      USING restaurants
      WHERE categories.id = $1
        AND restaurants.id = categories.restaurant_id
        AND restaurants.owner_user_id = $2
      RETURNING categories.*
      `,
      [id, ownerUserId],
    );

    return result.rows[0];
  }

  async findByNameAndRestaurantId(restaurantId: string, name: string) {
    const result = await pool.query(
      `
    SELECT *
    FROM categories
    WHERE restaurant_id = $1
      AND LOWER(TRIM(name)) = LOWER(TRIM($2))
    `,
      [restaurantId, name],
    );

    return result.rows[0];
  }

  async findByNameAndRestaurantIdExceptId(
    restaurantId: string,
    name: string,
    categoryId: string,
  ) {
    const result = await pool.query(
      `
    SELECT *
    FROM categories
    WHERE restaurant_id = $1
      AND LOWER(TRIM(name)) = LOWER(TRIM($2))
      AND id <> $3
    `,
      [restaurantId, name, categoryId],
    );

    return result.rows[0];
  }
}
