import { pool } from "../database/database.js";

export type CreateBannerDTO = {
  restaurant_id: string;
  image_url: string;
};

export type UpdateBannerDTO = {
  image_url?: string;
};

export class BannerRepository {
  async create(data: CreateBannerDTO) {
    const result = await pool.query(
      `
      INSERT INTO banners (
        restaurant_id,
        image_url
      )
      VALUES ($1, $2)
      RETURNING *
      `,
      [data.restaurant_id, data.image_url],
    );

    return result.rows[0];
  }

  async createForOwner(data: CreateBannerDTO, ownerUserId: string) {
    const result = await pool.query(
      `
      INSERT INTO banners (
        restaurant_id,
        image_url
      )
      SELECT $1, $2
      WHERE EXISTS (
        SELECT 1
        FROM restaurants
        WHERE restaurants.id = $1
          AND restaurants.owner_user_id = $3
      )
      RETURNING *
      `,
      [data.restaurant_id, data.image_url, ownerUserId],
    );

    return result.rows[0];
  }

  async findAll() {
    const result = await pool.query(`
      SELECT *
      FROM banners
      ORDER BY created_at DESC
    `);

    return result.rows;
  }

  async findAllForOwner(ownerUserId: string) {
    const result = await pool.query(
      `
      SELECT banners.*
      FROM banners
      INNER JOIN restaurants
        ON restaurants.id = banners.restaurant_id
      WHERE restaurants.owner_user_id = $1
      ORDER BY banners.created_at DESC
      `,
      [ownerUserId],
    );

    return result.rows;
  }

  async findById(id: string) {
    const result = await pool.query(
      `
      SELECT *
      FROM banners
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0];
  }

  async findByIdForOwner(id: string, ownerUserId: string) {
    const result = await pool.query(
      `
      SELECT banners.*
      FROM banners
      INNER JOIN restaurants
        ON restaurants.id = banners.restaurant_id
      WHERE banners.id = $1
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
      FROM banners
      WHERE restaurant_id = $1
      ORDER BY created_at DESC
      `,
      [restaurantId],
    );

    return result.rows;
  }

  async findByRestaurantIdForOwner(
    restaurantId: string,
    ownerUserId: string,
  ) {
    const result = await pool.query(
      `
      SELECT banners.*
      FROM banners
      INNER JOIN restaurants
        ON restaurants.id = banners.restaurant_id
      WHERE banners.restaurant_id = $1
        AND restaurants.owner_user_id = $2
      ORDER BY banners.created_at DESC
      `,
      [restaurantId, ownerUserId],
    );

    return result.rows;
  }

  async findByImageUrlAndRestaurantId(
    restaurantId: string,
    imageUrl: string,
  ) {
    const result = await pool.query(
      `
      SELECT *
      FROM banners
      WHERE restaurant_id = $1
        AND TRIM(image_url) = TRIM($2)
      `,
      [restaurantId, imageUrl],
    );

    return result.rows[0];
  }

  async findByImageUrlAndRestaurantIdExceptId(
    restaurantId: string,
    imageUrl: string,
    bannerId: string,
  ) {
    const result = await pool.query(
      `
      SELECT *
      FROM banners
      WHERE restaurant_id = $1
        AND TRIM(image_url) = TRIM($2)
        AND id <> $3
      `,
      [restaurantId, imageUrl, bannerId],
    );

    return result.rows[0];
  }

  async update(id: string, data: UpdateBannerDTO) {
    const result = await pool.query(
      `
      UPDATE banners
      SET
        image_url = COALESCE($1, image_url),
        updated_at = NOW()
      WHERE id = $2
      RETURNING *
      `,
      [data.image_url ?? null, id],
    );

    return result.rows[0];
  }

  async updateForOwner(
    id: string,
    ownerUserId: string,
    data: UpdateBannerDTO,
  ) {
    const result = await pool.query(
      `
      UPDATE banners
      SET
        image_url = COALESCE($1, image_url),
        updated_at = NOW()
      WHERE banners.id = $2
        AND EXISTS (
          SELECT 1
          FROM restaurants
          WHERE restaurants.id = banners.restaurant_id
            AND restaurants.owner_user_id = $3
        )
      RETURNING *
      `,
      [data.image_url ?? null, id, ownerUserId],
    );

    return result.rows[0];
  }

  async activate(id: string) {
    const result = await pool.query(
      `
      UPDATE banners
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
      UPDATE banners
      SET
        is_active = true,
        updated_at = NOW()
      WHERE banners.id = $1
        AND EXISTS (
          SELECT 1
          FROM restaurants
          WHERE restaurants.id = banners.restaurant_id
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
      UPDATE banners
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
      UPDATE banners
      SET
        is_active = false,
        updated_at = NOW()
      WHERE banners.id = $1
        AND EXISTS (
          SELECT 1
          FROM restaurants
          WHERE restaurants.id = banners.restaurant_id
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
      DELETE FROM banners
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
      DELETE FROM banners
      USING restaurants
      WHERE banners.id = $1
        AND restaurants.id = banners.restaurant_id
        AND restaurants.owner_user_id = $2
      RETURNING banners.*
      `,
      [id, ownerUserId],
    );

    return result.rows[0];
  }
}