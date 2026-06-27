import { pool } from "../database/database.js";

export class DashboardRepository {
  async getRecentProducts(restaurantId: string) {
    const result = await pool.query(
      `
      SELECT
        p.*,
        c.name AS category_name,
        c.emoji AS category_emoji
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.restaurant_id = $1
      ORDER BY p.created_at DESC
      LIMIT 5
      `,
      [restaurantId],
    );

    return result.rows;
  }

  async getRecentProductsForOwner(
    restaurantId: string,
    ownerUserId: string,
  ) {
    const result = await pool.query(
      `
      SELECT
        p.*,
        c.name AS category_name,
        c.emoji AS category_emoji
      FROM products p
      LEFT JOIN categories c ON c.id = p.category_id
      INNER JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.restaurant_id = $1
        AND r.owner_user_id = $2
      ORDER BY p.created_at DESC
      LIMIT 5
      `,
      [restaurantId, ownerUserId],
    );

    return result.rows;
  }

  async getStats(restaurantId: string) {
    const categories = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM categories
      WHERE restaurant_id = $1
      `,
      [restaurantId],
    );

    const products = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM products
      WHERE restaurant_id = $1
      `,
      [restaurantId],
    );

    const activeProducts = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM products
      WHERE restaurant_id = $1
        AND is_active = true
      `,
      [restaurantId],
    );

    const banners = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM banners
      WHERE restaurant_id = $1
      `,
      [restaurantId],
    );

    return {
      categories: Number(categories.rows[0].total),
      products: Number(products.rows[0].total),
      activeProducts: Number(activeProducts.rows[0].total),
      banners: Number(banners.rows[0].total),
    };
  }

  async getStatsForOwner(
    restaurantId: string,
    ownerUserId: string,
  ) {
    const categories = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM categories c
      INNER JOIN restaurants r ON r.id = c.restaurant_id
      WHERE c.restaurant_id = $1
        AND r.owner_user_id = $2
      `,
      [restaurantId, ownerUserId],
    );

    const products = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM products p
      INNER JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.restaurant_id = $1
        AND r.owner_user_id = $2
      `,
      [restaurantId, ownerUserId],
    );

    const activeProducts = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM products p
      INNER JOIN restaurants r ON r.id = p.restaurant_id
      WHERE p.restaurant_id = $1
        AND r.owner_user_id = $2
        AND p.is_active = true
      `,
      [restaurantId, ownerUserId],
    );

    const banners = await pool.query(
      `
      SELECT COUNT(*) AS total
      FROM banners b
      INNER JOIN restaurants r ON r.id = b.restaurant_id
      WHERE b.restaurant_id = $1
        AND r.owner_user_id = $2
      `,
      [restaurantId, ownerUserId],
    );

    return {
      categories: Number(categories.rows[0].total),
      products: Number(products.rows[0].total),
      activeProducts: Number(activeProducts.rows[0].total),
      banners: Number(banners.rows[0].total),
    };
  }
}