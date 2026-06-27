import { pool } from "../database/database.js";

export class PublicMenuRepository {
  async findRestaurantBySlug(slug: string) {
    const result = await pool.query(
      `
      SELECT
        id,
        name,
        slug,
        description,
        logo_url,
        whatsapp,
        phone,
        address,
        opening_hours
      FROM restaurants
      WHERE slug = $1
        AND status = 'ACTIVE'
      LIMIT 1
      `,
      [slug],
    );

    return result.rows[0];
  }

  async findActiveBannersByRestaurantId(restaurant_id: string) {
    const result = await pool.query(
      `
      SELECT
        id,
        image_url
      FROM banners
      WHERE restaurant_id = $1
        AND is_active = true
      ORDER BY created_at DESC
      `,
      [restaurant_id],
    );

    return result.rows;
  }

  async findActiveCategoriesWithProducts(restaurant_id: string) {
    const result = await pool.query(
      `
      SELECT
        c.id AS category_id,
        c.name AS category_name,
        c.emoji AS category_emoji,
        c.sort_order AS category_sort_order,

        p.id AS product_id,
        p.name AS product_name,
        p.description AS product_description,
        p.price AS product_price,
        p.image_url AS product_image_url,
        p.video_url AS product_video_url,
        p.is_promotion AS product_is_promotion,
        p.is_new AS product_is_new
      FROM categories c
      LEFT JOIN products p
        ON p.category_id = c.id
        AND p.is_active = true
      WHERE c.restaurant_id = $1
        AND c.is_active = true
      ORDER BY
        CASE
          WHEN c.sort_order = 0 THEN 999999
          ELSE c.sort_order
        END ASC,
        c.created_at ASC,
        p.created_at DESC
      `,
      [restaurant_id],
    );

    return result.rows;
  }
}