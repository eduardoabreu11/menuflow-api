import { pool } from "../database/database.js";

export type CreateProductDTO = {
  restaurant_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  image_url?: string;
  video_url?: string;
  is_promotion?: boolean;
  is_new?: boolean;
};

export type UpdateProductDTO = {
  category_id?: string;
  name?: string;
  description?: string;
  price?: number;
  image_url?: string;
  video_url?: string;
  is_promotion?: boolean;
  is_new?: boolean;
};

export class ProductRepository {
  async create(data: CreateProductDTO) {
    const result = await pool.query(
      `
      INSERT INTO products (
        restaurant_id,
        category_id,
        name,
        description,
        price,
        image_url,
        video_url,
        is_promotion,
        is_new
      )
      SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
      WHERE EXISTS (
        SELECT 1
        FROM categories
        WHERE categories.id = $2
          AND categories.restaurant_id = $1
      )
      RETURNING *
      `,
      [
        data.restaurant_id,
        data.category_id,
        data.name,
        data.description ?? null,
        data.price,
        data.image_url ?? null,
        data.video_url ?? null,
        data.is_promotion ?? false,
        data.is_new ?? false,
      ],
    );

    return result.rows[0];
  }

  async createForOwner(data: CreateProductDTO, ownerUserId: string) {
    const result = await pool.query(
      `
      INSERT INTO products (
        restaurant_id,
        category_id,
        name,
        description,
        price,
        image_url,
        video_url,
        is_promotion,
        is_new
      )
      SELECT $1, $2, $3, $4, $5, $6, $7, $8, $9
      WHERE EXISTS (
        SELECT 1
        FROM restaurants
        WHERE restaurants.id = $1
          AND restaurants.owner_user_id = $10
      )
      AND EXISTS (
        SELECT 1
        FROM categories
        WHERE categories.id = $2
          AND categories.restaurant_id = $1
      )
      RETURNING *
      `,
      [
        data.restaurant_id,
        data.category_id,
        data.name,
        data.description ?? null,
        data.price,
        data.image_url ?? null,
        data.video_url ?? null,
        data.is_promotion ?? false,
        data.is_new ?? false,
        ownerUserId,
      ],
    );

    return result.rows[0];
  }

  async findAll() {
    const result = await pool.query(`
      SELECT *
      FROM products
      ORDER BY created_at DESC
    `);

    return result.rows;
  }

  async findAllForOwner(ownerUserId: string) {
    const result = await pool.query(
      `
      SELECT products.*
      FROM products
      INNER JOIN restaurants
        ON restaurants.id = products.restaurant_id
      WHERE restaurants.owner_user_id = $1
      ORDER BY products.created_at DESC
      `,
      [ownerUserId],
    );

    return result.rows;
  }

  async findById(id: string) {
    const result = await pool.query(
      `
      SELECT *
      FROM products
      WHERE id = $1
      `,
      [id],
    );

    return result.rows[0];
  }

  async findByIdForOwner(id: string, ownerUserId: string) {
    const result = await pool.query(
      `
      SELECT products.*
      FROM products
      INNER JOIN restaurants
        ON restaurants.id = products.restaurant_id
      WHERE products.id = $1
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
      FROM products
      WHERE restaurant_id = $1
      ORDER BY created_at DESC
      `,
      [restaurantId],
    );

    return result.rows;
  }

  async findByRestaurantIdForOwner(restaurantId: string, ownerUserId: string) {
    const result = await pool.query(
      `
      SELECT products.*
      FROM products
      INNER JOIN restaurants
        ON restaurants.id = products.restaurant_id
      WHERE products.restaurant_id = $1
        AND restaurants.owner_user_id = $2
      ORDER BY products.created_at DESC
      `,
      [restaurantId, ownerUserId],
    );

    return result.rows;
  }

  async findByCategoryId(categoryId: string) {
    const result = await pool.query(
      `
      SELECT *
      FROM products
      WHERE category_id = $1
      ORDER BY created_at DESC
      `,
      [categoryId],
    );

    return result.rows;
  }

  async findByCategoryIdForOwner(categoryId: string, ownerUserId: string) {
    const result = await pool.query(
      `
      SELECT products.*
      FROM products
      INNER JOIN restaurants
        ON restaurants.id = products.restaurant_id
      WHERE products.category_id = $1
        AND restaurants.owner_user_id = $2
      ORDER BY products.created_at DESC
      `,
      [categoryId, ownerUserId],
    );

    return result.rows;
  }

  async update(id: string, data: UpdateProductDTO) {
    const result = await pool.query(
      `
      UPDATE products
      SET
        category_id = COALESCE($1, category_id),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        image_url = COALESCE($5, image_url),
        video_url = COALESCE($6, video_url),
        is_promotion = COALESCE($7, is_promotion),
        is_new = COALESCE($8, is_new),
        updated_at = NOW()
      WHERE id = $9
        AND (
          $1::uuid IS NULL
          OR EXISTS (
            SELECT 1
            FROM categories
            WHERE categories.id = $1
              AND categories.restaurant_id = products.restaurant_id
          )
        )
      RETURNING *
      `,
      [
        data.category_id ?? null,
        data.name ?? null,
        data.description ?? null,
        data.price ?? null,
        data.image_url ?? null,
        data.video_url ?? null,
        data.is_promotion ?? null,
        data.is_new ?? null,
        id,
      ],
    );

    return result.rows[0];
  }

  async updateForOwner(
    id: string,
    ownerUserId: string,
    data: UpdateProductDTO,
  ) {
    const result = await pool.query(
      `
      UPDATE products
      SET
        category_id = COALESCE($1, category_id),
        name = COALESCE($2, name),
        description = COALESCE($3, description),
        price = COALESCE($4, price),
        image_url = COALESCE($5, image_url),
        video_url = COALESCE($6, video_url),
        is_promotion = COALESCE($7, is_promotion),
        is_new = COALESCE($8, is_new),
        updated_at = NOW()
      WHERE products.id = $9
        AND EXISTS (
          SELECT 1
          FROM restaurants
          WHERE restaurants.id = products.restaurant_id
            AND restaurants.owner_user_id = $10
        )
        AND (
          $1::uuid IS NULL
          OR EXISTS (
            SELECT 1
            FROM categories
            WHERE categories.id = $1
              AND categories.restaurant_id = products.restaurant_id
          )
        )
      RETURNING *
      `,
      [
        data.category_id ?? null,
        data.name ?? null,
        data.description ?? null,
        data.price ?? null,
        data.image_url ?? null,
        data.video_url ?? null,
        data.is_promotion ?? null,
        data.is_new ?? null,
        id,
        ownerUserId,
      ],
    );

    return result.rows[0];
  }

  async activate(id: string) {
    const result = await pool.query(
      `
      UPDATE products
      SET is_active = true,
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
      UPDATE products
      SET is_active = true,
          updated_at = NOW()
      WHERE products.id = $1
        AND EXISTS (
          SELECT 1
          FROM restaurants
          WHERE restaurants.id = products.restaurant_id
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
      UPDATE products
      SET is_active = false,
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
      UPDATE products
      SET is_active = false,
          updated_at = NOW()
      WHERE products.id = $1
        AND EXISTS (
          SELECT 1
          FROM restaurants
          WHERE restaurants.id = products.restaurant_id
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
      DELETE FROM products
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
      DELETE FROM products
      USING restaurants
      WHERE products.id = $1
        AND restaurants.id = products.restaurant_id
        AND restaurants.owner_user_id = $2
      RETURNING products.*
      `,
      [id, ownerUserId],
    );

    return result.rows[0];
  }

  async categoryBelongsToRestaurant(restaurantId: string, categoryId: string) {
    const result = await pool.query(
      `
      SELECT 1
      FROM categories
      WHERE id = $1
        AND restaurant_id = $2
      `,
      [categoryId, restaurantId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async categoryBelongsToOwner(categoryId: string, ownerUserId: string) {
    const result = await pool.query(
      `
      SELECT 1
      FROM categories
      INNER JOIN restaurants
        ON restaurants.id = categories.restaurant_id
      WHERE categories.id = $1
        AND restaurants.owner_user_id = $2
      `,
      [categoryId, ownerUserId],
    );

    return (result.rowCount ?? 0) > 0;
  }

  async findByNameRestaurantAndCategory(
    restaurantId: string,
    categoryId: string,
    name: string,
  ) {
    const result = await pool.query(
      `
      SELECT *
      FROM products
      WHERE restaurant_id = $1
        AND category_id = $2
        AND LOWER(TRIM(name)) = LOWER(TRIM($3))
      `,
      [restaurantId, categoryId, name],
    );

    return result.rows[0];
  }

  async findByNameRestaurantAndCategoryExceptId(
    restaurantId: string,
    categoryId: string,
    name: string,
    productId: string,
  ) {
    const result = await pool.query(
      `
      SELECT *
      FROM products
      WHERE restaurant_id = $1
        AND category_id = $2
        AND LOWER(TRIM(name)) = LOWER(TRIM($3))
        AND id <> $4
      `,
      [restaurantId, categoryId, name, productId],
    );

    return result.rows[0];
  }
}
